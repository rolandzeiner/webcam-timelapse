"""Overlay history, against a real recorder.

Everything else stands in for the recorder. This file does not, because
the two recorder functions the export calls — the state history and the
long-term statistics — are exactly the kind of interface that shifts
between Home Assistant releases, and a stand-in would go on passing.
"""

from __future__ import annotations

import datetime as dt
from collections.abc import Generator
from typing import Any

import pytest
from freezegun.api import FrozenDateTimeFactory
from homeassistant.components.recorder import Recorder
from homeassistant.components.recorder.statistics import async_import_statistics
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.components.recorder.common import (
    async_wait_recording_done,
)

from custom_components.webcam_timelapse import export


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(
    recorder_mock: Recorder, enable_custom_integrations: None
) -> Generator[None]:
    """Bring the recorder up before ``hass``, for this module only.

    Shadows the fixture of the same name in conftest.py. The recorder has
    to be the first thing set up — it refuses to start once ``hass``
    exists — and conftest's autouse fixture would otherwise create
    ``hass`` before any test here could ask for the recorder.
    """
    yield


BASE = dt.datetime(2026, 8, 1, 12, 0, 0, tzinfo=dt.UTC)


async def record(
    hass: HomeAssistant,
    freezer: FrozenDateTimeFactory,
    entity_id: str,
    readings: list[tuple[int, str]],
    **attributes: Any,
) -> None:
    """Write states at ``BASE + minutes`` and wait for the recorder."""
    for minutes, state in readings:
        freezer.move_to(BASE + dt.timedelta(minutes=minutes))
        hass.states.async_set(entity_id, state, attributes)
        await hass.async_block_till_done()
    await async_wait_recording_done(hass)


async def test_history_returns_the_recorded_numbers_in_order(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory
) -> None:
    await record(
        hass,
        freezer,
        "sensor.co2",
        [(0, "600"), (10, "unavailable"), (20, "640"), (30, "unknown"), (40, "700.5")],
    )

    history = await export.async_load_history(
        hass,
        ["sensor.co2", "sensor.never_recorded"],
        BASE - dt.timedelta(minutes=5),
        BASE + dt.timedelta(hours=1),
        {},
    )

    points = history["sensor.co2"]
    # unavailable and unknown are dropped, never plotted as zero.
    assert [point.value for point in points] == [600.0, 640.0, 700.5]
    assert [point.at for point in points] == [
        (BASE + dt.timedelta(minutes=minutes)).timestamp() for minutes in (0, 20, 40)
    ]
    assert history["sensor.never_recorded"] == []


async def test_history_includes_the_reading_standing_when_the_window_opens(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory
) -> None:
    """Or the first frames of an export would show a dash for a steady gauge."""
    await record(hass, freezer, "sensor.level", [(0, "12"), (120, "13")])

    history = await export.async_load_history(
        hass,
        ["sensor.level"],
        BASE + dt.timedelta(minutes=60),
        BASE + dt.timedelta(minutes=90),
        {},
    )

    points = history["sensor.level"]
    assert [point.value for point in points] == [12.0]
    assert points[0].at <= (BASE + dt.timedelta(minutes=60)).timestamp()


async def test_history_can_take_its_time_from_an_attribute(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory
) -> None:
    """A feed that publishes late carries the real measurement time itself."""
    measured = BASE - dt.timedelta(minutes=10)
    await record(
        hass, freezer, "sensor.gauge", [(0, "1.5")], timestamp=measured.isoformat()
    )

    with_attribute = await export.async_load_history(
        hass,
        ["sensor.gauge"],
        BASE - dt.timedelta(hours=1),
        BASE + dt.timedelta(hours=1),
        {"sensor.gauge": "timestamp"},
    )
    without = await export.async_load_history(
        hass,
        ["sensor.gauge"],
        BASE - dt.timedelta(hours=1),
        BASE + dt.timedelta(hours=1),
        {},
    )

    assert with_attribute["sensor.gauge"][0].at == measured.timestamp()
    assert without["sensor.gauge"][0].at == BASE.timestamp()


async def test_history_older_than_the_recorder_keeps_comes_from_statistics(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory
) -> None:
    """Detailed history is purged after ten days; an archive can keep a year."""
    # With its unit, as a real sensor has: statistics come back converted to
    # the unit the entity currently reports in, and a unitless state would
    # turn 510 ppm into 0.00051.
    await record(
        hass,
        freezer,
        "sensor.co2",
        [(0, "600"), (30, "640")],
        unit_of_measurement="ppm",
    )
    # What the recorder would have left behind for the days before that:
    # hourly means, and nothing finer.
    hours = [BASE - dt.timedelta(hours=offset) for offset in (5, 4, 3, 2, 1)]
    async_import_statistics(
        hass,
        {
            "source": "recorder",
            "statistic_id": "sensor.co2",
            "name": None,
            "has_sum": False,
            "mean_type": 1,
            "unit_class": None,
            "unit_of_measurement": "ppm",
        },
        [
            {"start": hour, "mean": 500.0 + index * 10}
            for index, hour in enumerate(hours)
        ],
    )
    await async_wait_recording_done(hass)

    history = await export.async_load_history(
        hass,
        ["sensor.co2"],
        BASE - dt.timedelta(hours=4),
        BASE + dt.timedelta(hours=1),
        {},
    )

    points = history["sensor.co2"]
    assert [point.value for point in points] == [
        510.0,
        520.0,
        530.0,
        540.0,
        600.0,
        640.0,
    ]
    # Each hourly mean sits at the middle of its hour...
    assert points[0].at == (BASE - dt.timedelta(hours=3, minutes=30)).timestamp()
    # ...and the series is in order across the seam.
    assert [point.at for point in points] == sorted(point.at for point in points)


async def test_statistics_never_override_detailed_history(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory
) -> None:
    await record(
        hass,
        freezer,
        "sensor.co2",
        [(-180, "600"), (0, "640")],
        unit_of_measurement="ppm",
    )
    async_import_statistics(
        hass,
        {
            "source": "recorder",
            "statistic_id": "sensor.co2",
            "name": None,
            "has_sum": False,
            "mean_type": 1,
            "unit_class": None,
            "unit_of_measurement": "ppm",
        },
        [{"start": BASE - dt.timedelta(hours=1), "mean": 999.0}],
    )
    await async_wait_recording_done(hass)

    history = await export.async_load_history(
        hass,
        ["sensor.co2"],
        BASE - dt.timedelta(hours=2),
        BASE + dt.timedelta(hours=1),
        {},
    )

    assert [point.value for point in history["sensor.co2"]] == [600.0, 640.0]
