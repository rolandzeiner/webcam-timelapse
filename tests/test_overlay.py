"""Overlay tests: the series maths, and what actually lands on a frame.

The maths is checked against the same cases as src/overlay-history.test.ts
and src/sparkline.test.ts, because the number burned into a video has to be
the number the card shows for that moment. The drawing is checked by
looking at pixels — where the scrim is, where the row's colour appears —
rather than against a stored image, which would fail on every FreeType
update for reasons nobody could see.
"""

from __future__ import annotations

from pathlib import Path
from unittest.mock import patch
from zoneinfo import ZoneInfo

import pytest
from PIL import Image

from custom_components.webcam_timelapse import overlay
from custom_components.webcam_timelapse.overlay import (
    DEFAULT_ACCENT,
    ColumnSummary,
    OverlayGroup,
    OverlayRenderer,
    OverlayRow,
    OverlaySpec,
    Reading,
    Series,
    format_extent,
    format_span,
    night_bands,
    parse_color,
)

UTC = ZoneInfo("UTC")
HOUR = 3600
T0 = 1_785_000_000  # an arbitrary whole number of seconds
ORANGE = (255, 152, 0)
GREY = (90, 90, 90)


def series(*points: tuple[float, float]) -> Series:
    return Series([Reading(at, value) for at, value in points])


# --- Series ---------------------------------------------------------------


def test_series_sorts_its_readings() -> None:
    built = series((T0 + 20, 2.0), (T0, 1.0), (T0 + 10, 3.0))
    assert [point.value for point in built.points] == [1.0, 3.0, 2.0]


def test_resolve_holds_the_last_known_reading() -> None:
    built = series((T0, 1.0), (T0 + 600, 2.0))

    assert built.resolve(T0 - 1) is None  # nothing recorded yet
    assert built.resolve(T0) == (Reading(T0, 1.0), False)
    assert built.resolve(T0 + 599) == (Reading(T0, 1.0), False)
    assert built.resolve(T0 + 600) == (Reading(T0 + 600, 2.0), False)


def test_resolve_on_an_empty_series() -> None:
    assert Series([]).resolve(T0) is None


def test_a_reading_goes_stale_after_ninety_minutes_by_default() -> None:
    built = series((T0, 1.0))

    assert built.stale_after == 5400
    assert built.resolve(T0 + 5400) == (Reading(T0, 1.0), False)
    assert built.resolve(T0 + 5401) == (Reading(T0, 1.0), True)


def test_staleness_follows_the_series_own_cadence() -> None:
    """A gauge that reports every three hours is not stale after two."""
    slow = series(*((T0 + index * 3 * HOUR, float(index)) for index in range(6)))
    assert slow.stale_after == 6 * HOUR

    fast = series(*((T0 + index * 60, float(index)) for index in range(6)))
    assert fast.stale_after == 5400  # floored, not 120 seconds


def test_quantum_is_the_smallest_step_the_series_resolves() -> None:
    built = series(
        *((T0 + index, 253.335 + 0.001 * (index % 2)) for index in range(20))
    )
    # 0.0009999999998 in binary floating point must still snap to 0.001.
    assert built.quantum == pytest.approx(0.001)

    assert series((T0, 5.0), (T0 + 1, 5.0)).quantum == 0.0
    assert Series([]).quantum == 0.0


def test_quantum_ignores_one_hair_splitting_delta() -> None:
    values = [float(index % 2) for index in range(40)]
    values[10] = values[9] + 0.0001
    built = series(*((T0 + index, value) for index, value in enumerate(values)))

    assert built.quantum == pytest.approx(1.0)


def test_value_bounds() -> None:
    assert series((T0, 3.0), (T0 + 1, -2.0), (T0 + 2, 8.0)).value_bounds() == (
        -2.0,
        8.0,
    )
    assert Series([]).value_bounds() is None


# --- ColumnSummary --------------------------------------------------------


