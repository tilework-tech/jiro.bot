"""Jiro's geometry: the v6 box model, CSS transform chains and bubble layout.

All lengths here are in output pixels unless a name says "ref". The v6
mascot is a 92 x 90 box: an 83.1px tall art layer (the SVG, viewBox
0 -1 62 56) with a 4px shadow bar 2px below it.
"""

import functools
import math
from pathlib import Path

import numpy as np
from fontTools.ttLib import TTFont

FONT = Path(__file__).resolve().parent / "fonts" / "Inter-Regular.ttf"


def scale_for(spec, frame_height, mascot_height=None):
    height = mascot_height or round(spec.mascot["default_height_fraction"] * frame_height)
    return height / spec.mascot["ref_height"]


class Mascot:
    def __init__(self, spec, scale):
        m = spec.mascot
        self.spec, self.s = spec, scale
        self.w, self.h = m["ref_width"] * scale, m["ref_height"] * scale
        self.art_h = m["art"]["art_height"] * scale
        vb = m["art"]["view_box"]
        self.unit = self.art_h / vb[3]
        self.view_box = vb
        zzz = m["art"]["zzz"]
        self.zzz = (self.w - (zzz["width"] + zzz["right"]) * scale, zzz["top"] * scale,
                    self.w - zzz["right"] * scale, (zzz["top"] + zzz["font_size"]) * scale)
        sh = m["art"]["shadow"]
        sw = self.w * sh["width_fraction"]
        self.shadow = ((self.w - sw) / 2, self.art_h + sh["gap"] * scale, (self.w + sw) / 2,
                       self.art_h + (sh["gap"] + sh["height"]) * scale)
        self.puff = (self.w / 2 - 25 * scale, self.h - 2 * scale - 11 * scale, self.w / 2 + 25 * scale, self.h - 2 * scale)
        self.art_ink = self.view_to_local((1.0, -0.5, 60.3, 53.75))
        self.envelope = spec.envelope(scale)
        self.pad = spec.placement["text_padding"] * scale
        self.margin = spec.placement["edge_margin"] * scale

    def view_to_local(self, box):
        vx, vy = self.view_box[0], self.view_box[1]
        u = self.unit
        return ((box[0] - vx) * u, (box[1] - vy) * u, (box[2] - vx) * u, (box[3] - vy) * u)

    def core(self, x, y):
        """Everything he can draw while resting at (x, y), before text padding."""
        e = self.envelope
        return (x - e["side"], y + min(self.zzz[1], 0) - e["up"], x + max(self.w, self.zzz[2]) + e["side"],
                y + self.h + e["down"])

    def footprint(self, x, y):
        x0, y0, x1, y1 = self.core(x, y)
        return (x0 - self.pad, y0 - self.pad, x1 + self.pad, y1 + self.pad)


@functools.lru_cache(maxsize=1)
def _font():
    font = TTFont(str(FONT))
    return font["hmtx"].metrics, font.getBestCmap(), font["head"].unitsPerEm


def text_width(text, size):
    metrics, cmap, upem = _font()
    total = 0
    for ch in text:
        glyph = cmap.get(ord(ch)) or cmap.get(ord("?"))
        total += metrics[glyph][0]
    return total * size / upem


@functools.lru_cache(maxsize=256)
def wrap_cached(text, size, max_width):
    return tuple(wrap(text, size, max_width))


def wrap(text, size, max_width):
    words, lines, line = text.split(), [], ""
    for word in words:
        trial = f"{line} {word}".strip()
        if line and text_width(trial, size) > max_width:
            lines.append(line)
            line = word
        else:
            line = trial
    if line:
        lines.append(line)
    return lines or [""]


def bubble_size(spec, scale, text):
    """Wrapped lines, width and height of the bubble for a line of text."""
    b = spec.mascot["bubble"]
    s = scale
    size = b["font_size"] * s
    pad_y, pad_x = (v * s for v in b["padding"])
    border = b["border"] * s
    inner = b["max_width"] * s - 2 * (pad_x + border)
    lines = list(wrap_cached(text, size, inner))
    width = min(max(text_width(line, size) for line in lines) + 2 * (pad_x + border), b["max_width"] * s)
    height = max(len(lines) * size * b["line_height"] + 2 * (pad_y + border), b["min_height"] * s)
    return lines, math.ceil(width), height


