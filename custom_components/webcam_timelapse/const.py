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

# --- Defaults -------------------------------------------------------------

DEFAULT_NAME: Final = "Webcam"
DEFAULT_CAPTURE_INTERVAL: Final = 10  # minutes
DEFAULT_RETENTION_DAYS: Final = 14
DEFAULT_MAX_WIDTH: Final = 1024  # px; 0 == keep native width
DEFAULT_QUALITY: Final = 78  # WebP quality
DEFAULT_LIVE_REFRESH: Final = 30  # seconds; 0 == archive-only

# --- Bounds ---------------------------------------------------------------

# Every allowed interval divides 60 exactly. That is what lets capture run
# on a wall-clock grid via async_track_time_change(minute=[0,10,20,...]),
# which in turn makes every frame timestamp a deterministic slot — the
# invariant the whole on-disk layout and the card's index rest on. A free
# integer (7, say) would drift across the hour and break it, so the
# constraint is structural (a select) rather than a validator someone can
# later relax.
ALLOWED_CAPTURE_INTERVALS: Final[tuple[int, ...]] = (1, 2, 3, 5, 10, 15, 20, 30, 60)

# Capture fires this many seconds past the minute. Cameras commonly publish
# on the minute boundary; a few seconds of slack means we read the frame
# they just wrote rather than racing it.
CAPTURE_SECOND: Final = 5

ALLOWED_MAX_WIDTHS: Final[tuple[int, ...]] = (0, 640, 800, 1024, 1280, 1600, 1920)

MIN_RETENTION_DAYS: Final = 1
MAX_RETENTION_DAYS: Final = 365
MIN_QUALITY: Final = 40
MAX_QUALITY: Final = 95
MIN_LIVE_REFRESH: Final = 0
MAX_LIVE_REFRESH: Final = 600

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
