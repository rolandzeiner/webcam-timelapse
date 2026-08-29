"""Integration setup, unload and removal."""

from __future__ import annotations

import logging
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest
from homeassistant.config_entries import ConfigEntryState
from homeassistant.const import CONF_NAME, CONF_URL
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr

from custom_components.webcam_timelapse import frame_store
from custom_components.webcam_timelapse.const import DOMAIN, INTEGRATION_VERSION

from .conftest import make_entry, setup_entry


async def test_setup_registers_device_and_platforms(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    entry = make_entry()
    assert await setup_entry(hass, entry)
    assert entry.state is ConfigEntryState.LOADED

    device = dr.async_get(hass).async_get_device_by_identifier(
        (DOMAIN, entry.entry_id), entry.entry_id
    )
    assert device is not None
    assert device.name == "Test Cam"
    assert device.sw_version == INTEGRATION_VERSION
    # Derived from the image URL's origin, so the device links back to the
    # camera rather than to this project's repo.
    assert device.configuration_url == "https://example.invalid"

    for entity_id in (
        "camera.test_cam_live_view",
        "sensor.test_cam_last_capture",
        "sensor.test_cam_stored_frames",
        "sensor.test_cam_storage_used",
        "binary_sensor.test_cam_camera_online",
    ):
        assert hass.states.get(entity_id) is not None, entity_id


async def test_services_are_registered(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    assert await setup_entry(hass, make_entry())

    for service in ("capture_now", "purge_frames", "pause_capture", "resume_capture"):
        assert hass.services.has_service(DOMAIN, service), service


async def test_unload_leaves_frames_on_disk(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    """Unloading is a reload or a restart — history must survive it."""
    entry = make_entry()
    assert await setup_entry(hass, entry)
    frames_dir = entry.runtime_data.frames_dir
    frame_store.write_frame(frames_dir, 1_754_050_200, b"x")

    assert await hass.config_entries.async_unload(entry.entry_id)
    await hass.async_block_till_done()

    assert entry.state is ConfigEntryState.NOT_LOADED
    assert frame_store.scan_slots(frames_dir) == [1_754_050_200]


async def test_remove_entry_deletes_only_its_own_frames(
    hass: HomeAssistant, mock_fetch: AsyncMock, isolate_frames_dir: Path
) -> None:
    """Two cameras, one removed — the survivor's archive must be untouched."""
    first = make_entry(entry_id="01AAA", **{CONF_NAME: "First"})
    second = make_entry(
        entry_id="01BBB",
        **{CONF_NAME: "Second", CONF_URL: "https://other.invalid/cam.jpg"},
    )
    assert await setup_entry(hass, first)
    assert await setup_entry(hass, second)

    first_dir = first.runtime_data.frames_dir
    second_dir = second.runtime_data.frames_dir
    frame_store.write_frame(first_dir, 1_754_050_200, b"x")
    frame_store.write_frame(second_dir, 1_754_050_200, b"x")

    await hass.config_entries.async_remove(first.entry_id)
    await hass.async_block_till_done()

    assert not first_dir.exists()
    assert frame_store.scan_slots(second_dir) == [1_754_050_200]


async def test_card_resource_survives_removing_one_of_two_entries(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    """A surviving sibling still needs the card bundle registered."""
    first = make_entry(entry_id="01AAA", **{CONF_NAME: "First"})
    second = make_entry(
        entry_id="01BBB",
        **{CONF_NAME: "Second", CONF_URL: "https://other.invalid/cam.jpg"},
    )
    assert await setup_entry(hass, first)
    assert await setup_entry(hass, second)

    with patch(
        "custom_components.webcam_timelapse.JSModuleRegistration.async_unregister",
        new_callable=AsyncMock,
    ) as unregister:
        await hass.config_entries.async_remove(first.entry_id)
        await hass.async_block_till_done()
        unregister.assert_not_called()

        await hass.config_entries.async_remove(second.entry_id)
        await hass.async_block_till_done()
        unregister.assert_called_once()


async def test_options_update_reloads_the_entry(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    """One reload owner: the update listener registered in async_setup_entry."""
    from custom_components.webcam_timelapse.const import CONF_RETENTION_DAYS

    entry = make_entry()
    assert await setup_entry(hass, entry)

    hass.config_entries.async_update_entry(entry, options={CONF_RETENTION_DAYS: 3})
    await hass.async_block_till_done()

    assert entry.state is ConfigEntryState.LOADED
    assert entry.runtime_data.retention_days == 3


async def test_setup_uses_no_deprecated_ha_api(
    hass: HomeAssistant, mock_fetch: AsyncMock, caplog: pytest.LogCaptureFixture
) -> None:
    """HA reports deprecated API use to the logger, not via warnings.

    `frame.report_usage` logs through `_LOGGER.warning`
    (homeassistant/helpers/frame.py:393) and never calls `warnings.warn`,
    so pytest.ini's `error::DeprecationWarning` cannot see it. This is the
    check that covers that channel.
    """
    caplog.set_level(logging.WARNING)
    entry = make_entry()
    assert await setup_entry(hass, entry)

    await entry.runtime_data.async_refresh()
    await hass.async_block_till_done()

    assert "Detected that custom integration" not in caplog.text
