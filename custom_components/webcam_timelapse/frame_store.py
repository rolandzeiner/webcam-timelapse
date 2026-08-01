"""On-disk frame archive: paths, atomic writes, scanning, pruning, index.

PURE SYNCHRONOUS MODULE. Nothing here imports from ``homeassistant``, and
every function does blocking filesystem work — ``os.scandir`` over a few
thousand dirents, ``os.unlink``, a file write. Callers must go through
``hass.async_add_executor_job``. See ``encode.py`` for why the
no-HA-import rule is enforced structurally rather than by comment.

Frames are named ``<slot>.webp`` where ``slot`` is an integer epoch-second
timestamp snapped to the capture grid. Deriving the name from the grid
rather than from anything the upstream server says is the single most
important decision in this module: the obvious alternative (name the file
after the response's ``Last-Modified``) silently overwrites the same file
forever against any camera whose header freezes without also returning
304, which is a real, long-standing bug in the prior art this integration
was modelled against.
"""

from __future__ import annotations

import os
from itertools import pairwise
from pathlib import Path
from typing import Any, Final

FRAME_SUFFIX: Final = ".webp"
_TMP_SUFFIX: Final = ".tmp"


def slot_for(timestamp: float, step: int) -> int:
    """Snap an epoch timestamp onto the capture grid.

    Rounds to the *nearest* multiple of ``step`` rather than flooring.
    Capture fires a few seconds past the intended minute so the camera has
    finished writing, and flooring would push every frame into the
    previous slot. Rounding also keeps the grid uniform in timezones whose
    UTC offset is not a whole hour (a 60-minute interval in UTC+05:30
    fires at :30 past the UTC hour); the resulting grid is offset from UTC
    midnight but still has exactly ``step`` between consecutive slots,
    which is all the index and the card require.
    """
    return round(timestamp / step) * step


def frame_path(frames_dir: Path, slot: int) -> Path:
    """Return the absolute path of the frame for ``slot``."""
    return frames_dir / f"{slot}{FRAME_SUFFIX}"


def write_frame(frames_dir: Path, slot: int, data: bytes) -> Path:
    """Write one frame atomically and return its path.

    Writes to a sibling ``.tmp`` file and then ``os.replace``s it into
    place, so a reader (the static-file handler serving the card) can
    never observe a half-written frame. The temp file is in the same
    directory, hence the same filesystem, which is what makes the replace
    atomic.
    """
    frames_dir.mkdir(parents=True, exist_ok=True)
    target = frame_path(frames_dir, slot)
    tmp = target.with_suffix(FRAME_SUFFIX + _TMP_SUFFIX)
    try:
        tmp.write_bytes(data)
        os.replace(tmp, target)
    except OSError:
        tmp.unlink(missing_ok=True)
        raise
    return target


def scan_slots(frames_dir: Path) -> list[int]:
    """Return every stored slot, ascending.

    Names-only ``os.scandir`` — no ``stat``, no file reads — so this stays
    cheap enough to run on every capture tick even with a few thousand
    frames. Anything that is not exactly ``<integer>.webp`` is ignored, so
    a stray ``README.txt``, a leftover ``.tmp``, or a hand-dropped file is
    never mistaken for a frame (and consequently never pruned).
    """
    if not frames_dir.is_dir():
        return []

    slots: list[int] = []
    with os.scandir(frames_dir) as entries:
        for entry in entries:
            name = entry.name
            if not name.endswith(FRAME_SUFFIX):
                continue
            stem = name[: -len(FRAME_SUFFIX)]
            # str.isdigit() rejects "-1", "1.5", "" and any unicode oddity
            # that int() would otherwise happily accept.
            if not stem.isdigit():
                continue
            slots.append(int(stem))
    slots.sort()
    return slots


def prune(frames_dir: Path, slots: list[int], cutoff: int) -> list[int]:
    """Delete every frame strictly older than ``cutoff``; return what went.

    ``slots`` is the already-scanned, sorted list from ``scan_slots`` so a
    caller that has just scanned does not pay for a second walk. In steady
    state this unlinks exactly one file per tick.

    Deleting a frame that is being served concurrently is safe and needs
    no locking: on POSIX ``unlink`` only removes the directory entry, and
    an already-open file descriptor stays valid until closed. The only
    observable race is a request that resolved the index microseconds
    before the unlink, which yields a single 404 that the card already
    renders as a gap.
    """
    removed: list[int] = []
    for slot in slots:
        if slot >= cutoff:
            break  # slots is sorted; everything after this survives
        try:
            frame_path(frames_dir, slot).unlink()
        except FileNotFoundError:
            pass  # already gone: nothing to do, still counts as pruned
        except OSError:
            continue  # permissions or IO error — leave it, try again next tick
        removed.append(slot)
    return removed


def build_index(slots: list[int], step: int) -> dict[str, Any]:
    """Describe the archive as a dense grid plus run-length-encoded gaps.

    The card addresses frames by grid position, deriving each URL as
    ``t0 + i * step``. Returning the holes rather than the 2000-odd
    present slots keeps the payload tiny: a multi-day outage is one
    ``[start, length]`` pair.

    Leading and trailing gaps do not exist by construction — ``t0`` is the
    oldest surviving frame and ``count`` ends at the newest.
    """
    if not slots:
        return {"t0": None, "count": 0, "gaps": []}

    t0 = slots[0]
    count = (slots[-1] - t0) // step + 1

    gaps: list[list[int]] = []
    for previous, current in pairwise(slots):
        distance = (current - previous) // step
        if distance > 1:
            gaps.append([(previous - t0) // step + 1, distance - 1])

    return {"t0": t0, "count": count, "gaps": gaps}


def disk_usage(frames_dir: Path) -> int:
    """Total bytes occupied by stored frames."""
    if not frames_dir.is_dir():
        return 0

    total = 0
    with os.scandir(frames_dir) as entries:
        for entry in entries:
            if not entry.name.endswith(FRAME_SUFFIX):
                continue
            try:
                total += entry.stat(follow_symlinks=False).st_size
            except OSError:
                continue
    return total


def purge_all(frames_dir: Path) -> int:
    """Delete every frame in ``frames_dir``; return how many went.

    Per-file unlink rather than ``rmtree`` so a foreign file living
    alongside the archive survives. Removing the whole directory is only
    correct when the config entry itself is being removed, which
    ``__init__.async_remove_entry`` handles separately.
    """
    slots = scan_slots(frames_dir)
    return len(prune(frames_dir, slots, cutoff=slots[-1] + 1 if slots else 0))
