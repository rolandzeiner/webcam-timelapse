"""Video export tests: picking frames, driving ffmpeg, and cleaning up.

Almost all of these run against a stand-in for ffmpeg — a few lines of
Python that count the bytes they are fed — so the suite does not depend on
which codecs a CI image happens to ship, and so failure modes (a crash, a
bad exit code, a binary that is not there) can be staged on demand. One
test at the end runs the real thing where it is installed.
"""

from __future__ import annotations

import asyncio
import datetime as dt
import io
import shutil
from collections.abc import Generator
from pathlib import Path
from types import SimpleNamespace
from typing import Any
from unittest.mock import AsyncMock, patch

import pytest
from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util
from PIL import Image

from custom_components.webcam_timelapse import export, frame_store
from custom_components.webcam_timelapse.const import (
    CONF_CAPTURE_INTERVAL,
    DOMAIN,
    EXPORT_MIN_FREE_BYTES,
)
from custom_components.webcam_timelapse.export import (
    ExportError,
    ExportOptions,
    VideoExporter,
    async_get_exporter,
)
from custom_components.webcam_timelapse.overlay import Reading

from .conftest import (
    FRAME_BYTES,
    install_ffmpeg,
    make_entry,
    setup_entry,
    write_frames,
)
from .conftest import FRAME_HEIGHT as HEIGHT
from .conftest import FRAME_WIDTH as WIDTH
from .conftest import GRID_STEP as STEP
from .conftest import GRID_T0 as T0
from .conftest import grid_slots as slots


@pytest.fixture
async def exporter(
    hass: HomeAssistant, mock_fetch: AsyncMock, media_dir: Path, ffmpeg: Path
) -> VideoExporter:
    """An exporter for a set-up entry with six frames in its archive."""
    entry = make_entry()
    assert await setup_entry(hass, entry)
    write_frames(entry.runtime_data, slots(6))
    return async_get_exporter(hass, entry)


def fed_bytes(result: dict[str, Any]) -> int:
    """How many bytes the stand-in ffmpeg was given."""
    return int(Path(result["path"]).read_bytes().removeprefix(b"bytes="))


# --- the happy path -------------------------------------------------------


async def test_export_writes_a_video_into_the_media_folder(
    exporter: VideoExporter, media_dir: Path
) -> None:
    result = await exporter.async_export(ExportOptions(timestamp=False))

    target = Path(result["path"])
    assert target.parent == media_dir / "webcam_timelapse" / "test_cam"
    assert target.suffix == ".mp4"
    assert target.name.startswith("test_cam_")
    assert result["file_name"] == target.name
    assert result["media_content_id"] == (
        f"media-source://media_source/local/webcam_timelapse/test_cam/{target.name}"
    )
    assert result["frames"] == 6
    assert result["skipped"] == 0
    assert result["fps"] == 24
    assert result["duration"] == 0.25
    assert (result["width"], result["height"]) == (WIDTH, HEIGHT)
    assert (result["start"], result["end"]) == (T0, T0 + 5 * STEP)
    assert result["size_bytes"] == target.stat().st_size
    # Every frame reached the encoder, whole and in the size promised.
    assert fed_bytes(result) == 6 * FRAME_BYTES
    # Nothing half-written is left beside it.
    assert [path.name for path in target.parent.iterdir()] == [target.name]


async def test_export_reports_done_with_the_result(exporter: VideoExporter) -> None:
    assert exporter.status.state == "idle"

    result = await exporter.async_export(ExportOptions())

    status = exporter.status.as_dict()
    assert status["state"] == "done"
    assert (status["done"], status["total"]) == (6, 6)
    assert status["result"] == result
    assert status["error"] is None
    assert exporter.running is False


async def test_the_file_is_named_for_the_frames_it_holds(
    hass: HomeAssistant, exporter: VideoExporter
) -> None:
    await hass.config.async_set_time_zone("Europe/Vienna")

    result = await exporter.async_export(
        ExportOptions(start=T0 + STEP, end=T0 + 3 * STEP)
    )

    def label(slot: int) -> str:
        return dt_util.as_local(dt_util.utc_from_timestamp(slot)).strftime(
            "%Y%m%d-%H%M"
        )

    assert result["file_name"] == (
        f"test_cam_{label(T0 + STEP)}_{label(T0 + 3 * STEP)}.mp4"
    )


async def test_a_second_export_of_the_same_range_keeps_the_first(
    exporter: VideoExporter,
) -> None:
    """With and without readings, say — the second must not replace the first."""
    first = await exporter.async_export(ExportOptions())
    second = await exporter.async_export(ExportOptions())
    third = await exporter.async_export(ExportOptions())

    assert Path(first["path"]).is_file()
    assert second["file_name"] == first["file_name"].replace(".mp4", "_2.mp4")
    assert third["file_name"] == first["file_name"].replace(".mp4", "_3.mp4")


