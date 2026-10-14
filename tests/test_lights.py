"""Capture lights: on for the fetch, back off after, and nobody's lamp stolen."""

from __future__ import annotations

import asyncio
import datetime as dt
from collections.abc import Callable
from typing import Any
from unittest.mock import AsyncMock, patch

import pytest
from homeassistant.const import (
    ATTR_ENTITY_ID,
    STATE_OFF,
    STATE_ON,
    STATE_UNAVAILABLE,
)
from homeassistant.core import Context, HomeAssistant, ServiceCall
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.update_coordinator import UpdateFailed

from custom_components.webcam_timelapse.const import (
    CONF_CAPTURE_LIGHTS,
    CONF_LIGHT_SETTLE,
    CONF_LIGHTS_MODE,
    CONF_LIGHTS_NIGHT_ONLY,
    CONF_LIGHTS_WINDOW_END,
    CONF_LIGHTS_WINDOW_START,
)
from custom_components.webcam_timelapse.coordinator import WebcamTimelapseCoordinator
from custom_components.webcam_timelapse.lights import (
    in_window,
    lights_mode,
    lights_window,
)

from .conftest import fresh_result, make_entry, setup_entry

GROW = "light.grow"
PLUG = "switch.lamp_plug"


def install_lights(
    hass: HomeAssistant, states: dict[str, str]
) -> list[tuple[str, str, list[str]]]:
    """Fake light and switch services that move state like real entities.

    Returns the log of calls as ``(domain, service, entity_ids)``. State is
    written with the call's own context, which is what a real entity does
    and what the "who touched this light" logic reads.
    """
    log: list[tuple[str, str, list[str]]] = []

    async def _handle(call: ServiceCall) -> None:
        ids = list(call.data[ATTR_ENTITY_ID])
        log.append((call.domain, call.service, ids))
        new_state = STATE_ON if call.service == "turn_on" else STATE_OFF
        for entity_id in ids:
            hass.states.async_set(entity_id, new_state, context=call.context)

    for entity_id, state in states.items():
        hass.states.async_set(entity_id, state)
    for domain in ("light", "switch"):
        for service in ("turn_on", "turn_off"):
            hass.services.async_register(domain, service, _handle)
    return log


async def lit_coordinator(
    hass: HomeAssistant, **overrides: Any
) -> WebcamTimelapseCoordinator:
    """A set-up entry with capture lights and no settle delay."""
    config = {CONF_CAPTURE_LIGHTS: [GROW], CONF_LIGHT_SETTLE: 0, **overrides}
    entry = make_entry(**config)
    assert await setup_entry(hass, entry)
    coordinator: WebcamTimelapseCoordinator = entry.runtime_data
    return coordinator


def during_fetch(mock_fetch: AsyncMock, action: Callable[[], None]) -> None:
    """Run ``action`` at the moment the frame is being fetched."""

    async def _fetch(*_args: Any, **_kwargs: Any) -> Any:
        action()
        return fresh_result()

    mock_fetch.side_effect = _fetch


# --- the basic cycle ------------------------------------------------------


