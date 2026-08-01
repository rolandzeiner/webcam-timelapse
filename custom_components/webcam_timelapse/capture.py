"""Fetching a single still frame from an arbitrary camera URL.

Because the URL is user-supplied, this module carries guards a
single-vendor integration would not need: a scheme check, a
``Content-Type`` check, and — most importantly — a hard ceiling on how
many bytes we are willing to read. Home Assistant's container is commonly
memory-capped (1 GiB on the reference host), so an unguarded
``await resp.read()`` against a misconfigured URL that points at a video
file would OOM-kill the whole HA process rather than failing this one
entry.
"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass, field
from enum import Enum

import aiohttp
from homeassistant.exceptions import ConfigEntryAuthFailed
from homeassistant.helpers.update_coordinator import UpdateFailed

from .const import DOMAIN, FETCH_TIMEOUT_SECONDS, MAX_IMAGE_BYTES, USER_AGENT

_CHUNK = 64 * 1024


@dataclass(slots=True)
class CacheValidators:
    """Conditional-GET validators captured from a previous response.

    Lifted from the sibling wiener-linien-austria integration. Here the
    purpose is different: at a 10-minute capture cadence against a camera
    that refreshes every minute, ``If-None-Match`` will essentially never
    save a download. What it buys instead is *duplicate suppression* — a
    camera whose feeder process has died keeps serving the same image, and
    without this we would write 144 identical frames a day and present
    them as a timelapse.
    """

    etag: str | None = None
    last_modified: str | None = None

    def to_request_headers(self) -> dict[str, str]:
        """Build conditional-GET request headers from this validator pair."""
        out: dict[str, str] = {}
        if self.etag:
            out["If-None-Match"] = self.etag
        if self.last_modified:
            out["If-Modified-Since"] = self.last_modified
        return out

    def update_from_response(self, resp: aiohttp.ClientResponse) -> None:
        """Capture validators from the response for the next request."""
        if etag := resp.headers.get("ETag"):
            self.etag = etag
        if last_modified := resp.headers.get("Last-Modified"):
            self.last_modified = last_modified


class FetchOutcome(Enum):
    """What a capture attempt produced."""

    FRESH = "fresh"
    """New image bytes worth storing."""

    UNCHANGED = "unchanged"
    """Server said 304, or returned a byte-identical image."""


@dataclass(slots=True)
class FetchResult:
    """The result of one capture attempt."""

    outcome: FetchOutcome
    raw: bytes | None = None
    digest: str | None = None
    content_type: str | None = None
    validators: CacheValidators = field(default_factory=CacheValidators)


def request_headers(
    user_agent: str, extra: dict[str, str] | None = None
) -> dict[str, str]:
    """Base outbound headers, with any user-configured additions layered on."""
    headers = {"User-Agent": user_agent, "Accept": "image/*,*/*;q=0.8"}
    if extra:
        headers.update(extra)
    return headers


def body_digest(raw: bytes) -> str:
    """Short content hash used to spot a frozen camera.

    Needed in addition to the 304 path because plenty of cameras serve
    weak validators, or none at all. blake2b at 16 bytes costs about a
    millisecond for a 160 KB frame — cheap enough to run every tick, and
    it makes freeze detection work against *any* server rather than only
    well-behaved ones.
    """
    return hashlib.blake2b(raw, digest_size=16).hexdigest()


async def fetch_frame(
    session: aiohttp.ClientSession,
    url: str,
    *,
    validators: CacheValidators | None = None,
    previous_digest: str | None = None,
    extra_headers: dict[str, str] | None = None,
    auth: aiohttp.BasicAuth | None = None,
    verify_ssl: bool = True,
) -> FetchResult:
    """Fetch one frame, or report that nothing changed.

    Raises:
        ConfigEntryAuthFailed: 401/403, so HA starts the reauth flow.
        UpdateFailed: any other transport, protocol or payload problem.
    """
    validators = validators or CacheValidators()
    headers = request_headers(USER_AGENT, extra_headers)
    headers.update(validators.to_request_headers())

    timeout = aiohttp.ClientTimeout(total=FETCH_TIMEOUT_SECONDS)

    try:
        response = await session.get(
            url, headers=headers, timeout=timeout, auth=auth, ssl=verify_ssl
        )
        async with response:
            if response.status == 304:
                return FetchResult(FetchOutcome.UNCHANGED, validators=validators)

            response.raise_for_status()

            content_type = (
                response.headers.get("Content-Type", "").split(";")[0].strip()
            )
            if content_type and not content_type.startswith("image/"):
                # A login portal or an error page served with 200 is the
                # single most common misconfiguration; failing here with a
                # readable message beats a confusing decode error later.
                raise UpdateFailed(
                    translation_domain=DOMAIN,
                    translation_key="not_an_image",
                    translation_placeholders={"content_type": content_type},
                )

            # Refuse oversized payloads BEFORE reading the body when the
            # server was honest enough to declare a length.
            declared = response.content_length
            if declared is not None and declared > MAX_IMAGE_BYTES:
                raise UpdateFailed(
                    translation_domain=DOMAIN,
                    translation_key="image_too_large",
                    translation_placeholders={
                        "size": str(declared),
                        "limit": str(MAX_IMAGE_BYTES),
                    },
                )

            # Servers lie, or omit Content-Length entirely on a chunked
            # response, so the streamed read enforces the same ceiling.
            chunks: list[bytes] = []
            total = 0
            async for chunk in response.content.iter_chunked(_CHUNK):
                total += len(chunk)
                if total > MAX_IMAGE_BYTES:
                    raise UpdateFailed(
                        translation_domain=DOMAIN,
                        translation_key="image_too_large",
                        translation_placeholders={
                            "size": f">{MAX_IMAGE_BYTES}",
                            "limit": str(MAX_IMAGE_BYTES),
                        },
                    )
                chunks.append(chunk)

            validators.update_from_response(response)

    except TimeoutError as err:
        raise UpdateFailed(
            translation_domain=DOMAIN,
            translation_key="fetch_timeout",
            translation_placeholders={"seconds": str(FETCH_TIMEOUT_SECONDS)},
        ) from err
    except aiohttp.ClientResponseError as err:
        if err.status in (401, 403):
            raise ConfigEntryAuthFailed(
                translation_domain=DOMAIN,
                translation_key="auth_error",
                translation_placeholders={"status": str(err.status)},
            ) from err
        raise UpdateFailed(
            translation_domain=DOMAIN,
            translation_key="http_error",
            translation_placeholders={"status": str(err.status), "reason": err.message},
        ) from err
    # asyncio.CancelledError is deliberately absent from these handlers: it
    # derives from BaseException, so it propagates untouched. Reporting a
    # cancelled shutdown as a camera fault would raise a spurious Repairs
    # issue every time HA stops.
    except aiohttp.ClientError as err:
        raise UpdateFailed(
            translation_domain=DOMAIN,
            translation_key="connection_error",
            translation_placeholders={
                "error_type": type(err).__name__,
                "error": str(err),
            },
        ) from err

    raw = b"".join(chunks)
    if not raw:
        raise UpdateFailed(
            translation_domain=DOMAIN,
            translation_key="empty_response",
        )

    digest = body_digest(raw)
    if previous_digest is not None and digest == previous_digest:
        # Byte-identical to last tick: the camera is stuck. Report it as
        # unchanged so the slot becomes a gap rather than a duplicate.
        return FetchResult(FetchOutcome.UNCHANGED, digest=digest, validators=validators)

    return FetchResult(
        FetchOutcome.FRESH,
        raw=raw,
        digest=digest,
        content_type=content_type or None,
        validators=validators,
    )
