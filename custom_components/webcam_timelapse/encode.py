"""WebP encoding for captured frames.

PURE SYNCHRONOUS MODULE. Nothing here imports from ``homeassistant``, and
nothing here may be called from the event loop — every entry point does
blocking CPU work (a 1200x900 LANCZOS downscale plus a WebP encode runs
~120-250 ms on a Raspberry Pi class core). Callers must go through
``hass.async_add_executor_job``.

The no-``homeassistant``-import rule is deliberate and load-bearing: it
makes the module trivially unit-testable without the HA test harness, and
it makes an accidental direct call from async code visible on review
rather than only in a blocking-call warning at runtime.
"""

from __future__ import annotations

import io

from PIL import Image, UnidentifiedImageError

# `method` trades CPU for compression. 4 (Pillow's default) is the right
# point on ARM: method=6 costs roughly 3x the CPU for ~3% smaller output.
_WEBP_METHOD = 4

# Pillow's thumbnail() takes a (width, height) box and preserves aspect
# ratio, so an effectively unbounded height lets width alone drive the
# result. 10x the width covers any panorama we would realistically meet.
_HEIGHT_HEADROOM = 10


class ImageDecodeError(ValueError):
    """Raised when the fetched payload is not a decodable image."""


def encode_webp(raw: bytes, max_width: int, quality: int) -> tuple[bytes, int, int]:
    """Convert an arbitrary still image to a (optionally downscaled) WebP.

    Args:
        raw: The bytes as fetched from the camera URL.
        max_width: Target width in pixels, or ``0`` to keep the native
            width. Images already narrower than this are never upscaled.
        quality: WebP quality, 0-100.

    Returns:
        ``(webp_bytes, width, height)`` where the dimensions describe the
        encoded result, not the source.

    Raises:
        ImageDecodeError: The payload could not be identified or decoded
            as an image.
    """
    # verify() detects a truncated or hostile payload without decoding the
    # full pixel buffer, but it leaves the Image object unusable — hence
    # the deliberate second open() below rather than reusing this one.
    try:
        with Image.open(io.BytesIO(raw)) as probe:
            probe.verify()
    except (UnidentifiedImageError, OSError, SyntaxError) as err:
        raise ImageDecodeError(str(err)) from err

    try:
        with Image.open(io.BytesIO(raw)) as image:
            # WebP has no palette/greyscale-with-alpha subtleties worth
            # preserving here, and RGB keeps the encoder on its fast path.
            rgb = image.convert("RGB")

            if max_width > 0:
                # thumbnail() is a no-op when the source is already
                # smaller, which is exactly the "don't upscale a 640px
                # camera to 1024" behaviour we want.
                rgb.thumbnail(
                    (max_width, max_width * _HEIGHT_HEADROOM),
                    Image.Resampling.LANCZOS,
                )

            buffer = io.BytesIO()
            rgb.save(buffer, "WEBP", quality=quality, method=_WEBP_METHOD)
            return buffer.getvalue(), rgb.width, rgb.height
    except (UnidentifiedImageError, OSError, SyntaxError, ValueError) as err:
        raise ImageDecodeError(str(err)) from err