def _overshoot(spec, width, height):
    """How far the bubble pop's overshoot reaches past the resting bubble, per side."""
    sx, sy = spec.peak("bubble_pop", "sx"), spec.peak("bubble_pop", "sy")
    return max(sx - 1, 0) * width / 2, max(sy - 1, 0) * height


def bubble_boxes(spec, scale, text, mascot_boxes, frame_size):
    """Space each bubble can cover, pop overshoot and drop shadow included, for (N, 4) mascot boxes."""
    b = spec.mascot["bubble"]
    _, width, height = bubble_size(spec, scale, text)
    ox, oy = _overshoot(spec, width, height)
    boxes = np.asarray(mascot_boxes, dtype=np.float64)
    edge, gap = b["edge_margin"] * scale, b["gap"] * scale
    left = np.clip((boxes[:, 0] + boxes[:, 2]) / 2 - width / 2, edge + ox, frame_size[0] - edge - ox - width)
    top = boxes[:, 1] - gap - height
    below = top - oy < edge
    top = np.where(below, boxes[:, 3] + gap, top)
    return np.stack([left - ox, top - oy, left + width + ox, top + height + 3 * scale], axis=1)


def bubble_layout(spec, scale, text, mascot_box, frame_size):
    """Box, wrapped lines and tail placement of the speech bubble for a resting mascot box."""
    b = spec.mascot["bubble"]
    s = scale
    size = b["font_size"] * s
    pad_y, pad_x = (v * s for v in b["padding"])
    border = b["border"] * s
    lines, width, height = bubble_size(spec, scale, text)
    x0, y0, x1, y1 = mascot_box
    ox, oy = _overshoot(spec, width, height)
    cx = (x0 + x1) / 2
    left = cx - width / 2
    edge = b["edge_margin"] * s
    W, _ = frame_size
    lo, hi = edge + ox, W - edge - ox - width
    dx = lo - left if left < lo else hi - left if left > hi else 0.0
    left += dx
    top = y0 - b["gap"] * s - height
    below = top - oy < edge
    if below:
        top = y1 + b["gap"] * s
    return {"box": [left, top, left + width, top + height + 3 * s],
            "reach": [left - ox, top - oy, left + width + ox, top + height + 3 * s], "lines": lines, "below": below,
            "dx": dx, "font_size": size, "line_height": size * b["line_height"], "pad": [pad_x, pad_y],
            "border": border, "radius": b["radius"] * s, "tail": [cx, y0 if not below else y1]}


def affine(tx=0.0, ty=0.0, rot=0.0, sx=1.0, sy=1.0, origin=(0.0, 0.0)):
    """CSS `translate(tx,ty) rotate(rot) scale(sx,sy)` about origin, as a 3x3 matrix."""
    ox, oy = origin
    r = math.radians(rot)
    c, s_ = math.cos(r), math.sin(r)
    m = np.array([[c * sx, -s_ * sy, 0.0], [s_ * sx, c * sy, 0.0], [0.0, 0.0, 1.0]])
    m[0, 2], m[1, 2] = tx, ty
    to = np.array([[1, 0, ox], [0, 1, oy], [0, 0, 1.0]])
    back = np.array([[1, 0, -ox], [0, 1, -oy], [0, 0, 1.0]])
    return to @ m @ back


def apply_box(matrix, box):
    x0, y0, x1, y1 = box
    pts = np.array([[x0, y0, 1], [x1, y0, 1], [x0, y1, 1], [x1, y1, 1]]).T
    out = matrix @ pts
    return [float(out[0].min()), float(out[1].min()), float(out[0].max()), float(out[1].max())]


def union(boxes):
    boxes = [b for b in boxes if b]
    if not boxes:
        return None
    return [min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes)]


def intersects(a, b):
    return a[0] < b[2] and b[0] < a[2] and a[1] < b[3] and b[1] < a[3]
