"""Brightness smoothing for exported video.

PURE SYNCHRONOUS MODULE. Nothing here imports from ``homeassistant``.

A port of ``src/deflicker.ts``, which carries the reasoning — why the
luminance *curve* is smoothed rather than every frame normalised to one
target, and why the smoothed value is a trimmed mean rather than a median.
The card applies these gains as a CSS filter during playback; an export has
no browser, so the same numbers are applied to the pixels instead. Keep the
two in step: a video that flickers where the card does not, or the other
way round, is the one outcome this exists to prevent.
"""

from __future__ import annotations

import math
from collections.abc import Sequence
from typing import Final

#: Largest correction allowed, as a multiplier. A frame that is genuinely
#: almost black would otherwise demand an enormous gain and come back as
#: grey noise.
MAX_GAIN: Final = 1.5

# Below this mean luminance a frame carries too little signal for a
# multiplier to recover anything real.
_FLOOR: Final = 8

_TRIM_FRACTION: Final = 0.15


def radius_for_strength(strength: float) -> int:
    """Map a 0-100 strength onto a smoothing radius in frames. 0 is off."""
    clamped = min(max(strength, 0), 100)
    if clamped == 0:
        return 0
    # floor(x + 0.5), not round(): Python rounds halves to even and
    # JavaScript rounds them up, and the two must pick the same radius.
    return max(1, math.floor(clamped / 100 * 12 + 0.5))


def _trimmed_mean(values: list[float]) -> float:
    """Mean of a window with the extremes discarded."""
    ordered = sorted(values)
    cut = math.floor(len(ordered) * _TRIM_FRACTION)
    # Never trim away the whole window on a short one.
    kept = ordered[cut : len(ordered) - cut] if len(ordered) - 2 * cut >= 3 else ordered
    return sum(kept) / len(kept)


def deflicker_gains(
    luma: Sequence[int | None], radius: int, max_gain: float = MAX_GAIN
) -> list[float]:
    """Per-frame brightness multipliers for a dense grid of luminances.

    ``luma`` is indexed by grid position, with None where no frame or no
    measurement exists. Returns 1.0 wherever no correction can be computed.
    """
    gains = [1.0] * len(luma)
    if radius < 1:
        return gains

    min_gain = 1 / max_gain
    for index, own in enumerate(luma):
        if own is None or own < _FLOOR:
            continue
        window = [
            float(value)
            for value in luma[max(0, index - radius) : index + radius + 1]
            if value is not None and value >= _FLOOR
        ]
        if len(window) < 3:
            continue
        gains[index] = min(max(_trimmed_mean(window) / own, min_gain), max_gain)
    return gains
