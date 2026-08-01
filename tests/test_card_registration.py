"""Lovelace resource registration and the frames static mount."""

from __future__ import annotations

from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from homeassistant.core import HomeAssistant

from custom_components.webcam_timelapse.card_registration import (
    URL_BASE,
    JSModuleRegistration,
    async_register_frames_path,
)
from custom_components.webcam_timelapse.const import CARD_VERSION, FRAMES_URL_BASE

CARD_URL = f"{URL_BASE}/webcam-timelapse-card.js"


def lovelace(mode: str = "storage", items: list[dict] | None = None) -> SimpleNamespace:
    """A stand-in for HA's LovelaceData."""
    resources = MagicMock()
    resources.loaded = True
    resources.async_items = MagicMock(return_value=items or [])
    resources.async_create_item = AsyncMock()
    resources.async_update_item = AsyncMock()
    resources.async_delete_item = AsyncMock()
    return SimpleNamespace(resource_mode=mode, resources=resources)


@pytest.fixture
def http_hass(hass: HomeAssistant) -> HomeAssistant:
    """A hass whose http component accepts static path registration."""
    hass.http = MagicMock()  # type: ignore[attr-defined]
    hass.http.async_register_static_paths = AsyncMock()
    return hass


# --- frames mount ---------------------------------------------------------


async def test_frames_path_is_mounted_with_cache_headers(
    http_hass: HomeAssistant, tmp_path: Path
) -> None:
    """Frames are immutable, so the browser HTTP cache does the caching."""
    root = tmp_path / "frames"

    await async_register_frames_path(http_hass, root)

    assert root.is_dir(), (
        "directory must exist before mounting; aiohttp raises otherwise"
    )
    config = http_hass.http.async_register_static_paths.call_args[0][0][0]
    assert config.url_path == FRAMES_URL_BASE
    assert config.path == str(root)
    assert config.cache_headers is True


async def test_frames_path_tolerates_a_second_registration(
    http_hass: HomeAssistant, tmp_path: Path
) -> None:
    """async_setup runs once per process, but a reload must not explode."""
    http_hass.http.async_register_static_paths.side_effect = RuntimeError("dup")
    await async_register_frames_path(http_hass, tmp_path / "frames")


async def test_frames_path_skipped_without_http(
    hass: HomeAssistant, tmp_path: Path
) -> None:
    hass.http = None  # type: ignore[attr-defined]
    await async_register_frames_path(hass, tmp_path / "frames")


# --- card resource --------------------------------------------------------


async def test_registers_the_card_in_storage_mode(http_hass: HomeAssistant) -> None:
    registration = JSModuleRegistration(http_hass)
    registration.lovelace = lovelace()

    await registration.async_register()

    registration.lovelace.resources.async_create_item.assert_awaited_once_with(
        {"res_type": "module", "url": f"{CARD_URL}?v={CARD_VERSION}"}
    )


async def test_existing_resource_at_the_current_version_is_left_alone(
    http_hass: HomeAssistant,
) -> None:
    """Re-registering on every reload would bounce every open browser tab."""
    registration = JSModuleRegistration(http_hass)
    registration.lovelace = lovelace(
        items=[{"id": "1", "url": f"{CARD_URL}?v={CARD_VERSION}"}]
    )

    await registration.async_register()

    registration.lovelace.resources.async_create_item.assert_not_awaited()
    registration.lovelace.resources.async_update_item.assert_not_awaited()


async def test_stale_resource_is_updated(http_hass: HomeAssistant) -> None:
    registration = JSModuleRegistration(http_hass)
    registration.lovelace = lovelace(items=[{"id": "1", "url": f"{CARD_URL}?v=0.0.1"}])

    await registration.async_register()

    registration.lovelace.resources.async_update_item.assert_awaited_once_with(
        "1", {"res_type": "module", "url": f"{CARD_URL}?v={CARD_VERSION}"}
    )


async def test_yaml_mode_skips_resource_registration(
    http_hass: HomeAssistant,
) -> None:
    """YAML users add the resource themselves; fail closed rather than guess."""
    registration = JSModuleRegistration(http_hass)
    registration.lovelace = lovelace(mode="yaml")

    await registration.async_register()

    registration.lovelace.resources.async_create_item.assert_not_awaited()


async def test_missing_lovelace_still_mounts_the_bundle(
    http_hass: HomeAssistant,
) -> None:
    registration = JSModuleRegistration(http_hass)
    registration.lovelace = None

    await registration.async_register()

    http_hass.http.async_register_static_paths.assert_awaited_once()


async def test_registration_skipped_without_http(hass: HomeAssistant) -> None:
    hass.http = None  # type: ignore[attr-defined]
    registration = JSModuleRegistration(hass)
    registration.lovelace = lovelace()

    await registration.async_register()

    registration.lovelace.resources.async_create_item.assert_not_awaited()


async def test_legacy_mode_attribute_is_read(http_hass: HomeAssistant) -> None:
    """HA <= 2026.1 called it `mode`; 2026.2+ renamed it `resource_mode`."""
    registration = JSModuleRegistration(http_hass)
    registration.lovelace = SimpleNamespace(
        mode="storage", resources=lovelace().resources
    )

    await registration.async_register()

    registration.lovelace.resources.async_create_item.assert_awaited_once()


async def test_unregister_removes_only_our_resources(
    http_hass: HomeAssistant,
) -> None:
    registration = JSModuleRegistration(http_hass)
    registration.lovelace = lovelace(
        items=[
            {"id": "1", "url": f"{CARD_URL}?v={CARD_VERSION}"},
            {"id": "2", "url": "/other_integration/other-card.js"},
        ]
    )

    await registration.async_unregister()

    registration.lovelace.resources.async_delete_item.assert_awaited_once_with("1")


async def test_unregister_is_a_noop_in_yaml_mode(http_hass: HomeAssistant) -> None:
    registration = JSModuleRegistration(http_hass)
    registration.lovelace = lovelace(mode="yaml")

    await registration.async_unregister()

    registration.lovelace.resources.async_delete_item.assert_not_awaited()


async def test_waits_for_lovelace_resources_to_load(
    http_hass: HomeAssistant,
) -> None:
    """The resource collection is not loaded yet during early startup."""
    registration = JSModuleRegistration(http_hass)
    registration.lovelace = lovelace()
    registration.lovelace.resources.loaded = False

    with patch(
        "custom_components.webcam_timelapse.card_registration.async_call_later"
    ) as later:
        await registration.async_register()

    later.assert_called_once()
    registration.lovelace.resources.async_create_item.assert_not_awaited()
