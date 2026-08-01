"""Coordinator tests: the capture grid, freeze detection, pruning, teardown."""

from __future__ import annotations

import datetime as dt
from unittest.mock import AsyncMock, patch

import pytest
from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant
from homeassistant.helpers import issue_registry as ir
from homeassistant.helpers.update_coordinator import UpdateFailed
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import async_fire_time_changed

from custom_components.webcam_timelapse import frame_store
from custom_components.webcam_timelapse.const import (
    CAMERA_STALE_TICKS,
    CONF_CAPTURE_INTERVAL,
    CONF_RETENTION_DAYS,
    DOMAIN,
)
from custom_components.webcam_timelapse.encode import ImageDecodeError

from .conftest import fresh_result, make_entry, make_jpeg, setup_entry, unchanged_result

# A fixed point on the capture grid. Tests freeze the clock here BEFORE
# setting the entry up, because async_track_time_change computes its next
# fire time at registration — leaving the clock at the real "now" and then
# jumping backwards silently schedules nothing.
BASE = dt.datetime(2026, 8, 1, 12, 0, 0, tzinfo=dt.UTC)


async def fire_tick(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory, minutes: int
) -> None:
    """Advance to `minutes` past BASE, on the capture offset, and fire.

    Two non-obvious requirements, both paid for in debugging:

    1. Move the freezer AND pass the target explicitly. `async_fire_time_changed`
       decides whether to fire a handle from `timestamp - time.time()`; with the
       freezer already moved and no explicit datetime that difference is ~0, so
       nothing fires. With only the explicit datetime the handle fires but
       `dt_util.utcnow()` stays at BASE, so every capture lands in the same slot
       and overwrites the previous frame.
    2. `wait_background_tasks=True`. The timer dispatches the coroutine as a
       BACKGROUND task, which the default `async_block_till_done()` does not
       await — the capture is still mid-executor when assertions run, and the
       archive looks empty for no visible reason.
    """
    target = BASE + dt.timedelta(minutes=minutes, seconds=5)
    freezer.move_to(target)
    async_fire_time_changed(hass, target)
    await hass.async_block_till_done(wait_background_tasks=True)