def test_columns_keep_the_extremes_and_the_exit_of_each_slice() -> None:
    built = series(
        (T0 + 1, 5.0), (T0 + 2, 9.0), (T0 + 3, 2.0), (T0 + 4, 4.0), (T0 + 65, 7.0)
    )
    columns = ColumnSummary(built, 60)

    assert len(columns.keys) == 2
    assert (columns.lows[0], columns.highs[0], columns.exits[0]) == (2.0, 9.0, 4.0)
    assert (columns.lows[1], columns.highs[1], columns.exits[1]) == (7.0, 7.0, 7.0)


def test_columns_stay_sparse_for_a_slow_gauge() -> None:
    built = series((T0, 1.0), (T0 + 30 * 86400, 2.0))
    assert len(ColumnSummary(built, 60).keys) == 2


def test_column_window_carries_the_reading_already_in_effect() -> None:
    """A steady gauge has a value all through a window it never reports in."""
    columns = ColumnSummary(series((T0, 1.0), (T0 + 10 * HOUR, 2.0)), 60)

    first, last, anchor = columns.window(T0 + 2 * HOUR, T0 + 4 * HOUR)
    assert first == last  # no reading inside the window
    assert anchor == 1.0

    first, last, anchor = columns.window(T0 - 2 * HOUR, T0 - HOUR)
    assert (first, last, anchor) == (0, 0, None)  # before the first reading

    first, last, anchor = columns.window(T0 - HOUR, T0 + 11 * HOUR)
    assert (last - first, anchor) == (2, None)


# --- formatting -----------------------------------------------------------


@pytest.mark.parametrize(
    ("value", "text"),
    [
        (0, "0"),
        (-3, "0"),
        (float("nan"), "0"),
        (0.0123, "0.012"),
        (0.5, "0.5"),
        (4.56, "4.6"),
        (9.96, "10"),
        (40, "40"),  # must not be stripped to "4"
        (45.6, "46"),
        (123.4, "123"),
    ],
)
def test_format_extent_matches_the_card(value: float, text: str) -> None:
    assert format_extent(value) == text


@pytest.mark.parametrize(
    ("hours", "text"),
    [
        (0, ""),
        (float("inf"), ""),
        (0.5, "30 min"),
        (24, "24 h"),
        (47, "47 h"),
        (48, "2 d"),
        (336, "14 d"),
    ],
)
def test_format_span_matches_the_card(hours: float, text: str) -> None:
    assert format_span(hours) == text


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("#ff9800", ORANGE),
        ("  #FF9800  ", ORANGE),
        ("rgb(255, 152, 0)", ORANGE),
        ("orange", (255, 165, 0)),
        (None, DEFAULT_ACCENT),
        ("", DEFAULT_ACCENT),
        ("not-a-colour", DEFAULT_ACCENT),
        # Only a browser can resolve this; the card does so before asking.
        ("var(--primary-color)", DEFAULT_ACCENT),
    ],
)
def test_parse_color(raw: str | None, expected: tuple[int, int, int]) -> None:
    assert parse_color(raw) == expected


def test_parse_color_uses_the_given_fallback() -> None:
    assert parse_color("var(--x)", ORANGE) == ORANGE


def test_night_bands_are_clipped_to_the_window() -> None:
    nights = [(T0 - 2 * HOUR, T0 + 2 * HOUR), (T0 + 20 * HOUR, T0 + 30 * HOUR)]

    bands = night_bands(nights, T0, T0 + 24 * HOUR)

    assert bands == [
        pytest.approx((0.0, 2 / 24)),
        pytest.approx((20 / 24, 4 / 24)),
    ]


def test_night_bands_vanish_when_too_fine_to_read() -> None:
    """Thirty nights across thirty days is hatching, not context."""
    nights = [(T0 + day * 86400, T0 + day * 86400 + 8 * HOUR) for day in range(400)]

    assert night_bands(nights, T0, T0 + 400 * 86400) == []
    assert night_bands(nights, T0, T0 + 3 * 86400) != []
    assert night_bands(nights, T0, T0) == []


