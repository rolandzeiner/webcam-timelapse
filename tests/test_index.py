"""Unit tests for the run-length-encoded frame index.

The index is what the card addresses frames by: `url(i) = t0 + i * step`.
Getting the gap encoding wrong shows up as the scrubber pointing at 404s,
so every shape below is one the archive genuinely reaches — including the
ones that only happen after an outage.
"""

from __future__ import annotations

from custom_components.webcam_timelapse.frame_store import build_index

STEP = 600
T0 = 1_754_050_200


def slots(*positions: int) -> list[int]:
    """Grid positions -> epoch slots."""
    return [T0 + p * STEP for p in positions]


def test_empty_archive() -> None:
    """A freshly configured entry, before the first capture."""
    assert build_index([], STEP) == {"t0": None, "count": 0, "gaps": []}


def test_single_frame() -> None:
    """First capture landed; the card must render exactly one slot."""
    assert build_index(slots(0), STEP) == {"t0": T0, "count": 1, "gaps": []}


def test_contiguous_run() -> None:
    assert build_index(slots(0, 1, 2, 3), STEP) == {
        "t0": T0,
        "count": 4,
        "gaps": [],
    }


def test_single_interior_hole() -> None:
    """One missed capture — a 304 from a frozen camera, say."""
    assert build_index(slots(0, 1, 3, 4), STEP) == {
        "t0": T0,
        "count": 5,
        "gaps": [[2, 1]],
    }


def test_multiple_holes_are_run_length_encoded() -> None:
    assert build_index(slots(0, 4, 5, 9), STEP) == {
        "t0": T0,
        "count": 10,
        "gaps": [[1, 3], [6, 3]],
    }


def test_long_outage_is_a_single_pair() -> None:
    """A two-day outage must not become 288 integers on the wire."""
    index = build_index(slots(0, 1, 289), STEP)
    assert index["count"] == 290
    assert index["gaps"] == [[2, 287]]


def test_leading_and_trailing_gaps_cannot_exist() -> None:
    """t0 is the oldest surviving frame, so the grid never starts on a hole.

    After pruning trims the front of the archive, the index must re-anchor
    rather than describing slots that were deliberately deleted.
    """
    index = build_index(slots(5, 6, 7), STEP)
    assert index["t0"] == T0 + 5 * STEP
    assert index["count"] == 3
    assert index["gaps"] == []


def test_alternating_frames() -> None:
    """Worst realistic case for encoding size: every other slot missing."""
    assert build_index(slots(0, 2, 4, 6), STEP) == {
        "t0": T0,
        "count": 7,
        "gaps": [[1, 1], [3, 1], [5, 1]],
    }


def test_gap_positions_address_the_right_urls() -> None:
    """Every position the index calls a gap must genuinely be absent."""
    present = slots(0, 1, 5, 6, 10)
    index = build_index(present, STEP)

    missing: set[int] = set()
    for start, length in index["gaps"]:
        missing.update(range(start, start + length))

    for position in range(index["count"]):
        slot = index["t0"] + position * STEP
        assert (slot in present) is (position not in missing)


def test_index_scales_to_the_steady_state() -> None:
    """2016 contiguous frames = 10 min x 14 days, no gaps."""
    index = build_index(slots(*range(2016)), STEP)
    assert index == {"t0": T0, "count": 2016, "gaps": []}


def test_one_minute_step() -> None:
    """The index math must not assume the default interval."""
    step = 60
    present = [T0, T0 + 60, T0 + 240]
    assert build_index(present, step) == {"t0": T0, "count": 5, "gaps": [[2, 2]]}
