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
from typing import NamedTuple

from PIL import Image, ImageStat, UnidentifiedImageError

# `method` trades CPU for compression. 4 (Pillow's default) is the right
# point on ARM: method=6 costs roughly 3x the CPU for ~3% smaller output.
_WEBP_METHOD = 4

# Pillow's thumbnail() takes a (width, height) box and preserves aspect
# ratio, so an effectively unbounded height lets width alone drive the
# result. 10x the width covers any panorama we would realistically meet.
_HEIGHT_HEADROOM = 10


class ImageDecodeError(ValueError):
    """Raised when the fetched payload is not a decodable image."""


class EncodedFrame(NamedTuple):
    """The result of encoding one captured image."""

    data: bytes
    width: int
    height: int
    #: Mean perceptual luminance, 0-255. Measured here because the image
    #: is already decoded — recovering it later would mean re-reading and
    #: re-decoding every frame on disk.
    luma: int


def encode_webp(raw: bytes, max_width: int, quality: int) -> EncodedFrame:
    """Convert an arbitrary still image to a (optionally downscaled) WebP.

    Args:
        raw: The bytes as fetched from the camera URL.
        max_width: Target width in pixels, or ``0`` to keep the native
            width. Images already narrower than this are never upscaled.
        quality: WebP quality, 0-100.

    Returns:
        An :class:`EncodedFrame`.

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

            # "L" is ITU-R 601 luma, which weights green far above blue —
            # closer to how the eye reads brightness than a flat RGB mean,
            # and it is what makes the correction track *perceived*
            # flicker rather than raw channel energy.
            luma = round(ImageStat.Stat(rgb.convert("L")).mean[0])

            buffer = io.BytesIO()
            rgb.save(buffer, "WEBP", quality=quality, method=_WEBP_METHOD)
            return EncodedFrame(buffer.getvalue(), rgb.width, rgb.height, luma)
    except (UnidentifiedImageError, OSError, SyntaxError, ValueError) as err:
        raise ImageDecodeError(str(err)) from err


def measure_luma(data: bytes) -> int:
    """Mean perceptual luminance of an already-encoded frame.

    Only for backfilling frames captured before luminance was recorded —
    the capture path gets this free from `encode_webp`, which already has
    the image decoded. Decoding purely to measure is the expensive path
    and should never be on the hot one.
    """
    try:
        with Image.open(io.BytesIO(data)) as image:
            return round(ImageStat.Stat(image.convert("L")).mean[0])
    except (UnidentifiedImageError, OSError, SyntaxError, ValueError) as err:
        raise ImageDecodeError(str(err)) from err


def frame_size(data: bytes) -> tuple[int, int]:
    """Pixel size of an encoded frame, read from its header alone."""
    try:
        with Image.open(io.BytesIO(data)) as image:
            return image.size
    except (UnidentifiedImageError, OSError, SyntaxError, ValueError) as err:
        raise ImageDecodeError(str(err)) from err


def _even(value: int) -> int:
    """Round down to an even number, never below two."""
    return max(2, value - value % 2)


def crop_box(
    size: tuple[int, int], aspect: float | None, position: float = 0.5
) -> tuple[int, int, int, int]:
    """The part of a frame that a crop to ``aspect`` keeps.

    Args:
        size: The frame's width and height.
        aspect: Width over height to cut to, or ``None`` for the whole
            frame.
        position: Where the kept part sits along the axis it can slide
            on, 0.0 (left or top) to 1.0 (right or bottom).

    Returns:
        ``(left, top, right, bottom)`` as Pillow's ``crop`` takes it. When
        cropping, both sides are even — H.264 in 4:2:0 cannot store an odd
        one — so a frame of the planned size needs no resample afterwards.
    """
    width, height = size
    if aspect is None:
        return 0, 0, width, height
    position = min(1.0, max(0.0, position))
    if width / height > aspect:
        # Wider than wanted: keep the full height, slide across.
        kept_width = min(_even(round(height * aspect)), _even(width))
        kept_height = _even(height)
        left = round((width - kept_width) * position)
        return left, 0, left + kept_width, kept_height
    kept_width = _even(width)
    kept_height = min(_even(round(width / aspect)), _even(height))
    top = round((height - kept_height) * position)
    return 0, top, kept_width, top + kept_height


def decode_frame(
    data: bytes,
    size: tuple[int, int] | None = None,
    gain: float = 1.0,
    crop: tuple[float, float] | None = None,
) -> Image.Image:
    """Decode a stored frame to RGB, for the video export.

    Args:
        data: The encoded frame as stored on disk.
        size: Resize to exactly this, or ``None`` to keep the native size.
            A video has one frame size, and an archive can hold more than
            one — changing "Resize to" mid-archive does exactly that.
        gain: Brightness multiplier, 1.0 for none. Applied as a straight
            scale of the sRGB values, which is what the card's
            ``filter: brightness()`` does to the same frame.
        crop: ``(aspect, position)`` to cut the frame to before resizing,
            as ``crop_box`` takes them; ``None`` keeps the whole frame.
            Worked out per frame, so frames of another size are cut to the
            same shape rather than to the same pixels.

    Raises:
        ImageDecodeError: The payload could not be decoded as an image.
    """
    try:
        with Image.open(io.BytesIO(data)) as image:
            rgb = image.convert("RGB")
    except (UnidentifiedImageError, OSError, SyntaxError, ValueError) as err:
        raise ImageDecodeError(str(err)) from err

    if crop is not None:
        box = crop_box(rgb.size, *crop)
        if box != (0, 0, *rgb.size):
            rgb = rgb.crop(box)
    if size is not None and rgb.size != size:
        rgb = rgb.resize(size, Image.Resampling.LANCZOS)
    if gain != 1.0:
        table = [min(255, round(level * gain)) for level in range(256)]
        rgb = rgb.point(table * 3)
    return rgb
