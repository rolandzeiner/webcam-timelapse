"""Tests for the frame fetch layer.

The freeze-detection cases carry the most weight here: they are what stops
this integration from reproducing the prior art's headline bug, where a
camera with a stuck `Last-Modified` quietly filled the archive with
identical frames and presented them as a timelapse.
"""

from __future__ import annotations

import asyncio
from typing import Any, Self
from unittest.mock import AsyncMock, MagicMock

import aiohttp
import pytest
from homeassistant.exceptions import ConfigEntryAuthFailed
from homeassistant.helpers.update_coordinator import UpdateFailed

from custom_components.webcam_timelapse.capture import (
    CacheValidators,
    FetchOutcome,
    body_digest,
    fetch_frame,
    request_headers,
)
from custom_components.webcam_timelapse.const import MAX_IMAGE_BYTES, USER_AGENT

URL = "https://example.invalid/cam.jpg"


class FakeResponse:
    """Minimal aiohttp.ClientResponse stand-in."""

    def __init__(
        self,
        *,
        status: int = 200,
        body: bytes = b"\xff\xd8jpegbytes",
        headers: dict[str, str] | None = None,
        content_length: int | None = None,
        raise_for_status: Exception | None = None,
    ) -> None:
        self.status = status
        self._body = body
        self.headers = (
            headers if headers is not None else {"Content-Type": "image/jpeg"}
        )
        self.content_length = (
            content_length if content_length is not None else len(body)
        )
        self._raise = raise_for_status
        self.content = MagicMock()
        # Wrapped in a MagicMock rather than bound directly so tests can
        # assert the body was never read at all.
        self.content.iter_chunked = MagicMock(side_effect=self._iter_chunked)

    async def _iter_chunked(self, _size: int) -> Any:
        for i in range(0, len(self._body), 4):
            yield self._body[i : i + 4]

    def raise_for_status(self) -> None:
        if self._raise is not None:
            raise self._raise

    async def __aenter__(self) -> Self:
        return self

    async def __aexit__(self, *_exc: object) -> None:
        return None


def session_returning(response: FakeResponse | BaseException) -> MagicMock:
    """A ClientSession whose .get() resolves to — or raises — `response`.

    Checks BaseException, not Exception: asyncio.CancelledError derives
    from BaseException, and getting that wrong makes the cancellation test
    silently assert nothing.
    """
    session = MagicMock()
    if isinstance(response, BaseException):
        session.get = AsyncMock(side_effect=response)
    else:
        session.get = AsyncMock(return_value=response)
    return session


# --- headers --------------------------------------------------------------


def test_request_headers_carry_the_user_agent() -> None:
    headers = request_headers(USER_AGENT)
    assert headers["User-Agent"] == USER_AGENT
    assert headers["Accept"].startswith("image/")


def test_request_headers_merge_user_supplied_extras() -> None:
    headers = request_headers(USER_AGENT, {"X-Api-Key": "abc"})
    assert headers["X-Api-Key"] == "abc"
    assert headers["User-Agent"] == USER_AGENT


def test_cache_validators_round_trip() -> None:
    validators = CacheValidators()
    assert validators.to_request_headers() == {}

    response = FakeResponse(
        headers={"ETag": '"abc"', "Last-Modified": "Sat, 01 Aug 2026 07:14:01 GMT"}
    )
    validators.update_from_response(response)  # type: ignore[arg-type]

    assert validators.to_request_headers() == {
        "If-None-Match": '"abc"',
        "If-Modified-Since": "Sat, 01 Aug 2026 07:14:01 GMT",
    }


def test_cache_validators_keep_previous_values_when_absent() -> None:
    """A response without validators must not clear the ones we had."""
    validators = CacheValidators(etag='"abc"')
    validators.update_from_response(FakeResponse(headers={}))  # type: ignore[arg-type]
    assert validators.etag == '"abc"'


# --- happy path -----------------------------------------------------------


async def test_fresh_image_is_returned() -> None:
    session = session_returning(FakeResponse(body=b"\xff\xd8imagedata"))

    result = await fetch_frame(session, URL)

    assert result.outcome is FetchOutcome.FRESH
    assert result.raw == b"\xff\xd8imagedata"
    assert result.content_type == "image/jpeg"


async def test_conditional_headers_are_sent() -> None:
    session = session_returning(FakeResponse())
    validators = CacheValidators(etag='"abc"')

    await fetch_frame(session, URL, validators=validators)

    sent = session.get.call_args.kwargs["headers"]
    assert sent["If-None-Match"] == '"abc"'


# --- freeze detection -----------------------------------------------------


