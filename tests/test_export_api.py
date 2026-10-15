"""The export's two ways in: the service and the WebSocket API.

``test_export.py`` covers the exporter itself; this file covers what
callers actually touch.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any
from unittest.mock import AsyncMock, patch

import pytest
import voluptuous as vol
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError
from homeassistant.util import dt as dt_util

from custom_components.webcam_timelapse import export
from custom_components.webcam_timelapse.const import DOMAIN
from custom_components.webcam_timelapse.export import (
    ExportOptions,
    async_get_exporter,
)
from custom_components.webcam_timelapse.services import SERVICE_EXPORT_VIDEO
from custom_components.webcam_timelapse.websocket import (
    WS_TYPE_EXPORT_CANCEL,
    WS_TYPE_EXPORT_START,
    WS_TYPE_EXPORT_SUBSCRIBE,
)

from .conftest import (
    FRAME_BYTES,
    install_ffmpeg,
    make_entry,
    setup_entry,
    write_frames,
)
from .conftest import GRID_STEP as STEP
from .conftest import GRID_T0 as T0
from .conftest import grid_slots as slots


@pytest.fixture
async def entry_with_frames(
    hass: HomeAssistant, mock_fetch: AsyncMock, media_dir: Path, ffmpeg: Path
) -> Any:
    """A set-up entry with six frames in its archive."""
    entry = make_entry()
    assert await setup_entry(hass, entry)
    write_frames(entry.runtime_data, slots(6))
    return entry


# --- service ---------------------------------------------------------------


async def test_service_exports_and_returns_where_the_video_is(
    hass: HomeAssistant, entry_with_frames: Any
) -> None:
    response = await hass.services.async_call(
        DOMAIN,
        SERVICE_EXPORT_VIDEO,
        {"entry_id": entry_with_frames.entry_id},
        blocking=True,
        return_response=True,
    )

    assert response is not None
    assert response["frames"] == 6
    assert response["fps"] == 24
    assert Path(str(response["path"])).is_file()
    assert str(response["media_content_id"]).startswith("media-source://media_source/")


async def test_service_works_without_requesting_a_response(
    hass: HomeAssistant, entry_with_frames: Any, media_dir: Path
) -> None:
    """An automation step that just wants the file written."""
    await hass.services.async_call(
        DOMAIN,
        SERVICE_EXPORT_VIDEO,
        {"entry_id": entry_with_frames.entry_id},
        blocking=True,
    )

    assert len(list((media_dir / "webcam_timelapse" / "test_cam").iterdir())) == 1


async def test_service_reads_naive_datetimes_as_local_time(
    hass: HomeAssistant, entry_with_frames: Any
) -> None:
    """The datetime selector in the UI sends local wall-clock time, no offset."""
    await hass.config.async_set_time_zone("Europe/Vienna")

    def local(slot: int) -> str:
        return dt_util.as_local(dt_util.utc_from_timestamp(slot)).strftime(
            "%Y-%m-%d %H:%M:%S"
        )

    response = await hass.services.async_call(
        DOMAIN,
        SERVICE_EXPORT_VIDEO,
        {
            "entry_id": entry_with_frames.entry_id,
            "start": local(T0 + STEP),
            "end": local(T0 + 3 * STEP),
            "fps": 12,
            "max_width": 32,
            "deflicker": 0,
            "timestamp": False,
        },
        blocking=True,
        return_response=True,
    )

    assert response is not None
    assert (response["start"], response["end"]) == (T0 + STEP, T0 + 3 * STEP)
    assert (response["frames"], response["fps"], response["width"]) == (3, 12, 32)


async def test_service_accepts_the_cards_overlay_config(
    hass: HomeAssistant, entry_with_frames: Any
) -> None:
    hass.states.async_set("sensor.co2", "640", {"unit_of_measurement": "ppm"})

    response = await hass.services.async_call(
        DOMAIN,
        SERVICE_EXPORT_VIDEO,
        {
            "entry_id": entry_with_frames.entry_id,
            "overlay": {
                "type": "custom:webcam-timelapse-card",
                "camera_entity": "camera.test_cam",
                "entities": [{"entity": "sensor.co2", "graph": True}],
                "deflicker": 50,
            },
        },
        blocking=True,
        return_response=True,
    )

    assert response is not None
    assert response["frames"] == 6


@pytest.mark.parametrize(
    "bad",
    [
        {"fps": 0},
        {"fps": 61},
        {"deflicker": 101},
        {"max_width": -1},
        {"overlay": {"entities": [{"name": "no entity"}]}},
        {"overlay": {"entities": [{"entity": "not an entity id"}]}},
        {"start": "last Tuesday"},
        {"readings_size": 9},
        {"readings_size": 81},
        {"timestamp_size": 4},
        {"timestamp_size": 51},
        {"readings_position": "middle"},
        {"readings_position_left": "centre"},
    ],
)
async def test_service_rejects_malformed_input(
    hass: HomeAssistant, entry_with_frames: Any, bad: dict[str, Any]
) -> None:
    with pytest.raises(vol.Invalid):
        await hass.services.async_call(
            DOMAIN,
            SERVICE_EXPORT_VIDEO,
            {"entry_id": entry_with_frames.entry_id, **bad},
            blocking=True,
        )


@pytest.mark.parametrize(
    ("data", "key"),
    [
        (
            {"start": "2001-01-01 00:00:00", "end": "2001-01-02 00:00:00"},
            "export_no_frames",
        ),
        (
            {"start": "2026-08-02 00:00:00", "end": "2026-08-01 00:00:00"},
            "export_bad_range",
        ),
    ],
)
async def test_service_reports_the_callers_mistakes_as_validation_errors(
    hass: HomeAssistant, entry_with_frames: Any, data: dict[str, Any], key: str
) -> None:
    """Shown to the user as-is, rather than logged as a fault with a traceback."""
    with pytest.raises(ServiceValidationError) as err:
        await hass.services.async_call(
            DOMAIN,
            SERVICE_EXPORT_VIDEO,
            {"entry_id": entry_with_frames.entry_id, **data},
            blocking=True,
        )

    assert err.value.translation_key == key
    assert err.value.translation_domain == DOMAIN


async def test_service_refuses_a_second_export_for_the_same_camera(
    hass: HomeAssistant, entry_with_frames: Any
) -> None:
    exporter = async_get_exporter(hass, entry_with_frames)
    running = exporter.async_start(ExportOptions())

    with pytest.raises(ServiceValidationError) as err:
        await hass.services.async_call(
            DOMAIN,
            SERVICE_EXPORT_VIDEO,
            {"entry_id": entry_with_frames.entry_id},
            blocking=True,
        )
    assert err.value.translation_key == "export_running"

    await running


async def test_service_lets_a_real_fault_through_as_one(
    hass: HomeAssistant, entry_with_frames: Any, tmp_path: Path
) -> None:
    """A broken encoder is not the caller's mistake, and should be logged."""
    install_ffmpeg(hass, tmp_path, "sys.stdin.buffer.read()\nsys.exit(1)")

    with pytest.raises(export.ExportError) as err:
        await hass.services.async_call(
            DOMAIN,
            SERVICE_EXPORT_VIDEO,
            {"entry_id": entry_with_frames.entry_id},
            blocking=True,
        )

    assert err.value.translation_key == "export_ffmpeg_failed"
    assert not isinstance(err.value, ServiceValidationError)


