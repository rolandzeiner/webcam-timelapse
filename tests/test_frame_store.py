"""Unit tests for the pure on-disk frame archive.

No Home Assistant harness is involved — frame_store.py deliberately
imports nothing from `homeassistant`, so these run as plain pytest.
"""

from __future__ import annotations

import datetime as dt
import os
from itertools import pairwise
from pathlib import Path
from zoneinfo import ZoneInfo

import pytest

from custom_components.webcam_timelapse import frame_store

STEP = 600  # 10 minutes, the default capture interval


@pytest.fixture
def frames_dir(tmp_path: Path) -> Path:
    """An empty archive directory."""
    target = tmp_path / "frames"
    target.mkdir()
    return target


def seed(frames_dir: Path, slots: list[int]) -> None:
    """Write a placeholder frame for each slot."""
    for slot in slots:
        frame_store.write_frame(frames_dir, slot, b"x")


# --- slot_for -------------------------------------------------------------


def test_slot_for_snaps_to_grid() -> None:
    """An exact grid time stays put; the capture offset rounds back onto it."""
    assert frame_store.slot_for(1_754_050_200, STEP) == 1_754_050_200
    # Capture fires ~5 s late; the frame must land in the slot it was
    # scheduled for, not the previous one. This is why slot_for rounds
    # rather than floors.
    assert frame_store.slot_for(1_754_050_205, STEP) == 1_754_050_200
    # A few seconds early (scheduler jitter) rounds forward to the same slot.
    assert frame_store.slot_for(1_754_050_197, STEP) == 1_754_050_200


def test_slot_for_always_returns_a_multiple_of_step() -> None:
    for offset in range(0, 600, 37):
        slot = frame_store.slot_for(1_754_050_200 + offset, STEP)
        assert slot % STEP == 0


@pytest.mark.parametrize("step", [60, 120, 180, 300, 600, 900, 1200, 1800, 3600])
@pytest.mark.parametrize(
    ("label", "start"),
    [
        # Europe/Vienna springs forward 2026-03-29 (23-hour day) and falls
        # back 2026-10-25 (25-hour day). Capture fires on local wall-clock
        # minutes, so the grid has to stay uniform in epoch terms across
        # both — otherwise the card's "t0 + i * step" addressing breaks
        # for everyone in a DST timezone twice a year.
        (
            "spring-forward",
            dt.datetime(2026, 3, 29, 0, 0, tzinfo=ZoneInfo("Europe/Vienna")),
        ),
        (
            "fall-back",
            dt.datetime(2026, 10, 25, 0, 0, tzinfo=ZoneInfo("Europe/Vienna")),
        ),
    ],
)
def test_grid_stays_uniform_across_dst(
    label: str, start: dt.datetime, step: int
) -> None:
    """Consecutive capture ticks are exactly `step` apart in epoch seconds."""
    slots = [
        frame_store.slot_for(start.timestamp() + n * step + 5, step) for n in range(60)
    ]
    deltas = {b - a for a, b in pairwise(slots)}
    assert deltas == {step}, f"{label}: non-uniform grid {sorted(deltas)}"


# --- write_frame ----------------------------------------------------------


def test_write_frame_is_atomic_and_leaves_no_temp_file(frames_dir: Path) -> None:
    path = frame_store.write_frame(frames_dir, 1_754_050_200, b"payload")

    assert path.read_bytes() == b"payload"
    assert path.name == "1754050200.webp"
    assert list(frames_dir.glob("*.tmp")) == []


def test_write_frame_creates_missing_directory(tmp_path: Path) -> None:
    nested = tmp_path / "does" / "not" / "exist"
    frame_store.write_frame(nested, 1_754_050_200, b"payload")
    assert (nested / "1754050200.webp").is_file()


def test_write_frame_overwrites_in_place(frames_dir: Path) -> None:
    frame_store.write_frame(frames_dir, 1_754_050_200, b"first")
    frame_store.write_frame(frames_dir, 1_754_050_200, b"second")
    assert frame_store.frame_path(frames_dir, 1_754_050_200).read_bytes() == b"second"
    assert len(frame_store.scan_slots(frames_dir)) == 1


