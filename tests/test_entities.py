"""Entity behaviour: sensors, the connectivity flag and the camera."""

from __future__ import annotations

import datetime as dt
from unittest.mock import AsyncMock, patch

from homeassistant.components.camera import CameraEntityFeature
from homeassistant.const import STATE_OFF, STATE_ON, STATE_UNKNOWN
from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import UpdateFailed

from custom_components.webcam_timelapse import frame_store
from custom_components.webcam_timelapse.const import (
    CAMERA_STALE_TICKS,
    CONF_LIVE_REFRESH,
)

from .conftest import fresh_result, make_entry, make_jpeg, setup_entry, unchanged_result

CAMERA = "camera.test_cam_live_view"
LAST_CAPTURE = "sensor.test_cam_last_capture"
FRAME_COUNT = "sensor.test_cam_stored_frames"
STORAGE = "sensor.test_cam_storage_used"
ONLINE = "binary_sensor.test_cam_camera_online"


async def test_sensors_on_an_empty_archive(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    assert await setup_entry(hass, make_entry())

    assert hass.states.get(LAST_CAPTURE).state == STATE_UNKNOWN
    assert hass.states.get(FRAME_COUNT).state == "0"
    assert hass.states.get(STORAGE).state == "0.0"


async def test_sensors_reflect_the_archive(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    entry = make_entry()
    assert await setup_entry(hass, entry)
    coordinator = entry.runtime_data

    newest = 1_785_585_600
    frame_store.write_frame(coordinator.frames_dir, newest - 600, b"12345")
    frame_store.write_frame(coordinator.frames_dir, newest, b"12345")
    await coordinator.async_refresh()
    await hass.async_block_till_done()

    assert hass.states.get(FRAME_COUNT).state == "2"
    # Reported in bytes natively, displayed in MB.
    assert hass.states.get(STORAGE).state == "1e-05"

    expected = dt.datetime.fromtimestamp(newest, tz=dt.UTC).isoformat()
    assert hass.states.get(LAST_CAPTURE).state == expected


async def test_camera_online_flips_after_repeated_freezes(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    entry = make_entry()
    assert await setup_entry(hass, entry)
    coordinator = entry.runtime_data

    assert hass.states.get(ONLINE).state == STATE_ON

    mock_fetch.return_value = unchanged_result()
    for slot in range(CAMERA_STALE_TICKS):
        await coordinator._async_capture(1_785_585_600 + slot * 600)
    await coordinator.async_refresh()
    await hass.async_block_till_done()

    assert hass.states.get(ONLINE).state == STATE_OFF


async def test_camera_has_no_stream(hass: HomeAssistant, mock_fetch: AsyncMock) -> None:
    """Still-image polling only — go2rtc is deliberately not involved."""
    assert await setup_entry(hass, make_entry())

    state = hass.states.get(CAMERA)
    assert state is not None
    assert state.attributes["supported_features"] == CameraEntityFeature(0)


async def test_camera_serves_the_latest_frame(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    from homeassistant.components.camera import async_get_image

    entry = make_entry()
    assert await setup_entry(hass, entry)
    await entry.runtime_data.async_capture_now()

    image = await async_get_image(hass, CAMERA)

    assert image.content[:4] == b"RIFF"


async def test_camera_with_live_refresh_disabled_never_refetches(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    """live_refresh: 0 is the setting for 'do not hit the camera extra'."""
    from homeassistant.components.camera import async_get_image

    entry = make_entry(**{CONF_LIVE_REFRESH: 0})
    assert await setup_entry(hass, entry)
    await entry.runtime_data.async_capture_now()
    calls_after_capture = mock_fetch.call_count

    await async_get_image(hass, CAMERA)
    await async_get_image(hass, CAMERA)

    assert mock_fetch.call_count == calls_after_capture


async def test_camera_survives_a_failing_live_refresh(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    """A dead camera should show a stale picture, not a blank tile."""
    from homeassistant.components.camera import async_get_image

    entry = make_entry()
    assert await setup_entry(hass, entry)
    await entry.runtime_data.async_capture_now()
    good = entry.runtime_data.live_frame

    mock_fetch.side_effect = UpdateFailed("camera gone")
    with patch.object(entry.runtime_data, "_live_fetched_at", 0.0, create=True):
        image = await async_get_image(hass, CAMERA)

    assert image.content == good


async def test_camera_refreshes_when_the_cached_frame_is_stale(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    from homeassistant.components.camera import async_get_image

    entry = make_entry()
    assert await setup_entry(hass, entry)
    await entry.runtime_data.async_capture_now()

    before = mock_fetch.call_count
    mock_fetch.return_value = fresh_result(make_jpeg(seed=77))
    await async_get_image(hass, CAMERA)

    assert mock_fetch.call_count > before
