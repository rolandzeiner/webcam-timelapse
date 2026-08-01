"""Capture scheduling and archive state for Webcam Timelapse."""

from __future__ import annotations

import asyncio
import logging
from collections.abc import Callable
from datetime import datetime
from pathlib import Path
from typing import Any

import aiohttp
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import (
    CONF_NAME,
    CONF_PASSWORD,
    CONF_URL,
    CONF_USERNAME,
    CONF_VERIFY_SSL,
)
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import issue_registry as ir
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.event import async_track_time_change
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed
from homeassistant.util import dt as dt_util

from . import frame_store
from .capture import CacheValidators, FetchOutcome, fetch_frame
from .const import (
    CAMERA_STALE_TICKS,
    CAPTURE_SECOND,
    CONF_CAPTURE_INTERVAL,
    CONF_FRAMES_PATH,
    CONF_HEADERS,
    CONF_MAX_WIDTH,
    CONF_QUALITY,
    CONF_RETENTION_DAYS,
    DEFAULT_CAPTURE_INTERVAL,
    DEFAULT_MAX_WIDTH,
    DEFAULT_QUALITY,
    DEFAULT_RETENTION_DAYS,
    DOMAIN,
    STORAGE_SUBDIR,
)
from .encode import ImageDecodeError, encode_webp

_LOGGER = logging.getLogger(__name__)

_ISSUE_CAMERA_OFFLINE = "camera_offline"

type WebcamTimelapseConfigEntry = ConfigEntry["WebcamTimelapseCoordinator"]


class WebcamTimelapseCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    """Owns the capture schedule and the archive's derived state.

    Deliberately has **no** ``update_interval``. Captures are driven by
    ``async_track_time_change`` on the wall-clock grid instead, because a
    drifting interval would put frames at arbitrary timestamps and destroy
    the "slot = deterministic timestamp" invariant that the on-disk layout
    and the card's index both depend on. The tick sets a flag and asks for
    a refresh, so the actual capture still runs inside
    ``_async_update_data`` — that way HA's own machinery handles
    ``ConfigEntryAuthFailed`` (triggering reauth) and ``UpdateFailed``
    (marking entities unavailable) without this class reimplementing it.
    """

    config_entry: WebcamTimelapseConfigEntry

    def __init__(self, hass: HomeAssistant, entry: WebcamTimelapseConfigEntry) -> None:
        """Initialise the coordinator."""
        config = {**entry.data, **entry.options}
        self._entry = entry
        self._session = async_get_clientsession(hass)

        self.image_url: str = config[CONF_URL]
        self.camera_name: str = config.get(CONF_NAME, entry.title)
        self.interval_minutes: int = config.get(
            CONF_CAPTURE_INTERVAL, DEFAULT_CAPTURE_INTERVAL
        )
        self.retention_days: int = config.get(
            CONF_RETENTION_DAYS, DEFAULT_RETENTION_DAYS
        )
        self.max_width: int = config.get(CONF_MAX_WIDTH, DEFAULT_MAX_WIDTH)
        self.quality: int = config.get(CONF_QUALITY, DEFAULT_QUALITY)
        self.verify_ssl: bool = config.get(CONF_VERIFY_SSL, True)
        self._extra_headers: dict[str, str] = config.get(CONF_HEADERS) or {}

        username = config.get(CONF_USERNAME)
        password = config.get(CONF_PASSWORD)
        self._auth: aiohttp.BasicAuth | None = (
            aiohttp.BasicAuth(username, password or "") if username else None
        )

        custom_path = config.get(CONF_FRAMES_PATH)
        self.frames_dir: Path = (
            Path(custom_path)
            if custom_path
            else Path(hass.config.path(STORAGE_SUBDIR)) / entry.entry_id
        )

        self.step: int = self.interval_minutes * 60

        # Live-capture state
        self.last_frame: bytes | None = None
        self.last_frame_slot: int | None = None
        self._validators = CacheValidators()
        self._last_digest: str | None = None
        self._frozen_ticks = 0

        self.paused = False
        self._capture_pending = False
        # Serialises captures. A slow camera plus a short interval can put
        # two ticks in flight at once, and two concurrent encodes on a Pi
        # is exactly the wrong thing to allow.
        self._capture_lock = asyncio.Lock()
        self._issue_raised = False
        self._unsub: list[Callable[[], None]] = []

        super().__init__(
            hass,
            _LOGGER,
            config_entry=entry,
            name=f"{DOMAIN} {entry.title}",
            update_interval=None,
        )

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    async def _async_setup(self) -> None:
        """Create the archive directory and arm the capture grid."""
        await self.hass.async_add_executor_job(
            lambda: self.frames_dir.mkdir(parents=True, exist_ok=True)
        )

        # Every allowed interval divides 60, so this lands on a clean
        # wall-clock grid. CAPTURE_SECOND gives the camera a moment to
        # finish writing the frame it publishes on the minute boundary.
        minutes = list(range(0, 60, self.interval_minutes))
        self._unsub.append(
            async_track_time_change(
                self.hass, self._async_tick, minute=minutes, second=CAPTURE_SECOND
            )
        )

    @callback
    def async_teardown(self) -> None:
        """Cancel the capture schedule on unload."""
        for unsub in self._unsub:
            unsub()
        self._unsub.clear()

    # ------------------------------------------------------------------
    # Capture
    # ------------------------------------------------------------------

    async def _async_tick(self, now: datetime) -> None:
        """Grid tick — request a refresh that performs a capture."""
        if self.paused:
            return
        self._capture_pending = True
        await self.async_refresh()

    @callback
    def async_set_paused(self, paused: bool) -> None:
        """Pause or resume capturing.

        The schedule stays armed; the tick just returns early. That keeps
        the grid phase intact, so resuming mid-hour lands on the same slot
        boundaries as before rather than starting a fresh, offset series.
        """
        self.paused = paused
        self.async_update_listeners()

    async def async_purge_frames(self) -> int:
        """Delete every archived frame for this entry."""
        removed = await self.hass.async_add_executor_job(
            frame_store.purge_all, self.frames_dir
        )
        await self.async_refresh()
        return removed

    @property
    def live_frame(self) -> bytes | None:
        """Most recent image bytes, for the camera entity."""
        return self.last_frame

    async def async_refresh_live_frame(self) -> None:
        """Fetch a fresh image for the live view without archiving it.

        Deliberately isolated from the capture path: it passes no
        validators and no previous digest, and it never touches
        ``_frozen_ticks`` or ``_last_digest``. Those track the *capture*
        cadence, and letting an out-of-band live refresh move them would
        make the camera-offline signal depend on how many dashboards
        happen to be open.
        """
        result = await fetch_frame(
            self._session,
            self.image_url,
            extra_headers=self._extra_headers,
            auth=self._auth,
            verify_ssl=self.verify_ssl,
        )
        if result.raw is None:
            return

        encoded, _width, _height = await self.hass.async_add_executor_job(
            encode_webp, result.raw, self.max_width, self.quality
        )
        self.last_frame = encoded

    async def async_capture_now(self, *, allow_overwrite: bool = False) -> int:
        """Capture immediately, snapping to the nearest grid slot.

        Raises:
            UpdateFailed: the fetch or encode failed.
            FileExistsError: the target slot already holds a frame and
                ``allow_overwrite`` is False.
        """
        slot = frame_store.slot_for(dt_util.utcnow().timestamp(), self.step)
        if not allow_overwrite:
            exists = await self.hass.async_add_executor_job(
                frame_store.frame_path(self.frames_dir, slot).exists
            )
            if exists:
                raise FileExistsError(str(slot))

        await self._async_capture(slot, force=True)
        await self.async_refresh()
        return slot

    async def _async_capture(self, slot: int, *, force: bool = False) -> bool:
        """Fetch, encode and store one frame. Returns True if stored."""
        async with self._capture_lock:
            result = await fetch_frame(
                self._session,
                self.image_url,
                validators=None if force else self._validators,
                previous_digest=None if force else self._last_digest,
                extra_headers=self._extra_headers,
                auth=self._auth,
                verify_ssl=self.verify_ssl,
            )
            self._validators = result.validators

            if result.outcome is FetchOutcome.UNCHANGED or result.raw is None:
                # Camera is serving the same bytes it served last tick.
                # Leave the slot empty: a gap is honest, a duplicate frame
                # would silently pad the timelapse with dead time.
                self._frozen_ticks += 1
                self._maybe_raise_offline_issue()
                return False

            self._frozen_ticks = 0
            self._last_digest = result.digest
            self._clear_offline_issue()

            try:
                encoded, _width, _height = await self.hass.async_add_executor_job(
                    encode_webp, result.raw, self.max_width, self.quality
                )
            except ImageDecodeError as err:
                raise UpdateFailed(
                    translation_domain=DOMAIN,
                    translation_key="decode_error",
                    translation_placeholders={"error": str(err)},
                ) from err

            await self.hass.async_add_executor_job(
                frame_store.write_frame, self.frames_dir, slot, encoded
            )

            self.last_frame = encoded
            self.last_frame_slot = slot
            return True

    # ------------------------------------------------------------------
    # State
    # ------------------------------------------------------------------

    async def _async_update_data(self) -> dict[str, Any]:
        """Capture if a tick asked for it, then rebuild the archive state."""
        if self._capture_pending:
            self._capture_pending = False
            slot = frame_store.slot_for(dt_util.utcnow().timestamp(), self.step)
            await self._async_capture(slot)

        return await self._async_scan_and_prune()

    async def _async_scan_and_prune(self) -> dict[str, Any]:
        """Scan the archive, drop expired frames, and derive the index.

        Runs the whole filesystem interaction in a single executor job so
        the scan result is reused by the prune and the usage tally rather
        than walking the directory three times.
        """

        def _work() -> dict[str, Any]:
            slots = frame_store.scan_slots(self.frames_dir)
            if slots:
                cutoff = slots[-1] - self.retention_days * 86400
                removed = frame_store.prune(self.frames_dir, slots, cutoff)
                if removed:
                    slots = slots[len(removed) :]
            return {
                "index": frame_store.build_index(slots, self.step),
                "frame_count": len(slots),
                "bytes_used": frame_store.disk_usage(self.frames_dir),
                "newest_slot": slots[-1] if slots else None,
                "oldest_slot": slots[0] if slots else None,
            }

        state = await self.hass.async_add_executor_job(_work)
        state["step"] = self.step
        state["retention_days"] = self.retention_days
        state["online"] = self._frozen_ticks < CAMERA_STALE_TICKS
        state["frozen_ticks"] = self._frozen_ticks
        state["paused"] = self.paused
        return state

    # ------------------------------------------------------------------
    # Repairs
    # ------------------------------------------------------------------

    def _maybe_raise_offline_issue(self) -> None:
        """Flag a camera that has stopped producing new images."""
        if self._issue_raised or self._frozen_ticks < CAMERA_STALE_TICKS:
            return
        self._issue_raised = True
        ir.async_create_issue(
            self.hass,
            DOMAIN,
            f"{_ISSUE_CAMERA_OFFLINE}_{self._entry.entry_id}",
            is_fixable=False,
            severity=ir.IssueSeverity.WARNING,
            translation_key=_ISSUE_CAMERA_OFFLINE,
            translation_placeholders={
                "entry_title": self._entry.title,
                "ticks": str(self._frozen_ticks),
            },
        )

    def _clear_offline_issue(self) -> None:
        """Clear the offline issue once fresh images arrive again."""
        if not self._issue_raised:
            return
        self._issue_raised = False
        ir.async_delete_issue(
            self.hass, DOMAIN, f"{_ISSUE_CAMERA_OFFLINE}_{self._entry.entry_id}"
        )
