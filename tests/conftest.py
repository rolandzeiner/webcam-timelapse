"""Shared pytest fixtures for Webcam Timelapse tests."""

from collections.abc import Generator
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest
from homeassistant.const import CONF_NAME, CONF_URL, CONF_VERIFY_SSL
from pytest_homeassistant_custom_component.syrupy import HomeAssistantSnapshotExtension
from syrupy.assertion import SnapshotAssertion

from custom_components.webcam_timelapse.const import (
    CONF_CAPTURE_INTERVAL,
    CONF_MAX_WIDTH,
    CONF_QUALITY,
    CONF_RETENTION_DAYS,
)

pytest_plugins = "pytest_homeassistant_custom_component"

# Canonical entry-data shape used across the test suite. Individual tests
# splat overrides via ``{**BASE_ENTRY_DATA, ...}``. Hoisting it here
# avoids the drift you get when one inline copy gains a key and the
# others don't.
BASE_ENTRY_DATA: dict[str, object] = {
    CONF_NAME: "Test Cam",
    CONF_URL: "https://example.invalid/cam.jpg",
    CONF_CAPTURE_INTERVAL: 10,
    CONF_RETENTION_DAYS: 14,
    CONF_MAX_WIDTH: 1024,
    CONF_QUALITY: 78,
    CONF_VERIFY_SSL: True,
}


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
    that. Patching async_get_clientsession where the coordinator imports
    it is enough.
    """
    with patch(
        "custom_components.webcam_timelapse.coordinator.async_get_clientsession",
    ):
        yield


@pytest.fixture
def frames_root(tmp_path: Path) -> Path:
    """An isolated frames directory, standing in for /config/.cache/..."""
    root = tmp_path / "frames"
    root.mkdir()
    return root


@pytest.fixture
def mock_capture() -> Generator[AsyncMock]:
    """Bypass the network for entry-setup tests.

    Patches the capture helper rather than the coordinator's update method
    so the archive scan, prune and index derivation all still run for
    real — those are the parts most worth exercising during setup.
    """
    with patch(
        "custom_components.webcam_timelapse.coordinator.fetch_frame",
        new_callable=AsyncMock,
    ) as mocked:
        yield mocked
