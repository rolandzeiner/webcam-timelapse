"""Constants for Webcam Timelapse."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Final

from homeassistant.const import __version__ as _HA_VERSION

DOMAIN: Final = "webcam_timelapse"

# Integration version — read from manifest.json at module import so the
# string can never drift from HACS's authoritative source. Sync read of a
# ~600-byte file happens once per process; the manifest is required for
# HACS anyway. Release workflow: bump only manifest.json "version".
INTEGRATION_VERSION: Final = json.loads(
    (Path(__file__).parent / "manifest.json").read_text(encoding="utf-8")
)["version"]

# Must stay byte-identical to CARD_VERSION in src/const.ts. Aliasing to
# INTEGRATION_VERSION collapses the drift surface from three places to
# two; tests/test_card_version.py enforces the remaining pair.
CARD_VERSION: Final = INTEGRATION_VERSION

# User-Agent sent on every outbound HTTP request. HA convention is
# "HomeAssistant/{ha_ver} {domain}/{int_ver}" so log parsers on the
# upstream side can identify this integration specifically. The trailing
# "(+<repo-url>)" comment follows RFC-9110 §10.5.5 product-token-comment
# convention so a camera operator who sees us in their access log has a
# direct contact point without having to guess the repo.
USER_AGENT: Final = (
    f"HomeAssistant/{_HA_VERSION} {DOMAIN}/{INTEGRATION_VERSION} "
    f"(+https://github.com/rolandzeiner/webcam-timelapse)"
)

# No ATTRIBUTION constant: unlike the *-austria siblings there is no single
# upstream to credit — the image URL is user-supplied, so any attribution
# obligation belongs to whoever configures the entry. The README carries a
# "you are responsible for the terms of the URL you poll" section instead.

# --- Config entry keys ----------------------------------------------------

# Keys that Home Assistant already names are imported from
# homeassistant.const at the point of use (CONF_NAME, CONF_URL,
# CONF_USERNAME, CONF_PASSWORD, CONF_VERIFY_SSL) rather than redefined
# here — a second spelling of "username" is exactly how an options dict
# and a config flow drift apart.
CONF_CAPTURE_INTERVAL: Final = "capture_interval"
CONF_RETENTION_DAYS: Final = "retention_days"
CONF_MAX_WIDTH: Final = "max_width"
CONF_QUALITY: Final = "quality"
CONF_LIVE_REFRESH: Final = "live_refresh"
CONF_FRAMES_PATH: Final = "frames_path"
CONF_HEADERS: Final = "headers"
CONF_CAPTURE_LIGHTS: Final = "capture_lights"
CONF_LIGHT_SETTLE: Final = "light_settle"
CONF_LIGHTS_MODE: Final = "lights_mode"
CONF_LIGHTS_WINDOW_START: Final = "lights_window_start"
CONF_LIGHTS_WINDOW_END: Final = "lights_window_end"
# Read, never written: the on/off switch that `lights_mode` replaced. An
# entry saved before the mode existed still carries it, and "night" is what
# it meant.
CONF_LIGHTS_NIGHT_ONLY: Final = "lights_night_only"

# When the capture lights are used.
LIGHTS_MODE_ALWAYS: Final = "always"
LIGHTS_MODE_NIGHT: Final = "night"  # sunset to sunrise
LIGHTS_MODE_WINDOW: Final = "window"  # between two clock times
LIGHTS_MODES: Final[tuple[str, ...]] = (
    LIGHTS_MODE_ALWAYS,
    LIGHTS_MODE_NIGHT,
    LIGHTS_MODE_WINDOW,
)

# --- Defaults -------------------------------------------------------------

DEFAULT_NAME: Final = "Webcam"
DEFAULT_CAPTURE_INTERVAL: Final = 10  # minutes
DEFAULT_RETENTION_DAYS: Final = 14
DEFAULT_MAX_WIDTH: Final = 1024  # px; 0 == keep native width
DEFAULT_QUALITY: Final = 78  # WebP quality
DEFAULT_LIVE_REFRESH: Final = 30  # seconds; 0 == archive-only
# Seconds between switching the capture lights on and fetching the frame.
# A camera's auto-exposure needs a moment to adapt to the new light level,
# and a cheap one may hand back a frame it buffered while it was still
# dark; three seconds covers both on the ESP32 class of hardware.
DEFAULT_LIGHT_SETTLE: Final = 3
DEFAULT_LIGHTS_MODE: Final = LIGHTS_MODE_ALWAYS
DEFAULT_LIGHTS_WINDOW_START: Final = "20:00:00"
DEFAULT_LIGHTS_WINDOW_END: Final = "06:00:00"

# --- Bounds ---------------------------------------------------------------

# Every allowed interval divides 60 exactly. That is what lets capture run
# on a wall-clock grid via async_track_time_change(minute=[0,10,20,...]),
# which in turn makes every frame timestamp a deterministic slot — the
# invariant the whole on-disk layout and the card's index rest on. A free
# integer (7, say) would drift across the hour and break it, so the
# constraint is structural (a select) rather than a validator someone can
# later relax.
ALLOWED_CAPTURE_INTERVALS: Final[tuple[int, ...]] = (1, 2, 3, 5, 10, 15, 20, 30, 60)

# Capture fires between these seconds past the minute, on a second that is
# fixed per config entry (coordinator.capture_second_for).
#
# The floor is slack: cameras commonly publish on the minute boundary, and
# a few seconds means we read the frame they just wrote rather than racing
# it. The ceiling is the last whole second before the middle of the
# one-minute grid, where frame_store.slot_for starts rounding to the next
# slot.
#
# It is a range because one second for every entry made every install of
# the same public webcam fetch it together. Home Assistant staggers a
# time-pattern listener by only 0.05-0.5 s (helpers/event.py,
# RANDOM_MICROSECOND_MIN / _MAX, read in 2026.10.1). Measured 2026-10-12
# with 24 entries on the one-minute grid, on the real clock: sharing second
# 5, all 24 asked between 5.09 and 5.48 s past the minute; on their own
# seconds they asked between 6.2 and 29.3 s, at most 3 in any one second,
# and every frame was still filed under its own minute.
CAPTURE_SECOND_MIN: Final = 5
CAPTURE_SECOND_MAX: Final = 29

ALLOWED_MAX_WIDTHS: Final[tuple[int, ...]] = (0, 640, 800, 1024, 1280, 1600, 1920)

MIN_RETENTION_DAYS: Final = 1
MAX_RETENTION_DAYS: Final = 365
MIN_QUALITY: Final = 40
MAX_QUALITY: Final = 95
MIN_LIVE_REFRESH: Final = 0
MAX_LIVE_REFRESH: Final = 600
MIN_LIGHT_SETTLE: Final = 0
# Capped well under the shortest capture interval (60 s) so one capture's
# lights are always off again before the next tick wants them.
MAX_LIGHT_SETTLE: Final = 30

# Domains that can be picked as a capture light. Switches are included
# because a lamp on a smart plug is a switch as far as HA is concerned.
CAPTURE_LIGHT_DOMAINS: Final[tuple[str, ...]] = ("light", "switch")

# Hard ceiling on a single downloaded image. The image URL is user-supplied,
# and HA's container on the reference host is capped at 1 GiB — an unguarded
# read of a misconfigured URL (a video file, a redirect to something huge)
# would OOM-kill the whole HA process rather than failing this one entry.
MAX_IMAGE_BYTES: Final = 20 * 1024 * 1024

# Request timeout for a single frame fetch.
FETCH_TIMEOUT_SECONDS: Final = 30

# Consecutive unchanged responses (304, or an identical body hash) before the
# camera is reported offline. Three ticks avoids flapping on a genuinely
# static scene at night while still catching a dead feeder process.
CAMERA_STALE_TICKS: Final = 3

# --- Storage --------------------------------------------------------------

# Frames live under the HA config dir's .cache/, which HA's native backup
# skips wholesale (EXCLUDE_FROM_BACKUP contains ".cache/*", and the backup
# walk does not recurse into a directory that matches). Verified against HA
# 2026.7. Anything stored here must be regenerable — treat it as a cache,
# because a future HA release could legitimately clear it.
STORAGE_SUBDIR: Final = ".cache/webcam_timelapse"

FRAME_EXTENSION: Final = ".webp"

# URL prefixes for the two static mounts registered in async_setup.
CARD_URL_BASE: Final = "/webcam_timelapse"
FRAMES_URL_BASE: Final = "/webcam_timelapse_frames"

# --- Video export ---------------------------------------------------------

DEFAULT_EXPORT_FPS: Final = 24
MIN_EXPORT_FPS: Final = 1
MAX_EXPORT_FPS: Final = 60
# Matches the card's own default, so an export started without saying
# otherwise looks like the playback it was started from.
DEFAULT_EXPORT_DEFLICKER: Final = 50

# Exports go to the media folder rather than next to the frames: a video is
# a keepsake, not a cache, so it belongs where backups and the media
# browser can see it — the opposite of everything in STORAGE_SUBDIR.
EXPORT_SUBDIR: Final = "webcam_timelapse"
EXPORT_EXTENSION: Final = ".mp4"

# Refuse to start an export with less than this free on the target volume.
# On a typical install that volume is the one Home Assistant's database
# lives on, and a full disk there corrupts far more than one video.
EXPORT_MIN_FREE_BYTES: Final = 500 * 1024 * 1024

# x264 settings. `veryfast` is the knee on small ARM boards: roughly three
# times the throughput of `medium` for about a tenth more bytes. CRF 23 is
# x264's own default and visually clean on stills played back as video.
EXPORT_X264_PRESET: Final = "veryfast"
EXPORT_X264_CRF: Final = 23

# Overlay sizes, as a percentage of the video's width. The readings default
# keeps a three-sensor block under a third of the picture; the stamp's
# keeps the date and time readable without competing with it.
DEFAULT_EXPORT_READINGS_SIZE: Final = 30
MIN_EXPORT_READINGS_SIZE: Final = 10
MAX_EXPORT_READINGS_SIZE: Final = 80
DEFAULT_EXPORT_TIMESTAMP_SIZE: Final = 15
MIN_EXPORT_TIMESTAMP_SIZE: Final = 5
MAX_EXPORT_TIMESTAMP_SIZE: Final = 50

# Shapes a video can be cropped to, as width:height. "native" keeps the
# frames' own shape; the others cut the picture down to fit, and the
# overlay is laid out on what is left — never cropped with it.
EXPORT_ASPECTS: Final[dict[str, float | None]] = {
    "native": None,
    "16:9": 16 / 9,
    "9:16": 9 / 16,
    "1:1": 1.0,
}
DEFAULT_EXPORT_ASPECT: Final = "native"
# Where the crop sits along the axis it slides on: 0 is the left (or top)
# edge of the frame, 100 the right (or bottom), 50 the middle.
DEFAULT_EXPORT_CROP_POSITION: Final = 50

# Use only every n-th frame of the range. A fortnight at one frame a minute
# is 20,000 frames — 14 minutes at 24 fps — and most of what a long range
# is exported for is the faster version of it.
DEFAULT_EXPORT_EVERY: Final = 1
MAX_EXPORT_EVERY: Final = 60
