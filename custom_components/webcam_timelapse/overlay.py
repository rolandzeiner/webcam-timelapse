"""Drawing the time-synced readings onto exported video frames.

PURE SYNCHRONOUS MODULE. Nothing here imports from ``homeassistant``, and
everything here is CPU work on a decoded bitmap, so callers must go through
``hass.async_add_executor_job``. See ``encode.py`` for why that rule is
enforced structurally rather than by comment.

This is the card's overlay, drawn a second time. The card renders it with
the browser — HTML, CSS and an SVG sparkline — and none of that exists
where a video is encoded, so the same layout is rebuilt here on Pillow.
The series maths (which reading is in effect, when it counts as stale, how
the chart is scaled) is a line-for-line port of ``src/overlay-history.ts``
and ``src/sparkline.ts``, because the number burned into a frame has to be
the number the card shows for that frame. Change one side and the other
must follow.

Two things differ on purpose:

* The block has a fixed width for the whole export. The card's is
  content-driven, which is fine for a still and reads as jitter once the
  frames are played back at 24 a second.
* There are no entity icons. They live in the frontend's icon set, which
  the server does not have.
"""

from __future__ import annotations

import math
import threading
from bisect import bisect_left, bisect_right
from dataclasses import dataclass, field
from datetime import datetime, tzinfo
from functools import lru_cache
from pathlib import Path
from typing import Final, Literal

from PIL import Image, ImageColor, ImageDraw, ImageFont

type Color = tuple[int, int, int]
type Side = Literal["left", "right"]
#: Where a readings block goes. Left and right are the card's own bottom
#: corners; top and bottom centre the block on that edge.
type Position = Literal["left", "right", "top", "bottom"]
POSITIONS: Final[tuple[Position, ...]] = ("left", "right", "top", "bottom")

#: Default widths, as shares of the frame's width.
DEFAULT_READINGS_WIDTH: Final = 0.30
DEFAULT_STAMP_WIDTH: Final = 0.15

#: Home Assistant's default primary colour — what the card's rows use when
#: neither the row nor the theme says otherwise.
DEFAULT_ACCENT: Final[Color] = (3, 169, 244)

# Bundled rather than looked up on the host: Pillow's built-in face has no
# umlauts, no "µ" and no "²", and a Home Assistant container ships no
# system fonts to fall back on. See fonts/DejaVuSans-LICENSE.txt.
_FONT_PATH: Final = Path(__file__).parent / "fonts" / "DejaVuSans.ttf"

# The card's CSS is written in pixels against a stage that is typically
# this wide on a dashboard. Scaling by frame width keeps the overlay the
# same *proportion* of the picture at any resolution.
_REFERENCE_WIDTH: Final = 720

# --- the card's stylesheet, in CSS pixels ---------------------------------
_MARGIN: Final = 8
_FONT: Final = 12
_FONT_SMALL: Final = 10
_LINE_HEIGHT: Final = 1.25
_SCRIM_ALPHA: Final = 0.55
_STAMP_PAD: Final = (8, 4)
_STAMP_RADIUS: Final = 6
_BLOCK_PAD: Final = (10, 8)
_BLOCK_RADIUS: Final = 8
_BLOCK_GAP: Final = 2
_ROW_GAP: Final = 8
_SPARK_HEIGHT: Final = 34
_SPARK_MARGIN: Final = (2, 4)  # above, below
_SPARK_MIN_WIDTH: Final = 180
# Longest a label may run before it is cut short with an ellipsis. Kept in
# the stylesheet's units, so one long friendly name costs that row its
# tail rather than shrinking every reading to make room for it.
_NAME_LIMIT: Final = 160
# Text smaller than this does not survive video compression. A size that
# would need it is overruled — and the frame's edges overrule that.
_MIN_FONT_PX: Final = 8

# sparkline.ts draws in a 240x44 viewBox with 3 units of padding.
_VIEW_WIDTH: Final = 240
_VIEW_HEIGHT: Final = 44
_VIEW_PAD: Final = 3

#: sun.ts MIN_NIGHT_FRACTION — narrower than this and night reads as hatching.
MIN_NIGHT_FRACTION: Final = 4 / 234

# A reading older than this counts as stale unless the series' own cadence
# says it reports more slowly. Ninety minutes, as in overlay-history.ts.
_STALE_FLOOR_SECONDS: Final = 5400.0

