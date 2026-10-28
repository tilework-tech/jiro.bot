"""Find text and UI chrome in the footage, frame by sampled frame.

Two detectors run on each sampled frame:

- Text: RapidOCR's DBNet text detector (PaddleOCR models on ONNX Runtime, CPU
  only, models ship inside the wheel). Detection only, no recognition: we need
  where text is, not what it says. It finds words in UI labels, buttons, code
  and captions as well as paragraphs.
- Chrome: dense edge regions (Canny) that are not text, such as icons, button
  outlines, avatars, charts and screenshots-within-screenshots. Their density
  also gives every cell a "busyness" cost, so Jiro prefers flat colour.

Boxes from both become a TextMap that the scheduler and checker share.
"""

import cv2
import numpy as np

from .textmap import CELL, TextMap
from .video import frames as decode

_ENGINE = None


def _engine():
    global _ENGINE
    if _ENGINE is None:
        from rapidocr_onnxruntime import RapidOCR
        _ENGINE = RapidOCR()
    return _ENGINE


def text_boxes(rgb, min_side=4):
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    result, _ = _engine()(bgr, use_det=True, use_cls=False, use_rec=False)
    out = []
    for quad in result or []:
        pts = np.asarray(quad, dtype=np.float64)
        x0, y0 = pts.min(axis=0)
        x1, y1 = pts.max(axis=0)
        if x1 - x0 >= min_side and y1 - y0 >= min_side:
            out.append((float(x0), float(y0), float(x1), float(y1), "text"))
    return out


def busy_grid(rgb, cell=CELL, window=16):
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    edges = cv2.Canny(gray, 60, 160).astype(np.float32) / 255.0
    density = cv2.blur(edges, (window, window))
    h, w = gray.shape
    gh, gw = -(-h // cell), -(-w // cell)
    padded = np.zeros((gh * cell, gw * cell), dtype=np.float32)
    padded[:h, :w] = density
    return padded.reshape(gh, cell, gw, cell).mean(axis=(1, 3))


def chrome_boxes(grid, threshold, text, cell=CELL, min_cells=6):
    mask = (grid > threshold).astype(np.uint8)
    for x0, y0, x1, y1, _ in text:
        mask[int(y0 // cell):int(-(-y1 // cell)), int(x0 // cell):int(-(-x1 // cell))] = 0
    count, _, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
    out = []
    for i in range(1, count):
        x, y, w, h, area = stats[i]
        if area >= min_cells:
            out.append((float(x * cell), float(y * cell), float((x + w) * cell), float((y + h) * cell), "chrome"))
    return out


def sample_times(duration, cuts, interval):
    """Every `interval` seconds within each scene, starting one frame after each cut."""
    bounds = [0.0] + list(cuts) + [duration]
    times = []
    for a, b in zip(bounds, bounds[1:]):
        t = a + (0.04 if a > 0 else 0.0)
        while t < b - 1e-6:
            times.append(round(t, 3))
            t += interval
        if times and b - times[-1] > interval / 2 and b - 0.05 > times[-1]:
            times.append(round(b - 0.05, 3))
    return sorted(set(times))


def build_textmap(path, info, cuts, interval=0.5, chrome_threshold=0.18, progress=None):
    """Decode the video once, run both detectors on the sampled frames, return a TextMap."""
    times = sample_times(info["duration"], cuts, interval)
    wanted = {}
    last_frame = max(int(info["duration"] * info["fps"]) - 1, 0)
    for t in times:
        wanted.setdefault(min(int(round(t * info["fps"])), last_frame), []).append(t)
    last = max(wanted)
    samples, busy = [], []
    for index, rgb in enumerate(decode(path)):
        if index in wanted:
            text = text_boxes(rgb)
            grid = busy_grid(rgb)
            boxes = text + chrome_boxes(grid, chrome_threshold, text)
            for t in wanted[index]:
                samples.append((t, boxes))
                busy.append(grid)
            if progress:
                progress(len(samples), len(times))
        if index >= last:
            break
    missing = [t for t in times if t not in {s for s, _ in samples}]
    if missing:
        raise RuntimeError(f"could not decode frames for text detection at {missing[:5]} s; the video may be truncated")
    return TextMap(info["width"], info["height"], samples, cuts=cuts, busy=busy)
