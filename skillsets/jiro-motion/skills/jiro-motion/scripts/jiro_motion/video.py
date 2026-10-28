"""ffmpeg plumbing: probe, decode, cut detection and the alpha encoders.

Uses the static ffmpeg shipped by imageio-ffmpeg (libvpx-vp9, prores_ks,
libx264), so nothing has to be installed system-wide.
"""

import re
import subprocess

import imageio_ffmpeg
import numpy as np

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


def probe(path):
    reader = imageio_ffmpeg.read_frames(str(path))
    meta = next(reader)
    reader.close()
    log = subprocess.run([FFMPEG, "-hide_banner", "-i", str(path)], capture_output=True, text=True).stderr
    return {"width": meta["size"][0], "height": meta["size"][1], "fps": float(meta["fps"]),
            "duration": float(meta["duration"]), "audio": bool(re.search(r"Stream #.*Audio", log))}


def frames(path, pix_fmt="rgb24", decoder=None):
    """Yield every frame of a video as a numpy array (rgb24 or rgba)."""
    info = probe(path)
    channels = 4 if pix_fmt == "rgba" else 3
    cmd = [FFMPEG, "-v", "error"]
    if decoder:
        cmd += ["-c:v", decoder]
    cmd += ["-i", str(path), "-f", "rawvideo", "-pix_fmt", pix_fmt, "-"]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    size = info["width"] * info["height"] * channels
    finished = False
    try:
        while True:
            buf = proc.stdout.read(size)
            if len(buf) < size:
                finished = True
                break
            yield np.frombuffer(buf, dtype=np.uint8).reshape(info["height"], info["width"], channels)
    finally:
        proc.stdout.close()
        if not finished:
            proc.kill()
        err = proc.stderr.read().decode(errors="replace")
        proc.stderr.close()
        if proc.wait() and finished:
            raise RuntimeError(f"ffmpeg could not decode {path}: {err.strip()}")


def detect_cuts(path, min_jump=2.5, ratio=3.0, window=3):
    """Hard cut times (seconds): frames whose change is a spike against its neighbours.

    Every frame is shrunk to 64x36 and compared with the previous one (mean
    absolute RGB difference, 0..255). Scrolling and animation change many
    consecutive frames by similar amounts; a cut is a single frame whose
    change is `ratio` times bigger than any of the `window` frames around it.
    ffmpeg's scdet missed two of three cuts between dark UI pages in testing,
    which is why this does not use it.
    """
    info = probe(path)
    proc = subprocess.run([FFMPEG, "-v", "error", "-i", str(path), "-vf", "scale=64:36", "-f", "rawvideo",
                           "-pix_fmt", "rgb24", "-"], capture_output=True, check=True)
    small = np.frombuffer(proc.stdout, dtype=np.uint8).reshape(-1, 36, 64, 3).astype(np.float32)
    if len(small) < 2:
        return []
    diff = np.abs(np.diff(small, axis=0)).mean(axis=(1, 2, 3))
    cuts = []
    for i, d in enumerate(diff):
        around = np.concatenate([diff[max(i - window, 0):i], diff[i + 1:i + 1 + window]])
        if d > min_jump and d > ratio * (around.max() if len(around) else 0.0) + 0.5:
            cuts.append(round((i + 1) / info["fps"], 3))
    return cuts


class OverlayWriter:
    """Writes RGBA frames to WebM (VP9 + alpha) and ProRes 4444 (.mov) at once."""

    def __init__(self, webm, mov, size, fps):
        w, h = size
        source = ["-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{w}x{h}", "-r", f"{fps:g}", "-i", "-"]
        self.procs = [
            subprocess.Popen([FFMPEG, "-v", "error", "-y", *source, "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p",
                              "-b:v", "0", "-crf", "20", "-row-mt", "1", "-deadline", "good", "-cpu-used", "4",
                              "-auto-alt-ref", "0", "-metadata:s:v:0", "alpha_mode=1", str(webm)],
                             stdin=subprocess.PIPE),
            subprocess.Popen([FFMPEG, "-v", "error", "-y", *source, "-c:v", "prores_ks", "-profile:v", "4444",
                              "-pix_fmt", "yuva444p10le", "-vendor", "apl0", str(mov)], stdin=subprocess.PIPE),
        ]

    def write(self, rgba):
        data = np.ascontiguousarray(rgba).tobytes()
        for proc in self.procs:
            proc.stdin.write(data)

    def close(self):
        for proc in self.procs:
            proc.stdin.close()
        codes = [proc.wait() for proc in self.procs]
        if any(codes):
            raise RuntimeError(f"overlay encoder failed with exit codes {codes}")


class Mp4Writer:
    def __init__(self, path, size, fps, crf=18):
        w, h = size
        self.proc = subprocess.Popen([FFMPEG, "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
                                      "-s", f"{w}x{h}", "-r", f"{fps:g}", "-i", "-", "-c:v", "libx264",
                                      "-crf", str(crf), "-preset", "medium", "-pix_fmt", "yuv420p",
                                      "-movflags", "+faststart", str(path)], stdin=subprocess.PIPE)

    def write(self, rgb):
        self.proc.stdin.write(np.ascontiguousarray(rgb).tobytes())

    def close(self):
        self.proc.stdin.close()
        if self.proc.wait():
            raise RuntimeError("mp4 encoder failed")


def composite(input_path, overlay_mov, out_mp4, has_audio):
    cmd = [FFMPEG, "-v", "error", "-y", "-i", str(input_path), "-i", str(overlay_mov), "-filter_complex",
           "[0:v][1:v]overlay=0:0:format=auto:shortest=1[v]", "-map", "[v]"]
    if has_audio:
        cmd += ["-map", "0:a", "-c:a", "copy"]
    cmd += ["-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
            str(out_mp4)]
    subprocess.run(cmd, check=True)


def encode_poster(rgb, path):
    import cv2
    cv2.imwrite(str(path), cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 88])