async def test_frames_reach_the_encoder_in_capture_order(
    hass: HomeAssistant, exporter: VideoExporter, tmp_path: Path
) -> None:
    """Frames are decoded two at a time; the video must not be shuffled by it."""
    coordinator = hass.config_entries.async_entries(DOMAIN)[0].runtime_data
    write_frames(coordinator, slots(24))
    # Hands back exactly what it was fed, so the stream can be inspected.
    install_ffmpeg(
        hass,
        tmp_path,
        """
with open(sys.argv[-1], "wb") as out:
    out.write(sys.stdin.buffer.read())
""",
    )

    result = await exporter.async_export(ExportOptions(timestamp=False, deflicker=0))

    stream = Path(result["path"]).read_bytes()
    expected = [
        export._render_frame(coordinator.frames_dir, slot, (WIDTH, HEIGHT), 1.0, None)
        for slot in slots(24)
    ]
    assert len(set(expected)) == 24  # every frame is distinguishable
    assert stream == b"".join(frame for frame in expected if frame is not None)


# --- choosing frames ------------------------------------------------------


@pytest.mark.parametrize(
    ("start", "end", "expected"),
    [
        (None, None, 6),
        (T0 + STEP, None, 5),
        (None, T0 + STEP, 2),
        (T0 + STEP, T0 + 3 * STEP, 3),  # both ends inclusive
        (T0 + STEP + 1, T0 + 3 * STEP - 1, 1),
        (T0 + 2 * STEP, T0 + 2 * STEP, 1),
    ],
)
async def test_the_range_is_inclusive_at_both_ends(
    exporter: VideoExporter, start: float | None, end: float | None, expected: int
) -> None:
    result = await exporter.async_export(ExportOptions(start=start, end=end))
    assert result["frames"] == expected


async def test_gaps_are_skipped_not_padded(
    hass: HomeAssistant, exporter: VideoExporter
) -> None:
    """A night with no captures must not become seconds of frozen picture."""
    coordinator = hass.config_entries.async_entries(DOMAIN)[0].runtime_data
    write_frames(coordinator, [T0 + 50 * STEP])

    result = await exporter.async_export(ExportOptions())

    assert result["frames"] == 7
    assert fed_bytes(result) == 7 * FRAME_BYTES


async def test_frames_off_the_capture_grid_are_left_out(
    hass: HomeAssistant, exporter: VideoExporter
) -> None:
    """The card cannot show them either; the export matches what it shows."""
    coordinator = hass.config_entries.async_entries(DOMAIN)[0].runtime_data
    write_frames(coordinator, [T0 + 60])  # a one-minute frame on a ten-minute grid

    result = await exporter.async_export(ExportOptions())

    assert result["frames"] == 6


async def test_no_frames_in_range_is_an_error(
    exporter: VideoExporter, media_dir: Path
) -> None:
    with pytest.raises(ExportError) as err:
        await exporter.async_export(ExportOptions(start=T0 + 100 * STEP))

    assert err.value.translation_key == "export_no_frames"
    assert exporter.status.state == "failed"
    assert exporter.status.error == "export_no_frames"
    # Nothing was created for a video that was never going to exist.
    assert not (media_dir / "webcam_timelapse").exists()


async def test_a_backwards_range_is_an_error(exporter: VideoExporter) -> None:
    with pytest.raises(ExportError) as err:
        await exporter.async_export(ExportOptions(start=T0 + STEP, end=T0))

    assert err.value.translation_key == "export_bad_range"


# --- frame size -----------------------------------------------------------


@pytest.mark.parametrize(
    ("native", "max_width", "expected"),
    [
        ((1600, 1200), 0, (1600, 1200)),
        ((1601, 1201), 0, (1600, 1200)),  # H.264 4:2:0 cannot be odd
        ((1600, 1200), 640, (640, 480)),
        ((640, 480), 1280, (640, 480)),  # never upscaled
        ((333, 251), 100, (100, 74)),
        ((3, 1), 0, (2, 2)),
    ],
)
def test_output_size(
    native: tuple[int, int], max_width: int, expected: tuple[int, int]
) -> None:
    assert export._output_size(native, max_width) == expected


async def test_max_width_scales_the_video_down(exporter: VideoExporter) -> None:
    result = await exporter.async_export(ExportOptions(max_width=32))

    assert (result["width"], result["height"]) == (32, 24)
    assert fed_bytes(result) == 6 * 32 * 24 * 3


