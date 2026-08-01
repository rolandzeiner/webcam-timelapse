"""Binary sensor platform for Webcam Timelapse."""

from __future__ import annotations

from homeassistant.components.binary_sensor import (
    BinarySensorDeviceClass,
    BinarySensorEntity,
)
from homeassistant.const import EntityCategory
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .coordinator import WebcamTimelapseConfigEntry
from .entity import WebcamTimelapseEntity

PARALLEL_UPDATES = 0


async def async_setup_entry(
    hass: HomeAssistant,
    entry: WebcamTimelapseConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up binary sensor entities from a config entry."""
    async_add_entities([CameraOnlineBinarySensor(entry.runtime_data, entry)])


class CameraOnlineBinarySensor(WebcamTimelapseEntity, BinarySensorEntity):
    """Whether the camera is still producing new images.

    This is deliberately not "is the URL reachable". A camera whose feeder
    process has died keeps serving its last image with a 200, and a naive
    reachability check would call that healthy while the timelapse quietly
    filled with duplicates. Off means several consecutive captures came
    back byte-identical (or 304) — the condition a user can actually act
    on. It also puts the outage in HA's own history, so a jump in the
    timelapse has a visible explanation later.
    """

    _translation_key = "camera_online"
    _unique_key = "camera_online"
    _attr_device_class = BinarySensorDeviceClass.CONNECTIVITY
    _attr_entity_category = EntityCategory.DIAGNOSTIC

    @property
    def is_on(self) -> bool | None:
        """Return True while fresh frames are arriving."""
        data = self.coordinator.data
        if not data:
            return None
        return bool(data.get("online"))
