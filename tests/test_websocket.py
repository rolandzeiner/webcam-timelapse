"""WebSocket API: the frame index and the card-version probe."""

from __future__ import annotations

from unittest.mock import AsyncMock

from homeassistant.core import HomeAssistant

from custom_components.webcam_timelapse import frame_store
from custom_components.webcam_timelapse.const import CARD_VERSION, FRAMES_URL_BASE
from custom_components.webcam_timelapse.websocket import (
    WS_TYPE_CARD_VERSION,
    WS_TYPE_INDEX,
)

from .conftest import make_entry, setup_entry


async def test_card_version_probe(
    hass: HomeAssistant, hass_ws_client, mock_fetch: AsyncMock
) -> None:
    """Lets a tab left open across an upgrade notice it is running stale JS."""
    assert await setup_entry(hass, make_entry())
    client = await hass_ws_client(hass)

    await client.send_json_auto_id({"type": WS_TYPE_CARD_VERSION})
    response = await client.receive_json()

    assert response["success"]
    assert response["result"] == {"version": CARD_VERSION}


async def test_index_on_an_empty_archive(
    hass: HomeAssistant, hass_ws_client, mock_fetch: AsyncMock
) -> None:
    entry = make_entry()
    assert await setup_entry(hass, entry)
    client = await hass_ws_client(hass)

    await client.send_json_auto_id({"type": WS_TYPE_INDEX, "entry_id": entry.entry_id})
    response = await client.receive_json()

    assert response["success"]
    result = response["result"]
    assert result["t0"] is None
    assert result["count"] == 0
    assert result["gaps"] == []
    assert result["base"] == f"{FRAMES_URL_BASE}/{entry.entry_id}/"
    assert result["ext"] == ".webp"
    assert result["step"] == 600


async def test_index_describes_gaps(
    hass: HomeAssistant, hass_ws_client, mock_fetch: AsyncMock
) -> None:
    """The card derives every frame URL from t0 + i * step, so this is the API."""
    entry = make_entry()
    assert await setup_entry(hass, entry)
    coordinator = entry.runtime_data

    t0 = 1_785_585_600
    for position in (0, 1, 4):
        frame_store.write_frame(coordinator.frames_dir, t0 + position * 600, b"x")
    await coordinator.async_refresh()

    client = await hass_ws_client(hass)
    await client.send_json_auto_id({"type": WS_TYPE_INDEX, "entry_id": entry.entry_id})
    response = await client.receive_json()

    result = response["result"]
    assert result["t0"] == t0
    assert result["count"] == 5
    assert result["gaps"] == [[2, 2]]
    assert result["newest_slot"] == t0 + 4 * 600
    assert result["retention_days"] == 14
    assert result["online"] is True


async def test_index_for_an_unknown_entry(
    hass: HomeAssistant, hass_ws_client, mock_fetch: AsyncMock
) -> None:
    assert await setup_entry(hass, make_entry())
    client = await hass_ws_client(hass)

    await client.send_json_auto_id({"type": WS_TYPE_INDEX, "entry_id": "nope"})
    response = await client.receive_json()

    assert not response["success"]
    assert response["error"]["code"] == "not_found"


async def test_index_for_an_unloaded_entry(
    hass: HomeAssistant, hass_ws_client, mock_fetch: AsyncMock
) -> None:
    entry = make_entry()
    assert await setup_entry(hass, entry)
    await hass.config_entries.async_unload(entry.entry_id)
    await hass.async_block_till_done()

    client = await hass_ws_client(hass)
    await client.send_json_auto_id({"type": WS_TYPE_INDEX, "entry_id": entry.entry_id})
    response = await client.receive_json()

    assert not response["success"]
    assert response["error"]["code"] == "not_loaded"