async def test_service_for_an_unknown_camera(hass: HomeAssistant) -> None:
    assert await setup_entry(hass, make_entry())

    with pytest.raises(ServiceValidationError) as err:
        await hass.services.async_call(
            DOMAIN, SERVICE_EXPORT_VIDEO, {"entry_id": "nope"}, blocking=True
        )

    assert err.value.translation_key == "unknown_entry"


# --- WebSocket ---------------------------------------------------------------


async def test_ws_start_subscribe_and_finish(
    hass: HomeAssistant, hass_ws_client, entry_with_frames: Any
) -> None:
    client = await hass_ws_client(hass)

    await client.send_json_auto_id(
        {"type": WS_TYPE_EXPORT_SUBSCRIBE, "entry_id": entry_with_frames.entry_id}
    )
    subscribed = await client.receive_json()
    assert subscribed["success"]
    subscription = subscribed["id"]

    # The status is sent straight away, before anything has been started.
    idle = await client.receive_json()
    assert idle["id"] == subscription
    assert idle["event"]["state"] == "idle"

    await client.send_json_auto_id(
        {
            "type": WS_TYPE_EXPORT_START,
            "entry_id": entry_with_frames.entry_id,
            "start": T0 + STEP,
            "end": T0 + 4 * STEP,
            "fps": 12,
            "timestamp": False,
        }
    )

    started: dict[str, Any] | None = None
    final: dict[str, Any] | None = None
    while final is None:
        message = await client.receive_json()
        if message["type"] == "result":
            started = message
        elif message["event"]["state"] == "done":
            final = message["event"]

    assert started is not None and started["success"]
    assert started["result"]["state"] == "running"
    assert (final["done"], final["total"]) == (4, 4)
    result = final["result"]
    assert (result["frames"], result["fps"]) == (4, 12)
    assert (result["start"], result["end"]) == (T0 + STEP, T0 + 4 * STEP)
    assert Path(result["path"]).read_bytes() == b"bytes=%d" % (4 * FRAME_BYTES)