@pytest.mark.parametrize(
    ("aspect", "position", "expected"),
    [
        ("native", 50, (WIDTH, HEIGHT)),
        ("16:9", 50, (64, 36)),  # 64x48 is 4:3: the height is cut
        ("9:16", 50, (26, 48)),  # and here the width
        ("1:1", 0, (48, 48)),
    ],
)
async def test_aspect_crops_the_video(
    exporter: VideoExporter,
    aspect: str,
    position: int,
    expected: tuple[int, int],
) -> None:
    result = await exporter.async_export(
        ExportOptions(aspect=aspect, crop_position=position)
    )

    assert (result["width"], result["height"]) == expected
    assert fed_bytes(result) == 6 * expected[0] * expected[1] * 3


async def test_max_width_applies_to_the_cropped_picture(
    exporter: VideoExporter,
) -> None:
    result = await exporter.async_export(ExportOptions(aspect="1:1", max_width=32))

    assert (result["width"], result["height"]) == (32, 32)


async def test_crop_position_picks_the_part_kept(
    hass: HomeAssistant, mock_fetch: AsyncMock, media_dir: Path
) -> None:
    """0 keeps the left edge of the frame, 100 the right."""
    entry = make_entry()
    assert await setup_entry(hass, entry)
    coordinator = entry.runtime_data
    image = Image.new("RGB", (WIDTH, HEIGHT), (0, 0, 255))
    image.paste((255, 0, 0), (0, 0, WIDTH // 2, HEIGHT))
    buffer = io.BytesIO()
    image.save(buffer, "WEBP", lossless=True)
    frame_store.write_frame(coordinator.frames_dir, T0, buffer.getvalue())

    def render(position: float) -> bytes | None:
        return export._render_frame(
            coordinator.frames_dir, T0, (26, 48), 1.0, None, (9 / 16, position)
        )

    left = await hass.async_add_executor_job(render, 0.0)
    right = await hass.async_add_executor_job(render, 1.0)
    assert left is not None and right is not None
    assert left[:3] == bytes((255, 0, 0))
    assert right[:3] == bytes((0, 0, 255))


async def test_every_uses_only_every_nth_frame(exporter: VideoExporter) -> None:
    result = await exporter.async_export(ExportOptions(every=4))

    # Six frames: the first and the fifth. The range still opens on its
    # own first frame.
    assert result["frames"] == 2
    assert (result["start"], result["end"]) == (T0, T0 + 4 * STEP)
    assert fed_bytes(result) == 2 * FRAME_BYTES


async def test_frames_of_another_size_are_resized_to_match(
    hass: HomeAssistant, exporter: VideoExporter
) -> None:
    """Changing "Resize to" mid-archive leaves two sizes on disk; a video has one."""
    coordinator = hass.config_entries.async_entries(DOMAIN)[0].runtime_data
    write_frames(coordinator, [T0 + 6 * STEP, T0 + 7 * STEP], size=(128, 96))

    result = await exporter.async_export(ExportOptions())

    assert (result["width"], result["height"]) == (WIDTH, HEIGHT)
    assert fed_bytes(result) == 8 * FRAME_BYTES


# --- frames that cannot be read -------------------------------------------


async def test_an_unreadable_frame_is_skipped(
    hass: HomeAssistant, exporter: VideoExporter
) -> None:
    coordinator = hass.config_entries.async_entries(DOMAIN)[0].runtime_data
    frame_store.write_frame(coordinator.frames_dir, T0 + 2 * STEP, b"not a webp")

    result = await exporter.async_export(ExportOptions())

    assert (result["frames"], result["skipped"]) == (5, 1)
    assert fed_bytes(result) == 5 * FRAME_BYTES


async def test_an_unreadable_first_frame_does_not_set_the_size(
    hass: HomeAssistant, exporter: VideoExporter
) -> None:
    coordinator = hass.config_entries.async_entries(DOMAIN)[0].runtime_data
    frame_store.write_frame(coordinator.frames_dir, T0, b"not a webp")

    result = await exporter.async_export(ExportOptions())

    assert (result["width"], result["height"]) == (WIDTH, HEIGHT)
    assert result["frames"] == 5


async def test_a_frame_pruned_mid_export_is_skipped(
    hass: HomeAssistant, exporter: VideoExporter
) -> None:
    """Retention can delete a frame between planning and reading it."""
    real_read = frame_store.read_frame
    seen: list[int] = []

    def _read(frames_dir: Path, slot: int) -> bytes | None:
        seen.append(slot)
        # The first read of each slot is the planner sizing the video.
        if slot == T0 + 3 * STEP:
            return None
        return real_read(frames_dir, slot)

    with patch.object(frame_store, "read_frame", _read):
        result = await exporter.async_export(ExportOptions())

    assert (result["frames"], result["skipped"]) == (5, 1)


async def test_an_archive_with_nothing_readable_is_an_error(
    hass: HomeAssistant, mock_fetch: AsyncMock, media_dir: Path, ffmpeg: Path
) -> None:
    entry = make_entry()
    assert await setup_entry(hass, entry)
    frame_store.write_frame(entry.runtime_data.frames_dir, T0, b"not a webp")

    with pytest.raises(ExportError) as err:
        await async_get_exporter(hass, entry).async_export(ExportOptions())

    assert err.value.translation_key == "export_no_frames"


# --- deflicker ------------------------------------------------------------


async def test_deflicker_gains_follow_the_luminance_log(
    hass: HomeAssistant, mock_fetch: AsyncMock, media_dir: Path
) -> None:
    entry = make_entry()
    assert await setup_entry(hass, entry)
    coordinator = entry.runtime_data
    write_frames(coordinator, slots(12), luma=[100, 140] * 6)

    def plan(deflicker: int) -> export._Plan:
        return export._plan(
            coordinator.frames_dir,
            coordinator.step,
            ExportOptions(start=T0 + 4 * STEP, end=T0 + 7 * STEP, deflicker=deflicker),
            media_dir / "out",
            "cam",
        )

    smoothed = await hass.async_add_executor_job(plan, 50)
    # Dark frames lifted, bright ones pulled down — and computed over the
    # whole archive, so the first exported frame is corrected too.
    assert smoothed.gains[T0 + 4 * STEP] > 1 > smoothed.gains[T0 + 5 * STEP]

    untouched = await hass.async_add_executor_job(plan, 0)
    assert untouched.gains == {}


async def test_deflicker_changes_the_pixels_sent_to_the_encoder(
    hass: HomeAssistant, mock_fetch: AsyncMock, media_dir: Path
) -> None:
    entry = make_entry()
    assert await setup_entry(hass, entry)
    coordinator = entry.runtime_data
    write_frames(coordinator, slots(1))

    def render(gain: float) -> bytes | None:
        return export._render_frame(
            coordinator.frames_dir, T0, (WIDTH, HEIGHT), gain, None
        )

    plain = await hass.async_add_executor_job(render, 1.0)
    brighter = await hass.async_add_executor_job(render, 1.3)
    assert plain is not None and brighter is not None
    assert sum(brighter) > sum(plain)


# --- ffmpeg ---------------------------------------------------------------


def test_ffmpeg_binary_defaults_to_the_one_on_the_path(hass: HomeAssistant) -> None:
    assert export.ffmpeg_binary(hass) == "ffmpeg"

    hass.data["ffmpeg"] = SimpleNamespace(binary="/opt/ffmpeg/bin/ffmpeg")
    assert export.ffmpeg_binary(hass) == "/opt/ffmpeg/bin/ffmpeg"


def test_ffmpeg_command_describes_the_raw_input_exactly() -> None:
    command = export.ffmpeg_command("ffmpeg", (640, 480), 30, Path("/out/x.part"))

    assert command[0] == "ffmpeg"
    assert command[-1] == "/out/x.part"
    # The input options must come before -i, or they describe the output.
    source = command[: command.index("-i")]
    assert source[source.index("-video_size") + 1] == "640x480"
    assert source[source.index("-framerate") + 1] == "30"
    assert source[source.index("-pix_fmt") + 1] == "rgb24"
    # The container is named outright: the partial file's suffix is not .mp4.
    assert command[command.index("-f", command.index("-i")) + 1] == "mp4"


async def test_a_missing_ffmpeg_is_reported_as_such(
    hass: HomeAssistant, exporter: VideoExporter, media_dir: Path
) -> None:
    hass.data["ffmpeg"] = SimpleNamespace(binary="/nonexistent/ffmpeg")

    with pytest.raises(ExportError) as err:
        await exporter.async_export(ExportOptions())

    assert err.value.translation_key == "export_ffmpeg_missing"
    assert err.value.translation_placeholders == {"binary": "/nonexistent/ffmpeg"}
    assert exporter.status.error == "export_ffmpeg_missing"


async def test_a_failing_ffmpeg_reports_its_last_line_and_leaves_no_file(
    hass: HomeAssistant, exporter: VideoExporter, media_dir: Path, tmp_path: Path
) -> None:
    install_ffmpeg(
        hass,
        tmp_path,
        """
sys.stdin.buffer.read()
with open(sys.argv[-1], "wb") as out:
    out.write(b"half a video")
sys.stderr.write("some preamble\\nUnknown encoder 'libx264'\\n")
sys.exit(1)
""",
    )

    with pytest.raises(ExportError) as err:
        await exporter.async_export(ExportOptions())

    assert err.value.translation_key == "export_ffmpeg_failed"
    assert err.value.translation_placeholders == {"error": "Unknown encoder 'libx264'"}
    assert exporter.status.state == "failed"
    assert list((media_dir / "webcam_timelapse" / "test_cam").iterdir()) == []


async def test_an_ffmpeg_that_dies_mid_stream_is_a_failure_not_a_hang(
    hass: HomeAssistant, exporter: VideoExporter, media_dir: Path, tmp_path: Path
) -> None:
    """It stops reading; the pipe breaks under the frames still being fed."""
    coordinator = hass.config_entries.async_entries(DOMAIN)[0].runtime_data
    # Enough frames to overrun the pipe buffer of a reader that has gone.
    write_frames(coordinator, slots(40), size=(320, 240))
    install_ffmpeg(hass, tmp_path, "sys.exit(3)")

    with pytest.raises(ExportError) as err:
        await exporter.async_export(ExportOptions())

    assert err.value.translation_key == "export_ffmpeg_failed"
    assert err.value.translation_placeholders == {"error": "3"}


async def test_an_ffmpeg_that_wrote_nothing_usable_is_caught(
    hass: HomeAssistant, exporter: VideoExporter, tmp_path: Path
) -> None:
    """Every frame vanished between planning and reading."""
    real_read = frame_store.read_frame
    reads: dict[int, int] = {}

    def _read(frames_dir: Path, slot: int) -> bytes | None:
        reads[slot] = reads.get(slot, 0) + 1
        # Let the planner size the video from the first frame, then lose all.
        if slot == T0 and reads[slot] == 1:
            return real_read(frames_dir, slot)
        return None

    with (
        patch.object(frame_store, "read_frame", _read),
        pytest.raises(ExportError) as err,
    ):
        await exporter.async_export(ExportOptions())

    assert err.value.translation_key == "export_no_frames"


async def test_an_unexpected_failure_still_reaches_the_status(
    exporter: VideoExporter,
) -> None:
    """The card watches the status, not the log."""
    with (
        patch.object(export, "_publish", side_effect=OSError("disk went away")),
        pytest.raises(ExportError) as err,
    ):
        await exporter.async_export(ExportOptions())

    assert err.value.translation_key == "export_failed"
    assert exporter.status.state == "failed"
    assert exporter.status.error == "export_failed"
    assert exporter.status.message == "disk went away"


async def test_low_disk_space_refuses_to_start(
    exporter: VideoExporter, media_dir: Path
) -> None:
    usage = shutil.disk_usage(media_dir)
    with (
        patch.object(
            export.shutil,
            "disk_usage",
            return_value=usage._replace(free=EXPORT_MIN_FREE_BYTES - 1),
        ),
        pytest.raises(ExportError) as err,
    ):
        await exporter.async_export(ExportOptions())

    assert err.value.translation_key == "export_low_disk"
    assert err.value.translation_placeholders == {"free": "499", "needed": "500"}


# --- one at a time, and cancelling ----------------------------------------


async def test_a_second_export_is_refused_while_one_runs(
    exporter: VideoExporter,
) -> None:
    task = exporter.async_start(ExportOptions())
    assert exporter.running is True

    with pytest.raises(ExportError) as err:
        exporter.async_start(ExportOptions())
    assert err.value.translation_key == "export_running"

    result = await task
    assert result["frames"] == 6
    # And the refusal did not disturb the one that was running.
    assert exporter.status.state == "done"


async def test_cancel_stops_the_export_and_removes_the_partial_file(
    hass: HomeAssistant, exporter: VideoExporter, media_dir: Path
) -> None:
    coordinator = hass.config_entries.async_entries(DOMAIN)[0].runtime_data
    write_frames(coordinator, slots(60))
    states: list[str] = []

    def _listener(status: dict[str, Any]) -> None:
        states.append(status["state"])
        # Cancel as soon as frames are flowing.
        if status["state"] == "running" and status["total"]:
            exporter.async_cancel()

    exporter.async_subscribe(_listener)

    with pytest.raises(ExportError) as err:
        await exporter.async_export(ExportOptions())

    assert err.value.translation_key == "export_cancelled"
    assert exporter.status.state == "cancelled"
    assert states[-1] == "cancelled"
    assert exporter.running is False
    assert list((media_dir / "webcam_timelapse" / "test_cam").iterdir()) == []


async def test_cancel_with_nothing_running_is_a_no_op(exporter: VideoExporter) -> None:
    assert exporter.async_cancel() is False


async def test_cancelling_the_caller_cancels_the_export(
    hass: HomeAssistant, exporter: VideoExporter
) -> None:
    """A stopped script must not leave an encode running behind it."""
    coordinator = hass.config_entries.async_entries(DOMAIN)[0].runtime_data
    write_frames(coordinator, slots(60))

    caller = hass.async_create_task(exporter.async_export(ExportOptions()))
    while exporter.status.total == 0:
        await asyncio.sleep(0.01)
    caller.cancel()

    with pytest.raises(asyncio.CancelledError):
        await caller
    await hass.async_block_till_done(wait_background_tasks=True)
    assert exporter.status.state == "cancelled"


async def test_unloading_the_entry_cancels_its_export(
    hass: HomeAssistant, exporter: VideoExporter, media_dir: Path
) -> None:
    entry = hass.config_entries.async_entries(DOMAIN)[0]
    write_frames(entry.runtime_data, slots(60))

    task = exporter.async_start(ExportOptions())
    while exporter.status.total == 0:
        await asyncio.sleep(0.01)

    assert await hass.config_entries.async_unload(entry.entry_id)
    await hass.async_block_till_done(wait_background_tasks=True)

    assert task.cancelled()
    assert exporter.status.state == "cancelled"
    assert list((media_dir / "webcam_timelapse" / "test_cam").iterdir()) == []


async def test_exporting_an_unloaded_entry_is_an_error(
    hass: HomeAssistant, exporter: VideoExporter
) -> None:
    entry = hass.config_entries.async_entries(DOMAIN)[0]
    assert await hass.config_entries.async_unload(entry.entry_id)

    with pytest.raises(ExportError) as err:
        await exporter.async_export(ExportOptions())

    assert err.value.translation_key == "entry_not_loaded"


# --- status subscription --------------------------------------------------


async def test_subscribers_see_progress_through_to_done(
    hass: HomeAssistant, exporter: VideoExporter
) -> None:
    seen: list[dict[str, Any]] = []
    unsubscribe = exporter.async_subscribe(seen.append)

    with patch.object(export, "_PROGRESS_INTERVAL_SECONDS", 0):
        result = await exporter.async_export(ExportOptions())

    assert seen[0]["state"] == "running"
    assert seen[0]["total"] == 0  # announced before the frames are counted
    assert [status["done"] for status in seen if status["state"] == "running"][-1] == 6
    assert seen[-1] == {
        "state": "done",
        "done": 6,
        "total": 6,
        "error": None,
        "message": None,
        "result": result,
        "folder": str(Path(result["path"]).parent),
        # The export created the folder, so the card can link to it.
        "folder_media_id": "media-source://media_source/local/webcam_timelapse/test_cam",
        # Read again after the video was written, so it reflects the space left.
        "free_bytes": seen[-1]["free_bytes"],
    }
    assert isinstance(seen[-1]["free_bytes"], int)

    unsubscribe()
    unsubscribe()  # twice is harmless
    count = len(seen)
    await exporter.async_export(ExportOptions())
    assert len(seen) == count


async def test_the_exporter_survives_a_reload_of_its_entry(
    hass: HomeAssistant, exporter: VideoExporter
) -> None:
    """Saving options reloads the entry; the card's subscription must not die."""
    entry = hass.config_entries.async_entries(DOMAIN)[0]
    seen: list[str] = []
    exporter.async_subscribe(lambda status: seen.append(status["state"]))
    first = await exporter.async_export(ExportOptions())

    await hass.config_entries.async_reload(entry.entry_id)
    await hass.async_block_till_done()

    assert async_get_exporter(hass, entry) is exporter
    # The link to the finished video is still there to be read...
    assert exporter.status.result == first
    # ...and a new export, against the new coordinator, reports to the
    # same subscriber.
    await exporter.async_export(ExportOptions())
    assert seen.count("done") == 2


async def test_removing_the_entry_forgets_its_exporter_and_keeps_its_videos(
    hass: HomeAssistant, exporter: VideoExporter
) -> None:
    entry = hass.config_entries.async_entries(DOMAIN)[0]
    result = await exporter.async_export(ExportOptions())

    assert await hass.config_entries.async_remove(entry.entry_id)
    await hass.async_block_till_done()

    assert entry.entry_id not in hass.data[DOMAIN]["exporters"]
    # A video is a keepsake, not a cache.
    assert Path(result["path"]).is_file()


# --- where it is written --------------------------------------------------


def test_media_root_prefers_the_local_media_folder(
    hass: HomeAssistant, tmp_path: Path
) -> None:
    hass.config.media_dirs = {"nas": "/mnt/nas", "local": "/media"}
    assert export.media_root(hass) == ("local", Path("/media"))

    hass.config.media_dirs = {"nas": "/mnt/nas"}
    assert export.media_root(hass) == ("nas", Path("/mnt/nas"))

    hass.config.media_dirs = {}
    assert export.media_root(hass) == ("local", Path(hass.config.path("media")))


# --- the overlay's data ---------------------------------------------------


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("21.5", 21.5),
        (" 7 ", 7.0),
        ("-3", -3.0),
        ("unknown", None),
        ("Unavailable", None),
        ("", None),
        ("on", None),
        ("nan", None),
        ("inf", None),
    ],
)
def test_parse_value(raw: str, expected: float | None) -> None:
    """unknown/unavailable appear on every restart and must not plot as zero."""
    assert export._parse_value(raw) == expected


