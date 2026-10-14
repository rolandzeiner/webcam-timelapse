"""Rendering a stretch of the archive to an MP4.

The frames are already on disk as individual WebP files; an export decodes
them one at a time, optionally draws the card's overlay on each, and pipes
the raw pixels into ffmpeg. Nothing is ever held in memory beyond the one
frame in flight — a fortnight at one minute is 20,000 frames, and Home
Assistant's container is commonly capped at 1 GiB.

ffmpeg is a *soft* dependency. Home Assistant's container ships the binary,
and its own ``ffmpeg`` integration records where to find it when it is set
up, but this module never imports that integration: doing so would make
the whole integration fail to load on an install without it, for a feature
most captures never use. A missing binary is reported when an export is
attempted, not before.

The recorder is soft in the same way. Without it the overlay still draws,
with a dash where each value would be.
"""

from __future__ import annotations

import asyncio
import logging
import math
import os
import shutil
import time
from collections import deque
from collections.abc import Callable, Mapping
from dataclasses import dataclass
from datetime import datetime, timedelta
from functools import partial
from pathlib import Path
from typing import TYPE_CHECKING, Any, Final

import voluptuous as vol
from homeassistant.const import (
    ATTR_FRIENDLY_NAME,
    ATTR_UNIT_OF_MEASUREMENT,
    SUN_EVENT_SUNRISE,
    SUN_EVENT_SUNSET,
)
from homeassistant.core import HomeAssistant, State, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.sun import get_astral_event_date
from homeassistant.util import dt as dt_util
from homeassistant.util import slugify

from . import frame_store
from .const import (
    DEFAULT_EXPORT_DEFLICKER,
    DEFAULT_EXPORT_FPS,
    DEFAULT_EXPORT_READINGS_SIZE,
    DEFAULT_EXPORT_TIMESTAMP_SIZE,
    DOMAIN,
    EXPORT_EXTENSION,
    EXPORT_MIN_FREE_BYTES,
    EXPORT_SUBDIR,
    EXPORT_X264_CRF,
    EXPORT_X264_PRESET,
    MAX_EXPORT_FPS,
    MAX_EXPORT_READINGS_SIZE,
    MAX_EXPORT_TIMESTAMP_SIZE,
    MIN_EXPORT_FPS,
    MIN_EXPORT_READINGS_SIZE,
    MIN_EXPORT_TIMESTAMP_SIZE,
)
from .deflicker import deflicker_gains, radius_for_strength
from .encode import ImageDecodeError, decode_frame, frame_size
from .overlay import (
    DEFAULT_ACCENT,
    POSITIONS,
    OverlayGroup,
    OverlayRenderer,
    OverlayRow,
    OverlaySpec,
    Position,
    Reading,
    Series,
    Side,
    parse_color,
)

if TYPE_CHECKING:
    from .coordinator import WebcamTimelapseConfigEntry, WebcamTimelapseCoordinator

_LOGGER = logging.getLogger(__name__)

# How often, at most, subscribers hear about progress. A fast host encodes
# dozens of frames a second, and nobody needs a WebSocket message for each.
_PROGRESS_INTERVAL_SECONDS: Final = 0.5

# Frames decoded at once. Two, not one per core: the encoder wants the
# other cores, and so does the rest of Home Assistant — a capture that
# falls due mid-export must not find the machine saturated.
_RENDER_WORKERS: Final = 2

# How long to wait for a killed ffmpeg to actually be gone before giving
# up on it and removing its output anyway.
_FFMPEG_EXIT_TIMEOUT_SECONDS: Final = 30

# States that carry no measurement and must never be drawn as zero.
_NON_VALUES: Final = frozenset({"unknown", "unavailable", "none", ""})

_DATA_EXPORTERS: Final = "exporters"

STATE_IDLE: Final = "idle"
STATE_RUNNING: Final = "running"
STATE_DONE: Final = "done"
STATE_FAILED: Final = "failed"
STATE_CANCELLED: Final = "cancelled"

# --- request shape --------------------------------------------------------

# One overlay row, in the card's own config shape, so the card can hand its
# config over as it is. Keys the server has no use for (`show_icon`) are
# dropped rather than rejected: a card a version ahead of the integration
# should still be able to export.
_OVERLAY_ROW_SCHEMA: Final = vol.Schema(
    {
        vol.Required("entity"): cv.entity_id,
        vol.Optional("name"): cv.string,
        vol.Optional("unit"): cv.string,
        vol.Optional("decimals"): vol.All(vol.Coerce(int), vol.Range(min=0, max=6)),
        vol.Optional("color"): cv.string,
        vol.Optional("graph"): cv.boolean,
        vol.Optional("graph_hours"): vol.All(
            vol.Coerce(float), vol.Range(min=0.1, max=24 * 366)
        ),
        vol.Optional("time_attribute"): cv.string,
    },
    extra=vol.REMOVE_EXTRA,
)