_WHITE: Final[Color] = (255, 255, 255)
_NO_READING: Final = "—"

_STRINGS: Final[dict[str, dict[str, str]]] = {
    "en": {"range": "Range {v}", "flat": "No change"},
    "de": {"range": "Spanne {v}", "flat": "Unverändert"},
}


# --- series ---------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class Reading:
    """One recorded value."""

    #: Epoch seconds.
    at: float
    value: float


def _snap_down(raw: float) -> float:
    """The largest 1-2-5 x 10^k value at or below ``raw``.

    The nudge is not decoration: readings of 253.336 and 253.335 differ by
    0.0009999999998 in binary floating point, and flooring that lands a
    decade too low.
    """
    if not math.isfinite(raw) or raw <= 0:
        return 0.0
    nudged = raw * (1 + 1e-9)
    decade = 10.0 ** math.floor(math.log10(nudged))
    leading = nudged / decade
    return (5 if leading >= 5 else 2 if leading >= 2 else 1) * decade


def _nice_step(raw: float) -> float:
    """The smallest 1-2-5 x 10^k value at or above ``raw``."""
    if not math.isfinite(raw) or raw <= 0:
        return 1.0
    decade = 10.0 ** math.floor(math.log10(raw))
    leading = raw / decade
    return (10 if leading > 5 else 5 if leading > 2 else 2 if leading > 1 else 1) * (
        decade
    )


class Series:
    """One entity's readings, with what the overlay derives from them.

    Sorted once and indexed by time, because every frame asks the same two
    questions of it — "what was in effect at this moment" and "what falls
    in this window" — and an export asks them a few thousand times.
    """

    def __init__(self, points: list[Reading]) -> None:
        """Sort the readings and derive the series-wide properties."""
        self.points: list[Reading] = sorted(points, key=lambda point: point.at)
        self._ats: list[float] = [point.at for point in self.points]

        # Tenth percentile of the non-zero steps rather than the minimum:
        # one hair-splitting delta anywhere in six weeks would otherwise
        # define the quantum for the whole series.
        deltas = sorted(
            delta
            for previous, current in zip(self.points, self.points[1:], strict=False)
            if (delta := abs(current.value - previous.value)) > 0
        )
        #: The smallest change the series actually resolves, or 0.
        self.quantum: float = (
            _snap_down(deltas[math.floor(len(deltas) * 0.1)]) if deltas else 0.0
        )

        #: Seconds after which a reading counts as stale: twice the median
        #: interval, so an hourly gauge is not stale at forty minutes.
        self.stale_after: float = _STALE_FLOOR_SECONDS
        if len(self.points) >= 3:
            gaps = sorted(
                current - previous
                for previous, current in zip(self._ats, self._ats[1:], strict=False)
            )
            self.stale_after = max(gaps[len(gaps) >> 1] * 2, _STALE_FLOOR_SECONDS)

    def resolve(self, at: float) -> tuple[Reading, bool] | None:
        """The reading in effect at ``at``, and whether it is stale.

        Hold-last-known, never interpolated: the number on the frame must
        be one the sensor actually reported. None before the first reading
        — an honest "no data yet" rather than a back-projected value.
        """
        found = bisect_right(self._ats, at) - 1
        if found < 0:
            return None
        point = self.points[found]
        return point, at - point.at > self.stale_after

    def value_bounds(self) -> tuple[float, float] | None:
        """Lowest and highest value in the series, for sizing the column."""
        if not self.points:
            return None
        values = [point.value for point in self.points]
        return min(values), max(values)


