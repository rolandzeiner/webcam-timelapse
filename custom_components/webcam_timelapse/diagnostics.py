"""Diagnostics support for Webcam Timelapse.

**Principle of least disclosure.** Diagnostics dumps end up pasted into
public GitHub issues, so the rule is: surface the metadata a maintainer
needs to triage (config shape, last-refresh status, exception repr,
counts), but never the payload itself. Here that means two specific
omissions:

  * the frame bytes (`coordinator.live_frame`) — obviously
  * the absolute frames path, which contains the OS username

The image URL is deliberately *not* redacted: it is the single most
useful triage field, it is what the user typed, and a public webcam URL
is not a secret. Credentials for a camera behind basic auth are a
different matter and are redacted.
"""

from __future__ import annotations

from typing import Any

from homeassistant.components.diagnostics import async_redact_data
from homeassistant.core import HomeAssistant

from .coordinator import WebcamTimelapseConfigEntry

# Treat this set as monotonically growing — never shrink it. Includes
# forward-looking names that no field currently uses, so a future addition
# cannot leak silently.
TO_REDACT = {
    "password",
    "username",
    "api_key",
    "token",
    "headers",
    "Authorization",
    "Referer",
    "frames_path",
    "latitude",
    "longitude",
}


async def async_get_config_entry_diagnostics(
    hass: HomeAssistant, entry: WebcamTimelapseConfigEntry
) -> dict[str, Any]:
    """Return diagnostics for a config entry."""
    coordinator = entry.runtime_data
    data = coordinator.data or {}
    index = data.get("index") or {}

    return {
        "entry": {
            "title": entry.title,
            "version": entry.version,
            "data": async_redact_data(dict(entry.data), TO_REDACT),
            "options": async_redact_data(dict(entry.options), TO_REDACT),
        },
        "coordinator": {
            "last_update_success": coordinator.last_update_success,
            # repr() rather than str(): some aiohttp errors embed
            # response-body fragments in their str() form.
            "last_exception": repr(coordinator.last_exception),
            "update_interval": str(coordinator.update_interval),
            "paused": coordinator.paused,
            "step_seconds": coordinator.step,
            "retention_days": coordinator.retention_days,
            "max_width": coordinator.max_width,
            "quality": coordinator.quality,
        },
        "archive": {
            # Counts and shape, never contents. `gap_count` rather than the
            # gap list keeps this bounded no matter how badly a camera has
            # been behaving.
            "frame_count": data.get("frame_count"),
            "bytes_used": data.get("bytes_used"),
            "oldest_slot": data.get("oldest_slot"),
            "newest_slot": data.get("newest_slot"),
            "index_count": index.get("count"),
            "gap_count": len(index.get("gaps") or []),
            "online": data.get("online"),
            "frozen_ticks": data.get("frozen_ticks"),
            # Whether frames are being written at all, without disclosing
            # where on disk they live.
            "frames_dir_is_default": "frames_path" not in entry.data,
        },
    }