OVERLAY_SCHEMA: Final = vol.Schema(
    {
        vol.Optional("entities", default=list): [_OVERLAY_ROW_SCHEMA],
        vol.Optional("entities_left", default=list): [_OVERLAY_ROW_SCHEMA],
        vol.Optional("overlay_title"): cv.string,
        vol.Optional("overlay_title_left"): cv.string,
        vol.Optional("graph_hours", default=24): vol.All(
            vol.Coerce(float), vol.Range(min=0.1, max=24 * 366)
        ),
        vol.Optional("show_graph", default=True): cv.boolean,
        vol.Optional("show_sun", default=False): cv.boolean,
        vol.Optional("accent_color"): cv.string,
    },
    extra=vol.REMOVE_EXTRA,
)

#: Fields shared by the service and the WebSocket command. The time range
#: is not here because the two take it in different forms.
EXPORT_FIELDS: Final[dict[vol.Marker, Any]] = {
    vol.Optional("fps", default=DEFAULT_EXPORT_FPS): vol.All(
        vol.Coerce(int), vol.Range(min=MIN_EXPORT_FPS, max=MAX_EXPORT_FPS)
    ),
    vol.Optional("max_width", default=0): vol.All(
        vol.Coerce(int), vol.Range(min=0, max=7680)
    ),
    vol.Optional("deflicker", default=DEFAULT_EXPORT_DEFLICKER): vol.All(
        vol.Coerce(int), vol.Range(min=0, max=100)
    ),
    vol.Optional("timestamp", default=True): cv.boolean,
    vol.Optional("timestamp_size", default=DEFAULT_EXPORT_TIMESTAMP_SIZE): vol.All(
        vol.Coerce(int),
        vol.Range(min=MIN_EXPORT_TIMESTAMP_SIZE, max=MAX_EXPORT_TIMESTAMP_SIZE),
    ),
    vol.Optional("overlay"): vol.Any(None, OVERLAY_SCHEMA),
    vol.Optional("readings_size", default=DEFAULT_EXPORT_READINGS_SIZE): vol.All(
        vol.Coerce(int),
        vol.Range(min=MIN_EXPORT_READINGS_SIZE, max=MAX_EXPORT_READINGS_SIZE),
    ),
    # Where each of the card's two blocks goes in the video. Absent, a
    # block goes where the card draws it.
    vol.Optional("readings_position"): vol.Any(None, vol.In(POSITIONS)),
    vol.Optional("readings_position_left"): vol.Any(None, vol.In(POSITIONS)),
    vol.Optional("language"): cv.string,
}


@dataclass(frozen=True, slots=True)
class ExportOptions:
    """One export request."""

    #: First and last moment to include, epoch seconds, both inclusive.
    #: None means "from the oldest frame" / "to the newest".
    start: float | None = None
    end: float | None = None
    fps: int = DEFAULT_EXPORT_FPS
    #: Scale the video down to this width; 0 keeps the frames' own size.
    max_width: int = 0
    #: 0-100, the card's "Smooth brightness" dial. 0 is off.
    deflicker: int = DEFAULT_EXPORT_DEFLICKER
    timestamp: bool = True
    #: Width of the date-and-time stamp, as a percentage of the video's.
    timestamp_size: int = DEFAULT_EXPORT_TIMESTAMP_SIZE
    #: The card's overlay config (see OVERLAY_SCHEMA), or None for none.
    overlay: Mapping[str, Any] | None = None
    #: Width of the widest readings block, as a percentage of the video's.
    readings_size: int = DEFAULT_EXPORT_READINGS_SIZE
    #: Where the card's right-hand (`entities`) and left-hand
    #: (`entities_left`) blocks go. None keeps the card's own side.
    readings_position: Position | None = None
    readings_position_left: Position | None = None
    language: str | None = None

    @classmethod
    def from_request(
        cls, data: Mapping[str, Any], start: float | None, end: float | None
    ) -> ExportOptions:
        """Build from a validated service call or WebSocket message."""
        return cls(
            start=start,
            end=end,
            fps=data["fps"],
            max_width=data["max_width"],
            deflicker=data["deflicker"],
            timestamp=data["timestamp"],
            timestamp_size=data["timestamp_size"],
            overlay=data.get("overlay"),
            readings_size=data["readings_size"],
            readings_position=data.get("readings_position"),
            readings_position_left=data.get("readings_position_left"),
            language=data.get("language"),
        )


