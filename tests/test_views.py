"""The frame view: frames only reach signed-in users."""

from __future__ import annotations

from http import HTTPStatus
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest
from homeassistant.core import HomeAssistant
from homeassistant.setup import async_setup_component

from custom_components.webcam_timelapse import card_registration, frame_store
from custom_components.webcam_timelapse.const import CONF_FRAMES_PATH, FRAMES_URL_BASE

from .conftest import make_entry, setup_entry

SLOT = 1_785_585_600


@pytest.fixture(autouse=True)
async def http(hass: HomeAssistant) -> None:
    """Set up http first, so async_setup finds it and registers the view."""
    assert await async_setup_component(hass, "http", {})


async def test_nothing_is_served_without_authentication_but_the_card(
    hass: HomeAssistant, mock_fetch: AsyncMock
) -> None:
    """Static paths and auth-free views skip Home Assistant's login.

    The frame archive used to be a static mount, readable by anyone who
    could reach the instance (hacs/default#13131). This watches everything
    setup registers, so a later change that serves stored files without
    authentication fails here, whichever module it is added in: a static
    path may only serve the card bundle in www/, and every view must keep
    requires_auth on.
    """
    www = (Path(card_registration.__file__).parent / "www").resolve()
    # Core's camera component registers its own views (the image proxy
    # checks a rotating token instead of a login); set it up outside the
    # watched window so only this integration's registrations are seen.
    assert await async_setup_component(hass, "camera", {})
    with (
        patch.object(
            hass.http,
            "async_register_static_paths",
            wraps=hass.http.async_register_static_paths,
        ) as static_paths,
        patch.object(
            hass.http, "register_view", wraps=hass.http.register_view
        ) as views,
    ):
        assert await setup_entry(hass, make_entry())

    mounts = [config for call in static_paths.call_args_list for config in call.args[0]]
    ours = [
        call.args[0]
        for call in views.call_args_list
        if type(call.args[0]).__module__.startswith(
            "custom_components.webcam_timelapse"
        )
    ]
    # Without these, a spy that saw nothing would pass the checks below.
    assert mounts, "the card bundle mount was not seen"
    assert ours, "the frame view was not seen"
    for config in mounts:
        assert Path(config.path).resolve() == www, config
    for view in ours:
        assert view.requires_auth is True, view


async def test_serves_a_frame_to_a_signed_in_user(
    hass: HomeAssistant, hass_client, mock_fetch: AsyncMock
) -> None:
    entry = make_entry()
    assert await setup_entry(hass, entry)
    frame_store.write_frame(entry.runtime_data.frames_dir, SLOT, b"frame")
    client = await hass_client()

    response = await client.get(f"{FRAMES_URL_BASE}/{entry.entry_id}/{SLOT}.webp")

    assert response.status == HTTPStatus.OK
    assert await response.read() == b"frame"
    # Long-lived, so the browser cache stays the frame cache; private, so a
    # shared proxy never hands one user's frames to another.
    assert response.headers["Cache-Control"] == "private, max-age=2678400"


async def test_refuses_a_request_without_a_token(
    hass: HomeAssistant, hass_client_no_auth, mock_fetch: AsyncMock
) -> None:
    """The reason the view exists: a static path would have answered this."""
    entry = make_entry()
    assert await setup_entry(hass, entry)
    frame_store.write_frame(entry.runtime_data.frames_dir, SLOT, b"frame")
    client = await hass_client_no_auth()

    response = await client.get(f"{FRAMES_URL_BASE}/{entry.entry_id}/{SLOT}.webp")

    assert response.status == HTTPStatus.UNAUTHORIZED


async def test_serves_an_entry_with_its_own_storage_folder(
    hass: HomeAssistant, hass_client, mock_fetch: AsyncMock, tmp_path: Path
) -> None:
    """Resolved through the coordinator, not the default root."""
    entry = make_entry(**{CONF_FRAMES_PATH: str(tmp_path / "elsewhere")})
    assert await setup_entry(hass, entry)
    frame_store.write_frame(tmp_path / "elsewhere", SLOT, b"frame")
    client = await hass_client()

    response = await client.get(f"{FRAMES_URL_BASE}/{entry.entry_id}/{SLOT}.webp")

    assert response.status == HTTPStatus.OK


@pytest.mark.parametrize(
    "name",
    [
        f"{SLOT + 600}.webp",  # a slot with no frame
        f"{SLOT}.png",
        "luma.log",
        "abc.webp",
    ],
)
async def test_anything_but_a_stored_frame_is_not_found(
    hass: HomeAssistant, hass_client, mock_fetch: AsyncMock, name: str
) -> None:
    entry = make_entry()
    assert await setup_entry(hass, entry)
    frame_store.write_frame(entry.runtime_data.frames_dir, SLOT, b"frame")
    client = await hass_client()

    response = await client.get(f"{FRAMES_URL_BASE}/{entry.entry_id}/{name}")

    assert response.status == HTTPStatus.NOT_FOUND


async def test_a_path_traversal_is_refused(
    hass: HomeAssistant, hass_client, mock_fetch: AsyncMock
) -> None:
    """HA's request filter answers 400 first; the name pattern would 404 it."""
    entry = make_entry()
    assert await setup_entry(hass, entry)
    frame_store.write_frame(entry.runtime_data.frames_dir, SLOT, b"frame")
    client = await hass_client()

    response = await client.get(
        f"{FRAMES_URL_BASE}/{entry.entry_id}/..%2F{entry.entry_id}%2F{SLOT}.webp"
    )

    assert response.status != HTTPStatus.OK


async def test_an_unknown_entry_is_not_found(
    hass: HomeAssistant, hass_client, mock_fetch: AsyncMock
) -> None:
    assert await setup_entry(hass, make_entry())
    client = await hass_client()

    response = await client.get(f"{FRAMES_URL_BASE}/01UNKNOWN/{SLOT}.webp")

    assert response.status == HTTPStatus.NOT_FOUND


async def test_an_unloaded_entry_is_not_found(
    hass: HomeAssistant, hass_client, mock_fetch: AsyncMock
) -> None:
    entry = make_entry()
    assert await setup_entry(hass, entry)
    frame_store.write_frame(entry.runtime_data.frames_dir, SLOT, b"frame")
    assert await hass.config_entries.async_unload(entry.entry_id)
    client = await hass_client()

    response = await client.get(f"{FRAMES_URL_BASE}/{entry.entry_id}/{SLOT}.webp")

    assert response.status == HTTPStatus.NOT_FOUND