class ColumnSummary:
    """A series reduced to what one pixel column of its chart can show.

    A sparkline is a few hundred pixels wide. A sensor reporting every few
    seconds puts tens of thousands of readings under it, and walking those
    for every chart on every frame costs more than decoding the frame
    does. But within one pixel column only three things are visible: how
    low the line went, how high, and where it left. Those are computed
    once here, per column-sized slice of time, and a frame then touches a
    few hundred summaries however busy the sensor is.

    Slices are fixed in absolute time, not relative to a playhead, so the
    same summaries serve every frame of the export. Only slices that hold
    a reading are stored: a slow gauge stays as sparse as it is.
    """

    __slots__ = ("exits", "highs", "keys", "lows", "seconds")

    def __init__(self, series: Series, seconds: float) -> None:
        """Summarise ``series`` in slices ``seconds`` long."""
        self.seconds = seconds
        self.keys: list[int] = []
        self.lows: list[float] = []
        self.highs: list[float] = []
        self.exits: list[float] = []
        for point in series.points:
            key = math.floor(point.at / seconds)
            if self.keys and self.keys[-1] == key:
                if point.value < self.lows[-1]:
                    self.lows[-1] = point.value
                elif point.value > self.highs[-1]:
                    self.highs[-1] = point.value
                self.exits[-1] = point.value
            else:
                self.keys.append(key)
                self.lows.append(point.value)
                self.highs.append(point.value)
                self.exits.append(point.value)

    def window(self, start: float, end: float) -> tuple[int, int, float | None]:
        """Slices overlapping ``[start, end]``, and the value standing at its start.

        Returns ``(first, last, anchor)``: the summaries are
        ``[first:last]``, and ``anchor`` is the reading already in effect
        when the window opens, or None if there was none yet.

        The anchor carries more weight than it looks. The recorder stores
        only changes, so a slow gauge can cross a whole window without a
        row while having a perfectly good value throughout it; without the
        anchor that window is empty and the graph vanishes.
        """
        first = bisect_left(self.keys, math.floor(start / self.seconds))
        last = bisect_right(self.keys, math.floor(end / self.seconds))
        return first, last, self.exits[first - 1] if first > 0 else None


# --- what to draw ---------------------------------------------------------


@dataclass(slots=True)
class OverlayRow:
    """One reading: a label, a value and optionally a sparkline."""

    name: str
    series: Series
    unit: str = ""
    decimals: int = 1
    color: Color = DEFAULT_ACCENT
    graph: bool = False
    graph_hours: float = 24.0

    def format_value(self, value: float) -> str:
        """The value as the card prints it."""
        text = f"{value:.{self.decimals}f}"
        return f"{text} {self.unit}" if self.unit else text


@dataclass(slots=True)
class OverlayGroup:
    """One readings block."""

    #: Which of the card's blocks this is: `entities` or `entities_left`.
    side: Side
    rows: list[OverlayRow]
    title: str | None = None
    #: Where it goes in the video. None puts it where the card has it.
    position: Position | None = None


@dataclass(slots=True)
class OverlaySpec:
    """Everything the overlay shows, for a whole export."""

    time_zone: tzinfo
    groups: list[OverlayGroup] = field(default_factory=list)
    #: Sunset-to-sunrise spans as (from, to) epoch seconds, ascending.
    #: Empty leaves the sparklines unshaded.
    nights: list[tuple[float, float]] = field(default_factory=list)
    language: str = "en"
    show_stamp: bool = True
    #: How wide the widest readings block is, as a share of the frame.
    readings_width: float = DEFAULT_READINGS_WIDTH
    #: How wide the date-and-time stamp is, as a share of the frame.
    stamp_width: float = DEFAULT_STAMP_WIDTH


def parse_color(raw: str | None, fallback: Color = DEFAULT_ACCENT) -> Color:
    """A CSS colour as RGB, or ``fallback`` for anything Pillow cannot read.

    A card config can carry ``var(--some-theme-colour)``. Only a browser
    can resolve that; the card does so before it asks for an export, and a
    service call that passes one through gets the accent colour instead of
    an error over a cosmetic.
    """
    if not raw:
        return fallback
    try:
        parsed = ImageColor.getrgb(raw.strip())
    except ValueError:
        return fallback
    return (parsed[0], parsed[1], parsed[2])


def format_extent(value: float) -> str:
    """How far a gauge moved: two significant digits, as ``formatExtent``."""
    if not math.isfinite(value) or value <= 0:
        return "0"
    if value >= 100:
        return str(round(value))
    digits = max(0, 1 - math.floor(math.log10(value)))
    text = f"{value:.{digits}f}"
    # Only ever strip inside a decimal — "40" must not become "4".
    return text.rstrip("0").rstrip(".") if "." in text else text


def format_span(hours: float) -> str:
    """A graph window as a short duration, as ``formatSpan``."""
    if not math.isfinite(hours) or hours <= 0:
        return ""
    if hours < 1:
        return f"{round(hours * 60)} min"
    if hours < 48:
        return f"{round(hours)} h"
    return f"{round(hours / 24)} d"