class ExportError(HomeAssistantError):
    """An export that could not be started or did not finish."""

    def __init__(self, key: str, **placeholders: str) -> None:
        """Initialise with a translation key from strings.json."""
        super().__init__(
            translation_domain=DOMAIN,
            translation_key=key,
            translation_placeholders=placeholders,
        )


@dataclass(slots=True)
class ExportStatus:
    """Where one entry's export stands."""

    state: str = STATE_IDLE
    done: int = 0
    total: int = 0
    #: Translation key of what went wrong, when ``state`` is failed.
    error: str | None = None
    message: str | None = None
    result: dict[str, Any] | None = None

    def as_dict(self) -> dict[str, Any]:
        """JSON-serialisable form, as sent to the card."""
        return {
            "state": self.state,
            "done": self.done,
            "total": self.total,
            "error": self.error,
            "message": self.message,
            "result": self.result,
        }


# --- planning (executor) --------------------------------------------------


@dataclass(slots=True)
class _Plan:
    """Everything decided before the first frame is decoded."""

    slots: list[int]
    size: tuple[int, int]
    #: Brightness multiplier per slot; slots that need none are absent.
    gains: dict[int, float]
    target: Path
    partial: Path


def _even(value: int) -> int:
    """Round down to an even number, never below two.

    H.264 in the 4:2:0 layout every player understands stores colour at
    half resolution in both directions, so neither dimension may be odd.
    """
    return max(2, value - value % 2)


def _output_size(native: tuple[int, int], max_width: int) -> tuple[int, int]:
    """The video's frame size: native, or scaled down to ``max_width``."""
    width, height = native
    if 0 < max_width < width:
        height = round(height * max_width / width)
        width = max_width
    return _even(width), _even(height)


def _free_name(directory: Path, stem: str) -> Path:
    """A path in ``directory`` that is not taken yet.

    Exporting the same range twice — with and without the readings, say —
    must not replace the first video with the second.
    """
    candidate = directory / f"{stem}{EXPORT_EXTENSION}"
    counter = 2
    while candidate.exists():
        candidate = directory / f"{stem}_{counter}{EXPORT_EXTENSION}"
        counter += 1
    return candidate