def test_attribute_time_reads_what_a_card_would() -> None:
    moment = dt.datetime(2026, 8, 1, 12, 0, tzinfo=dt.UTC)
    epoch = moment.timestamp()

    assert export._attribute_time({"t": moment}, "t") == epoch
    assert export._attribute_time({"t": moment.isoformat()}, "t") == epoch
    # A bare number is milliseconds, as `new Date(n)` reads it.
    assert export._attribute_time({"t": epoch * 1000}, "t") == epoch
    assert export._attribute_time({"t": 0}, "t") is None
    assert export._attribute_time({"t": True}, "t") is None
    assert export._attribute_time({"t": "last Tuesday"}, "t") is None
    assert export._attribute_time({}, "t") is None


@pytest.fixture
def mock_history() -> Generator[AsyncMock]:
    """Stand in for the recorder with two readings per entity asked for."""

    async def _history(
        hass: HomeAssistant, entity_ids: list[str], *_args: Any
    ) -> dict[str, list[Reading]]:
        return {
            entity_id: [Reading(T0 - 3600, 600.0), Reading(T0, 640.0)]
            for entity_id in entity_ids
        }

    with patch.object(
        export, "async_load_history", AsyncMock(side_effect=_history)
    ) as mocked:
        yield mocked


async def test_overlay_resolves_names_units_and_colours_like_the_card(
    hass: HomeAssistant, mock_history: AsyncMock
) -> None:
    hass.states.async_set(
        "sensor.co2",
        "640",
        {"friendly_name": "Garden CO2", "unit_of_measurement": "ppm"},
    )
    options = ExportOptions(
        overlay=export.OVERLAY_SCHEMA(
            {
                "overlay_title": "  Greenhouse ",
                "overlay_title_left": "   ",
                "accent_color": "#102030",
                "graph_hours": 12,
                "entities": [
                    {"entity": "sensor.co2", "graph": True, "show_icon": True},
                    {
                        "entity": "sensor.co2",
                        "name": "CO₂ (raw)",
                        "unit": "",
                        "decimals": 0,
                        "color": "#ff9800",
                        "graph": True,
                        "graph_hours": 48,
                    },
                ],
                "entities_left": [{"entity": "sensor.unheard_of"}],
                "type": "custom:webcam-timelapse-card",
            }
        ),
        language="de",
    )

    spec = await export.async_build_overlay(hass, options, T0, T0 + STEP)

    assert spec is not None
    assert spec.language == "de"
    assert spec.show_stamp is True
    left, right = spec.groups
    assert (left.side, left.title) == ("left", None)  # blank heading is no heading
    assert (right.side, right.title) == ("right", "Greenhouse")

    plain, custom = right.rows
    assert (plain.name, plain.unit, plain.decimals) == ("Garden CO2", "ppm", 1)
    assert plain.color == (16, 32, 48)  # the card's accent
    assert (plain.graph, plain.graph_hours) == (True, 12)
    assert (custom.name, custom.unit, custom.decimals) == ("CO₂ (raw)", "", 0)
    assert custom.color == (255, 152, 0)
    assert custom.graph_hours == 48
    # One series per entity, shared by the rows that show it.
    assert plain.series is custom.series
    assert plain.series.resolve(T0) is not None

    # An entity Home Assistant has never heard of still gets its row.
    assert (left.rows[0].name, left.rows[0].unit) == ("sensor.unheard_of", "")

    # History reaches half the widest graph window past each end.
    _hass, entity_ids, start, end, time_attributes = mock_history.call_args.args
    # Each entity once, however many rows show it.
    assert entity_ids == ["sensor.unheard_of", "sensor.co2"]
    assert start == dt_util.utc_from_timestamp(T0 - 24 * 3600)
    assert end == dt_util.utc_from_timestamp(T0 + STEP + 24 * 3600)
    assert time_attributes == {}


