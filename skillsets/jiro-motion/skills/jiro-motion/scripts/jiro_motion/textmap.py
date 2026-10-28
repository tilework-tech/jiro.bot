"""Where text (and UI chrome) is on screen over time.

A TextMap holds boxes sampled at discrete times. Between two samples we do
not know what the footage shows, so a time interval is only "free" for a box
if every sample inside it, plus the nearest sample on either side that
belongs to the same scene, is free. Samples never leak across a scene cut.
"""

import bisect
import json
from pathlib import Path

import numpy as np

CELL = 4


class TextMap:
    def __init__(self, width, height, samples, cuts=(), busy=None, cell=CELL):
        self.width, self.height, self.cell = int(width), int(height), cell
        self.cuts = sorted(float(c) for c in cuts)
        pairs = sorted(((float(t), [self._box(b) for b in boxes]) for t, boxes in samples), key=lambda p: p[0])
        self.times = [t for t, _ in pairs]
        self.boxes = [b for _, b in pairs]
        self.busy = [np.asarray(b, dtype=np.float16) for b in busy] if busy is not None else None
        gw, gh = -(-self.width // cell), -(-self.height // cell)
        self._integral = []
        for boxes in self.boxes:
            mask = np.zeros((gh, gw), dtype=np.int32)
            for x0, y0, x1, y1, _ in boxes:
                c0, r0 = max(int(x0 // cell), 0), max(int(y0 // cell), 0)
                c1, r1 = min(int(-(-x1 // cell)), gw), min(int(-(-y1 // cell)), gh)
                if c1 > c0 and r1 > r0:
                    mask[r0:r1, c0:c1] = 1
            self._integral.append(self._sat(mask))
        self._busy_integral = ([self._sat(b.astype(np.float32)).astype(np.float32) for b in self.busy]
                               if self.busy is not None else None)
        self._sampled_scenes = {self.scene_index(t) for t in self.times}

    @staticmethod
    def _sat(grid):
        out = np.zeros((grid.shape[0] + 1, grid.shape[1] + 1), dtype=np.float64)
        out[1:, 1:] = grid.cumsum(0).cumsum(1)
        return out

    @staticmethod
    def _box(box):
        if isinstance(box, dict):
            x0, y0, x1, y1 = box["box"]
            return (float(x0), float(y0), float(x1), float(y1), box.get("label", "text"))
        x0, y0, x1, y1 = box[:4]
        return (float(x0), float(y0), float(x1), float(y1), box[4] if len(box) > 4 else "text")

    def _unsampled(self, t0, t1):
        """True if [t0, t1] touches a scene with no samples at all: nothing is known there."""
        if not self.times:
            return False
        return any(i not in self._sampled_scenes for i in range(self.scene_index(t0), self.scene_index(t1) + 1))

    def scene_index(self, t):
        return bisect.bisect_right(self.cuts, t + 1e-9)

    def sample_indices(self, t0, t1):
        """Samples governing [t0, t1]: those inside, plus the nearest same-scene neighbour each side."""
        if not self.times:
            return []
        lo = bisect.bisect_left(self.times, t0 - 1e-9)
        hi = bisect.bisect_right(self.times, t1 + 1e-9)
        picked = list(range(lo, hi))
        if lo > 0 and self.scene_index(self.times[lo - 1]) == self.scene_index(t0):
            picked.insert(0, lo - 1)
        if hi < len(self.times) and self.scene_index(self.times[hi]) == self.scene_index(t1):
            picked.append(hi)
        return picked

    def _cells(self, box):
        gh, gw = self._integral[0].shape[0] - 1, self._integral[0].shape[1] - 1
        x0, y0, x1, y1 = box[:4]
        c0, r0 = max(int(x0 // self.cell), 0), max(int(y0 // self.cell), 0)
        c1, r1 = min(int(-(-x1 // self.cell)), gw), min(int(-(-y1 // self.cell)), gh)
        return r0, c0, r1, c1

    @staticmethod
    def _sum(sat, r0, c0, r1, c1):
        return sat[r1, c1] - sat[r0, c1] - sat[r1, c0] + sat[r0, c0]

    def is_free(self, box, t0, t1, pad=0.0):
        x0, y0, x1, y1 = box[:4]
        padded = (x0 - pad, y0 - pad, x1 + pad, y1 + pad)
        if not self._integral:
            return True
        if self._unsampled(t0, t1):
            return False
        r0, c0, r1, c1 = self._cells(padded)
        if r1 <= r0 or c1 <= c0:
            return True
        for i in self.sample_indices(t0, t1):
            if self._sum(self._integral[i], r0, c0, r1, c1) > 0:
                return False
        return True

    def _cells_many(self, boxes):
        gh, gw = self._integral[0].shape[0] - 1, self._integral[0].shape[1] - 1
        b = np.asarray(boxes, dtype=np.float64)
        c0 = np.clip(np.floor(b[:, 0] / self.cell), 0, gw).astype(int)
        r0 = np.clip(np.floor(b[:, 1] / self.cell), 0, gh).astype(int)
        c1 = np.clip(np.ceil(b[:, 2] / self.cell), 0, gw).astype(int)
        r1 = np.clip(np.ceil(b[:, 3] / self.cell), 0, gh).astype(int)
        return r0, c0, np.maximum(r1, r0), np.maximum(c1, c0)

    def free_many(self, boxes, t0, t1, pad=0.0):
        """is_free for an (N, 4) array of boxes at once; returns a bool array."""
        b = np.asarray(boxes, dtype=np.float64) + np.array([-pad, -pad, pad, pad])
        free = np.ones(len(b), dtype=bool)
        if not self._integral or not len(b):
            return free
        if self._unsampled(t0, t1):
            return np.zeros(len(b), dtype=bool)
        r0, c0, r1, c1 = self._cells_many(b)
        for i in self.sample_indices(t0, t1):
            sat = self._integral[i]
            free &= (sat[r1, c1] - sat[r0, c1] - sat[r1, c0] + sat[r0, c0]) <= 0
        return free

    def cost_many(self, boxes, t0, t1):
        if not self._busy_integral:
            return np.zeros(len(boxes))
        r0, c0, r1, c1 = self._cells_many(boxes)
        area = np.maximum((r1 - r0) * (c1 - c0), 1)
        out = np.zeros(len(boxes))
        for i in self.sample_indices(t0, t1):
            sat = self._busy_integral[i]
            out = np.maximum(out, (sat[r1, c1] - sat[r0, c1] - sat[r1, c0] + sat[r0, c0]) / area)
        return out

    def free_until(self, box, t0, limit, pad=0.0):
        """Latest t <= limit such that box stays free over [t0, t]; t0 if not free at all."""
        if not self.is_free(box, t0, t0, pad):
            return t0
        later = [t for t in self.times if t0 < t <= limit + 1e-9]
        last = t0
        for t in later:
            if not self.is_free(box, t0, t, pad):
                end = t - 1e-3
                scene = self.scene_index(t)
                if scene > self.scene_index(t0):
                    end = min(end, self.cuts[scene - 1] - 1e-3)
                return max(t0, end)
            last = t
        return limit if self.is_free(box, t0, limit, pad) else last

    def boxes_at(self, t):
        """Every box that may be on screen at t (from the samples governing t)."""
        out = []
        for i in self.sample_indices(t, t):
            out.extend(self.boxes[i])
        return out

    def to_json(self):
        return json.dumps({
            "width": self.width, "height": self.height, "cell": self.cell, "cuts": self.cuts,
            "samples": [{"t": t, "boxes": [{"box": list(b[:4]), "label": b[4]} for b in boxes]}
                        for t, boxes in zip(self.times, self.boxes)],
        })

    def save(self, path):
        """Write <path> (boxes, JSON) and, if present, <path>.busy.npz (edge density grids)."""
        path = Path(path)
        path.write_text(self.to_json())
        if self.busy is not None:
            np.savez_compressed(str(path) + ".busy.npz", *self.busy)

    @classmethod
    def load(cls, path):
        path = Path(path)
        data = json.loads(path.read_text())
        busy_path = Path(str(path) + ".busy.npz")
        busy = None
        if busy_path.exists():
            with np.load(busy_path) as npz:
                busy = [npz[f"arr_{i}"] for i in range(len(npz.files))]
        return cls(data["width"], data["height"], [(s["t"], s["boxes"]) for s in data["samples"]],
                   cuts=data["cuts"], busy=busy, cell=data.get("cell", CELL))