# --- drawing --------------------------------------------------------------


def frame(width: int = 720, height: int = 540) -> Image.Image:
    return Image.new("RGB", (width, height), GREY)


def spec(*groups: OverlayGroup, **kwargs: object) -> OverlaySpec:
    return OverlaySpec(time_zone=UTC, groups=list(groups), **kwargs)  # type: ignore[arg-type]


def steady_row(**kwargs: object) -> OverlayRow:
    defaults: dict[str, object] = {
        "name": "CO2",
        "series": series((T0 - HOUR, 600.0), (T0, 640.0), (T0 + HOUR, 700.0)),
        "unit": "ppm",
        "decimals": 0,
    }
    return OverlayRow(**{**defaults, **kwargs})  # type: ignore[arg-type]


def has_colour(
    image: Image.Image, box: tuple[int, int, int, int], colour: tuple[int, int, int]
) -> bool:
    region = image.crop(box)
    colours = region.getcolors(maxcolors=region.width * region.height)
    assert colours is not None
    return any(found == colour for _count, found in colours)


def darker_than_background(image: Image.Image, at: tuple[int, int]) -> bool:
    pixel = image.getpixel(at)
    assert isinstance(pixel, tuple)
    return pixel[0] < GREY[0] - 20


def test_the_bundled_font_is_the_one_in_use() -> None:
    """Pillow's built-in face has no umlauts, no µ and no superscripts."""
    overlay._load_font.cache_clear()
    assert overlay._load_font(20).getname()[0] == "DejaVu Sans"


def test_a_missing_font_file_falls_back_to_pillows_scalable_face() -> None:
    overlay._load_font.cache_clear()
    try:
        with patch.object(overlay, "_FONT_PATH", Path("/nonexistent/font.ttf")):
            image = frame()
            OverlayRenderer(spec(OverlayGroup("right", [steady_row()])), 720, 540).draw(
                image, T0
            )
        assert image.getpixel((700, 520)) != GREY
    finally:
        overlay._load_font.cache_clear()


def test_the_stamp_sits_top_left_and_the_block_bottom_right() -> None:
    image = frame()
    OverlayRenderer(spec(OverlayGroup("right", [steady_row()])), 720, 540).draw(
        image, T0
    )

    assert darker_than_background(image, (12, 12))  # stamp scrim
    assert darker_than_background(image, (700, 520))  # readings scrim
    assert has_colour(image, (0, 0, 200, 40), (255, 255, 255))  # stamp text
    # The picture itself is untouched.
    assert image.getpixel((360, 270)) == GREY
    assert image.getpixel((12, 520)) == GREY


def test_a_left_block_takes_the_other_corner() -> None:
    image = frame()
    OverlayRenderer(spec(OverlayGroup("left", [steady_row()])), 720, 540).draw(
        image, T0
    )

    assert darker_than_background(image, (14, 520))
    assert image.getpixel((700, 520)) == GREY


def test_no_stamp_when_it_is_switched_off() -> None:
    image = frame()
    OverlayRenderer(
        spec(OverlayGroup("right", [steady_row()]), show_stamp=False), 720, 540
    ).draw(image, T0)

    assert image.getpixel((12, 12)) == GREY
    assert darker_than_background(image, (700, 520))


def test_a_stamp_alone_is_a_valid_overlay() -> None:
    image = frame()
    OverlayRenderer(spec(), 720, 540).draw(image, T0)

    assert darker_than_background(image, (12, 12))
    assert image.getpixel((700, 520)) == GREY


def test_the_row_name_is_drawn_in_the_rows_colour() -> None:
    image = frame()
    OverlayRenderer(
        spec(OverlayGroup("right", [steady_row(color=ORANGE)])), 720, 540
    ).draw(image, T0)

    assert has_colour(image, (360, 400, 720, 540), ORANGE)