async def test_ws_resolves_the_camera_entity_like_the_index_does(
    hass: HomeAssistant, hass_ws_client, entry_with_frames: Any
) -> None:
    """The card only holds a camera entity_id, never an entry_id."""
    client = await hass_ws_client(hass)

    await client.send_json_auto_id(
        {"type": WS_TYPE_EXPORT_START, "entity_id": "camera.test_cam_live_view"}
    )
    response = await client.receive_json()

    assert response["success"]
    await hass.async_block_till_done(wait_background_tasks=True)
    assert async_get_exporter(hass, entry_with_frames).status.state == "done"


async def test_ws_subscribing_late_shows_the_finished_export(
    hass: HomeAssistant, hass_ws_client, entry_with_frames: Any
) -> None:
    """Reopening the dashboard must still find the link to the video."""
    result = await async_get_exporter(hass, entry_with_frames).async_export(
        ExportOptions()
    )
    client = await hass_ws_client(hass)

    await client.send_json_auto_id(
        {"type": WS_TYPE_EXPORT_SUBSCRIBE, "entry_id": entry_with_frames.entry_id}
    )
    assert (await client.receive_json())["success"]
    status = (await client.receive_json())["event"]

    assert status["state"] == "done"
    assert status["result"]["file_name"] == result["file_name"]


async def test_ws_reports_where_videos_go_before_there_are_any(
    hass: HomeAssistant, hass_ws_client, entry_with_frames: Any, media_dir: Path
) -> None:
    """So people can find, and tidy up, what earlier exports left behind."""
    client = await hass_ws_client(hass)

    await client.send_json_auto_id(
        {"type": WS_TYPE_EXPORT_SUBSCRIBE, "entry_id": entry_with_frames.entry_id}
    )
    assert (await client.receive_json())["success"]
    status = (await client.receive_json())["event"]

    assert status["state"] == "idle"
    assert status["folder"] == str(media_dir / "webcam_timelapse" / "test_cam")
    # Nothing to browse yet: a link would open the media browser on an error.
    assert status["folder_media_id"] is None
    # Read from the folder above, which is where the first video will go.
    assert status["free_bytes"] > 0


async def test_ws_links_the_folder_once_it_exists(
    hass: HomeAssistant, hass_ws_client, entry_with_frames: Any, media_dir: Path
) -> None:
    """The card turns this into a media-browser link to the videos."""
    (media_dir / "webcam_timelapse" / "test_cam").mkdir(parents=True)
    client = await hass_ws_client(hass)

    await client.send_json_auto_id(
        {"type": WS_TYPE_EXPORT_SUBSCRIBE, "entry_id": entry_with_frames.entry_id}
    )
    assert (await client.receive_json())["success"]
    status = (await client.receive_json())["event"]

    assert status["folder_media_id"] == (
        "media-source://media_source/local/webcam_timelapse/test_cam"
    )


async def test_service_passes_sizes_and_positions_through(
    hass: HomeAssistant, entry_with_frames: Any
) -> None:
    hass.states.async_set("sensor.co2", "640")
    seen: list[ExportOptions] = []
    real_build = export.async_build_overlay

    async def _spy(hass: HomeAssistant, options: ExportOptions, *args: Any) -> Any:
        seen.append(options)
        return await real_build(hass, options, *args)

    with patch.object(export, "async_build_overlay", _spy):
        await hass.services.async_call(
            DOMAIN,
            SERVICE_EXPORT_VIDEO,
            {
                "entry_id": entry_with_frames.entry_id,
                "overlay": {"entities": [{"entity": "sensor.co2"}]},
                "readings_size": 25,
                "timestamp_size": 10,
                "readings_position": "bottom",
                "aspect": "9:16",
                "crop_position": 20,
                "every": 5,
            },
            blocking=True,
        )

    (options,) = seen
    assert (options.readings_size, options.timestamp_size) == (25, 10)
    assert options.readings_position == "bottom"
    assert options.readings_position_left is None
    assert (options.aspect, options.crop_position, options.every) == ("9:16", 20, 5)
    assert options.crop == (9 / 16, 0.2)


