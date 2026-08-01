"""Config flow tests: user, reconfigure, options and reauth."""

from __future__ import annotations

from typing import Any, Self
from unittest.mock import AsyncMock, MagicMock, patch

import aiohttp
import pytest
import voluptuous as vol
from homeassistant.config_entries import SOURCE_USER
from homeassistant.const import (
    CONF_NAME,
    CONF_PASSWORD,
    CONF_URL,
    CONF_USERNAME,
    CONF_VERIFY_SSL,
)
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType

from custom_components.webcam_timelapse.config_flow import (
    async_probe_url,
    compute_unique_id,
    flatten,
    validate_url,
)
from custom_components.webcam_timelapse.const import (
    CONF_CAPTURE_INTERVAL,
    CONF_FRAMES_PATH,
    CONF_LIVE_REFRESH,
    CONF_MAX_WIDTH,
    CONF_QUALITY,
    CONF_RETENTION_DAYS,
    DOMAIN,
)

from .conftest import make_entry

URL = "https://cam.invalid/live.jpg"


class _Response:
    """Minimal aiohttp.ClientResponse stand-in for probe tests."""

    def __init__(
        self,
        *,
        status: int = 200,
        headers: dict[str, str] | None = None,
        raise_for_status: Exception | None = None,
    ) -> None:
        self.status = status
        self.headers = headers or {}
        self._raise = raise_for_status

    def raise_for_status(self) -> None:
        if self._raise is not None:
            raise self._raise

    async def __aenter__(self) -> Self:
        return self

    async def __aexit__(self, *_exc: object) -> None:
        return None


def _session(response: _Response | BaseException) -> MagicMock:
    session = MagicMock()
    if isinstance(response, BaseException):
        session.get = AsyncMock(side_effect=response)
    else:
        session.get = AsyncMock(return_value=response)
    return session


def user_input(**overrides: Any) -> dict[str, Any]:
    """Form input in the shape HA delivers it — advanced fields nested."""
    advanced = {
        CONF_MAX_WIDTH: "1024",
        CONF_QUALITY: 78,
        CONF_LIVE_REFRESH: 30,
        CONF_FRAMES_PATH: "",
        CONF_VERIFY_SSL: True,
        CONF_USERNAME: "",
        CONF_PASSWORD: "",
    }
    advanced.update(overrides.pop("advanced", {}))
    return {
        CONF_NAME: "Kleine Erlauf",
        CONF_URL: URL,
        CONF_CAPTURE_INTERVAL: "10",
        CONF_RETENTION_DAYS: 14,
        "advanced": advanced,
        **overrides,
    }


# --- pure helpers ---------------------------------------------------------


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("https://a.invalid/x.jpg", None),
        ("http://a.invalid/x.jpg", None),
        ("  https://a.invalid/x.jpg  ", None),
        ("file:///etc/passwd", "invalid_scheme"),
        ("ftp://a.invalid/x.jpg", "invalid_scheme"),
        ("javascript:alert(1)", "invalid_scheme"),
        ("https://", "invalid_url"),
        ("not a url", "invalid_scheme"),
    ],
)
def test_validate_url(raw: str, expected: str | None) -> None:
    """file:// in particular would read from the HA host's own filesystem."""
    assert validate_url(raw) == expected


def test_unique_id_is_stable_and_url_derived() -> None:
    """Must not use Python's hash(): PEP 456 randomises it per process."""
    assert compute_unique_id(URL) == compute_unique_id(URL)
    assert compute_unique_id(URL) != compute_unique_id(URL + "?x")
    assert len(compute_unique_id(URL)) == 16


def test_flatten_lifts_the_advanced_section() -> None:
    assert flatten({"a": 1, "advanced": {"b": 2}}) == {"a": 1, "b": 2}
    assert flatten({"a": 1, "advanced": None}) == {"a": 1}
    assert flatten({"a": 1}) == {"a": 1}


# --- user step ------------------------------------------------------------


async def test_user_flow_creates_entry(
    hass: HomeAssistant, mock_probe: AsyncMock
) -> None:
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "user"

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], user_input()
    )

    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["title"] == "Kleine Erlauf"
    data = result["data"]
    assert data[CONF_URL] == URL
    # Coerced off the string the select returns.
    assert data[CONF_CAPTURE_INTERVAL] == 10
    assert data[CONF_MAX_WIDTH] == 1024
    # Blank optionals are omitted, not stored as "".
    assert CONF_USERNAME not in data
    assert CONF_FRAMES_PATH not in data


