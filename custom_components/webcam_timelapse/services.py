"""Services for Webcam Timelapse."""

from __future__ import annotations

import logging
from datetime import datetime
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
from homeassistant.util import dt as dt_util

from .const import DOMAIN
from .export import EXPORT_FIELDS, ExportError, ExportOptions, async_get_exporter

if TYPE_CHECKING:
    from .coordinator import WebcamTimelapseCoordinator

_LOGGER = logging.getLogger(__name__)

SERVICE_CAPTURE_NOW = "capture_now"
SERVICE_PURGE_FRAMES = "purge_frames"
SERVICE_PAUSE_CAPTURE = "pause_capture"
SERVICE_RESUME_CAPTURE = "resume_capture"
SERVICE_EXPORT_VIDEO = "export_video"

ATTR_ENTRY_ID = "entry_id"
ATTR_START = "start"
ATTR_END = "end"

_ENTRY_SCHEMA = vol.Schema({vol.Required(ATTR_ENTRY_ID): cv.string})

_EXPORT_SCHEMA = _ENTRY_SCHEMA.extend(
    {
        vol.Optional(ATTR_START): cv.datetime,
        vol.Optional(ATTR_END): cv.datetime,
        **EXPORT_FIELDS,
    }
)

# Export failures that are the caller's to fix rather than a fault. Raised
# as ServiceValidationError, which Home Assistant shows to the user without
# logging a traceback for it.
_EXPORT_USER_ERRORS = frozenset(
    {"export_running", "export_no_frames", "export_bad_range", "export_cancelled"}
)


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


def _epoch(moment: datetime | None) -> float | None:
    """A service-call datetime as epoch seconds; naive means local time."""
    return None if moment is None else dt_util.as_utc(moment).timestamp()


async def _async_export_video(call: ServiceCall) -> ServiceResponse:
    """Render a stretch of the archive to an MP4 in the media folder.

    Returns only once the video is written, which can be minutes. That is
    what lets an automation use the file in its next step.
    """
    coordinator = _resolve(call)
    options = ExportOptions.from_request(
        call.data, _epoch(call.data.get(ATTR_START)), _epoch(call.data.get(ATTR_END))
    )
    try:
        return await async_get_exporter(
            call.hass, coordinator.config_entry
        ).async_export(options)
    except ExportError as err:
        if err.translation_key not in _EXPORT_USER_ERRORS:
            raise
        raise ServiceValidationError(
            translation_domain=DOMAIN,
            translation_key=err.translation_key,
            translation_placeholders=err.translation_placeholders,
        ) from err


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
    hass.services.async_register(
        DOMAIN,
        SERVICE_EXPORT_VIDEO,
        _async_export_video,
        schema=_EXPORT_SCHEMA,
        supports_response=SupportsResponse.OPTIONAL,
    )