async def test_lights_are_on_for_the_fetch_and_off_after(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    log = install_lights(hass, {GROW: STATE_OFF, PLUG: STATE_OFF})
    coordinator = await lit_coordinator(hass, **{CONF_CAPTURE_LIGHTS: [GROW, PLUG]})

    seen: dict[str, str] = {}
    during_fetch(
        mock_fetch,
        lambda: seen.update({e: hass.states.get(e).state for e in (GROW, PLUG)}),
    )

    await coordinator.async_capture_now()

    assert seen == {GROW: STATE_ON, PLUG: STATE_ON}
    assert hass.states.get(GROW).state == STATE_OFF
    assert hass.states.get(PLUG).state == STATE_OFF
    # One call per domain each way — a light and a plug cannot share one.
    assert log == [
        ("light", "turn_on", [GROW]),
        ("switch", "turn_on", [PLUG]),
        ("light", "turn_off", [GROW]),
        ("switch", "turn_off", [PLUG]),
    ]
    assert coordinator.data["frame_count"] == 1


async def test_no_lights_configured_switches_nothing(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    log = install_lights(hass, {GROW: STATE_OFF})
    coordinator = await lit_coordinator(hass, **{CONF_CAPTURE_LIGHTS: []})

    await coordinator.async_capture_now()

    assert log == []
    assert coordinator.data["frame_count"] == 1


async def test_a_light_that_is_already_on_is_left_alone(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    """Not ours to switch off: we never switched it on."""
    log = install_lights(hass, {GROW: STATE_ON, PLUG: STATE_OFF})
    coordinator = await lit_coordinator(hass, **{CONF_CAPTURE_LIGHTS: [GROW, PLUG]})

    await coordinator.async_capture_now()

    assert log == [("switch", "turn_on", [PLUG]), ("switch", "turn_off", [PLUG])]
    assert hass.states.get(GROW).state == STATE_ON


@pytest.mark.parametrize("state", [STATE_UNAVAILABLE, None])
async def test_an_unreachable_light_is_skipped_and_the_frame_still_taken(
    hass: HomeAssistant, mock_fetch: AsyncMock, state: str | None
) -> None:
    log = install_lights(hass, {} if state is None else {GROW: state})
    coordinator = await lit_coordinator(hass)

    await coordinator.async_capture_now()

    assert log == []
    assert coordinator.data["frame_count"] == 1


async def test_the_settle_delay_sits_between_switching_on_and_fetching(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    install_lights(hass, {GROW: STATE_OFF})
    coordinator = await lit_coordinator(hass, **{CONF_LIGHT_SETTLE: 2.5})

    order: list[str] = []
    real_sleep = asyncio.sleep

    async def _sleep(seconds: float) -> None:
        order.append(f"sleep {seconds} with light {hass.states.get(GROW).state}")
        await real_sleep(0)

    during_fetch(mock_fetch, lambda: order.append("fetch"))
    with patch("custom_components.webcam_timelapse.lights.asyncio.sleep", _sleep):
        await coordinator.async_capture_now()

    assert order == ["sleep 2.5 with light on", "fetch"]


async def test_the_live_view_refresh_never_switches_a_light(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    """At a 30-second refresh that would turn the room into a strobe."""
    log = install_lights(hass, {GROW: STATE_OFF})
    coordinator = await lit_coordinator(hass)

    await coordinator.async_refresh_live_frame()

    assert mock_fetch.call_count == 1
    assert log == []


# --- only at night --------------------------------------------------------


@pytest.mark.parametrize(
    ("sun_is_up", "expected_calls"),
    [
        (True, []),
        (False, [("light", "turn_on", [GROW]), ("light", "turn_off", [GROW])]),
    ],
)
async def test_night_mode_follows_the_sun(
    hass: HomeAssistant,
    mock_fetch: AsyncMock,
    sun_is_up: bool,
    expected_calls: list[tuple[str, str, list[str]]],
) -> None:
    log = install_lights(hass, {GROW: STATE_OFF})
    coordinator = await lit_coordinator(hass, **{CONF_LIGHTS_MODE: "night"})

    with patch(
        "custom_components.webcam_timelapse.lights.is_up", return_value=sun_is_up
    ):
        await coordinator.async_capture_now()

    assert log == expected_calls
    # Daylight or not, the frame is taken.
    assert coordinator.data["frame_count"] == 1


async def test_at_every_capture_the_sun_is_never_consulted(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    log = install_lights(hass, {GROW: STATE_OFF})
    coordinator = await lit_coordinator(hass)

    with patch("custom_components.webcam_timelapse.lights.is_up") as sun:
        await coordinator.async_capture_now()

    sun.assert_not_called()
    assert len(log) == 2


async def test_night_mode_lights_the_frame_when_the_sun_cannot_be_placed(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    log = install_lights(hass, {GROW: STATE_OFF})
    coordinator = await lit_coordinator(hass, **{CONF_LIGHTS_MODE: "night"})

    with patch(
        "custom_components.webcam_timelapse.lights.is_up",
        side_effect=ValueError("no sunrise at this latitude"),
    ):
        await coordinator.async_capture_now()

    assert [call[1] for call in log] == ["turn_on", "turn_off"]


async def test_night_mode_uses_the_real_sun_for_the_home_location(
    hass: HomeAssistant, mock_fetch: AsyncMock, freezer: Any
) -> None:
    """Unpatched: local noon is day and local midnight is night."""
    hass.config.latitude = 48.2
    hass.config.longitude = 16.4
    log = install_lights(hass, {GROW: STATE_OFF})
    coordinator = await lit_coordinator(hass, **{CONF_LIGHTS_MODE: "night"})

    freezer.move_to("2026-06-21 11:00:00+00:00")  # early afternoon in Vienna
    await coordinator.async_capture_now()
    assert log == []

    freezer.move_to("2026-06-21 23:00:00+00:00")  # 01:00 local
    await coordinator.async_capture_now()
    assert [call[1] for call in log] == ["turn_on", "turn_off"]


async def test_an_entry_from_before_the_mode_keeps_its_night_setting(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    """Saved with the old night-only switch: still night, not every capture."""
    install_lights(hass, {GROW: STATE_OFF})
    coordinator = await lit_coordinator(hass, **{CONF_LIGHTS_NIGHT_ONLY: True})

    assert coordinator.capture_lights.mode == "night"


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ({}, "always"),
        ({CONF_LIGHTS_NIGHT_ONLY: False}, "always"),
        ({CONF_LIGHTS_NIGHT_ONLY: True}, "night"),
        ({CONF_LIGHTS_MODE: "window", CONF_LIGHTS_NIGHT_ONLY: True}, "window"),
        ({CONF_LIGHTS_MODE: "bogus"}, "always"),
    ],
)
def test_lights_mode_from_stored_settings(raw: dict[str, Any], expected: str) -> None:
    assert lights_mode(raw) == expected


def test_lights_window_from_stored_settings() -> None:
    assert lights_window(
        {CONF_LIGHTS_WINDOW_START: "21:30:00", CONF_LIGHTS_WINDOW_END: "05:15"}
    ) == (dt.time(21, 30), dt.time(5, 15))
    # Missing or unreadable falls back to the defaults, not to an error.
    assert lights_window({CONF_LIGHTS_WINDOW_START: "late"}) == (
        dt.time(20, 0),
        dt.time(6, 0),
    )


@pytest.mark.parametrize(
    ("moment", "start", "end", "inside"),
    [
        # Across midnight.
        ("23:00", "20:00", "06:00", True),
        ("20:00", "20:00", "06:00", True),
        ("05:59", "20:00", "06:00", True),
        ("06:00", "20:00", "06:00", False),
        ("12:00", "20:00", "06:00", False),
        ("19:59", "20:00", "06:00", False),
        # Within one day.
        ("08:00", "08:00", "10:00", True),
        ("09:30", "08:00", "10:00", True),
        ("10:00", "08:00", "10:00", False),
        ("07:59", "08:00", "10:00", False),
        # Start equals end: refused in the form; read as the whole day.
        ("03:00", "08:00", "08:00", True),
    ],
)
def test_in_window(moment: str, start: str, end: str, inside: bool) -> None:
    clock = dt.time.fromisoformat
    assert in_window(clock(moment), clock(start), clock(end)) is inside


@pytest.mark.parametrize(
    ("local_time", "lit"),
    [("23:30", True), ("05:00", True), ("12:00", False), ("19:00", False)],
)
async def test_window_mode_follows_the_home_clock(
    hass: HomeAssistant, mock_fetch: AsyncMock, freezer: Any, local_time: str, lit: bool
) -> None:
    await hass.config.async_set_time_zone("Europe/Vienna")
    log = install_lights(hass, {GROW: STATE_OFF})
    coordinator = await lit_coordinator(
        hass,
        **{
            CONF_LIGHTS_MODE: "window",
            CONF_LIGHTS_WINDOW_START: "20:00:00",
            CONF_LIGHTS_WINDOW_END: "06:00:00",
        },
    )

    # In Home Assistant's time zone, not UTC: the window was typed against
    # the clock the user sees.
    freezer.move_to(f"2026-10-14 {local_time}:00+02:00")
    with patch("custom_components.webcam_timelapse.lights.is_up") as sun:
        await coordinator.async_capture_now()

    sun.assert_not_called()
    assert bool(log) is lit
    assert coordinator.data["frame_count"] == 1


# --- failures -------------------------------------------------------------


async def test_a_failed_fetch_still_switches_the_lights_off(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    log = install_lights(hass, {GROW: STATE_OFF})
    coordinator = await lit_coordinator(hass)
    mock_fetch.side_effect = UpdateFailed("camera exploded")

    with pytest.raises(UpdateFailed):
        await coordinator.async_capture_now()

    assert log == [("light", "turn_on", [GROW]), ("light", "turn_off", [GROW])]
    assert hass.states.get(GROW).state == STATE_OFF


async def test_a_light_that_will_not_switch_does_not_cost_the_frame(
    hass: HomeAssistant, mock_fetch: AsyncMock, caplog: pytest.LogCaptureFixture
) -> None:
    hass.states.async_set(GROW, STATE_OFF)

    async def _broken(call: ServiceCall) -> None:
        raise HomeAssistantError("bulb did not answer")

    hass.services.async_register("light", "turn_on", _broken)
    coordinator = await lit_coordinator(hass)

    await coordinator.async_capture_now()

    assert coordinator.data["frame_count"] == 1
    assert "light.turn_on failed for light.grow: bulb did not answer" in caplog.text


async def test_a_missing_light_service_does_not_cost_the_frame(
    hass: HomeAssistant, mock_fetch: AsyncMock, caplog: pytest.LogCaptureFixture
) -> None:
    """The light integration is not loaded at all: ServiceNotFound."""
    hass.states.async_set(GROW, STATE_OFF)
    coordinator = await lit_coordinator(hass)

    await coordinator.async_capture_now()

    assert coordinator.data["frame_count"] == 1
    assert "light.turn_on failed for light.grow" in caplog.text


async def test_a_hung_light_is_abandoned_after_the_timeout(
    hass: HomeAssistant, mock_fetch: AsyncMock, caplog: pytest.LogCaptureFixture
) -> None:
    hass.states.async_set(GROW, STATE_OFF)
    release = asyncio.Event()

    async def _hang(call: ServiceCall) -> None:
        await release.wait()

    hass.services.async_register("light", "turn_on", _hang)
    coordinator = await lit_coordinator(hass)

    with patch(
        "custom_components.webcam_timelapse.lights._SWITCH_TIMEOUT_SECONDS", 0.01
    ):
        await coordinator.async_capture_now()
    release.set()

    assert coordinator.data["frame_count"] == 1
    assert "light.turn_on failed for light.grow: TimeoutError" in caplog.text


# --- other people's lights ------------------------------------------------


async def test_a_light_a_person_touched_stays_on(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    """Someone walked in and used the switch while we held the light."""
    log = install_lights(hass, {GROW: STATE_OFF})
    coordinator = await lit_coordinator(hass)
    during_fetch(
        mock_fetch,
        lambda: hass.states.async_set(
            GROW, STATE_ON, {"brightness": 255}, context=Context(user_id="a-person")
        ),
    )

    await coordinator.async_capture_now()

    assert log == [("light", "turn_on", [GROW])]
    assert hass.states.get(GROW).state == STATE_ON


async def test_a_light_an_automation_touched_stays_on(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    """A motion light firing mid-capture must not be switched off again."""
    log = install_lights(hass, {GROW: STATE_OFF})
    coordinator = await lit_coordinator(hass)
    during_fetch(
        mock_fetch,
        lambda: hass.states.async_set(
            GROW,
            STATE_ON,
            {"brightness": 255},
            context=Context(parent_id="motion-sensor-event"),
        ),
    )

    await coordinator.async_capture_now()

    assert log == [("light", "turn_on", [GROW])]


async def test_a_claim_survives_a_later_report_from_the_device(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    """The claim is remembered, not re-read from whatever wrote state last."""
    log = install_lights(hass, {GROW: STATE_OFF})
    coordinator = await lit_coordinator(hass)

    def _person_then_device() -> None:
        hass.states.async_set(
            GROW, STATE_ON, {"brightness": 255}, context=Context(user_id="a-person")
        )
        hass.states.async_set(GROW, STATE_ON, {"brightness": 254})

    during_fetch(mock_fetch, _person_then_device)

    await coordinator.async_capture_now()

    assert log == [("light", "turn_on", [GROW])]


async def test_a_device_report_does_not_claim_the_light(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    """A bulb confirming its brightness is not somebody choosing to light it."""
    log = install_lights(hass, {GROW: STATE_OFF})
    coordinator = await lit_coordinator(hass)
    during_fetch(
        mock_fetch,
        lambda: hass.states.async_set(GROW, STATE_ON, {"brightness": 254}),
    )

    await coordinator.async_capture_now()

    assert log == [("light", "turn_on", [GROW]), ("light", "turn_off", [GROW])]


async def test_a_reaction_to_our_own_call_does_not_claim_the_light(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    """Adaptive Lighting re-issues turn_on parented on the call it adapts.

    Reading that as "somebody else wants this on" would leave every
    capture light burning all night on any install that runs it.
    """
    hass.states.async_set(GROW, STATE_OFF)
    ours: list[Context] = []
    log: list[str] = []

    async def _handle(call: ServiceCall) -> None:
        log.append(call.service)
        if call.service == "turn_on":
            ours.append(call.context)
        hass.states.async_set(
            GROW,
            STATE_ON if call.service == "turn_on" else STATE_OFF,
            context=call.context,
        )

    hass.services.async_register("light", "turn_on", _handle)
    hass.services.async_register("light", "turn_off", _handle)
    coordinator = await lit_coordinator(hass)
    during_fetch(
        mock_fetch,
        lambda: hass.states.async_set(
            GROW,
            STATE_ON,
            {"brightness": 128},
            context=Context(parent_id=ours[0].id),
        ),
    )

    await coordinator.async_capture_now()

    assert log == ["turn_on", "turn_off"]
    assert hass.states.get(GROW).state == STATE_OFF


async def test_a_light_someone_switched_off_is_not_switched_off_again(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    log = install_lights(hass, {GROW: STATE_OFF})
    coordinator = await lit_coordinator(hass)
    during_fetch(
        mock_fetch,
        lambda: hass.states.async_set(
            GROW, STATE_OFF, context=Context(user_id="a-person")
        ),
    )

    await coordinator.async_capture_now()

    assert log == [("light", "turn_on", [GROW])]
    assert hass.states.get(GROW).state == STATE_OFF


async def test_only_the_claimed_light_is_kept_on(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    log = install_lights(hass, {GROW: STATE_OFF, "light.bench": STATE_OFF})
    coordinator = await lit_coordinator(
        hass, **{CONF_CAPTURE_LIGHTS: [GROW, "light.bench"]}
    )
    during_fetch(
        mock_fetch,
        lambda: hass.states.async_set(
            GROW, STATE_ON, {"brightness": 255}, context=Context(user_id="a-person")
        ),
    )

    await coordinator.async_capture_now()

    assert log[-1] == ("light", "turn_off", ["light.bench"])
    assert hass.states.get(GROW).state == STATE_ON
    assert hass.states.get("light.bench").state == STATE_OFF
