"""Service call behaviour."""

from __future__ import annotations

from unittest.mock import AsyncMock

import pytest
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError
from homeassistant.util import dt as dt_util

from custom_components.webcam_timelapse import frame_store
from custom_components.webcam_timelapse.const import DOMAIN
from custom_components.webcam_timelapse.services import (
    SERVICE_CAPTURE_NOW,
    SERVICE_PAUSE_CAPTURE,
    SERVICE_PURGE_FRAMES,
    SERVICE_RESUME_CAPTURE,
)

from .conftest import make_entry, setup_entry


async def test_capture_now_stores_a_frame(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    entry = make_entry()
    assert await setup_entry(hass, entry)

    response = await hass.services.async_call(
        DOMAIN,
        SERVICE_CAPTURE_NOW,
        {"entry_id": entry.entry_id},
        blocking=True,
        return_response=True,
    )

    assert response is not None
    slot = response["slot"]
    assert frame_store.frame_path(entry.runtime_data.frames_dir, slot).is_file()


async def test_capture_now_works_without_requesting_a_response(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    """Registered as OPTIONAL, not ONLY — ONLY breaks plain automation actions."""
    entry = make_entry()
    assert await setup_entry(hass, entry)

    await hass.services.async_call(
        DOMAIN, SERVICE_CAPTURE_NOW, {"entry_id": entry.entry_id}, blocking=True
    )

    assert entry.runtime_data.data["frame_count"] == 1


async def test_capture_now_refuses_an_occupied_slot(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    entry = make_entry()
    assert await setup_entry(hass, entry)
    coordinator = entry.runtime_data
    slot = frame_store.slot_for(dt_util.utcnow().timestamp(), coordinator.step)
    frame_store.write_frame(coordinator.frames_dir, slot, b"original")

    with pytest.raises(ServiceValidationError) as err:
        await hass.services.async_call(
            DOMAIN, SERVICE_CAPTURE_NOW, {"entry_id": entry.entry_id}, blocking=True
        )

    assert err.value.translation_key == "slot_occupied"


async def test_purge_frames_empties_the_archive(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    entry = make_entry()
    assert await setup_entry(hass, entry)
    for offset in range(4):
        frame_store.write_frame(
            entry.runtime_data.frames_dir, 1_754_050_200 + offset * 600, b"x"
        )

    response = await hass.services.async_call(
        DOMAIN,
        SERVICE_PURGE_FRAMES,
        {"entry_id": entry.entry_id},
        blocking=True,
        return_response=True,
    )

    assert response == {"removed": 4}
    assert entry.runtime_data.data["frame_count"] == 0


async def test_pause_and_resume(hass: HomeAssistant, mock_fetch: AsyncMock) -> None:
    entry = make_entry()
    assert await setup_entry(hass, entry)

    await hass.services.async_call(
        DOMAIN, SERVICE_PAUSE_CAPTURE, {"entry_id": entry.entry_id}, blocking=True
    )
    assert entry.runtime_data.paused is True
    assert entry.runtime_data.data["paused"] is True

    await hass.services.async_call(
        DOMAIN, SERVICE_RESUME_CAPTURE, {"entry_id": entry.entry_id}, blocking=True
    )
    assert entry.runtime_data.paused is False
    assert entry.runtime_data.data["paused"] is False


async def test_unknown_entry_is_a_validation_error(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    assert await setup_entry(hass, make_entry())

    with pytest.raises(ServiceValidationError) as err:
        await hass.services.async_call(
            DOMAIN, SERVICE_PAUSE_CAPTURE, {"entry_id": "nope"}, blocking=True
        )

    assert err.value.translation_key == "unknown_entry"


async def test_unloaded_entry_is_a_validation_error(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    entry = make_entry()
    assert await setup_entry(hass, entry)
    await hass.config_entries.async_unload(entry.entry_id)
    await hass.async_block_till_done()

    with pytest.raises(ServiceValidationError) as err:
        await hass.services.async_call(
            DOMAIN, SERVICE_PAUSE_CAPTURE, {"entry_id": entry.entry_id}, blocking=True
        )

    assert err.value.translation_key == "entry_not_loaded"