def _plan(
    frames_dir: Path,
    step: int,
    options: ExportOptions,
    output_dir: Path,
    name: str,
) -> _Plan:
    """Pick the frames and the output file. Blocking; run in the executor."""
    archive, _off_grid = frame_store.partition_grid(
        frame_store.scan_slots(frames_dir), step
    )
    slots = [
        slot
        for slot in archive
        if (options.start is None or slot >= options.start)
        and (options.end is None or slot <= options.end)
    ]
    if not slots:
        raise ExportError("export_no_frames")

    # The first frame that decodes sets the size for the whole video.
    native: tuple[int, int] | None = None
    for slot in slots:
        data = frame_store.read_frame(frames_dir, slot)
        if data is None:
            continue
        try:
            native = frame_size(data)
        except ImageDecodeError:
            continue
        break
    if native is None:
        raise ExportError("export_no_frames")

    output_dir.mkdir(parents=True, exist_ok=True)
    free = shutil.disk_usage(output_dir).free
    if free < EXPORT_MIN_FREE_BYTES:
        raise ExportError(
            "export_low_disk",
            free=str(free // (1024 * 1024)),
            needed=str(EXPORT_MIN_FREE_BYTES // (1024 * 1024)),
        )

    gains: dict[int, float] = {}
    radius = radius_for_strength(options.deflicker)
    if radius:
        # Computed over the whole archive grid, not just the selection, so
        # the first and last frames of an export get the same correction
        # the card gives them — their smoothing windows reach outside it.
        luma = frame_store.read_luma(frames_dir)
        origin = archive[0]
        count = (archive[-1] - origin) // step + 1
        present = set(archive)
        dense = [
            luma.get(origin + index * step)
            if origin + index * step in present
            else None
            for index in range(count)
        ]
        for slot, gain in zip(
            (origin + index * step for index in range(count)),
            deflicker_gains(dense, radius),
            strict=True,
        ):
            if gain != 1.0:
                gains[slot] = gain

    def _label(slot: int) -> str:
        return dt_util.as_local(dt_util.utc_from_timestamp(slot)).strftime(
            "%Y%m%d-%H%M"
        )

    target = _free_name(output_dir, f"{name}_{_label(slots[0])}_{_label(slots[-1])}")
    return _Plan(
        slots=slots,
        size=_output_size(native, options.max_width),
        gains=gains,
        target=target,
        # Hidden while it is being written, so a half-finished file never
        # shows up in the media browser as if it could be played.
        partial=target.with_name(f".{target.name}.part"),
    )


def _render_frame(
    frames_dir: Path,
    slot: int,
    size: tuple[int, int],
    gain: float,
    renderer: OverlayRenderer | None,
) -> bytes | None:
    """One frame as raw RGB24, or None if it cannot be read. Blocking."""
    data = frame_store.read_frame(frames_dir, slot)
    if data is None:
        # Pruned by retention between planning and now. A gap, as on the
        # card — not a reason to throw the rest of the video away.
        return None
    try:
        image = decode_frame(data, size, gain)
    except ImageDecodeError:
        return None
    if renderer is not None:
        renderer.draw(image, slot)
    return image.tobytes()


# --- overlay data ---------------------------------------------------------


def _parse_value(raw: str) -> float | None:
    """A state string as a finite number, or None."""
    text = raw.strip()
    if text.lower() in _NON_VALUES:
        return None
    try:
        value = float(text)
    except ValueError:
        return None
    return value if math.isfinite(value) else None


def _attribute_time(attributes: Mapping[str, Any], name: str) -> float | None:
    """A timestamp held in a state attribute, as epoch seconds."""
    raw = attributes.get(name)
    if isinstance(raw, datetime):
        return raw.timestamp()
    if isinstance(raw, (int, float)) and not isinstance(raw, bool):
        # The card feeds this to `new Date()`, which reads a bare number
        # as milliseconds.
        return raw / 1000 if raw > 0 else None
    if isinstance(raw, str) and (parsed := dt_util.parse_datetime(raw)) is not None:
        return dt_util.as_utc(parsed).timestamp()
    return None


async def async_load_history(
    hass: HomeAssistant,
    entity_ids: list[str],
    start: datetime,
    end: datetime,
    time_attributes: Mapping[str, str],
) -> dict[str, list[Reading]]:
    """Recorded numeric readings for several entities across a window.

    Where the recorder's detailed history does not reach back to ``start``
    — it keeps ten days by default, and an archive can keep a year — the
    gap is filled from long-term statistics, which are hourly means kept
    indefinitely. Coarser, but a reading; the alternative is a dash across
    most of a long export.
    """
    if not entity_ids or "recorder" not in hass.config.components:
        return {}

    # Imported here, not at module level: this module is loaded with the
    # integration, and the recorder is an optional part of Home Assistant.
    from homeassistant.components.recorder import history
    from homeassistant.components.recorder.statistics import (
        statistics_during_period,
    )
    from homeassistant.helpers.recorder import get_instance

    recorder = get_instance(hass)
    # Attributes are only asked for when a row reads its time from one:
    # they multiply the size of what comes back many times over.
    states = await recorder.async_add_executor_job(
        partial(
            history.get_significant_states,
            hass,
            start,
            end,
            entity_ids,
            include_start_time_state=True,
            significant_changes_only=True,
            minimal_response=False,
            no_attributes=not time_attributes,
        )
    )

    series: dict[str, list[Reading]] = {}
    for entity_id in entity_ids:
        attribute = time_attributes.get(entity_id)
        points: list[Reading] = []
        for state in states.get(entity_id, []):
            if not isinstance(state, State):
                # The recorder's compact dict form. Only produced under
                # `minimal_response`, which is off above.
                continue
            value = _parse_value(str(state.state))
            if value is None:
                continue
            at = (
                _attribute_time(state.attributes, attribute) if attribute else None
            ) or state.last_updated.timestamp()
            points.append(Reading(at, value))
        points.sort(key=lambda point: point.at)
        series[entity_id] = points

    # Entities whose detailed history starts after the window does.
    wanted = start.timestamp()
    short = {
        entity_id: (points[0].at if points else end.timestamp())
        for entity_id, points in series.items()
        if not points or points[0].at > wanted
    }
    if short:
        statistics = await recorder.async_add_executor_job(
            partial(
                statistics_during_period,
                hass,
                start,
                dt_util.utc_from_timestamp(max(short.values())),
                set(short),
                "hour",
                None,
                {"mean"},
            )
        )
        for entity_id, first_detailed in short.items():
            older = [
                # The mean of an hour, placed at the middle of it.
                Reading((row["start"] + row["end"]) / 2, float(mean))
                for row in statistics.get(entity_id, [])
                if (mean := row.get("mean")) is not None
                and (row["start"] + row["end"]) / 2 < first_detailed
            ]
            if older:
                series[entity_id] = sorted(
                    [*older, *series[entity_id]], key=lambda point: point.at
                )

    return series


@callback
def night_spans(
    hass: HomeAssistant, start: datetime, end: datetime
) -> list[tuple[float, float]]:
    """Sunset-to-sunrise spans overlapping ``[start, end]``, epoch seconds.

    A day on which the sun does not set, or does not rise, contributes
    nothing. That leaves a polar night unshaded where the card shades it —
    a cosmetic difference in a corner case, against pulling the card's own
    solar maths over for it.
    """
    spans: list[tuple[float, float]] = []
    day = dt_util.as_local(start).date() - timedelta(days=1)
    last = dt_util.as_local(end).date() + timedelta(days=1)
    while day <= last:
        sunset = get_astral_event_date(hass, SUN_EVENT_SUNSET, day)
        sunrise = get_astral_event_date(
            hass, SUN_EVENT_SUNRISE, day + timedelta(days=1)
        )
        if sunset is not None and sunrise is not None and sunrise > sunset:
            spans.append((sunset.timestamp(), sunrise.timestamp()))
        day += timedelta(days=1)
    return spans


def _heading(value: Any) -> str | None:
    """Blank and whitespace-only headings are the same thing: no heading."""
    text = str(value or "").strip()
    return text or None


async def async_build_overlay(
    hass: HomeAssistant,
    options: ExportOptions,
    first_slot: int,
    last_slot: int,
) -> OverlaySpec | None:
    """Gather what the overlay shows, or None when the video gets none."""
    config = options.overlay or {}
    show_graph: bool = config.get("show_graph", True)
    card_hours: float = config.get("graph_hours", 24)
    accent = parse_color(config.get("accent_color"), DEFAULT_ACCENT)

    blocks: list[tuple[Side, str | None, list[Mapping[str, Any]]]] = [
        (
            "left",
            _heading(config.get("overlay_title_left")),
            config.get("entities_left", []),
        ),
        ("right", _heading(config.get("overlay_title")), config.get("entities", [])),
    ]
    rows = [row for _side, _title, block in blocks for row in block]
    if not rows and not options.timestamp:
        return None

    # Half of each graph window sits either side of the frame it is drawn
    # on, so the first and last frames need history from outside the range.
    reach = (
        max(
            (
                row.get("graph_hours", card_hours)
                for row in rows
                if show_graph and row.get("graph")
            ),
            default=0.0,
        )
        * 3600
        / 2
    )
    window_start = dt_util.utc_from_timestamp(first_slot - reach)
    window_end = dt_util.utc_from_timestamp(last_slot + reach)

    history = await async_load_history(
        hass,
        list(dict.fromkeys(row["entity"] for row in rows)),
        window_start,
        window_end,
        {
            row["entity"]: row["time_attribute"]
            for row in rows
            if row.get("time_attribute")
        },
    )
    # One Series per entity, shared by every row that shows it.
    series = {entity_id: Series(points) for entity_id, points in history.items()}
    empty = Series([])

    groups: list[OverlayGroup] = []
    for side, title, block in blocks:
        if not block:
            continue
        built: list[OverlayRow] = []
        for row in block:
            entity_id: str = row["entity"]
            state = hass.states.get(entity_id)
            attributes: Mapping[str, Any] = state.attributes if state else {}
            built.append(
                OverlayRow(
                    name=str(
                        row.get("name")
                        or attributes.get(ATTR_FRIENDLY_NAME)
                        or entity_id
                    ),
                    series=series.get(entity_id, empty),
                    # An explicit empty unit means "none", as on the card.
                    unit=str(
                        row["unit"]
                        if "unit" in row
                        else attributes.get(ATTR_UNIT_OF_MEASUREMENT) or ""
                    ),
                    decimals=row.get("decimals", 1),
                    color=parse_color(row.get("color"), accent),
                    graph=show_graph and bool(row.get("graph")),
                    graph_hours=row.get("graph_hours", card_hours),
                )
            )
        groups.append(
            OverlayGroup(
                side=side,
                rows=built,
                title=title,
                position=(
                    options.readings_position
                    if side == "right"
                    else options.readings_position_left
                ),
            )
        )

    return OverlaySpec(
        time_zone=dt_util.get_default_time_zone(),
        groups=groups,
        nights=(
            night_spans(hass, window_start, window_end)
            if config.get("show_sun") and reach
            else []
        ),
        language=options.language or hass.config.language,
        show_stamp=options.timestamp,
        readings_width=options.readings_size / 100,
        stamp_width=options.timestamp_size / 100,
    )


# --- the export itself ----------------------------------------------------


@callback
def ffmpeg_binary(hass: HomeAssistant) -> str:
    """The ffmpeg executable to run.

    Home Assistant's own ffmpeg integration stores a manager under this key
    when it is set up, and the manager knows about a custom ``ffmpeg_bin``.
    Read by key rather than by importing the integration — see the module
    docstring.
    """
    manager = hass.data.get("ffmpeg")
    return str(getattr(manager, "binary", None) or "ffmpeg")


def ffmpeg_command(
    binary: str, size: tuple[int, int], fps: int, output: Path
) -> list[str]:
    """ffmpeg arguments that encode raw RGB24 on stdin to an MP4."""
    return [
        binary,
        "-hide_banner",
        "-nostdin",
        "-loglevel",
        "error",
        "-y",
        "-f",
        "rawvideo",
        "-pix_fmt",
        "rgb24",
        "-video_size",
        f"{size[0]}x{size[1]}",
        "-framerate",
        str(fps),
        "-i",
        "pipe:0",
        "-an",
        # Convert with the BT.709 matrix and say so in the stream. Left to
        # its defaults ffmpeg converts with BT.601 and tags nothing, and a
        # player then guesses BT.709 for anything HD-sized — which shifts
        # every colour slightly, greens most of all.
        "-vf",
        (
            "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p,"
            "setparams=colorspace=bt709:color_primaries=bt709:color_trc=bt709"
        ),
        "-colorspace",
        "bt709",
        "-color_primaries",
        "bt709",
        "-color_trc",
        "bt709",
        "-color_range",
        "tv",
        "-c:v",
        "libx264",
        "-preset",
        EXPORT_X264_PRESET,
        "-crf",
        str(EXPORT_X264_CRF),
        # Index at the front, so the file starts playing in a browser
        # before it has finished downloading.
        "-movflags",
        "+faststart",
        "-f",
        "mp4",
        str(output),
    ]


@callback
def media_root(hass: HomeAssistant) -> tuple[str, Path]:
    """The media folder exports are written to, and its media-source key."""
    media_dirs = hass.config.media_dirs
    if "local" in media_dirs:
        return "local", Path(media_dirs["local"])
    for key, path in media_dirs.items():
        return key, Path(path)
    return "local", Path(hass.config.path("media"))


class VideoExporter:
    """Runs one entry's exports, one at a time, and reports on them.

    One at a time per camera because an export is the heaviest thing this
    integration does: a decode and an x264 encode per frame, for minutes.
    Two at once on a small board would starve the captures the archive
    exists for.

    Deliberately outlives the coordinator. Saving the entry's options
    reloads it, which builds a new coordinator; an exporter owned by the
    old one would take the card's status subscription, and the link to a
    video that had just finished, away with it. So it hangs off the entry
    instead, and looks the coordinator up afresh for each export.
    """

    def __init__(self, hass: HomeAssistant, entry: WebcamTimelapseConfigEntry) -> None:
        """Initialise idle."""
        self._hass = hass
        self._entry = entry
        self._status = ExportStatus()
        self._task: asyncio.Task[dict[str, Any]] | None = None
        self._listeners: list[Callable[[dict[str, Any]], None]] = []
        self._last_notified = 0.0

    @property
    def status(self) -> ExportStatus:
        """Where the current or most recent export stands."""
        return self._status

    @property
    def running(self) -> bool:
        """Whether an export is in flight."""
        return self._task is not None and not self._task.done()

    @callback
    def async_subscribe(
        self, listener: Callable[[dict[str, Any]], None]
    ) -> Callable[[], None]:
        """Call ``listener`` with the status whenever it changes."""
        self._listeners.append(listener)

        @callback
        def _unsubscribe() -> None:
            if listener in self._listeners:
                self._listeners.remove(listener)

        return _unsubscribe

    @property
    def folder(self) -> Path:
        """Where this camera's videos are written.

        Reported with every status, not only with a finished video, so the
        card can say where exports go before the first one exists — which
        is what anyone looking to tidy them up needs to know.
        """
        return media_root(self._hass)[1] / EXPORT_SUBDIR / slugify(self._entry.title)

    @callback
    def status_payload(self) -> dict[str, Any]:
        """The status as sent to the card, with the folder alongside it."""
        return {**self._status.as_dict(), "folder": str(self.folder)}

    @callback
    def _notify(self) -> None:
        self._last_notified = time.monotonic()
        status = self.status_payload()
        for listener in list(self._listeners):
            listener(status)

    @callback
    def async_start(self, options: ExportOptions) -> asyncio.Task[dict[str, Any]]:
        """Start an export in the background and return its task.

        A background task of the config entry, so unloading the entry
        cancels it — and with it ffmpeg — rather than leaving an encode
        running against a coordinator that no longer exists.
        """
        if self.running:
            raise ExportError("export_running")

        task = self._entry.async_create_background_task(
            self._hass, self._async_run(options), f"{DOMAIN}_export"
        )
        # A failure is reported through the status, which is the only
        # place a card that started this and then closed could find it.
        # Reading the exception here stops asyncio logging it a second
        # time as "never retrieved".
        task.add_done_callback(lambda done: done.cancelled() or done.exception())
        self._task = task
        return task

    async def async_export(self, options: ExportOptions) -> dict[str, Any]:
        """Run an export to completion and return its result."""
        task = self.async_start(options)
        try:
            return await task
        except asyncio.CancelledError:
            current = asyncio.current_task()
            if current is not None and current.cancelling():
                # We are the one being cancelled — HA is stopping, or the
                # script that called the service was. Let it through.
                raise
            # The export was cancelled from elsewhere (the card's cancel
            # button). To the caller that is a failed call, not a
            # cancellation of the caller itself.
            raise ExportError("export_cancelled") from None

    @callback
    def async_cancel(self) -> bool:
        """Stop the running export. Returns whether there was one."""
        if not self.running:
            return False
        assert self._task is not None
        self._task.cancel()
        return True

    async def _async_run(self, options: ExportOptions) -> dict[str, Any]:
        """Render, keeping the status in step with what happens."""
        self._status = ExportStatus(state=STATE_RUNNING)
        self._notify()
        try:
            result = await self._async_render(options)
        except asyncio.CancelledError:
            self._status = ExportStatus(state=STATE_CANCELLED)
            self._notify()
            raise
        except ExportError as err:
            self._status = ExportStatus(
                state=STATE_FAILED, error=err.translation_key, message=str(err)
            )
            self._notify()
            raise
        except Exception as err:
            # Anything unforeseen — a full disk mid-write, a permissions
            # problem on the media folder. It must still end up in the
            # status: the card is watching that, not the log.
            _LOGGER.exception("%s: video export failed", self._entry.title)
            self._status = ExportStatus(
                state=STATE_FAILED, error="export_failed", message=str(err)
            )
            self._notify()
            raise ExportError("export_failed", error=str(err)) from err

        self._status = ExportStatus(
            state=STATE_DONE,
            done=result["frames"],
            total=result["frames"],
            result=result,
        )
        self._notify()
        return result

    async def _async_render(self, options: ExportOptions) -> dict[str, Any]:
        hass = self._hass
        coordinator: WebcamTimelapseCoordinator | None = getattr(
            self._entry, "runtime_data", None
        )
        if coordinator is None:
            raise ExportError("entry_not_loaded", entry_id=self._entry.entry_id)
        frames_dir = coordinator.frames_dir

        if (
            options.start is not None
            and options.end is not None
            and options.end < options.start
        ):
            raise ExportError("export_bad_range")

        media_key, root = media_root(hass)
        output_dir = self.folder
        name = output_dir.name

        plan = await hass.async_add_executor_job(
            _plan, frames_dir, coordinator.step, options, output_dir, name
        )
        self._status.total = len(plan.slots)
        self._notify()

        spec = await async_build_overlay(hass, options, plan.slots[0], plan.slots[-1])
        renderer = (
            await hass.async_add_executor_job(OverlayRenderer, spec, *plan.size)
            if spec is not None
            else None
        )

        command = ffmpeg_command(
            ffmpeg_binary(hass), plan.size, options.fps, plan.partial
        )
        try:
            process = await asyncio.create_subprocess_exec(
                *command,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.DEVNULL,
                stderr=asyncio.subprocess.PIPE,
            )
        except FileNotFoundError as err:
            raise ExportError("export_ffmpeg_missing", binary=command[0]) from err

        assert process.stdin is not None
        assert process.stderr is not None
        # Drained for the whole run. ffmpeg blocks once the pipe's buffer
        # fills, and with it would the frames we are feeding it.
        stderr_reader = asyncio.ensure_future(process.stderr.read())

        written = 0
        finished = False
        try:
            try:
                # A short queue of frames being decoded, drained in the
                # order it was filled so the video stays in sequence.
                # Decoding is most of the cost and Pillow drops the GIL
                # for it, so a second worker nearly halves the wall time.
                rendering: deque[asyncio.Future[bytes | None]] = deque()
                for slot in [*plan.slots, *([None] * _RENDER_WORKERS)]:
                    if slot is not None:
                        rendering.append(
                            hass.async_add_executor_job(
                                _render_frame,
                                frames_dir,
                                slot,
                                plan.size,
                                plan.gains.get(slot, 1.0),
                                renderer,
                            )
                        )
                        if len(rendering) < _RENDER_WORKERS:
                            continue
                    if not rendering:
                        break
                    frame = await rendering.popleft()
                    if frame is not None:
                        process.stdin.write(frame)
                        await process.stdin.drain()
                        written += 1
                    self._status.done += 1
                    if (
                        time.monotonic() - self._last_notified
                        >= _PROGRESS_INTERVAL_SECONDS
                    ):
                        self._notify()
                process.stdin.close()
            except (BrokenPipeError, ConnectionResetError):
                # ffmpeg went away mid-stream. Its exit code and stderr,
                # read below, say why; the pipe error itself says nothing.
                pass

            # No timeout here. With the index moved to the front ffmpeg
            # rewrites the whole file on the way out, and on an SD card
            # that is as slow as the file is large. Cancelling still works:
            # this await is where it lands.
            return_code = await process.wait()
            errors = (await stderr_reader).decode("utf-8", "replace").strip()

            if return_code != 0:
                _LOGGER.error(
                    "%s: ffmpeg exited with code %s: %s",
                    self._entry.title,
                    return_code,
                    errors,
                )
                raise ExportError(
                    "export_ffmpeg_failed",
                    # The last line is the one that names the problem.
                    error=errors.splitlines()[-1] if errors else str(return_code),
                )
            if written == 0:
                raise ExportError("export_no_frames")

            size_bytes = await hass.async_add_executor_job(
                _publish, plan.partial, plan.target
            )
            finished = True
        finally:
            if not finished:
                if process.returncode is None:
                    process.kill()
                stderr_reader.cancel()
                # Shielded, because this is the path a cancelled export
                # takes, and a second cancellation while it unwinds (Home
                # Assistant stopping, say) must not interrupt the clean-up
                # and leave a stray ffmpeg and half a file behind.
                await asyncio.shield(self._async_discard(process, plan.partial))

        relative = plan.target.relative_to(root).as_posix()
        return {
            "path": str(plan.target),
            "file_name": plan.target.name,
            "media_content_id": f"media-source://media_source/{media_key}/{relative}",
            "frames": written,
            "skipped": len(plan.slots) - written,
            "fps": options.fps,
            "duration": round(written / options.fps, 2),
            "width": plan.size[0],
            "height": plan.size[1],
            "size_bytes": size_bytes,
            "start": plan.slots[0],
            "end": plan.slots[-1],
        }

    async def _async_discard(
        self, process: asyncio.subprocess.Process, partial_path: Path
    ) -> None:
        """Wait for a killed ffmpeg to go, then remove what it wrote."""
        try:
            async with asyncio.timeout(_FFMPEG_EXIT_TIMEOUT_SECONDS):
                await process.wait()
        except TimeoutError:
            _LOGGER.warning("%s: ffmpeg did not exit", self._entry.title)
        await self._hass.async_add_executor_job(
            partial(partial_path.unlink, missing_ok=True)
        )


@callback
def async_get_exporter(
    hass: HomeAssistant, entry: WebcamTimelapseConfigEntry
) -> VideoExporter:
    """The exporter for one config entry, created on first use."""
    exporters: dict[str, VideoExporter] = hass.data.setdefault(DOMAIN, {}).setdefault(
        _DATA_EXPORTERS, {}
    )
    if entry.entry_id not in exporters:
        exporters[entry.entry_id] = VideoExporter(hass, entry)
    return exporters[entry.entry_id]


@callback
def async_forget_exporter(hass: HomeAssistant, entry_id: str) -> None:
    """Drop a removed entry's exporter."""
    hass.data.get(DOMAIN, {}).get(_DATA_EXPORTERS, {}).pop(entry_id, None)


def _publish(partial_path: Path, target: Path) -> int:
    """Move a finished video into place; return its size. Blocking."""
    os.replace(partial_path, target)
    return target.stat().st_size