def test_the_value_follows_the_moment() -> None:
    renderer = OverlayRenderer(
        spec(OverlayGroup("right", [steady_row()]), show_stamp=False), 720, 540
    )
    early, late, later = frame(), frame(), frame()
    renderer.draw(early, T0 - HOUR)
    renderer.draw(late, T0 + HOUR)
    renderer.draw(later, T0 + HOUR)

    assert early.tobytes() != late.tobytes()  # 600 ppm against 700 ppm
    assert late.tobytes() == later.tobytes()  # and it is deterministic


def test_the_block_does_not_change_size_between_frames() -> None:
    """A content-sized block jitters once the frames are played as video."""
    row = steady_row(series=series((T0, 5.0), (T0 + HOUR, 12345.0)))
    renderer = OverlayRenderer(
        spec(OverlayGroup("right", [row]), show_stamp=False), 720, 540
    )
    narrow, wide = frame(), frame()
    renderer.draw(narrow, T0)
    renderer.draw(wide, T0 + HOUR)

    def scrim_left_edge(image: Image.Image) -> int:
        y = 525
        return next(x for x in range(720) if image.getpixel((x, y)) != GREY)

    assert scrim_left_edge(narrow) == scrim_left_edge(wide)


def test_a_stale_reading_is_dimmed() -> None:
    renderer = OverlayRenderer(
        spec(
            OverlayGroup("right", [steady_row(series=series((T0, 640.0)))]),
            show_stamp=False,
        ),
        720,
        540,
    )
    fresh, stale = frame(), frame()
    renderer.draw(fresh, T0 + 60)
    renderer.draw(stale, T0 + 6 * HOUR)

    region = (360, 400, 720, 540)
    assert has_colour(fresh, region, (255, 255, 255))
    assert not has_colour(stale, region, (255, 255, 255))


def test_a_row_with_no_reading_yet_still_draws() -> None:
    image = frame()
    OverlayRenderer(
        spec(OverlayGroup("right", [steady_row(series=Series([]), graph=True)])),
        720,
        540,
    ).draw(image, T0)

    assert darker_than_background(image, (700, 520))


def test_a_graph_makes_the_block_taller_and_draws_in_the_rows_colour() -> None:
    plain = OverlayRenderer(
        spec(OverlayGroup("right", [steady_row(color=ORANGE)])), 720, 540
    )
    graphed = OverlayRenderer(
        spec(OverlayGroup("right", [steady_row(color=ORANGE, graph=True)])), 720, 540
    )
    assert graphed._blocks[0].height > plain._blocks[0].height

    image = frame()
    graphed.draw(image, T0)
    block = graphed._blocks[0]
    spark_top = block.top + block.rows[0].spark_top  # type: ignore[operator]
    assert has_colour(
        image, (block.left, spark_top, block.left + block.width, spark_top + 34), ORANGE
    )


def test_a_graph_before_the_first_reading_is_left_out() -> None:
    """No chart at all, rather than an empty frame that reads as broken."""
    row = steady_row(color=ORANGE, graph=True, graph_hours=2, series=series((T0, 5.0)))
    renderer = OverlayRenderer(
        spec(OverlayGroup("right", [row]), show_stamp=False), 720, 540
    )
    image = frame()
    renderer.draw(image, T0 - 10 * HOUR)

    block = renderer._blocks[0]
    spark_top = block.top + block.rows[0].spark_top  # type: ignore[operator]
    assert not has_colour(
        image, (block.left, spark_top, block.left + block.width, spark_top + 34), ORANGE
    )


