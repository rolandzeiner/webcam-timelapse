/**
 * Build-time constants for the Webcam Timelapse card.
 *
 * CARD_VERSION must stay byte-identical to `version` in
 * custom_components/webcam_timelapse/manifest.json — const.py aliases its
 * CARD_VERSION to that manifest, and tests/test_versions.py enforces the
 * remaining pair. Bump both in the same commit.
 */
export const CARD_VERSION = "0.8.0";

/** Custom element tag, and the `type:` users put in their card config. */
export const CARD_TAG = "webcam-timelapse-card";

/** WebSocket commands exposed by the Python side. */
export const WS_INDEX = "webcam_timelapse/index";
export const WS_CARD_VERSION = "webcam_timelapse/card_version";

export const WS_LUMA = "webcam_timelapse/luma";
export const WS_EXPORT_START = "webcam_timelapse/export/start";
export const WS_EXPORT_SUBSCRIBE = "webcam_timelapse/export/subscribe";
export const WS_EXPORT_CANCEL = "webcam_timelapse/export/cancel";
/** Home Assistant's own command for turning a media id into a URL. */
export const WS_RESOLVE_MEDIA = "media_source/resolve_media";