async def test_user_flow_rejects_a_bad_scheme(
    hass: HomeAssistant, mock_probe: AsyncMock
) -> None:
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], user_input(**{CONF_URL: "file:///etc/passwd"})
    )

    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {CONF_URL: "invalid_scheme"}
    mock_probe.assert_not_called()


@pytest.mark.parametrize(
    "probe_error", ["cannot_connect", "not_an_image", "timeout", "invalid_auth"]
)
async def test_user_flow_surfaces_probe_errors(
    hass: HomeAssistant, mock_probe: AsyncMock, probe_error: str
) -> None:
    mock_probe.return_value = probe_error

    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], user_input()
    )

    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {"base": probe_error}


async def test_off_grid_interval_is_rejected_by_the_schema(
    hass: HomeAssistant, mock_probe: AsyncMock
) -> None:
    """7 minutes does not divide 60, so it would break the wall-clock grid.

    The select selector rejects it before the flow's own validator ever
    runs — which is the point of making the constraint structural rather
    than a check a later maintainer could soften.
    """
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )

    with pytest.raises(vol.Invalid):
        await hass.config_entries.flow.async_configure(
            result["flow_id"], user_input(**{CONF_CAPTURE_INTERVAL: "7"})
        )


async def test_duplicate_url_aborts(hass: HomeAssistant, mock_probe: AsyncMock) -> None:
    """The same camera twice would interleave two archives in one directory."""
    existing = make_entry(**{CONF_URL: URL})
    existing.add_to_hass(hass)

    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], user_input()
    )

    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "already_configured"


async def test_credentials_are_stored_when_supplied(
    hass: HomeAssistant, mock_probe: AsyncMock
) -> None:
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        user_input(advanced={CONF_USERNAME: "bob", CONF_PASSWORD: "hunter2"}),
    )

    assert result["data"][CONF_USERNAME] == "bob"
    assert result["data"][CONF_PASSWORD] == "hunter2"


# --- reconfigure ----------------------------------------------------------


async def test_reconfigure_updates_the_entry(
    hass: HomeAssistant, mock_probe: AsyncMock, mock_fetch: AsyncMock
) -> None:
    entry = make_entry(**{CONF_URL: URL})
    entry.add_to_hass(hass)

    result = await entry.start_reconfigure_flow(hass)
    assert result["step_id"] == "reconfigure"

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], user_input(**{CONF_NAME: "Renamed", CONF_RETENTION_DAYS: 7})
    )
    await hass.async_block_till_done()

    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "reconfigure_successful"
    assert entry.data[CONF_RETENTION_DAYS] == 7
    assert entry.title == "Renamed"


async def test_reconfigure_to_a_different_camera_aborts(
    hass: HomeAssistant, mock_probe: AsyncMock
) -> None:
    """Swapping the URL would orphan the archive; that is a new entry's job."""
    entry = make_entry(**{CONF_URL: URL})
    entry.add_to_hass(hass)

    result = await entry.start_reconfigure_flow(hass)
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], user_input(**{CONF_URL: "https://other.invalid/x.jpg"})
    )

    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "unique_id_mismatch"


# --- options --------------------------------------------------------------


async def test_options_flow_keeps_the_url(
    hass: HomeAssistant, mock_probe: AsyncMock, mock_fetch: AsyncMock
) -> None:
    """The options form omits the URL, so it must come from existing data."""
    entry = make_entry(**{CONF_URL: URL})
    entry.add_to_hass(hass)

    result = await hass.config_entries.options.async_init(entry.entry_id)
    assert result["step_id"] == "init"

    form = user_input(**{CONF_RETENTION_DAYS: 30})
    form.pop(CONF_URL)
    result = await hass.config_entries.options.async_configure(result["flow_id"], form)
    await hass.async_block_till_done()

    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["data"][CONF_RETENTION_DAYS] == 30
    assert result["data"][CONF_URL] == URL


async def test_options_flow_surfaces_probe_errors(
    hass: HomeAssistant, mock_probe: AsyncMock
) -> None:
    entry = make_entry(**{CONF_URL: URL})
    entry.add_to_hass(hass)
    mock_probe.return_value = "cannot_connect"

    result = await hass.config_entries.options.async_init(entry.entry_id)
    form = user_input()
    form.pop(CONF_URL)
    result = await hass.config_entries.options.async_configure(result["flow_id"], form)

    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {"base": "cannot_connect"}