async def test_overlay_passes_time_attributes_to_the_history_lookup(
    hass: HomeAssistant, mock_history: AsyncMock
) -> None:
    options = ExportOptions(
        overlay=export.OVERLAY_SCHEMA(
            {"entities": [{"entity": "sensor.gauge", "time_attribute": "timestamp"}]}
        )
    )

    await export.async_build_overlay(hass, options, T0, T0)

    assert mock_history.call_args.args[4] == {"sensor.gauge": "timestamp"}


async def test_show_graph_off_drops_every_graph_and_the_extra_history(
    hass: HomeAssistant, mock_history: AsyncMock
) -> None:
    options = ExportOptions(
        overlay=export.OVERLAY_SCHEMA(
            {
                "show_graph": False,
                "show_sun": True,
                "entities": [{"entity": "sensor.co2", "graph": True}],
            }
        )
    )

    spec = await export.async_build_overlay(hass, options, T0, T0 + STEP)

    assert spec is not None
    assert spec.groups[0].rows[0].graph is False
    assert spec.nights == []  # nothing to shade
    _hass, _ids, start, end, _attrs = mock_history.call_args.args
    assert (start.timestamp(), end.timestamp()) == (T0, T0 + STEP)


async def test_show_sun_supplies_the_nights_around_the_export(
    hass: HomeAssistant, mock_history: AsyncMock
) -> None:
    hass.config.latitude = 48.2
    hass.config.longitude = 16.4
    options = ExportOptions(
        overlay=export.OVERLAY_SCHEMA(
            {"show_sun": True, "entities": [{"entity": "sensor.co2", "graph": True}]}
        )
    )

    spec = await export.async_build_overlay(hass, options, T0, T0 + 86400)

    assert spec is not None
    assert len(spec.nights) >= 2
    for sunset, sunrise in spec.nights:
        assert 6 * 3600 < sunrise - sunset < 18 * 3600
    assert spec.nights == sorted(spec.nights)