def test_a_flat_graph_and_a_busy_one_both_draw() -> None:
    busy = series(
        *((T0 - 12 * HOUR + index * 5, float(index % 17)) for index in range(17_280))
    )
    flat = series((T0 - 20 * HOUR, 3.0))
    renderer = OverlayRenderer(
        spec(
            OverlayGroup(
                "right",
                [
                    steady_row(name="Busy", series=busy, graph=True, color=ORANGE),
                    steady_row(name="Flat", series=flat, graph=True),
                ],
            ),
            nights=[(T0 - 6 * HOUR, T0 + 4 * HOUR)],
            language="de-AT",
        ),
        720,
        540,
    )
    image = frame()
    renderer.draw(image, T0)

    assert has_colour(image, (360, 300, 720, 540), ORANGE)
    assert has_colour(image, (360, 300, 720, 540), DEFAULT_ACCENT)


def test_a_title_adds_a_heading_row() -> None:
    plain = OverlayRenderer(spec(OverlayGroup("right", [steady_row()])), 720, 540)
    titled = OverlayRenderer(
        spec(OverlayGroup("right", [steady_row()], title="Greenhouse")), 720, 540
    )
    assert titled._blocks[0].height > plain._blocks[0].height

    image = frame()
    titled.draw(image, T0)
    assert darker_than_background(image, (700, 520))


def test_a_long_name_is_shortened_rather_than_crossing_the_picture() -> None:
    renderer = OverlayRenderer(
        spec(
            OverlayGroup(
                "right", [steady_row(name="An extremely long friendly name " * 6)]
            )
        ),
        720,
        540,
    )
    block = renderer._blocks[0]

    assert block.rows[0].name.endswith("…")
    assert block.width < 720 * 0.7


def test_the_overlay_scales_with_the_frame() -> None:
    small = OverlayRenderer(spec(OverlayGroup("right", [steady_row()])), 720, 540)
    large = OverlayRenderer(spec(OverlayGroup("right", [steady_row()])), 1440, 1080)

    assert large._blocks[0].height == pytest.approx(small._blocks[0].height * 2, abs=4)


def test_a_tiny_frame_does_not_break_the_layout() -> None:
    image = frame(160, 120)
    OverlayRenderer(
        spec(
            OverlayGroup("left", [steady_row(graph=True)]),
            OverlayGroup("right", [steady_row(graph=True)], title="Readings"),
        ),
        160,
        120,
    ).draw(image, T0)

    assert image.size == (160, 120)


def test_two_blocks_stack_when_they_would_collide() -> None:
    """Same answer as the card's narrow layout: the right block keeps the corner."""
    groups = (
        OverlayGroup("left", [steady_row(name="A fairly long reading name")]),
        OverlayGroup("right", [steady_row(name="Another fairly long name")]),
    )
    side_by_side = OverlayRenderer(spec(*groups), 1600, 1200)
    left, right = side_by_side._blocks
    assert left.top == right.top

    crowded = OverlayRenderer(spec(*groups, readings_width=0.6), 1600, 1200)
    left, right = crowded._blocks
    assert right.left + right.width == 1600 - crowded._margin  # kept its corner
    assert left.top + left.height <= right.top


# --- size -----------------------------------------------------------------


def graphed_group(side: str = "right", **kwargs: object) -> OverlayGroup:
    return OverlayGroup(
        side,  # type: ignore[arg-type]
        [
            steady_row(name="Garden ESP32-S3-CAM-1 SCD40 CO2", graph=True),
            steady_row(name="Temperature", unit="°C", decimals=1, graph=True),
        ],
        **kwargs,  # type: ignore[arg-type]
    )


@pytest.mark.parametrize("share", [0.2, 0.3, 0.5])
def test_the_readings_take_the_share_of_the_width_asked_for(share: float) -> None:
    renderer = OverlayRenderer(spec(graphed_group(), readings_width=share), 1600, 1200)

    assert renderer._blocks[0].width == pytest.approx(1600 * share, rel=0.03)


def test_the_default_is_under_a_third_of_the_picture() -> None:
    renderer = OverlayRenderer(spec(graphed_group()), 1600, 1200)

    assert renderer._blocks[0].width == pytest.approx(480, rel=0.03)