def test_write_frame_cleans_up_temp_on_failure(
    frames_dir: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    def boom(_src: object, _dst: object) -> None:
        raise OSError("disk full")

    monkeypatch.setattr(frame_store.os, "replace", boom)

    with pytest.raises(OSError, match="disk full"):
        frame_store.write_frame(frames_dir, 1_754_050_200, b"payload")

    assert list(frames_dir.iterdir()) == []


# --- scan_slots -----------------------------------------------------------


def test_scan_slots_returns_sorted_slots(frames_dir: Path) -> None:
    seed(frames_dir, [1_754_050_800, 1_754_050_200, 1_754_051_400])
    assert frame_store.scan_slots(frames_dir) == [
        1_754_050_200,
        1_754_050_800,
        1_754_051_400,
    ]


def test_scan_slots_on_missing_directory(tmp_path: Path) -> None:
    assert frame_store.scan_slots(tmp_path / "nope") == []


def test_scan_slots_ignores_foreign_files(frames_dir: Path) -> None:
    """Anything that is not exactly <int>.webp must be invisible.

    This is what stops prune() from ever deleting a file it did not
    create — a README dropped in the archive, a leftover temp file, or a
    frame from some other tool.
    """
    seed(frames_dir, [1_754_050_200])
    (frames_dir / "README.txt").write_text("hands off")
    (frames_dir / "notaslot.webp").write_bytes(b"x")
    (frames_dir / "-17.webp").write_bytes(b"x")
    (frames_dir / "1754050800.webp.tmp").write_bytes(b"x")
    (frames_dir / "1754050900.jpg").write_bytes(b"x")

    assert frame_store.scan_slots(frames_dir) == [1_754_050_200]


# --- prune ----------------------------------------------------------------


def test_prune_keeps_exactly_the_retention_window(frames_dir: Path) -> None:
    slots = [1_754_050_200 + n * STEP for n in range(10)]
    seed(frames_dir, slots)

    cutoff = slots[4]
    removed = frame_store.prune(frames_dir, slots, cutoff)

    assert removed == slots[:4]
    assert frame_store.scan_slots(frames_dir) == slots[4:]


def test_prune_is_a_noop_on_empty_archive(frames_dir: Path) -> None:
    assert frame_store.prune(frames_dir, [], cutoff=1_754_050_200) == []


def test_prune_never_touches_foreign_files(frames_dir: Path) -> None:
    slots = [1_754_050_200, 1_754_050_800]
    seed(frames_dir, slots)
    keeper = frames_dir / "README.txt"
    keeper.write_text("hands off")

    frame_store.prune(frames_dir, slots, cutoff=1_754_060_000)

    assert frame_store.scan_slots(frames_dir) == []
    assert keeper.read_text() == "hands off"


def test_prune_tolerates_an_already_deleted_frame(frames_dir: Path) -> None:
    slots = [1_754_050_200, 1_754_050_800]
    seed(frames_dir, slots)
    frame_store.frame_path(frames_dir, slots[0]).unlink()

    assert frame_store.prune(frames_dir, slots, cutoff=1_754_060_000) == slots


# --- disk_usage / purge_all ----------------------------------------------


def test_disk_usage_counts_only_frames(frames_dir: Path) -> None:
    frame_store.write_frame(frames_dir, 1_754_050_200, b"1234567890")
    (frames_dir / "README.txt").write_text("ignored")

    assert frame_store.disk_usage(frames_dir) == 10


def test_disk_usage_on_missing_directory(tmp_path: Path) -> None:
    assert frame_store.disk_usage(tmp_path / "nope") == 0


def test_purge_all_removes_every_frame_but_spares_foreign_files(
    frames_dir: Path,
) -> None:
    seed(frames_dir, [1_754_050_200 + n * STEP for n in range(5)])
    keeper = frames_dir / "README.txt"
    keeper.write_text("hands off")

    assert frame_store.purge_all(frames_dir) == 5
    assert frame_store.scan_slots(frames_dir) == []
    assert keeper.exists()


def test_purge_all_on_empty_archive(frames_dir: Path) -> None:
    assert frame_store.purge_all(frames_dir) == 0


def test_scan_slots_handles_a_large_archive(frames_dir: Path) -> None:
    """2016 frames is the steady state at 10 min / 14 days."""
    slots = [1_754_050_200 + n * STEP for n in range(2016)]
    for slot in slots:
        os.close(
            os.open(frame_store.frame_path(frames_dir, slot), os.O_CREAT | os.O_WRONLY)
        )

    assert frame_store.scan_slots(frames_dir) == slots
