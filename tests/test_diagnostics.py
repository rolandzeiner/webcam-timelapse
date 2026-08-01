"""Diagnostics: shape, and what must never appear in it."""

from __future__ import annotations

import json
from unittest.mock import AsyncMock

from homeassistant.const import CONF_PASSWORD, CONF_USERNAME
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.components.diagnostics import (
    get_diagnostics_for_config_entry,
)

from custom_components.webcam_timelapse import frame_store
from custom_components.webcam_timelapse.const import CONF_FRAMES_PATH

from .conftest import make_entry, setup_entry

SECRET = "sup3r-s3cret-camera-pw"


async def test_diagnostics_shape(
    hass: HomeAssistant, hass_client, mock_fetch: AsyncMock
) -> None:
    entry = make_entry()
    assert await setup_entry(hass, entry)
    coordinator = entry.runtime_data
    frame_store.write_frame(coordinator.frames_dir, 1_785_585_600, b"12345")
    await coordinator.async_refresh()

    diag = await get_diagnostics_for_config_entry(hass, hass_client, entry)

    assert diag["entry"]["title"] == "Test Cam"
    assert diag["coordinator"]["last_update_success"] is True
    assert diag["coordinator"]["step_seconds"] == 600
    assert diag["archive"]["frame_count"] == 1
    assert diag["archive"]["bytes_used"] == 5
    assert diag["archive"]["gap_count"] == 0
    assert diag["archive"]["frames_dir_is_default"] is True


async def test_credentials_are_redacted(
    hass: HomeAssistant, hass_client, mock_fetch: AsyncMock
) -> None:
    """These dumps get pasted into public GitHub issues."""
    entry = make_entry(**{CONF_USERNAME: "bob", CONF_PASSWORD: SECRET})
    assert await setup_entry(hass, entry)

    diag = await get_diagnostics_for_config_entry(hass, hass_client, entry)

    assert SECRET not in json.dumps(diag)
    assert "bob" not in json.dumps(diag)


async def test_frames_path_is_redacted_but_the_url_is_not(
    hass: HomeAssistant, hass_client, mock_fetch: AsyncMock, tmp_path
) -> None:
    """The path leaks the OS username; the camera URL is the key triage field."""
    custom = tmp_path / "somewhere" / "private"
    entry = make_entry(**{CONF_FRAMES_PATH: str(custom)})
    assert await setup_entry(hass, entry)

    diag = await get_diagnostics_for_config_entry(hass, hass_client, entry)
    dumped = json.dumps(diag)

    assert str(custom) not in dumped
    assert "https://example.invalid/cam.jpg" in dumped
    assert diag["archive"]["frames_dir_is_default"] is False


async def test_frame_bytes_never_appear(
    hass: HomeAssistant, hass_client, mock_fetch: AsyncMock
) -> None:
    """Counts and shape only — never the payload."""
    entry = make_entry()
    assert await setup_entry(hass, entry)
    await entry.runtime_data.async_capture_now()

    diag = await get_diagnostics_for_config_entry(hass, hass_client, entry)

    assert "RIFF" not in json.dumps(diag)
    assert entry.runtime_data.live_frame is not None