def night_bands(
    nights: list[tuple[float, float]], start: float, end: float
) -> list[tuple[float, float]]:
    """Night inside ``[start, end]`` as (left, width) fractions of it.

    Returns nothing once the widest band is too narrow to read as night —
    the same test, with the same threshold, the card applies.
    """
    span = end - start
    if span <= 0:
        return []
    bands: list[tuple[float, float]] = []
    for night_start, night_end in nights:
        left, right = max(night_start, start), min(night_end, end)
        if right > left:
            bands.append(((left - start) / span, (right - left) / span))
    widest = max((width for _left, width in bands), default=0.0)
    return bands if widest >= MIN_NIGHT_FRACTION else []


# --- drawing --------------------------------------------------------------


@lru_cache(maxsize=16)
def _load_font(size: int) -> ImageFont.FreeTypeFont:
    """The bundled face at ``size`` pixels."""
    try:
        return ImageFont.truetype(str(_FONT_PATH), size)
    except OSError:
        # The file is part of the integration, so this means a broken
        # install. Pillow's own scalable face still gets the digits onto
        # the frame; its bitmap one cannot be laid out on a baseline, so
        # without FreeType there is nothing to fall back to.
        fallback = ImageFont.load_default(size)
        if isinstance(fallback, ImageFont.FreeTypeFont):
            return fallback
        raise


def _rounded_mask(width: int, height: int, radius: int, alpha: float) -> Image.Image:
    """An anti-aliased rounded rectangle, as a paste mask.

    Pillow's rounded_rectangle is not anti-aliased, and a stair-stepped
    corner that stays put for a whole video is the kind of flaw the eye
    finds within a second. Drawing it once at four times the size and
    scaling down costs nothing per frame.
    """
    factor = 4
    big = Image.new("L", (width * factor, height * factor), 0)
    ImageDraw.Draw(big).rounded_rectangle(
        (0, 0, width * factor - 1, height * factor - 1),
        radius=radius * factor,
        fill=round(255 * alpha),
    )
    return big.resize((width, height), Image.Resampling.LANCZOS)


def _dot_mask(diameter: int) -> Image.Image:
    """An anti-aliased disc, as a paste mask."""
    factor = 4
    big = Image.new("L", (diameter * factor, diameter * factor), 0)
    ImageDraw.Draw(big).ellipse(
        (0, 0, diameter * factor - 1, diameter * factor - 1), fill=255
    )
    return big.resize((diameter, diameter), Image.Resampling.LANCZOS)


def _with_alpha(color: Color, alpha: float) -> tuple[int, int, int, int]:
    return (color[0], color[1], color[2], round(255 * alpha))


@dataclass(slots=True)
class _RowLayout:
    row: OverlayRow
    name: str
    top: int
    #: Top of the sparkline box, or None when the row has no graph.
    spark_top: int | None
    #: The row's series per pixel column; None when the row has no graph.
    columns: ColumnSummary | None


@dataclass(slots=True)
class _StampLayout:
    font: ImageFont.FreeTypeFont
    line: int
    pad_x: int
    pad_y: int
    mask: Image.Image


@dataclass(slots=True)
class _BlockLayout:
    group: OverlayGroup
    left: int
    top: int
    width: int
    height: int
    inner_width: int
    rows: list[_RowLayout]
    mask: Image.Image
    value_right: int


