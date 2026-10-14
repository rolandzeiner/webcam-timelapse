"""Deflicker tests: the Python port must agree with src/deflicker.ts.

The card applies these gains as a CSS filter and the export bakes them into
the pixels, so a divergence between the two shows up as a video that
flickers where the card it was exported from does not.
"""

from __future__ import annotations

import pytest

from custom_components.webcam_timelapse.deflicker import (
    MAX_GAIN,
    deflicker_gains,
    radius_for_strength,
)


@pytest.mark.parametrize(
    ("strength", "radius"),
    [
        (0, 0),
        (-5, 0),
        (1, 1),  # rounds to 0, floored at 1: any non-zero strength does something
        (50, 6),
        (100, 12),
        (500, 12),
        # 4.5 frames. JavaScript's Math.round gives 5; Python's round() gives
        # 4. The card is the reference, so this has to be 5.
        (37.5, 5),
    ],
)
def test_radius_for_strength(strength: float, radius: int) -> None:
    assert radius_for_strength(strength) == radius


def test_zero_radius_changes_nothing() -> None:
    assert deflicker_gains([100, 140, 100, 140], 0) == [1.0, 1.0, 1.0, 1.0]


def test_empty_series() -> None:
    assert deflicker_gains([], 6) == []


def test_a_steady_series_needs_no_correction() -> None:
    assert deflicker_gains([120] * 9, 3) == [1.0] * 9


def test_alternating_brightness_is_pulled_together() -> None:
    """The footage this exists for: cloud edges flipping every frame."""
    luma: list[int | None] = [100, 140] * 8
    gains = deflicker_gains(luma, 4)

    corrected = [value * gain for value, gain in zip(luma, gains, strict=True) if value]
    interior = corrected[4:-4]
    assert max(interior) - min(interior) < 10  # was 40
    # Dark frames are lifted, bright ones pulled down.
    assert gains[6] > 1 > gains[7]


def test_a_slow_change_survives() -> None:
    """Dusk must still get dark: only fast excursions are corrected."""
    luma: list[int | None] = list(range(200, 40, -4))
    gains = deflicker_gains(luma, 3)

    assert all(0.9 < gain < 1.1 for gain in gains[3:-3])


def test_one_black_frame_does_not_drag_its_neighbours() -> None:
    luma: list[int | None] = [120] * 6 + [9] + [120] * 6
    gains = deflicker_gains(luma, 4)

    # Every full window that contains the black frame trims it away.
    assert gains[4:6] == [1.0, 1.0]
    assert gains[7:9] == [1.0, 1.0]
    # The black frame itself is lifted, but only as far as the clamp.
    assert gains[6] == MAX_GAIN


def test_gain_is_clamped_both_ways() -> None:
    gains = deflicker_gains([20, 200, 200, 200, 200], 4)
    assert gains[0] == MAX_GAIN

    gains = deflicker_gains([250, 20, 20, 20, 20, 20, 20], 6)
    assert gains[0] == pytest.approx(1 / MAX_GAIN)


def test_unmeasured_and_near_black_frames_are_left_alone() -> None:
    luma: list[int | None] = [100, None, 140, 3, 100, 140, 100]
    gains = deflicker_gains(luma, 3)

    assert gains[1] == 1.0  # no measurement
    assert gains[3] == 1.0  # too dark to scale meaningfully
    # ...and neither is counted in a neighbour's window.
    assert gains[4] == pytest.approx(1.2)


def test_a_window_with_too_few_measurements_is_left_alone() -> None:
    assert deflicker_gains([100, 140, None, None, None], 1) == [1.0] * 5