async def test_overlay_carries_the_sizes_and_positions_asked_for(
    hass: HomeAssistant, mock_history: AsyncMock
) -> None:
    overlay = export.OVERLAY_SCHEMA(
        {
            "entities": [{"entity": "sensor.co2"}],
            "entities_left": [{"entity": "sensor.temp"}],
        }
    )

    default = await export.async_build_overlay(
        hass, ExportOptions(overlay=overlay), T0, T0
    )
    assert default is not None
    assert (default.readings_width, default.stamp_width) == (0.30, 0.15)
    # Each block where the card has it.
    assert [group.position for group in default.groups] == [None, None]

    custom = await export.async_build_overlay(
        hass,
        ExportOptions(
            overlay=overlay,
            readings_size=45,
            timestamp_size=8,
            readings_position="top",
            readings_position_left="bottom",
        ),
        T0,
        T0,
    )
    assert custom is not None
    assert (custom.readings_width, custom.stamp_width) == (0.45, 0.08)
    positions = {group.side: group.position for group in custom.groups}
    assert positions == {"right": "top", "left": "bottom"}


async def test_no_readings_and_no_stamp_means_no_overlay_at_all(
    hass: HomeAssistant, mock_history: AsyncMock
) -> None:
    assert (
        await export.async_build_overlay(
            hass, ExportOptions(timestamp=False), T0, T0 + STEP
        )
        is None
    )

    stamp_only = await export.async_build_overlay(hass, ExportOptions(), T0, T0)
    assert stamp_only is not None
    assert stamp_only.groups == []
    assert stamp_only.language == hass.config.language


