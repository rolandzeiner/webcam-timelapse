"""Webcam Timelapse integration."""

from __future__ import annotations

import logging
import shutil
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from homeassistant.const import EVENT_HOMEASSISTANT_STARTED, Platform
from homeassistant.core import CoreState, Event, HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers import device_registry as dr

from .card_registration import JSModuleRegistration, async_register_frames_path
from .const import DOMAIN, INTEGRATION_VERSION, STORAGE_SUBDIR
from .coordinator import WebcamTimelapseConfigEntry, WebcamTimelapseCoordinator
from .services import async_setup_services
from .websocket import async_register_websocket_commands

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

_LOGGER = logging.getLogger(__name__)

PLATFORMS: list[Platform] = [
    Platform.BINARY_SENSOR,
    Platform.CAMERA,
    Platform.SENSOR,
]


def frames_root(hass: HomeAssistant) -> Path:
    """Parent directory holding every entry's frame archive."""
    return Path(hass.config.path(STORAGE_SUBDIR))


async def async_setup(hass: HomeAssistant, config: dict[str, Any]) -> bool:
    """Set up the Webcam Timelapse component."""
    hass.data.setdefault(DOMAIN, {})

    async_register_websocket_commands(hass)
    async_setup_services(hass)

    # Both static mounts are process-wide and registered exactly once.
    # Registering per entry would re-push a `?v=` resource to every open
    # browser session on each reload, which users experience as an
    # infinite reload loop.
    await async_register_frames_path(hass, frames_root(hass))

    registration = JSModuleRegistration(hass)

    async def _register_card(_event: Event | None = None) -> None:
        await registration.async_register()

    if hass.state == CoreState.running:
        await _register_card()
    else:
        hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, _register_card)

    return True


async def async_setup_entry(
    hass: HomeAssistant, entry: WebcamTimelapseConfigEntry
) -> bool:
    """Set up Webcam Timelapse from a config entry."""
    coordinator = WebcamTimelapseCoordinator(hass, entry)
    # Invokes coordinator._async_setup() (mkdir + arm the capture grid)
    # before the first fetch, and raises ConfigEntryNotReady on failure.
    await coordinator.async_config_entry_first_refresh()

    # Registered only after first_refresh succeeded, so teardown never
    # runs against a half-initialised coordinator.
    entry.async_on_unload(coordinator.async_teardown)

    entry.runtime_data = coordinator

    # Register the device explicitly so the Devices panel shows the camera
    # before any entity has reported state.
    parsed = urlparse(coordinator.image_url)
    dr.async_get(hass).async_get_or_create(
        config_entry_id=entry.entry_id,
        identifiers={(DOMAIN, entry.entry_id)},
        name=entry.title,
        manufacturer="Webcam Timelapse",
        model="Still-image camera",
        sw_version=INTEGRATION_VERSION,
        configuration_url=f"{parsed.scheme}://{parsed.netloc}"
        if parsed.netloc
        else None,
    )

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    # Single reload owner: this listener reloads on ANY update — options
    # changes AND the data writes from reconfigure/reauth. The config flow
    # therefore uses async_update_and_abort (not the *_reload_* variant)
    # plus _abort_if_unique_id_configured(reload_on_update=False), because
    # pairing this listener with a reloading config-flow method is
    # deprecated in HA 2026.6 and a hard error in 2026.12.
    entry.async_on_unload(entry.add_update_listener(_async_reload_entry))
    return True


async def _async_reload_entry(
    hass: HomeAssistant, entry: WebcamTimelapseConfigEntry
) -> None:
    """Reload the entry on any update. The SOLE reload owner."""
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(
    hass: HomeAssistant, entry: WebcamTimelapseConfigEntry
) -> bool:
    """Unload a config entry."""
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)


async def async_remove_entry(
    hass: HomeAssistant, entry: WebcamTimelapseConfigEntry
) -> None:
    """Delete this entry's frames, and the card resource on the last entry."""
    entry_frames = frames_root(hass) / entry.entry_id
    await hass.async_add_executor_job(
        lambda: shutil.rmtree(entry_frames, ignore_errors=True)
    )

    remaining = [
        other
        for other in hass.config_entries.async_entries(DOMAIN)
        if other.entry_id != entry.entry_id
    ]
    if remaining:
        # The Lovelace resource is registered once for the integration, so
        # a surviving sibling entry still needs the card. Note this hook is
        # async_remove_entry, not async_unload_entry — the latter would
        # tear the resource down on every reload.
        return

    await JSModuleRegistration(hass).async_unregister()