class OverlayRenderer:
    """Draws one export's overlay onto its frames.

    Everything that does not depend on the moment — fonts, the size and
    position of each block, the scrims behind them — is worked out once
    here, so the per-frame cost is a handful of text and line calls.

    Sizes are asked for as a share of the frame's width, because that is
    how an overlay is judged — "the readings take a third of the picture"
    — and it holds at any resolution. The card's stylesheet still sets
    every proportion inside a block; only the overall scale is chosen here.
    """

    def __init__(self, spec: OverlaySpec, width: int, height: int) -> None:
        """Lay the overlay out for frames of ``width`` x ``height``."""
        self._spec = spec
        self._width = width
        self._height = height
        self._lock = threading.Lock()
        self._strings = _STRINGS.get(
            spec.language.lower().replace("_", "-").split("-")[0], _STRINGS["en"]
        )
        # The gap to the frame's edge follows the frame, not the overlay:
        # a smaller overlay sits in the same place, just smaller.
        self._margin = max(1, round(_MARGIN * max(1.0, width / _REFERENCE_WIDTH)))

        self._stamp = self._layout_stamp() if spec.show_stamp else None

        # Laid out once at the stylesheet's own size to measure, then again
        # at the scale that makes the widest block the share asked for.
        self._set_scale(1.0)
        if spec.groups:
            natural = [self._layout_block(group) for group in spec.groups]
            self._set_scale(self._readings_scale(natural))
        self._blocks = [self._layout_block(group) for group in spec.groups]
        self._place_blocks()

    def _set_scale(self, scale: float) -> None:
        """Size every readings measurement for ``scale`` x the stylesheet."""
        self._scale = scale
        self._font = _load_font(self._px(_FONT))
        self._small = _load_font(self._px(_FONT_SMALL))
        self._line = self._px(_FONT * _LINE_HEIGHT)
        self._small_line = self._px(_FONT_SMALL * 1.2)
        self._stroke = max(1, round(1.5 * scale))
        self._dot = _dot_mask(max(3, self._px(5)))

    def _readings_scale(self, natural: list[_BlockLayout]) -> float:
        """The scale that gives the widest block its share of the frame.

        One scale for every block, so text is the same size in both; the
        narrower block simply comes out narrower than the share.
        """
        widest = max(block.width for block in natural)
        tallest = max(block.height for block in natural)
        scale = self._spec.readings_width * self._width / widest
        scale = max(scale, _MIN_FONT_PX / _FONT)
        room = min(
            (self._width - 2 * self._margin) / widest,
            (self._height - 2 * self._margin) / tallest,
        )
        return min(scale, room)

    def _layout_stamp(self) -> _StampLayout:
        """Size the date-and-time box to its share of the frame's width."""
        # Every stamp has this shape and the face has tabular digits, so
        # one measurement sizes the box for the whole export.
        sample = "0000-00-00 00:00"
        natural = _load_font(_FONT).getlength(sample) + 2 * _STAMP_PAD[0]
        scale = self._spec.stamp_width * self._width / natural
        scale = max(scale, _MIN_FONT_PX / _FONT)
        scale = min(scale, (self._width - 2 * self._margin) / natural)

        def px(css_pixels: float) -> int:
            return max(1, round(css_pixels * scale))

        font = _load_font(px(_FONT))
        line = px(_FONT * _LINE_HEIGHT)
        pad_x, pad_y = px(_STAMP_PAD[0]), px(_STAMP_PAD[1])
        return _StampLayout(
            font=font,
            line=line,
            pad_x=pad_x,
            pad_y=pad_y,
            mask=_rounded_mask(
                math.ceil(font.getlength(sample)) + 2 * pad_x,
                line + 2 * pad_y,
                px(_STAMP_RADIUS),
                _SCRIM_ALPHA,
            ),
        )

    def _px(self, css_pixels: float) -> int:
        """Stylesheet pixels at the readings' scale, never below one."""
        return max(1, round(css_pixels * self._scale))

    # --- layout -----------------------------------------------------------

    def _fit(self, text: str, limit: int) -> str:
        """``text``, shortened with an ellipsis until it fits ``limit``."""
        if self._font.getlength(text) <= limit:
            return text
        while len(text) > 1 and self._font.getlength(text + "…") > limit:
            text = text[:-1]
        return text.rstrip() + "…"

    def _layout_block(self, group: OverlayGroup) -> _BlockLayout:
        pad_x, pad_y = self._px(_BLOCK_PAD[0]), self._px(_BLOCK_PAD[1])
        gap = self._px(_BLOCK_GAP)
        row_gap = self._px(_ROW_GAP)

        names = [self._fit(row.name, self._px(_NAME_LIMIT)) for row in group.rows]
        name_width = max(
            (math.ceil(self._font.getlength(name)) for name in names), default=0
        )

        # Widest value the export can show. The face's digits are all one
        # width, so the extremes of the series bound everything between.
        value_width = math.ceil(self._font.getlength(_NO_READING))
        for row in group.rows:
            for value in row.series.value_bounds() or ():
                value_width = max(
                    value_width,
                    math.ceil(self._font.getlength(row.format_value(value))),
                )
        time_width = math.ceil(self._small.getlength("00:00"))

        inner_width = name_width + row_gap + value_width + row_gap + time_width
        if group.title:
            inner_width = max(inner_width, math.ceil(self._font.getlength(group.title)))
        if any(row.graph for row in group.rows):
            inner_width = max(inner_width, self._px(_SPARK_MIN_WIDTH))
        # Never wider than the frame it is drawn on.
        inner_width = min(inner_width, self._width - 2 * self._margin - 2 * pad_x)

        cursor = pad_y
        if group.title:
            cursor += self._line + gap + self._px(2)

        rows: list[_RowLayout] = []
        for row, name in zip(group.rows, names, strict=True):
            top = cursor
            cursor += self._line + gap
            spark_top: int | None = None
            if row.graph:
                spark_top = cursor + self._px(_SPARK_MARGIN[0])
                cursor = (
                    spark_top
                    + self._px(_SPARK_HEIGHT)
                    + self._px(1)
                    + self._small_line
                    + self._px(_SPARK_MARGIN[1])
                    + gap
                )
            rows.append(
                _RowLayout(
                    row,
                    name,
                    top,
                    spark_top,
                    ColumnSummary(
                        row.series,
                        row.graph_hours * 3600 / self._spark_interior(inner_width),
                    )
                    if row.graph
                    else None,
                )
            )

        height = cursor - gap + pad_y
        width = inner_width + 2 * pad_x
        return _BlockLayout(
            group=group,
            left=0,
            top=0,
            width=width,
            height=height,
            inner_width=inner_width,
            rows=rows,
            mask=_rounded_mask(width, height, self._px(_BLOCK_RADIUS), _SCRIM_ALPHA),
            value_right=pad_x + inner_width - time_width - row_gap,
        )

    def _place_blocks(self) -> None:
        """Put each block where it was asked for, and never two on top of each other.

        Left and right are the card's corners, bottom-left and bottom-right,
        so a block left at its default lands where the card draws it. Top
        and bottom centre the block on that edge.

        The right-hand block goes first and keeps its spot, which is the
        card's narrow layout too. A block that would overlap one already
        placed moves away from its edge until it clears; one at the top
        also clears the timestamp.
        """
        margin = self._margin
        placed: list[tuple[int, int, int, int]] = []
        stamp: list[tuple[int, int, int, int]] = []
        if self._stamp is not None:
            stamp.append(
                (
                    margin,
                    margin,
                    margin + self._stamp.mask.width,
                    margin + self._stamp.mask.height,
                )
            )

        def clash(
            block: _BlockLayout, others: list[tuple[int, int, int, int]]
        ) -> tuple[int, int, int, int] | None:
            right, bottom = block.left + block.width, block.top + block.height
            for other in others:
                if (
                    block.left < other[2] + margin
                    and other[0] < right + margin
                    and block.top < other[3] + margin
                    and other[1] < bottom + margin
                ):
                    return other
            return None

        for block in sorted(self._blocks, key=lambda item: item.group.side != "right"):
            position = block.group.position or block.group.side
            if position == "left":
                block.left = margin
            elif position == "right":
                block.left = self._width - margin - block.width
            else:
                block.left = (self._width - block.width) // 2
            block.left = max(0, block.left)

            downward = position == "top"
            block.top = margin if downward else self._height - margin - block.height
            obstacles = [*placed, *(stamp if downward else [])]
            for _attempt in range(len(obstacles)):
                other = clash(block, obstacles)
                if other is None:
                    break
                block.top = (
                    other[3] + margin if downward else other[1] - margin - block.height
                )
            block.top = min(max(0, block.top), max(0, self._height - block.height))
            placed.append(
                (
                    block.left,
                    block.top,
                    block.left + block.width,
                    block.top + block.height,
                )
            )

    # --- per frame --------------------------------------------------------

    def draw(self, frame: Image.Image, slot: int) -> None:
        """Draw the overlay for the moment ``slot`` onto ``frame``, in place.

        ``frame`` must be RGB at the size this renderer was laid out for.
        """
        # One frame at a time. The export decodes frames on more than one
        # thread, and the fonts here are FreeType faces shared between
        # them — which FreeType does not allow to be used concurrently.
        with self._lock:
            draw = ImageDraw.Draw(frame, "RGBA")
            if self._stamp is not None:
                self._draw_stamp(frame, draw, self._stamp, slot)
            for block in self._blocks:
                self._draw_block(frame, draw, block, float(slot))

    def _baseline(self, top: int, line: int, font: ImageFont.FreeTypeFont) -> int:
        """Baseline that centres ``font`` in a line box starting at ``top``."""
        ascent, descent = font.getmetrics()
        return round(top + (line - (ascent + descent)) / 2 + ascent)

    def _draw_stamp(
        self,
        frame: Image.Image,
        draw: ImageDraw.ImageDraw,
        stamp: _StampLayout,
        slot: int,
    ) -> None:
        margin = self._margin
        frame.paste((0, 0, 0), (margin, margin), stamp.mask)
        # ISO order with the year, not the card's weekday-and-day form: a
        # video outlives the dashboard it came from, and "Tue 13.10." means
        # nothing a year on.
        text = datetime.fromtimestamp(slot, self._spec.time_zone).strftime(
            "%Y-%m-%d %H:%M"
        )
        draw.text(
            (
                margin + stamp.pad_x,
                self._baseline(margin + stamp.pad_y, stamp.line, stamp.font),
            ),
            text,
            font=stamp.font,
            fill=_WHITE,
            anchor="ls",
        )

    def _draw_block(
        self,
        frame: Image.Image,
        draw: ImageDraw.ImageDraw,
        block: _BlockLayout,
        at: float,
    ) -> None:
        frame.paste((0, 0, 0), (block.left, block.top), block.mask)
        pad_x = self._px(_BLOCK_PAD[0])
        x0 = block.left + pad_x
        x1 = x0 + block.inner_width

        # All the white text goes onto one greyscale layer the size of the
        # block, each piece at its own strength, and the layer is pasted
        # in white at the end. Pillow blends shapes drawn with an alpha
        # but not text — a translucent fill comes out fully opaque — and
        # the muted captions and a dimmed stale value are exactly what
        # separates the reading from its furniture.
        layer = Image.new("L", (block.width, block.height), 0)
        ink = ImageDraw.Draw(layer)

        def white(
            position: tuple[float, float],
            content: str,
            font: ImageFont.FreeTypeFont,
            alpha: float,
            anchor: str,
        ) -> None:
            ink.text(
                (position[0] - block.left, position[1] - block.top),
                content,
                font=font,
                fill=round(255 * alpha),
                anchor=anchor,
            )

        if block.group.title:
            white(
                (
                    x0,
                    self._baseline(
                        block.top + self._px(_BLOCK_PAD[1]), self._line, self._font
                    ),
                ),
                self._fit(block.group.title, block.inner_width),
                self._font,
                0.95,
                "ls",
            )

        for layout in block.rows:
            row = layout.row
            baseline = self._baseline(block.top + layout.top, self._line, self._font)
            resolved = row.series.resolve(at)

            draw.text(
                (x0, baseline),
                layout.name,
                font=self._font,
                fill=row.color,
                anchor="ls",
            )
            white(
                (block.left + block.value_right, baseline),
                _NO_READING
                if resolved is None
                else row.format_value(resolved[0].value),
                self._font,
                0.55 if resolved and resolved[1] else 1.0,
                "rs",
            )
            if resolved is not None:
                # The reading's own time, not the frame's: an hourly gauge
                # beside a 12:05 frame would otherwise imply a 12:05
                # measurement.
                white(
                    (x1, baseline),
                    datetime.fromtimestamp(
                        resolved[0].at, self._spec.time_zone
                    ).strftime("%H:%M"),
                    self._small,
                    0.6,
                    "rs",
                )

            if layout.spark_top is not None:
                spark_top = block.top + layout.spark_top
                caption = self._draw_spark(
                    frame, draw, layout, at, x0, spark_top, x1 - x0
                )
                if caption is not None:
                    # The chart's units: how far it moved, and over how
                    # long. Without them it is an autoscaled line with no
                    # origin and no unit.
                    line = self._baseline(
                        spark_top + self._px(_SPARK_HEIGHT) + self._px(1),
                        self._small_line,
                        self._small,
                    )
                    white((x0, line), caption, self._small, 0.6, "ls")
                    white(
                        (x1, line),
                        format_span(row.graph_hours),
                        self._small,
                        0.6,
                        "rs",
                    )

        frame.paste(_WHITE, (block.left, block.top), layer)

    @staticmethod
    def _spark_interior(width: int) -> float:
        """Width of the plotted area inside a chart ``width`` pixels wide."""
        return width * (1 - 2 * _VIEW_PAD / _VIEW_WIDTH)

    def _draw_spark(
        self,
        frame: Image.Image,
        draw: ImageDraw.ImageDraw,
        layout: _RowLayout,
        at: float,
        left: int,
        top: int,
        width: int,
    ) -> str | None:
        """One sparkline. A port of ``sparkline()``.

        Returns how far the series moved inside the window, worded for the
        caption under the chart, or None when there was nothing to draw.
        """
        row, columns = layout.row, layout.columns
        assert columns is not None

        half = row.graph_hours * 3600 / 2
        start, end = at - half, at + half
        span = (end - start) or 1.0

        first, last, anchor = columns.window(start, end)
        if first == last and anchor is None:
            # Nothing recorded yet. No chart, rather than an empty frame
            # that reads as "broken".
            return None

        lows, highs = columns.lows[first:last], columns.highs[first:last]
        if anchor is not None:
            lows.append(anchor)
            highs.append(anchor)
        low, high = min(lows), max(highs)
        observed = high - low
        middle = (low + high) / 2

        # Floor the plotted range at four quantisation steps, so a gauge
        # jittering on its last digit is not drawn like one that moved a
        # metre. The relative term keeps float noise on a large-magnitude
        # sensor from blowing the domain open.
        floor = max(4 * row.series.quantum, abs(middle) * 1e-9)
        wanted = max(observed, floor) or 1.0
        bottom_value, top_value = middle - wanted / 2, middle + wanted / 2

        # Round outward to 1-2-5 bounds so the scale only moves when the
        # data crosses a round number, not on every frame. A flat series
        # skips this and stays exactly centred.
        if observed > 0:
            step = _nice_step(wanted / 4)
            rounded_low = math.floor(bottom_value / step) * step
            rounded_high = math.ceil(top_value / step) * step
            if rounded_high > rounded_low:
                bottom_value, top_value = rounded_low, rounded_high
        value_range = (top_value - bottom_value) or 1.0

        height = self._px(_SPARK_HEIGHT)
        pad_x = _VIEW_PAD / _VIEW_WIDTH * width
        pad_y = _VIEW_PAD / _VIEW_HEIGHT * height
        interior = self._spark_interior(width)
        x_start, x_end = left + pad_x, left + pad_x + interior
        y_base, y_scale = top + height - pad_y, (height - 2 * pad_y) / value_range

        def y_of(value: float) -> float:
            return y_base - (value - bottom_value) * y_scale

        # Night first, so the line and the marker stay on top of it.
        for band_left, band_width in night_bands(self._spec.nights, start, end):
            draw.rectangle(
                (
                    x_start + band_left * interior,
                    top,
                    x_start + (band_left + band_width) * interior,
                    top + height,
                ),
                fill=_with_alpha(_WHITE, 0.7 * 0.12),
            )

        # A step, not a curve: these are discrete readings held until the
        # next one, and a line through them would imply values in between
        # that were never measured. Each column contributes the level the
        # line arrives at, the extent it covers there, and the level it
        # leaves at; the last level is held flat to the end of the window.
        path: list[tuple[float, float]] = []
        level = anchor
        if level is not None:
            path.append((x_start, y_of(level)))
        per_second = interior / span
        for index in range(first, last):
            x = x_start + (columns.keys[index] * columns.seconds - start) * per_second
            x = min(max(x, x_start), x_end)
            column_low, column_high = columns.lows[index], columns.highs[index]
            if level is not None:
                path.append((x, y_of(level)))
                column_low, column_high = (
                    min(column_low, level),
                    max(column_high, level),
                )
            level = columns.exits[index]
            if column_low != column_high:
                path.append((x, y_of(column_low)))
                path.append((x, y_of(column_high)))
            path.append((x, y_of(level)))
        assert level is not None
        path.append((x_end, y_of(level)))
        draw.line(path, fill=row.color, width=self._stroke, joint="curve")

        playhead = x_start + interior / 2
        draw.line(
            ((playhead, top), (playhead, top + height)),
            fill=_with_alpha(_WHITE, 0.7 * 0.5),
            width=max(1, round(self._scale)),
        )

        # The marker rides the line at the playhead. Before the first
        # reading there is no value for it to sit on, so it is left out.
        current = row.series.resolve(at)
        if current is not None:
            radius = self._dot.width / 2
            frame.paste(
                row.color,
                (round(playhead - radius), round(y_of(current[0].value) - radius)),
                self._dot,
            )

        if observed == 0:
            return self._strings["flat"]
        return self._strings["range"].replace(
            "{v}", format_extent(observed) + (f" {row.unit}" if row.unit else "")
        )
