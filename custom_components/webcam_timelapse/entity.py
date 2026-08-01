"""Shared entity base for Webcam Timelapse."""

from __future__ import annotations

from urllib.parse import urlparse

from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN, INTEGRATION_VERSION
from .coordinator import WebcamTimelapseConfigEntry, WebcamTimelapseCoordinator


class WebcamTimelapseEntity(CoordinatorEntity[WebcamTimelapseCoordinator]):
    """Identity and device linkage shared by every entity.

    The three identity fields (`_attr_unique_id`, `_attr_translation_key`,
    `_attr_device_info`) are the Platinum-critical ones — changing any of
    them after release invalidates existing registry rows and users lose
    their history and customisations.

    No `_attr_attribution`: the image URL is user-supplied, so there is no
    single upstream this integration can credit on the user's behalf.
    """

    _attr_has_entity_name = True

    _translation_key: str
    _unique_key: str

    def __init__(
        self,
        coordinator: WebcamTimelapseCoordinator,
        entry: WebcamTimelapseConfigEntry,
    ) -> None:
        """Initialise shared entity identity."""
        super().__init__(coordinator)
        self._entry = entry
        # KEEP THIS FORMAT STABLE — changes wipe existing registry rows.
        self._attr_unique_id = f"{entry.entry_id}_{self._unique_key}"
        self._attr_translation_key = self._translation_key

        parsed = urlparse(coordinator.image_url)
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry.entry_id)},
            name=entry.title,
            manufacturer="Webcam Timelapse",
            model="Still-image camera",
            sw_version=INTEGRATION_VERSION,
            configuration_url=(
                f"{parsed.scheme}://{parsed.netloc}" if parsed.netloc else None
            ),
        )
