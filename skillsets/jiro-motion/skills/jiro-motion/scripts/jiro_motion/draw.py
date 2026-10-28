"""Paint track frames as RGBA images with the exact v6 shapes and colours.

Each frame becomes a small SVG cropped to Jiro's ink and bubble, rasterised
by resvg with the bundled Inter font, then pasted into a transparent frame.
"""

import math

import cv2
import numpy as np
import resvg_py

from .geometry import FONT, Mascot, union

PUFF_DOTS = [(0, 0, 0), (-22, -2, 0), (-14, -6, 1), (14, -6, 1), (22, -2, 0)]


def _matrix(m):
    return f"matrix({m[0][0]:.5f} {m[1][0]:.5f} {m[0][1]:.5f} {m[1][1]:.5f} {m[0][2]:.3f} {m[1][2]:.3f})"


def _esc(text):
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


class Painter:
    def __init__(self, spec, scale):
        self.spec, self.s = spec, scale
        self.m = Mascot(spec, scale)
        self.art = spec.mascot["art"]
        self.c = self.art["colors"]

    def face_svg(self, frame):
        face = frame["face"]
        glyph = "cursor" if face == "glance" else face
        gx, gy = frame["glance"]
        paths = self.art["faces"][glyph].split("M")[1:]
        parts = []
        for d in paths:
            d = "M" + d
            if glyph == "eyes" and frame["eyes_sy"] != 1:
                nums = [float(v) for v in d.replace("M", " ").replace("h", " ").replace("v", " ").replace("z", " ").split()]
                cy = nums[1] + 3.5
                parts.append(f'<path d="{d}" transform="translate(0 {cy:.3f}) scale(1 {frame["eyes_sy"]:.4f}) translate(0 {-cy:.3f})"/>')
            else:
                parts.append(f'<path d="{d}"/>')
        if glyph == "cursor" and frame["cursor_on"]:
            x, y, w, h = self.art["cursor_block"]
            parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}"/>')
        return (f'<g fill="{self.c["face"]}" shape-rendering="crispEdges" transform="translate({gx:.3f} {gy:.3f})">'
                + "".join(parts) + "</g>")

    def mascot_svg(self, frame):
        m, s, op = self.m, self.s, frame["opacity"]
        vb = m.view_box
        unit = m.unit
        out = []
        sh = m.shadow
        shadow_op = op * frame["shadow"].get("opacity", 1.0)
        out.append(f'<g transform="{_matrix(frame["matrices"]["shadow"])}" opacity="{shadow_op:.4f}">'
                   f'<rect x="{sh[0]:.3f}" y="{sh[1]:.3f}" width="{sh[2] - sh[0]:.3f}" height="{sh[3] - sh[1]:.3f}" '
                   f'fill="{self.c["shadow"]}"/></g>')
        if frame["puff"] and frame["matrices"]["puff"]:
            cx, by = m.w / 2, m.h - 2 * s
            dots = []
            for dx, dy, spread in PUFF_DOTS:
                size = (4 + 2 * spread) * s
                colour = self.c["puff"] if spread == 0 else self.c["puff_light"]
                dots.append(f'<rect x="{cx + dx * s - size / 2:.3f}" y="{by - 4 * s + dy * s - spread * s:.3f}" '
                            f'width="{size:.3f}" height="{size:.3f}" fill="{colour}"/>')
            out.append(f'<g transform="{_matrix(frame["matrices"]["puff"])}" '
                       f'opacity="{op * frame["puff"]["opacity"]:.4f}">' + "".join(dots) + "</g>")
        art_op = op * frame["art_opacity"]
        out.append(
            f'<g transform="{_matrix(frame["matrices"]["art"])}" opacity="{art_op:.4f}">'
            f'<g transform="matrix({unit:.5f} 0 0 {unit:.5f} {-vb[0] * unit:.4f} {-vb[1] * unit:.4f})">'
            f'<path d="{self.art["body_fill"]}" fill="{self.c["body"]}" shape-rendering="crispEdges"/>'
            f'<path d="{self.art["body_line"]}" transform="{self.art["body_line_transform"]}" fill="{self.c["line"]}"/>'
            + self.face_svg(frame) + "</g></g>")
        if frame["zzz"] and frame["matrices"]["zzz"]:
            z = self.art["zzz"]
            x0, y0, _, _ = m.zzz
            out.append(f'<g transform="{_matrix(frame["matrices"]["zzz"])}" opacity="{op * frame["zzz"]["opacity"]:.4f}">'
                       f'<text x="{x0:.3f}" y="{y0 + z["font_size"] * s * 0.8:.3f}" font-family="Inter" '
                       f'font-size="{z["font_size"] * s:.3f}" letter-spacing="{z["letter_spacing"] * s:.3f}" '
                       f'fill="{self.c["zzz"]}">{_esc(z["text"])}</text></g>')
        return "".join(out)

    def bubble_svg(self, frame):
        bubble = frame["bubble"]
        if not bubble or bubble["opacity"] <= 1e-3:
            return ""
        lay, s = bubble["layout"], self.s
        x0, y0, x1, y1 = lay["box"]
        y1 -= 3 * s
        w, h = x1 - x0, y1 - y0
        bw, r = lay["border"], lay["radius"]
        tail_x = lay["tail"][0]
        ow, oh = (v * s for v in self.spec.mascot["bubble"]["tail"]["outer"])
        iw, ih = (v * s for v in self.spec.mascot["bubble"]["tail"]["inner"])
        if lay["below"]:
            outer = f"{tail_x - ow},{y0} {tail_x + ow},{y0} {tail_x},{y0 - oh}"
            inner = f"{tail_x - iw},{y0 + bw / 2} {tail_x + iw},{y0 + bw / 2} {tail_x},{y0 - ih}"
        else:
            outer = f"{tail_x - ow},{y1} {tail_x + ow},{y1} {tail_x},{y1 + oh}"
            inner = f"{tail_x - iw},{y1 - bw / 2} {tail_x + iw},{y1 - bw / 2} {tail_x},{y1 + ih}"
        text_parts, shown = [], bubble["shown"]
        pad_x, pad_y = lay["pad"]
        for k, line in enumerate(lay["lines"]):
            visible = line[:max(shown, 0)]
            shown -= len(line) + 1
            if visible:
                baseline = y0 + bw + pad_y + lay["line_height"] * k + (lay["line_height"] + lay["font_size"] * 0.72) / 2
                text_parts.append(f'<text x="{x0 + bw + pad_x:.3f}" y="{baseline:.3f}" font-family="Inter" '
                                  f'font-size="{lay["font_size"]:.3f}" fill="{self.c["bubble_text"]}">{_esc(visible)}</text>')
        return (f'<g transform="{_matrix(bubble["matrix"])}" opacity="{frame["opacity"] * bubble["opacity"]:.4f}">'
                f'<rect x="{x0:.3f}" y="{y0 + 3 * s:.3f}" width="{w:.3f}" height="{h:.3f}" rx="{r:.3f}" fill="{self.c["bubble_shadow"]}"/>'
                f'<rect x="{x0 + bw / 2:.3f}" y="{y0 + bw / 2:.3f}" width="{w - bw:.3f}" height="{h - bw:.3f}" rx="{r - bw / 2:.3f}" '
                f'fill="{self.c["bubble_bg"]}" stroke="{self.c["bubble_border"]}" stroke-width="{bw:.3f}"/>'
                f'<polygon points="{outer}" fill="{self.c["bubble_border"]}"/>'
                f'<polygon points="{inner}" fill="{self.c["bubble_bg"]}"/>'
                + "".join(text_parts) + "</g>")

    def paint(self, frame, size):
        W, H = size
        canvas = np.zeros((H, W, 4), dtype=np.uint8)
        if not frame["visible"]:
            return canvas
        area = union([frame["ink_box"], frame["bubble_box"]])
        x0, y0 = max(int(math.floor(area[0])) - 6, 0), max(int(math.floor(area[1])) - 6, 0)
        x1, y1 = min(int(math.ceil(area[2])) + 6, W), min(int(math.ceil(area[3])) + 6, H)
        if x1 <= x0 or y1 <= y0:
            return canvas
        svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{x1 - x0}" height="{y1 - y0}">'
               f'<g transform="translate({-x0} {-y0})">{self.mascot_svg(frame)}{self.bubble_svg(frame)}</g></svg>')
        png = resvg_py.svg_to_bytes(svg_string=svg, skip_system_fonts=True, font_files=[str(FONT)])
        tile = cv2.imdecode(np.frombuffer(bytes(png), dtype=np.uint8), cv2.IMREAD_UNCHANGED)
        tile = cv2.cvtColor(tile, cv2.COLOR_BGRA2RGBA)
        canvas[y0:y0 + tile.shape[0], x0:x0 + tile.shape[1]] = tile[:y1 - y0, :x1 - x0]
        return canvas


def render_frames(spec, track, size):
    painter = Painter(spec, track.scale)
    for frame in track.frames:
        yield painter.paint(frame, size)