async def test_304_reports_unchanged_and_writes_nothing() -> None:
    """The server told us nothing changed — that slot becomes a gap."""
    session = session_returning(FakeResponse(status=304, body=b""))

    result = await fetch_frame(session, URL, validators=CacheValidators(etag='"a"'))

    assert result.outcome is FetchOutcome.UNCHANGED
    assert result.raw is None


async def test_identical_body_reports_unchanged_without_validators() -> None:
    """Freeze detection must work against servers with no ETag at all.

    This is the case the prior art misses: a 200 with the same bytes every
    time. Without the body hash we would store a duplicate frame each tick.
    """
    body = b"\xff\xd8frozen"
    session = session_returning(FakeResponse(body=body, headers={}))

    result = await fetch_frame(session, URL, previous_digest=body_digest(body))

    assert result.outcome is FetchOutcome.UNCHANGED
    assert result.raw is None
    assert result.digest == body_digest(body)


async def test_changed_body_is_fresh() -> None:
    session = session_returning(FakeResponse(body=b"\xff\xd8new"))

    result = await fetch_frame(session, URL, previous_digest=body_digest(b"old"))

    assert result.outcome is FetchOutcome.FRESH
    assert result.raw == b"\xff\xd8new"


def test_body_digest_is_stable_and_discriminating() -> None:
    assert body_digest(b"a") == body_digest(b"a")
    assert body_digest(b"a") != body_digest(b"b")


# --- guards ---------------------------------------------------------------


async def test_non_image_content_type_is_refused() -> None:
    """A login page served with 200 is the most common misconfiguration."""
    session = session_returning(
        FakeResponse(headers={"Content-Type": "text/html; charset=utf-8"})
    )

    with pytest.raises(UpdateFailed) as err:
        await fetch_frame(session, URL)
    assert err.value.translation_key == "not_an_image"


async def test_declared_oversize_is_refused_without_reading_the_body() -> None:
    """Content-Length over the cap must short-circuit before iter_chunked."""
    response = FakeResponse(content_length=MAX_IMAGE_BYTES + 1)
    session = session_returning(response)

    with pytest.raises(UpdateFailed) as err:
        await fetch_frame(session, URL)

    assert err.value.translation_key == "image_too_large"
    response.content.iter_chunked.assert_not_called()


async def test_undeclared_oversize_is_caught_mid_stream() -> None:
    """Servers omit or lie about Content-Length, so the read is capped too."""
    body = b"x" * (MAX_IMAGE_BYTES + 16)
    session = session_returning(FakeResponse(body=body, content_length=None))

    with pytest.raises(UpdateFailed) as err:
        await fetch_frame(session, URL)
    assert err.value.translation_key == "image_too_large"


async def test_empty_body_is_refused() -> None:
    session = session_returning(FakeResponse(body=b"", content_length=0))

    with pytest.raises(UpdateFailed) as err:
        await fetch_frame(session, URL)
    assert err.value.translation_key == "empty_response"


# --- error mapping --------------------------------------------------------


@pytest.mark.parametrize("status", [401, 403])
async def test_auth_failures_trigger_reauth(status: int) -> None:
    """ConfigEntryAuthFailed is what makes HA open the reauth flow."""
    error = aiohttp.ClientResponseError(
        request_info=MagicMock(), history=(), status=status, message="denied"
    )
    session = session_returning(FakeResponse(raise_for_status=error))

    with pytest.raises(ConfigEntryAuthFailed):
        await fetch_frame(session, URL)


async def test_other_http_errors_are_update_failures() -> None:
    error = aiohttp.ClientResponseError(
        request_info=MagicMock(), history=(), status=500, message="boom"
    )
    session = session_returning(FakeResponse(raise_for_status=error))

    with pytest.raises(UpdateFailed) as err:
        await fetch_frame(session, URL)
    assert err.value.translation_key == "http_error"


async def test_timeout_is_mapped() -> None:
    session = session_returning(TimeoutError())

    with pytest.raises(UpdateFailed) as err:
        await fetch_frame(session, URL)
    assert err.value.translation_key == "fetch_timeout"


async def test_connection_error_is_mapped() -> None:
    session = session_returning(aiohttp.ClientConnectionError("refused"))

    with pytest.raises(UpdateFailed) as err:
        await fetch_frame(session, URL)
    assert err.value.translation_key == "connection_error"


async def test_cancellation_is_never_swallowed() -> None:
    """Cancellation must propagate, not be reported as a camera fault."""
    session = session_returning(asyncio.CancelledError())

    with pytest.raises(asyncio.CancelledError):
        await fetch_frame(session, URL)
