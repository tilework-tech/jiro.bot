#!/usr/bin/env python3
"""Scratch verification of installed and regenerated Original bubble assets."""
from pathlib import Path
import struct
import sys
import zlib

ROOT = Path(__file__).resolve().parents[2]
REFERENCE = ROOT / '.local/option1-reference'
REGENERATED = ROOT / '.local/options-round/favicon-options/01-bubble'
MAPPING = {
    'site/img/favicon.svg': 'source.svg',
    'site/img/favicon-16x16.png': '16.png',
    'site/img/favicon-32x32.png': '32.png',
    'site/img/favicon-48x48.png': '48.png',
    'site/img/apple-touch-icon.png': '180.png',
    'site/favicon.ico': 'favicon.ico',
    'site/jiro-16px.png': '16.png',
}


def png(data):
    assert data[:8] == b'\x89PNG\r\n\x1a\n', 'PNG signature'
    position = 8
    chunks = []
    while position < len(data):
        length = struct.unpack_from('>I', data, position)[0]
        kind = data[position + 4:position + 8]
        chunk = data[position + 8:position + 8 + length]
        crc = struct.unpack_from('>I', data, position + 8 + length)[0]
        assert zlib.crc32(kind + chunk) & 0xffffffff == crc, 'PNG CRC'
        position += length + 12
        if kind == b'IHDR':
            width, height, depth, color, compression, filtering, interlace = struct.unpack('>IIBBBBB', chunk)
        if kind == b'IDAT':
            chunks.append(chunk)
    assert (depth, color, compression, filtering, interlace) == (8, 6, 0, 0, 0), 'Expected noninterlaced RGBA8 PNG'
    raw = zlib.decompress(b''.join(chunks))
    stride = width * 4
    assert len(raw) == height * (stride + 1), 'PNG scanline length'
    output = bytearray()
    previous = bytearray(stride)
    for y in range(height):
        filter_type = raw[y * (stride + 1)]
        row = bytearray(raw[y * (stride + 1) + 1:(y + 1) * (stride + 1)])
        for x in range(stride):
            left = row[x - 4] if x >= 4 else 0
            above = previous[x]
            upper_left = previous[x - 4] if x >= 4 else 0
            if filter_type == 0:
                predictor = 0
            elif filter_type == 1:
                predictor = left
            elif filter_type == 2:
                predictor = above
            elif filter_type == 3:
                predictor = (left + above) // 2
            elif filter_type == 4:
                estimate = left + above - upper_left
                distances = [abs(estimate - left), abs(estimate - above), abs(estimate - upper_left)]
                predictor = [left, above, upper_left][distances.index(min(distances))]
            else:
                raise AssertionError(f'Unknown PNG filter {filter_type}')
            row[x] = (row[x] + predictor) % 256
        output.extend(row)
        previous = row
    return width, height, bytes(output)


def ico(data):
    reserved, kind, count = struct.unpack_from('<HHH', data)
    assert (reserved, kind, count) == (0, 1, 3), 'Expected three-frame ICO'
    frames = {}
    for index in range(count):
        width, height, colors, reserved, planes, bpp, length, offset = struct.unpack_from('<BBBBHHII', data, 6 + index * 16)
        frame = data[offset:offset + length]
        assert width == height and width in [16, 32, 48], 'ICO dimensions'
        if frame.startswith(b'\x89PNG'):
            decoded_width, decoded_height, rgba = png(frame)
            assert (width, height) == (decoded_width, decoded_height), 'ICO embedded PNG dimensions'
        else:
            header_size, dib_width, dib_height, dib_planes, dib_bpp, compression = struct.unpack_from('<IiiHHI', frame)
            assert (header_size, dib_width, dib_height, dib_planes, dib_bpp, compression) == (40, width, height * 2, 1, 32, 0), 'Expected uncompressed RGBA32 ICO DIB'
            output = bytearray()
            for y in range(height):
                for x in range(width):
                    position = 40 + ((height - 1 - y) * width + x) * 4
                    blue, green, red, alpha = frame[position:position + 4]
                    output.extend((red, green, blue, alpha))
            rgba = bytes(output)
        assert width not in frames, 'Duplicate ICO size'
        frames[width] = rgba
    assert set(frames) == {16, 32, 48}, 'ICO frame sizes'
    return frames


def check_art(size, rgba):
    assert len(rgba) == size * size * 4, 'RGBA length'
    alpha = rgba[3::4]
    assert min(alpha) == 0 and max(alpha) == 255, 'Transparent exterior and opaque interior'
    assert all(alpha[p] == 0 for p in [0, size - 1, size * (size - 1), size * size - 1]), 'Transparent corners'
    colors = {tuple(rgba[i:i + 4]) for i in range(0, len(rgba), 4)}
    assert (250, 248, 242, 255) in colors, 'Original cream body'
    assert (251, 94, 69, 255) in colors, 'Original orange face'
    assert any(g > r and g > b and a > 0 for r, g, b, a in colors), 'Original green perimeter'
    return f'{size}x{size}: alpha=0..255, transparent={alpha.count(0)}, opaque={alpha.count(255)}, four clear corners, original full color'


def verify(path, reference_name):
    actual = path.read_bytes()
    expected = (REFERENCE / reference_name).read_bytes()
    if reference_name.endswith('.svg'):
        assert actual == expected, 'SVG does not exactly match option 1 source'
        return 'exact original vector source'
    if reference_name.endswith('.ico'):
        actual_frames = ico(actual)
        expected_frames = ico(expected)
        assert actual_frames == expected_frames, 'Decoded ICO pixels differ from option 1'
        details = []
        for size, rgba in sorted(actual_frames.items()):
            _, _, reference_png = png((REFERENCE / f'{size}.png').read_bytes())
            assert rgba == reference_png, 'ICO frame differs from matching reference PNG'
            details.append(check_art(size, rgba))
        return '; '.join(details)
    width, height, rgba = png(actual)
    expected_width, expected_height, expected_rgba = png(expected)
    size = int(reference_name.split('.')[0])
    assert (width, height) == (expected_width, expected_height) == (size, size), 'PNG dimensions'
    assert rgba == expected_rgba, 'Decoded PNG pixels differ from option 1'
    return check_art(size, rgba)


def main():
    failures = 0
    checks = [(ROOT / destination, source) for destination, source in MAPPING.items()]
    checks += [(REGENERATED / source, source) for source in dict.fromkeys(MAPPING.values())]
    for path, reference_name in checks:
        try:
            result = verify(path, reference_name)
            print(f'PASS {path.relative_to(ROOT)}: {result}')
        except (AssertionError, OSError, ValueError, struct.error, zlib.error) as error:
            failures += 1
            print(f'FAIL {path.relative_to(ROOT)}: {error}')
    print(f'{len(checks) - failures}/{len(checks)} checks passed; {failures} failed')
    return bool(failures)


if __name__ == '__main__':
    sys.exit(main())
