"""WebSocket API: the frame index and the card-version probe.

The index is delivered over WebSocket rather than as an `index.json`
written next to the frames, for three reasons: it is auth-gated, it is
always derived from live coordinator state so it cannot go stale relative
to the directory, and it costs no extra disk write per capture tick.

Putting it on a sensor attribute was never an option — 2016 entries blows
straight past the recorder's attribute budget and would be written to the
database every tick.
"""

from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.components.websocket_api import async_register_command
from homeassistant.components.websocket_api.connection import ActiveConnection
from homeassistant.components.websocket_api.decorators import (
    async_response,
    websocket_command,
)
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import entity_registry as er

from .const import CARD_VERSION, DOMAIN, FRAME_EXTENSION, FRAMES_URL_BASE

WS_TYPE_INDEX = f"{DOMAIN}/index"
WS_TYPE_CARD_VERSION = f"{DOMAIN}/card_version"


@callback
def async_register_websocket_commands(hass: HomeAssistant) -> None:
    """Register this integration's WebSocket commands.

    Called once per HA start from async_setup. Note that HA exposes no
    public deregister hook, so these handlers outlive integration removal
    — pragmatic given the API surface, and harmless in practice (a stray
    handler nobody calls once the bundle is gone). Do not "fix" this by
    moving registration into async_setup_entry: that would re-register on
    every reload.
    """
    async_register_command(hass, websocket_index)
    async_register_command(hass, websocket_card_version)


@websocket_command(
    {
        vol.Required("type"): WS_TYPE_INDEX,
        # Either identifier works. The card holds a camera entity_id and
        # cannot turn it into an entry_id on its own: the frontend's
        # `hass.entities` is the *display* registry, which carries
        # `platform` but not `config_entry_id`. Resolving it here uses the
        # real entity registry, and avoids publishing a constant onto the
        # camera's state where the recorder would store it on every write.
        vol.Exclusive("entry_id", "target"): str,
        vol.Exclusive("entity_id", "target"): str,
    }
)
@async_response
async def websocket_index(
    hass: HomeAssistant,
    connection: ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Return the frame index for one config entry.

    Shape:
        base   — URL prefix; frame N is f"{base}{t0 + N*step}{ext}"
        step   — seconds per slot
        t0     — epoch of the OLDEST surviving frame
        count  — slots from t0 through the newest, inclusive
        gaps   — run-length-encoded [start_slot, length] holes
    """
    entry_id: str | None = msg.get("entry_id")

    if entry_id is None:
        entity_id = msg.get("entity_id")
        if entity_id is None:
            connection.send_error(
                msg["id"], "invalid_format", "Provide entry_id or entity_id"
            )
            return
        registry_entry = er.async_get(hass).async_get(entity_id)
        if registry_entry is None or registry_entry.config_entry_id is None:
            connection.send_error(msg["id"], "not_found", f"Unknown entity {entity_id}")
            return
        entry_id = registry_entry.config_entry_id

    entry = hass.config_entries.async_get_entry(entry_id)

    if entry is None or entry.domain != DOMAIN:
        connection.send_error(msg["id"], "not_found", f"Unknown entry {entry_id}")
        return

    coordinator = getattr(entry, "runtime_data", None)
    if coordinator is None or coordinator.data is None:
        connection.send_error(msg["id"], "not_loaded", f"Entry {entry_id} not loaded")
        return

    index = coordinator.data["index"]
    connection.send_result(
        msg["id"],
        {
            "base": f"{FRAMES_URL_BASE}/{entry_id}/",
            "ext": FRAME_EXTENSION,
            "step": coordinator.data["step"],
            "t0": index["t0"],
            "count": index["count"],
            "gaps": index["gaps"],
            "retention_days": coordinator.data["retention_days"],
            "online": coordinator.data["online"],
            "newest_slot": coordinator.data["newest_slot"],
        },
    )


@websocket_command({vol.Required("type"): WS_TYPE_CARD_VERSION})
@async_response
async def websocket_card_version(
    hass: HomeAssistant,
    connection: ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Return the bundled card version so the frontend can spot a stale tab."""
    connection.send_result(msg["id"], {"version": CARD_VERSION})
