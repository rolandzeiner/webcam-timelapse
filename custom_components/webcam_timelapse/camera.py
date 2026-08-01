"""Camera platform for Webcam Timelapse.

Shipping a real camera entity — rather than leaving the live view to the
custom card — buys three things for very little code:

  * `camera.snapshot` / `camera.record` work out of the box, so a user can
    wire "save a frame when the doorbell rings" with no service of ours.
  * Stock `picture-entity` / `picture-glance` cards and the companion app
    work, so the integration is useful to someone who never installs the
    custom card.
  * The card can render the live image through `entity_picture`
    (`/api/camera_proxy/...`), which is authenticated, same-origin and
    token-rotated — strictly better than pointing a browser at the
    third-party camera URL directly.

There is deliberately no `async_stream_source`: this integration polls
still images, so there is no stream for go2rtc to consume. HA falls back
to its built-in MJPEG-from-stills behaviour.
"""

from __future__ import annotations

import logging

from homeassistant.components.camera import Camera, CameraEntityFeature
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import UpdateFailed
from homeassistant.util import dt as dt_util

from .const import CONF_LIVE_REFRESH, DEFAULT_LIVE_REFRESH
from .coordinator import WebcamTimelapseConfigEntry, WebcamTimelapseCoordinator
from .encode import ImageDecodeError
from .entity import WebcamTimelapseEntity

_LOGGER = logging.getLogger(__name__)

PARALLEL_UPDATES = 0


async def async_setup_entry(
    hass: HomeAssistant,
    entry: WebcamTimelapseConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up the camera entity from a config entry."""
    async_add_entities([WebcamTimelapseCamera(entry.runtime_data, entry)])


class WebcamTimelapseCamera(WebcamTimelapseEntity, Camera):
    """Live view for one archived camera."""

    _translation_key = "camera"
    _unique_key = "camera"
    _attr_supported_features = CameraEntityFeature(0)

    def __init__(
        self,
        coordinator: WebcamTimelapseCoordinator,
        entry: WebcamTimelapseConfigEntry,
    ) -> None:
        """Initialise the camera entity."""
        WebcamTimelapseEntity.__init__(self, coordinator, entry)
        Camera.__init__(self)

        config = {**entry.data, **entry.options}
        self._live_refresh: int = config.get(CONF_LIVE_REFRESH, DEFAULT_LIVE_REFRESH)
        self._attr_frame_interval = float(self._live_refresh or 1)
        self._live_frame: bytes | None = None
        self._live_fetched_at: float = 0.0

    @property
    def available(self) -> bool:
        """Available while the coordinator has state."""
        return super().available and self.coordinator.data is not None

    async def async_camera_image(
        self, width: int | None = None, height: int | None = None
    ) -> bytes | None:
        """Return the most recent image.

        Serves the last captured frame from memory, refreshing from the
        camera only when that frame is older than `live_refresh` seconds.
        With `live_refresh: 0` the entity is archive-only and never issues
        a request of its own — the right setting for a camera you are
        polling slowly on purpose, or whose operator you would rather not
        hit more often than the capture cadence already does.
        """
        now = dt_util.utcnow().timestamp()

        if self._live_refresh > 0 and now - self._live_fetched_at >= self._live_refresh:
            try:
                await self.coordinator.async_refresh_live_frame()
            except (UpdateFailed, ImageDecodeError) as err:
                # Serve the last good frame rather than a broken image.
                # Deliberately not re-raised: the binary sensor and the
                # coordinator's own error handling own the "camera is
                # broken" signal, and a dashboard tile going blank every
                # 30 s is a worse way to learn that than one that shows a
                # stale picture. Timestamp still advances so a dead camera
                # is not re-polled on every single request.
                _LOGGER.debug("Live refresh for %s failed: %s", self.entity_id, err)

            self._live_fetched_at = now

        return self.coordinator.live_frame