async def test_service_rejects_an_unknown_aspect(
    hass: HomeAssistant, entry_with_frames: Any
) -> None:
    with pytest.raises(vol.Invalid):
        await hass.services.async_call(
            DOMAIN,
            SERVICE_EXPORT_VIDEO,
            {"entry_id": entry_with_frames.entry_id, "aspect": "21:9"},
            blocking=True,
        )


async def test_ws_unsubscribing_stops_the_events(
    hass: HomeAssistant, hass_ws_client, entry_with_frames: Any
) -> None:
    client = await hass_ws_client(hass)
    await client.send_json_auto_id(
        {"type": WS_TYPE_EXPORT_SUBSCRIBE, "entry_id": entry_with_frames.entry_id}
    )
    subscription = (await client.receive_json())["id"]
    await client.receive_json()  # the initial status

    await client.send_json_auto_id(
        {"type": "unsubscribe_events", "subscription": subscription}
    )
    assert (await client.receive_json())["success"]

    exporter = async_get_exporter(hass, entry_with_frames)
    assert exporter._listeners == []
    # And an export after that does not try to write to the dropped listener.
    await exporter.async_export(ExportOptions())


async def test_ws_start_while_running_is_refused_with_a_code_the_card_knows(
    hass: HomeAssistant, hass_ws_client, entry_with_frames: Any
) -> None:
    exporter = async_get_exporter(hass, entry_with_frames)
    running = exporter.async_start(ExportOptions())
    client = await hass_ws_client(hass)

    await client.send_json_auto_id(
        {"type": WS_TYPE_EXPORT_START, "entry_id": entry_with_frames.entry_id}
    )
    response = await client.receive_json()

    assert not response["success"]
    assert response["error"]["code"] == "export_running"
    await running


async def test_ws_cancel(
    hass: HomeAssistant, hass_ws_client, entry_with_frames: Any, media_dir: Path
) -> None:
    write_frames(entry_with_frames.runtime_data, slots(60))
    client = await hass_ws_client(hass)

    await client.send_json_auto_id(
        {"type": WS_TYPE_EXPORT_CANCEL, "entry_id": entry_with_frames.entry_id}
    )
    assert (await client.receive_json())["result"] == {"cancelled": False}

    await client.send_json_auto_id(
        {"type": WS_TYPE_EXPORT_START, "entry_id": entry_with_frames.entry_id}
    )
    assert (await client.receive_json())["success"]
    await client.send_json_auto_id(
        {"type": WS_TYPE_EXPORT_CANCEL, "entry_id": entry_with_frames.entry_id}
    )
    assert (await client.receive_json())["result"] == {"cancelled": True}

    await hass.async_block_till_done(wait_background_tasks=True)
    assert async_get_exporter(hass, entry_with_frames).status.state == "cancelled"
    folder = media_dir / "webcam_timelapse" / "test_cam"
    assert not folder.exists() or list(folder.iterdir()) == []


@pytest.mark.parametrize(
    "command", [WS_TYPE_EXPORT_START, WS_TYPE_EXPORT_SUBSCRIBE, WS_TYPE_EXPORT_CANCEL]
)
async def test_ws_export_commands_for_an_unknown_camera(
    hass: HomeAssistant, hass_ws_client, entry_with_frames: Any, command: str
) -> None:
    client = await hass_ws_client(hass)

    await client.send_json_auto_id({"type": command, "entry_id": "nope"})
    response = await client.receive_json()

    assert not response["success"]
    assert response["error"]["code"] == "not_found"


async def test_ws_start_validates_its_input(
    hass: HomeAssistant, hass_ws_client, entry_with_frames: Any
) -> None:
    client = await hass_ws_client(hass)

    await client.send_json_auto_id(
        {
            "type": WS_TYPE_EXPORT_START,
            "entry_id": entry_with_frames.entry_id,
            "fps": 1000,
        }
    )
    response = await client.receive_json()

    assert not response["success"]
    assert response["error"]["code"] == "invalid_format"
