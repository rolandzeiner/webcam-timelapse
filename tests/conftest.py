"""Shared pytest fixtures for Webcam Timelapse tests."""

from __future__ import annotations

import io
from collections.abc import Generator
from pathlib import Path
from typing import Any
from unittest.mock import AsyncMock, patch

import pytest
from homeassistant.const import CONF_NAME, CONF_URL, CONF_VERIFY_SSL
from homeassistant.core import HomeAssistant
from PIL import Image
from pytest_homeassistant_custom_component.common import MockConfigEntry
from pytest_homeassistant_custom_component.syrupy import HomeAssistantSnapshotExtension
from syrupy.assertion import SnapshotAssertion

from custom_components.webcam_timelapse.capture import (
    CacheValidators,
    FetchOutcome,
    FetchResult,
    body_digest,
)
from custom_components.webcam_timelapse.config_flow import compute_unique_id
from custom_components.webcam_timelapse.const import (
    CONF_CAPTURE_INTERVAL,
    CONF_LIVE_REFRESH,
    CONF_MAX_WIDTH,
    CONF_QUALITY,
    CONF_RETENTION_DAYS,
    DOMAIN,
)

pytest_plugins = "pytest_homeassistant_custom_component"

# Canonical entry-data shape used across the test suite. Individual tests
# splat overrides via ``{**BASE_ENTRY_DATA, ...}``. Hoisting it here
# avoids the drift you get when one inline copy gains a key and the
# others don't.
BASE_ENTRY_DATA: dict[str, Any] = {
    CONF_NAME: "Test Cam",
    CONF_URL: "https://example.invalid/cam.jpg",
    CONF_CAPTURE_INTERVAL: 10,
    CONF_RETENTION_DAYS: 14,
    CONF_MAX_WIDTH: 1024,
    CONF_QUALITY: 78,
    CONF_LIVE_REFRESH: 30,
    CONF_VERIFY_SSL: True,
}


def make_jpeg(width: int = 320, height: int = 240, seed: int = 0) -> bytes:
    """A small but genuinely decodable JPEG.

    Generated rather than committed as a binary fixture: the encoder tests
    care about dimensions and decodability, both of which read better in
    code than hidden in a checked-in file. ``seed`` shifts the pixel
    pattern so two calls produce different bytes — which is what the
    freeze-detection paths need.
    """
    image = Image.new("RGB", (width, height))
    pixels = image.load()
    assert pixels is not None
    for y in range(height):
        for x in range(width):
            pixels[x, y] = ((x * 7 + seed) % 256, (y * 11) % 256, ((x + y) * 3) % 256)
    buffer = io.BytesIO()
    image.save(buffer, "JPEG", quality=90)
    return buffer.getvalue()


def fresh_result(raw: bytes | None = None) -> FetchResult:
    """A FetchResult carrying a new frame."""
    raw = raw if raw is not None else make_jpeg()
    return FetchResult(
        FetchOutcome.FRESH,
        raw=raw,
        digest=body_digest(raw),
        content_type="image/jpeg",
        validators=CacheValidators(etag='"x"'),
    )


def unchanged_result() -> FetchResult:
    """A FetchResult standing in for a 304 or a frozen camera."""
    return FetchResult(FetchOutcome.UNCHANGED, validators=CacheValidators(etag='"x"'))


def make_entry(
    *,
    unique_id: str | None = None,
    entry_id: str = "01TESTENTRYID0000000000000",
    **overrides: Any,
) -> MockConfigEntry:
    """A config entry with the canonical data, plus any overrides.

    `unique_id` has to be passed at construction: HA forbids assigning it
    afterwards (`use async_update_entry instead`). It defaults to the real
    URL-derived value so duplicate-abort tests behave like production.
    """
    data = {**BASE_ENTRY_DATA, **overrides}
    return MockConfigEntry(
        domain=DOMAIN,
        title=str(data[CONF_NAME]),
        data=data,
        unique_id=unique_id or compute_unique_id(str(data[CONF_URL])),
        entry_id=entry_id,
    )


async def setup_entry(hass: HomeAssistant, entry: MockConfigEntry) -> bool:
    """Add and set up an entry, returning whether setup succeeded."""
    entry.add_to_hass(hass)
    result = await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return result


@pytest.fixture
def snapshot(snapshot: SnapshotAssertion) -> SnapshotAssertion:
    """Use the HA snapshot extension so diagnostics / state dumps diff cleanly.

    Create/update snapshots with: pytest --snapshot-update
    Stored under tests/snapshots/ next to the test module.
    """
    return snapshot.use_extension(HomeAssistantSnapshotExtension)


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations):
    """Enable custom integrations for all tests in this package."""
    yield


