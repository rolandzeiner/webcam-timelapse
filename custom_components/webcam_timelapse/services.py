"""Services for Webcam Timelapse."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

import voluptuous as vol
from homeassistant.core import (
    HomeAssistant,
    ServiceCall,
    ServiceResponse,
    SupportsResponse,
    callback,
)
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import config_validation as cv

from .const import DOMAIN

if TYPE_CHECKING:
    from .coordinator import WebcamTimelapseCoordinator

_LOGGER = logging.getLogger(__name__)

SERVICE_CAPTURE_NOW = "capture_now"
SERVICE_PURGE_FRAMES = "purge_frames"
SERVICE_PAUSE_CAPTURE = "pause_capture"
SERVICE_RESUME_CAPTURE = "resume_capture"

ATTR_ENTRY_ID = "entry_id"

_ENTRY_SCHEMA = vol.Schema({vol.Required(ATTR_ENTRY_ID): cv.string})


@callback
def _resolve(call: ServiceCall) -> WebcamTimelapseCoordinator:
    """Return the coordinator for the requested entry, or raise."""
    entry_id: str = call.data[ATTR_ENTRY_ID]
    entry = call.hass.config_entries.async_get_entry(entry_id)
    if entry is None or entry.domain != DOMAIN:
        raise ServiceValidationError(
            translation_domain=DOMAIN,
            translation_key="unknown_entry",
            translation_placeholders={"entry_id": entry_id},
        )
    coordinator: WebcamTimelapseCoordinator | None = getattr(
        entry, "runtime_data", None
    )
    if coordinator is None:
        raise ServiceValidationError(
            translation_domain=DOMAIN,
            translation_key="entry_not_loaded",
            translation_placeholders={"entry_id": entry_id},
        )
    return coordinator


async def _async_capture_now(call: ServiceCall) -> ServiceResponse:
    """Capture one frame immediately, snapped to the nearest grid slot."""
    coordinator = _resolve(call)
    try:
        slot = await coordinator.async_capture_now()
    except FileExistsError as err:
        # Refusing beats overwriting: a frame that already exists can never
        # be re-fetched from the camera, so a user experimenting with this
        # service must not be able to silently destroy history.
        raise ServiceValidationError(
            translation_domain=DOMAIN,
            translation_key="slot_occupied",
            translation_placeholders={"slot": str(err)},
        ) from err
    return {"slot": slot}


async def _async_purge_frames(call: ServiceCall) -> ServiceResponse:
    """Delete every archived frame for one entry."""
    removed = await _resolve(call).async_purge_frames()
    return {"removed": removed}


async def _async_pause_capture(call: ServiceCall) -> None:
    """Stop capturing until resumed."""
    _resolve(call).async_set_paused(True)


async def _async_resume_capture(call: ServiceCall) -> None:
    """Resume capturing."""
    _resolve(call).async_set_paused(False)


@callback
def async_setup_services(hass: HomeAssistant) -> None:
    """Register the integration's services.

    Sync despite the `async_` prefix — `hass.services.async_register` is
    itself sync (the prefix means "safe to call from the event loop", not
    "awaitable"), which is exactly what `@callback` documents here.
    """
    hass.services.async_register(
        DOMAIN,
        SERVICE_CAPTURE_NOW,
        _async_capture_now,
        schema=_ENTRY_SCHEMA,
        supports_response=SupportsResponse.OPTIONAL,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_PURGE_FRAMES,
        _async_purge_frames,
        schema=_ENTRY_SCHEMA,
        supports_response=SupportsResponse.OPTIONAL,
    )
    hass.services.async_register(
        DOMAIN, SERVICE_PAUSE_CAPTURE, _async_pause_capture, schema=_ENTRY_SCHEMA
    )
    hass.services.async_register(
        DOMAIN, SERVICE_RESUME_CAPTURE, _async_resume_capture, schema=_ENTRY_SCHEMA
    )
