"""Sensor platform for Webcam Timelapse."""

from __future__ import annotations

import datetime as dt

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorStateClass,
)
from homeassistant.const import EntityCategory, UnitOfInformation
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
    """Set up sensor entities from a config entry."""
    coordinator = entry.runtime_data
    async_add_entities(
        [
            LastCaptureSensor(coordinator, entry),
            FrameCountSensor(coordinator, entry),
            StorageUsedSensor(coordinator, entry),
        ]
    )


class LastCaptureSensor(WebcamTimelapseEntity, SensorEntity):
    """When the newest stored frame was taken.

    Also the human-readable counterpart to the archive's epoch-integer
    filenames: the files are named for machine determinism, and this is
    where a person reads the time instead.
    """

    _translation_key = "last_capture"
    _unique_key = "last_capture"
    _attr_device_class = SensorDeviceClass.TIMESTAMP

    @property
    def native_value(self) -> dt.datetime | None:
        """Return the newest frame's slot as an aware datetime."""
        newest = (self.coordinator.data or {}).get("newest_slot")
        if newest is None:
            return None
        return dt.datetime.fromtimestamp(newest, tz=dt.UTC)


class FrameCountSensor(WebcamTimelapseEntity, SensorEntity):
    """How many frames are currently archived."""

    _translation_key = "frame_count"
    _unique_key = "frame_count"
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_native_unit_of_measurement = "frames"

    @property
    def native_value(self) -> int | None:
        """Return the archived frame count."""
        return (self.coordinator.data or {}).get("frame_count")


class StorageUsedSensor(WebcamTimelapseEntity, SensorEntity):
    """Disk occupied by the archive.

    Reported in bytes with a suggested display unit rather than
    pre-divided, so HA owns the unit conversion and the user can override
    it per entity.
    """

    _translation_key = "storage_used"
    _unique_key = "storage_used"
    _attr_device_class = SensorDeviceClass.DATA_SIZE
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_native_unit_of_measurement = UnitOfInformation.BYTES
    _attr_suggested_unit_of_measurement = UnitOfInformation.MEGABYTES
    _attr_suggested_display_precision = 1
    _attr_entity_category = EntityCategory.DIAGNOSTIC

    @property
    def native_value(self) -> int | None:
        """Return bytes occupied by stored frames."""
        return (self.coordinator.data or {}).get("bytes_used")