def test_both_blocks_share_one_text_size() -> None:
    """The narrower block comes out narrower, not with bigger text."""
    renderer = OverlayRenderer(
        spec(
            OverlayGroup("left", [steady_row(name="CO2")]),
            graphed_group(),
        ),
        1600,
        1200,
    )
    left, right = renderer._blocks

    assert right.width == pytest.approx(480, rel=0.03)
    assert left.width < right.width
    assert left.rows[0].top == right.rows[0].top  # same line height


@pytest.mark.parametrize("share", [0.1, 0.15, 0.3])
def test_the_stamp_takes_the_share_of_the_width_asked_for(share: float) -> None:
    renderer = OverlayRenderer(spec(stamp_width=share), 1600, 1200)

    assert renderer._stamp is not None
    assert renderer._stamp.mask.width == pytest.approx(1600 * share, rel=0.05)


def test_text_never_shrinks_below_legibility() -> None:
    """A size that would need sub-8px text is overruled."""
    renderer = OverlayRenderer(
        spec(graphed_group(), readings_width=0.05, stamp_width=0.02), 640, 480
    )

    assert renderer._font.size >= 8
    assert renderer._stamp is not None
    assert renderer._stamp.font.size >= 8


def test_the_frame_overrules_a_size_too_large_for_it() -> None:
    rows = [steady_row(name=f"Reading {index}", graph=True) for index in range(8)]
    renderer = OverlayRenderer(
        spec(OverlayGroup("right", rows), readings_width=0.8), 640, 480
    )
    block = renderer._blocks[0]

    assert block.top >= 0
    assert block.top + block.height <= 480
    assert block.left >= 0


# --- position -------------------------------------------------------------


def place(
    position: str | None, side: str = "right", **kwargs: object
) -> OverlayRenderer:
    return OverlayRenderer(
        spec(graphed_group(side, position=position), **kwargs), 1600, 1200
    )


def test_by_default_a_block_goes_where_the_card_has_it() -> None:
    right = place(None)._blocks[0]
    left = place(None, side="left")._blocks[0]

    assert right.left + right.width == 1600 - place(None)._margin
    assert left.left == place(None)._margin
    assert right.top + right.height == left.top + left.height == 1200 - 18


@pytest.mark.parametrize(
    ("position", "horizontal", "vertical"),
    [
        ("left", "left", "bottom"),
        ("right", "right", "bottom"),
        ("bottom", "centre", "bottom"),
        ("top", "centre", "top"),
    ],
)
def test_each_position(position: str, horizontal: str, vertical: str) -> None:
    renderer = place(position, show_stamp=False)
    block, margin = renderer._blocks[0], renderer._margin

    centre = block.left + block.width / 2
    assert {
        "left": block.left == margin,
        "right": block.left + block.width == 1600 - margin,
        "centre": abs(centre - 800) <= 1,
    }[horizontal]
    assert {
        "top": block.top == margin,
        "bottom": block.top + block.height == 1200 - margin,
    }[vertical]


def test_a_block_at_the_top_clears_the_timestamp() -> None:
    renderer = place("top", readings_width=0.8)
    stamp, block = renderer._stamp, renderer._blocks[0]

    assert stamp is not None
    assert block.top >= renderer._margin + stamp.mask.height


def test_two_blocks_asked_for_the_same_place_stack() -> None:
    renderer = OverlayRenderer(
        spec(
            graphed_group("left", position="bottom"),
            graphed_group("right", position="bottom"),
        ),
        1600,
        1200,
    )
    left, right = renderer._blocks

    assert right.top + right.height == 1200 - renderer._margin  # right keeps it
    assert left.top + left.height <= right.top


def test_moving_a_block_moves_its_pixels() -> None:
    image = frame(1600, 1200)
    OverlayRenderer(
        spec(graphed_group(position="top"), show_stamp=False), 1600, 1200
    ).draw(image, T0)

    assert darker_than_background(image, (800, 40))
    assert image.getpixel((1590, 1190)) == GREY