async def test_setup_creates_the_archive_directory(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    entry = make_entry()
    assert await setup_entry(hass, entry)

    coordinator = entry.runtime_data
    assert coordinator.frames_dir.is_dir()
    # First refresh scans only — it must not capture, because a startup
    # capture would land off the wall-clock grid.
    mock_fetch.assert_not_called()
    assert coordinator.data["frame_count"] == 0
    assert coordinator.data["index"] == {"t0": None, "count": 0, "gaps": []}


async def test_grid_tick_captures_and_stores_a_frame(
    hass: HomeAssistant, mock_fetch: AsyncMock, freezer: FrozenDateTimeFactory
) -> None:
    freezer.move_to(BASE)
    entry = make_entry()
    assert await setup_entry(hass, entry)
    coordinator = entry.runtime_data

    await fire_tick(hass, freezer, 10)

    assert mock_fetch.call_count == 1
    assert coordinator.data["frame_count"] == 1

    slot = frame_store.slot_for(dt_util.utcnow().timestamp(), coordinator.step)
    stored = frame_store.frame_path(coordinator.frames_dir, slot)
    assert stored.is_file()
    # Written as WebP, not passed through as the source JPEG.
    assert stored.read_bytes()[:4] == b"RIFF"


async def test_paused_coordinator_skips_the_tick(
    hass: HomeAssistant, mock_fetch: AsyncMock, freezer: FrozenDateTimeFactory
) -> None:
    freezer.move_to(BASE)
    entry = make_entry()
    assert await setup_entry(hass, entry)
    coordinator = entry.runtime_data

    coordinator.async_set_paused(True)
    await fire_tick(hass, freezer, 10)

    mock_fetch.assert_not_called()
    assert coordinator.data["paused"] is True

    # Resuming keeps the original grid phase — the schedule was never torn
    # down, so the next tick lands on a normal boundary.
    coordinator.async_set_paused(False)
    await fire_tick(hass, freezer, 20)

    assert mock_fetch.call_count == 1


# --- freeze detection -----------------------------------------------------


async def test_unchanged_response_leaves_a_gap_rather_than_a_duplicate(
    hass: HomeAssistant, mock_fetch: AsyncMock, freezer: FrozenDateTimeFactory
) -> None:
    """The headline bug in the prior art: duplicates padding the timelapse."""
    freezer.move_to(BASE)
    entry = make_entry()
    assert await setup_entry(hass, entry)
    coordinator = entry.runtime_data
    mock_fetch.return_value = unchanged_result()

    await fire_tick(hass, freezer, 10)

    assert coordinator.data["frame_count"] == 0
    assert coordinator.data["frozen_ticks"] == 1
    assert coordinator.data["online"] is True  # not yet past the threshold


async def test_repeated_freeze_marks_offline_and_raises_one_issue(
    hass: HomeAssistant, mock_fetch: AsyncMock, freezer: FrozenDateTimeFactory
) -> None:
    freezer.move_to(BASE)
    entry = make_entry()
    assert await setup_entry(hass, entry)
    coordinator = entry.runtime_data
    mock_fetch.return_value = unchanged_result()

    issue_id = f"camera_offline_{entry.entry_id}"
    registry = ir.async_get(hass)

    ticks = CAMERA_STALE_TICKS + 1
    for n in range(1, ticks + 1):
        await fire_tick(hass, freezer, 10 * n)

    assert coordinator.data["online"] is False
    assert registry.async_get_issue(DOMAIN, issue_id) is not None

    # Recovery clears it.
    mock_fetch.return_value = fresh_result()
    await fire_tick(hass, freezer, 10 * (ticks + 1))

    assert coordinator.data["online"] is True
    assert registry.async_get_issue(DOMAIN, issue_id) is None


async def test_capture_failure_marks_the_coordinator_unsuccessful(
    hass: HomeAssistant, mock_fetch: AsyncMock, freezer: FrozenDateTimeFactory
) -> None:
    freezer.move_to(BASE)
    entry = make_entry()
    assert await setup_entry(hass, entry)
    coordinator = entry.runtime_data
    mock_fetch.side_effect = UpdateFailed("camera exploded")

    await fire_tick(hass, freezer, 10)

    assert coordinator.last_update_success is False


async def test_undecodable_payload_is_a_translated_failure(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    entry = make_entry()
    assert await setup_entry(hass, entry)
    coordinator = entry.runtime_data
    mock_fetch.return_value = fresh_result(b"<html>not an image</html>")

    with (
        patch.object(coordinator, "_capture_pending", True),
        pytest.raises(UpdateFailed) as err,
    ):
        await coordinator._async_update_data()

    assert err.value.translation_key == "decode_error"
    assert isinstance(err.value.__cause__, ImageDecodeError)


# --- retention ------------------------------------------------------------


async def test_prune_drops_frames_past_the_retention_window(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    entry = make_entry(**{CONF_RETENTION_DAYS: 1})
    assert await setup_entry(hass, entry)
    coordinator = entry.runtime_data

    now_slot = frame_store.slot_for(dt_util.utcnow().timestamp(), coordinator.step)
    keep = now_slot - 600
    drop = now_slot - 3 * 86400
    for slot in (drop, keep, now_slot):
        frame_store.write_frame(coordinator.frames_dir, slot, b"x")

    await coordinator.async_refresh()

    assert frame_store.scan_slots(coordinator.frames_dir) == [keep, now_slot]
    assert coordinator.data["oldest_slot"] == keep


async def test_index_reports_gaps_after_an_outage(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    entry = make_entry()
    assert await setup_entry(hass, entry)
    coordinator = entry.runtime_data

    base = frame_store.slot_for(dt_util.utcnow().timestamp(), coordinator.step)
    for offset in (0, 1, 5, 6):
        frame_store.write_frame(coordinator.frames_dir, base - (6 - offset) * 600, b"x")

    await coordinator.async_refresh()

    assert coordinator.data["index"]["count"] == 7
    assert coordinator.data["index"]["gaps"] == [[2, 3]]


async def test_purge_frames_empties_the_archive(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    entry = make_entry()
    assert await setup_entry(hass, entry)
    coordinator = entry.runtime_data

    for offset in range(3):
        frame_store.write_frame(
            coordinator.frames_dir, 1_754_050_200 + offset * 600, b"x"
        )

    assert await coordinator.async_purge_frames() == 3
    assert coordinator.data["frame_count"] == 0


# --- capture_now ----------------------------------------------------------


async def test_capture_now_stores_a_frame_off_schedule(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    entry = make_entry()
    assert await setup_entry(hass, entry)
    coordinator = entry.runtime_data

    slot = await coordinator.async_capture_now()

    assert frame_store.frame_path(coordinator.frames_dir, slot).is_file()
    assert coordinator.data["frame_count"] == 1


async def test_capture_now_refuses_to_overwrite_history(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    """A stored frame can never be re-fetched, so overwriting destroys data."""
    entry = make_entry()
    assert await setup_entry(hass, entry)
    coordinator = entry.runtime_data

    slot = frame_store.slot_for(dt_util.utcnow().timestamp(), coordinator.step)
    frame_store.write_frame(coordinator.frames_dir, slot, b"original")

    with pytest.raises(FileExistsError):
        await coordinator.async_capture_now()

    assert (
        frame_store.frame_path(coordinator.frames_dir, slot).read_bytes() == b"original"
    )


async def test_capture_now_can_overwrite_when_explicitly_allowed(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    entry = make_entry()
    assert await setup_entry(hass, entry)
    coordinator = entry.runtime_data

    slot = frame_store.slot_for(dt_util.utcnow().timestamp(), coordinator.step)
    frame_store.write_frame(coordinator.frames_dir, slot, b"original")

    await coordinator.async_capture_now(allow_overwrite=True)

    assert (
        frame_store.frame_path(coordinator.frames_dir, slot).read_bytes() != b"original"
    )


# --- live frame -----------------------------------------------------------


async def test_live_refresh_does_not_disturb_freeze_state(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    """Otherwise 'camera offline' would depend on how many tabs are open."""
    entry = make_entry()
    assert await setup_entry(hass, entry)
    coordinator = entry.runtime_data

    mock_fetch.return_value = unchanged_result()
    await coordinator._async_capture(1_754_050_200)
    assert coordinator._frozen_ticks == 1

    mock_fetch.return_value = fresh_result(make_jpeg(seed=9))
    await coordinator.async_refresh_live_frame()

    assert coordinator.live_frame is not None
    assert coordinator._frozen_ticks == 1  # untouched by the live path
    assert coordinator._last_digest is None


async def test_live_refresh_on_unchanged_keeps_the_old_frame(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    entry = make_entry()
    assert await setup_entry(hass, entry)
    coordinator = entry.runtime_data

    await coordinator.async_capture_now()
    first = coordinator.live_frame

    mock_fetch.return_value = unchanged_result()
    await coordinator.async_refresh_live_frame()

    assert coordinator.live_frame == first


# --- teardown -------------------------------------------------------------


async def test_unload_cancels_the_capture_schedule(
    hass: HomeAssistant, mock_fetch: AsyncMock, freezer: FrozenDateTimeFactory
) -> None:
    freezer.move_to(BASE)
    entry = make_entry()
    assert await setup_entry(hass, entry)

    assert await hass.config_entries.async_unload(entry.entry_id)
    await hass.async_block_till_done()

    mock_fetch.reset_mock()
    await fire_tick(hass, freezer, 10)

    mock_fetch.assert_not_called()


async def test_custom_frames_path_is_honoured(
    hass: HomeAssistant, mock_fetch: AsyncMock, tmp_path
) -> None:
    from custom_components.webcam_timelapse.const import CONF_FRAMES_PATH

    custom = tmp_path / "elsewhere"
    entry = make_entry(**{CONF_FRAMES_PATH: str(custom)})
    assert await setup_entry(hass, entry)

    assert entry.runtime_data.frames_dir == custom
    assert custom.is_dir()


async def test_interval_drives_the_step(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    entry = make_entry(**{CONF_CAPTURE_INTERVAL: 5})
    assert await setup_entry(hass, entry)

    assert entry.runtime_data.step == 300
    assert entry.runtime_data.data["step"] == 300