@pytest.fixture(autouse=True)
def mock_aiohttp_session() -> Generator[None]:
    """Stop pycares from starting its background DNS thread.

    pytest-homeassistant-custom-component's verify_cleanup fixture asserts
    no stray threads remain at teardown, and the resolver thread violates
    that. Patching async_get_clientsession where each module imports it is
    enough.
    """
    with (
        patch("custom_components.webcam_timelapse.coordinator.async_get_clientsession"),
        patch("custom_components.webcam_timelapse.config_flow.async_get_clientsession"),
    ):
        yield


@pytest.fixture(autouse=True)
def isolate_frames_dir(tmp_path: Path) -> Generator[Path]:
    """Redirect the frame archive to a per-test temporary directory.

    pytest-homeassistant-custom-component's `hass.config.config_dir` is a
    fixed directory INSIDE site-packages, shared by every test and every
    run. Left alone, the archive accumulates real frames across tests —
    which shows up as retention and purge assertions failing on counts
    from some earlier test, and as junk written into the installed
    package. `Config.path` joins with the config dir, and joining an
    absolute path just returns it, so pointing STORAGE_SUBDIR at a tmp
    directory redirects everything while still exercising the real path
    resolution. Patched in both modules that imported the name.
    """
    root = tmp_path / "cache"
    with (
        patch(
            "custom_components.webcam_timelapse.coordinator.STORAGE_SUBDIR", str(root)
        ),
        patch("custom_components.webcam_timelapse.STORAGE_SUBDIR", str(root)),
    ):
        yield root


@pytest.fixture
def mock_fetch() -> Generator[AsyncMock]:
    """Bypass the network in the coordinator.

    Patches the fetch helper rather than the coordinator's update method,
    so the archive scan, prune, index derivation and the real Pillow
    encode all still run — those are the parts most worth exercising.
    Defaults to returning a fresh frame.
    """
    with patch(
        "custom_components.webcam_timelapse.coordinator.fetch_frame",
        new_callable=AsyncMock,
    ) as mocked:
        mocked.return_value = fresh_result()
        yield mocked


@pytest.fixture
def mock_probe() -> Generator[AsyncMock]:
    """Make the config flow's trial request succeed by default."""
    with patch(
        "custom_components.webcam_timelapse.config_flow.async_probe_url",
        new_callable=AsyncMock,
        return_value=None,
    ) as mocked:
        yield mocked


@pytest.fixture(autouse=True)
def no_deprecated_ha_api(
    request: pytest.FixtureRequest, caplog: pytest.LogCaptureFixture
) -> Generator[None]:
    """Fail any test that trips Home Assistant's deprecation channel.

    `frame.report_usage` logs through `_LOGGER.warning` and never calls
    `warnings.warn`, so `pytest.ini`'s `error::DeprecationWarning` filter
    cannot see it. This is that filter's counterpart for HA's own channel,
    and it runs on every test rather than on one.

    HA emits two message shapes and picks the severity tier from whichever
    applies (`homeassistant/helpers/frame.py`):

    - "Detected that custom integration '<x>' ..." when the stack walk finds
      our integration. Governed by `custom_integration_behavior`, the most
      lenient tier — it is still LOG long after core has moved on.
    - "Detected code that ..." when HA cannot attribute the call to any
      integration, which is exactly what happens for a call made from a
      *test* file. Governed by `core_behavior`, the strictest tier, and so
      the first to turn a warning into a `RuntimeError`.

    Watching only the first shape is what let `device_registry.async_get_device`
    reach a hard CI failure on 2026-08-29. The deprecation had been logging
    since HA 2026.7, but only ever from the test file, so the old single-test
    tripwire never saw it. Catching both shapes means a deprecation fails the
    build while it is still a warning in our tier, which makes the eventual
    flip to ERROR a no-op.

    Records are read per phase via `get_records`, not from `caplog.text`:
    pytest installs a fresh handler for each of setup/call/teardown, so by
    the time this finaliser runs `caplog.text` holds teardown records only
    and would miss everything the test body logged.

    Opt out for a test that asserts deprecation behaviour on purpose:

        @pytest.mark.allow_deprecated_ha_api
    """
    yield
    if request.node.get_closest_marker("allow_deprecated_ha_api"):
        return
    hits = [
        message
        for phase in ("setup", "call")
        for record in caplog.get_records(phase)
        if (message := record.getMessage()).startswith(
            ("Detected that ", "Detected code that ")
        )
    ]
    if hits:
        pytest.fail(
            "Home Assistant reported deprecated API use:\n  " + "\n  ".join(hits),
            pytrace=False,
        )
