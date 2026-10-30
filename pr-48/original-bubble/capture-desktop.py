#!/usr/bin/env python3
"""Capture the existing X11 desktop as lossless PNG using only Python's stdlib."""

import argparse
import ctypes as C
import os
from pathlib import Path
import struct
import sys
import zlib


class XImage(C.Structure):
    _fields_ = [
        ("width", C.c_int), ("height", C.c_int),
        ("xoffset", C.c_int), ("format", C.c_int),
        ("data", C.c_void_p), ("byte_order", C.c_int),
        ("bitmap_unit", C.c_int), ("bitmap_bit_order", C.c_int),
        ("bitmap_pad", C.c_int), ("depth", C.c_int),
        ("bytes_per_line", C.c_int), ("bits_per_pixel", C.c_int),
        ("red_mask", C.c_ulong), ("green_mask", C.c_ulong),
        ("blue_mask", C.c_ulong),
    ]


def chunk(kind, payload):
    return (struct.pack("!I", len(payload)) + kind + payload
            + struct.pack("!I", zlib.crc32(kind + payload) & 0xFFFFFFFF))


def capture(display_name):
    x = C.CDLL("libX11.so.6")
    signatures = {
        "XOpenDisplay": ([C.c_char_p], C.c_void_p),
        "XDefaultScreen": ([C.c_void_p], C.c_int),
        "XDefaultRootWindow": ([C.c_void_p], C.c_ulong),
        "XDisplayWidth": ([C.c_void_p, C.c_int], C.c_int),
        "XDisplayHeight": ([C.c_void_p, C.c_int], C.c_int),
        "XGetImage": ([C.c_void_p, C.c_ulong, C.c_int, C.c_int,
                       C.c_uint, C.c_uint, C.c_ulong, C.c_int], C.POINTER(XImage)),
        "XDestroyImage": ([C.POINTER(XImage)], C.c_int),
        "XCloseDisplay": ([C.c_void_p], C.c_int),
    }
    for name, (arguments, result) in signatures.items():
        function = getattr(x, name)
        function.argtypes = arguments
        function.restype = result
    display = x.XOpenDisplay(display_name.encode())
    if not display:
        raise RuntimeError(f"Cannot open X11 display {display_name}")
    image = None
    try:
        screen = x.XDefaultScreen(display)
        width = x.XDisplayWidth(display, screen)
        height = x.XDisplayHeight(display, screen)
        image = x.XGetImage(display, x.XDefaultRootWindow(display), 0, 0,
                            width, height, C.c_ulong(-1).value, 2)
        if not image:
            raise RuntimeError("XGetImage did not return a desktop image")
        info = image.contents
        if (info.byte_order, info.bits_per_pixel, info.red_mask,
                info.green_mask, info.blue_mask) != (0, 32, 0xFF0000, 0xFF00, 0xFF):
            raise RuntimeError("Expected the session display's little-endian BGRX format")
        pixels = C.string_at(info.data, info.bytes_per_line * height)
        rows = bytearray()
        for y in range(height):
            row = pixels[y * info.bytes_per_line:y * info.bytes_per_line + width * 4]
            rgb = bytearray(width * 3)
            rgb[0::3], rgb[1::3], rgb[2::3] = row[2::4], row[1::4], row[0::4]
            rows.append(0)
            rows.extend(rgb)
        png = (b"\x89PNG\r\n\x1a\n"
               + chunk(b"IHDR", struct.pack("!2I5B", width, height, 8, 2, 0, 0, 0))
               + chunk(b"IDAT", zlib.compress(rows))
               + chunk(b"IEND", b""))
        return png, width, height
    finally:
        if image:
            x.XDestroyImage(image)
        x.XCloseDisplay(display)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", help="PNG output path, or - for standard output")
    parser.add_argument("--display", default=os.environ.get("DISPLAY") or ":1")
    args = parser.parse_args()
    png, width, height = capture(args.display)
    if args.output == "-":
        sys.stdout.buffer.write(png)
    else:
        Path(args.output).write_bytes(png)
    print(f"Captured {width}x{height} desktop from {args.display}", file=sys.stderr)


if __name__ == "__main__":
    main()