# --- reauth ---------------------------------------------------------------


async def test_reauth_updates_credentials(
    hass: HomeAssistant, mock_probe: AsyncMock, mock_fetch: AsyncMock
) -> None:
    entry = make_entry(**{CONF_URL: URL, CONF_USERNAME: "old"})
    entry.add_to_hass(hass)

    result = await entry.start_reauth_flow(hass)
    assert result["step_id"] == "reauth_confirm"

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_USERNAME: "new", CONF_PASSWORD: "secret"}
    )
    await hass.async_block_till_done()

    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "reauth_successful"
    assert entry.data[CONF_USERNAME] == "new"
    assert entry.data[CONF_PASSWORD] == "secret"


async def test_reauth_rejects_bad_credentials(
    hass: HomeAssistant, mock_probe: AsyncMock
) -> None:
    entry = make_entry(**{CONF_URL: URL})
    entry.add_to_hass(hass)
    mock_probe.return_value = "invalid_auth"

    result = await entry.start_reauth_flow(hass)
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_USERNAME: "bob", CONF_PASSWORD: "wrong"}
    )

    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {"base": "invalid_auth"}


# --- async_probe_url ------------------------------------------------------
#
# Mocked out everywhere above, so without these it would ship never having
# run. It is the only code that decides whether a URL the user typed is
# usable at all.


async def test_probe_accepts_an_image(hass: HomeAssistant) -> None:
    session = _session(_Response(headers={"Content-Type": "image/jpeg"}))
    with patch(
        "custom_components.webcam_timelapse.config_flow.async_get_clientsession",
        return_value=session,
    ):
        assert await async_probe_url(hass, URL) is None


async def test_probe_rejects_a_web_page(hass: HomeAssistant) -> None:
    session = _session(_Response(headers={"Content-Type": "text/html; charset=utf-8"}))
    with patch(
        "custom_components.webcam_timelapse.config_flow.async_get_clientsession",
        return_value=session,
    ):
        assert await async_probe_url(hass, URL) == "not_an_image"


@pytest.mark.parametrize("status", [401, 403])
async def test_probe_reports_auth_failures(hass: HomeAssistant, status: int) -> None:
    session = _session(_Response(status=status))
    with patch(
        "custom_components.webcam_timelapse.config_flow.async_get_clientsession",
        return_value=session,
    ):
        assert await async_probe_url(hass, URL) == "invalid_auth"


async def test_probe_reports_http_errors(hass: HomeAssistant) -> None:
    error = aiohttp.ClientResponseError(
        request_info=MagicMock(), history=(), status=500, message="boom"
    )
    session = _session(_Response(raise_for_status=error))
    with patch(
        "custom_components.webcam_timelapse.config_flow.async_get_clientsession",
        return_value=session,
    ):
        assert await async_probe_url(hass, URL) == "cannot_connect"


async def test_probe_reports_timeouts(hass: HomeAssistant) -> None:
    session = _session(TimeoutError())
    with patch(
        "custom_components.webcam_timelapse.config_flow.async_get_clientsession",
        return_value=session,
    ):
        assert await async_probe_url(hass, URL) == "timeout"


async def test_probe_reports_connection_errors(hass: HomeAssistant) -> None:
    session = _session(aiohttp.ClientConnectionError("refused"))
    with patch(
        "custom_components.webcam_timelapse.config_flow.async_get_clientsession",
        return_value=session,
    ):
        assert await async_probe_url(hass, URL) == "cannot_connect"


async def test_probe_sends_basic_auth_as_a_header(hass: HomeAssistant) -> None:
    """aiohttp.BasicAuth is deprecated and gone in 4.0, so we build the header."""
    response = _Response(headers={"Content-Type": "image/jpeg"})
    session = _session(response)
    with patch(
        "custom_components.webcam_timelapse.config_flow.async_get_clientsession",
        return_value=session,
    ):
        await async_probe_url(hass, URL, username="bob", password="hunter2")

    sent = session.get.call_args.kwargs["headers"]
    assert sent["Authorization"] == aiohttp.encode_basic_auth("bob", "hunter2")
