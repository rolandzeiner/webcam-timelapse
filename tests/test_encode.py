"""Unit tests for WebP encoding.

Fixtures are generated rather than committed as binaries: the encoder's
behaviour depends on dimensions and decodability, both of which are
clearer expressed in code than hidden in a checked-in .jpg.
"""

from __future__ import annotations

import io

import pytest
from PIL import Image

from custom_components.webcam_timelapse.encode import ImageDecodeError, encode_webp


def jpeg(width: int, height: int) -> bytes:
    """A JPEG of the given size with enough detail to survive compression."""
    image = Image.new("RGB", (width, height))
    pixels = image.load()
    assert pixels is not None
    for y in range(height):
        for x in range(width):
            pixels[x, y] = ((x * 7) % 256, (y * 11) % 256, ((x + y) * 3) % 256)
    buffer = io.BytesIO()
    image.save(buffer, "JPEG", quality=92)
    return buffer.getvalue()


def dimensions(data: bytes) -> tuple[int, int]:
    with Image.open(io.BytesIO(data)) as image:
        return image.width, image.height


def test_output_is_webp() -> None:
    frame = encode_webp(jpeg(320, 240), max_width=1024, quality=78)
    # RIFF container with a WEBP fourcc — checked at the byte level so the
    # test fails loudly if Pillow ever silently falls back to another codec.
    assert frame.data[:4] == b"RIFF"
    assert frame.data[8:12] == b"WEBP"


def test_downscales_to_max_width() -> None:
    frame = encode_webp(jpeg(1200, 900), max_width=1024, quality=78)

    assert frame.width == 1024
    assert frame.height == 768  # 4:3 preserved
    assert dimensions(frame.data) == (1024, 768)


def test_does_not_upscale_a_smaller_source() -> None:
    """A 640px camera must stay 640px, not be blown up to the target."""
    frame = encode_webp(jpeg(640, 480), max_width=1024, quality=78)

    assert (frame.width, frame.height) == (640, 480)
    assert dimensions(frame.data) == (640, 480)


def test_max_width_zero_keeps_native_size() -> None:
    frame = encode_webp(jpeg(1200, 900), max_width=0, quality=78)

    assert (frame.width, frame.height) == (1200, 900)
    assert dimensions(frame.data) == (1200, 900)


def test_preserves_aspect_ratio_for_panoramas() -> None:
    """A very wide source must not be clipped by the height headroom."""
    frame = encode_webp(jpeg(2000, 200), max_width=1024, quality=78)
    assert (frame.width, frame.height) == (1024, 102)


def test_lower_quality_produces_smaller_output() -> None:
    source = jpeg(800, 600)
    high = encode_webp(source, max_width=0, quality=90)
    low = encode_webp(source, max_width=0, quality=45)
    assert len(low.data) < len(high.data)


def test_rejects_a_non_image_payload() -> None:
    """An HTML error page served with a 200 must not become a frame."""
    with pytest.raises(ImageDecodeError):
        encode_webp(b"<html><body>404 Not Found</body></html>", 1024, 78)


def test_rejects_empty_payload() -> None:
    with pytest.raises(ImageDecodeError):
        encode_webp(b"", 1024, 78)


def test_rejects_a_truncated_image() -> None:
    """verify() must catch the truncation before a full decode is attempted."""
    truncated = jpeg(800, 600)[:200]
    with pytest.raises(ImageDecodeError):
        encode_webp(truncated, 1024, 78)


def test_converts_greyscale_and_palette_sources() -> None:
    """Not every camera serves RGB; the encoder must normalise."""
    for mode in ("L", "P", "RGBA"):
        buffer = io.BytesIO()
        Image.new(mode, (320, 240)).save(buffer, "PNG")
        frame = encode_webp(buffer.getvalue(), 1024, 78)
        assert frame.data[:4] == b"RIFF", mode
        assert (frame.width, frame.height) == (320, 240), mode


def test_reports_mean_luminance() -> None:
    """Measured during encode because the image is already decoded there.

    Recovering it later would mean re-reading and re-decoding every frame
    on disk, which is precisely what the names-only directory scan exists
    to avoid.
    """

    def flat(level: int) -> bytes:
        buffer = io.BytesIO()
        Image.new("RGB", (64, 48), (level, level, level)).save(buffer, "JPEG")
        return buffer.getvalue()

    assert encode_webp(flat(200), 1024, 78).luma == 200
    assert encode_webp(flat(40), 1024, 78).luma == 40
    # Monotonic in brightness is all the deflicker maths relies on.
    assert (
        encode_webp(flat(30), 1024, 78).luma
        < encode_webp(flat(120), 1024, 78).luma
        < encode_webp(flat(220), 1024, 78).luma
    )