async def test_history_is_empty_without_the_recorder(hass: HomeAssistant) -> None:
    """The overlay still draws, with a dash where each value would be."""
    now = dt_util.utcnow()
    assert await export.async_load_history(hass, ["sensor.co2"], now, now, {}) == {}
    assert await export.async_load_history(hass, [], now, now, {}) == {}


async def test_export_with_an_overlay_draws_on_every_frame(
    hass: HomeAssistant, exporter: VideoExporter, mock_history: AsyncMock
) -> None:
    """End to end: the readings change the pixels the encoder is given."""
    captured: list[bytes] = []
    real_render = export._render_frame

    def _render(*args: Any) -> bytes | None:
        frame = real_render(*args)
        if frame is not None:
            captured.append(frame)
        return frame

    overlay = export.OVERLAY_SCHEMA({"entities": [{"entity": "sensor.co2"}]})
    with patch.object(export, "_render_frame", _render):
        await exporter.async_export(ExportOptions(end=T0, overlay=overlay))
        await exporter.async_export(ExportOptions(end=T0, timestamp=False))

    with_overlay, without = captured
    assert len(with_overlay) == len(without) == FRAME_BYTES
    assert with_overlay != without


# --- the real encoder -----------------------------------------------------


@pytest.mark.skipif(shutil.which("ffmpeg") is None, reason="ffmpeg is not installed")
async def test_the_real_ffmpeg_produces_a_playable_mp4(
    hass: HomeAssistant,
    mock_fetch: AsyncMock,
    media_dir: Path,
    mock_history: AsyncMock,
) -> None:
    """The command line is only proven by the program it is written for."""
    entry = make_entry(**{CONF_CAPTURE_INTERVAL: 10})
    assert await setup_entry(hass, entry)
    write_frames(entry.runtime_data, slots(8), size=(161, 121))

    result = await async_get_exporter(hass, entry).async_export(
        ExportOptions(
            fps=8,
            overlay=export.OVERLAY_SCHEMA(
                {"entities": [{"entity": "sensor.co2", "graph": True}]}
            ),
        )
    )

    video = Path(result["path"]).read_bytes()
    assert (result["width"], result["height"]) == (160, 120)
    assert result["frames"] == 8
    assert result["duration"] == 1.0
    # An ISO base media file, with the index moved to the front.
    assert video[4:8] == b"ftyp"
    assert video.index(b"moov") < video.index(b"mdat")
    assert b"avc1" in video
