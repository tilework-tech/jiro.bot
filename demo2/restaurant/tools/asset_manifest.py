#!/usr/bin/env python3
"""Write or check a deterministic inventory of shipped and reference assets."""
from __future__ import annotations

import argparse
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs" / "ASSETS.md"
EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".mp4", ".webm", ".svg", ".wav", ".ogg", ".woff", ".woff2", ".ttf", ".zip"}
SKIP_DIRS = {"node_modules", "dist", ".git", "__pycache__"}


def assets():
    for path in sorted(ROOT.rglob("*")):
        if not path.is_file() or path.suffix.lower() not in EXTENSIONS:
            continue
        if SKIP_DIRS.intersection(path.relative_to(ROOT).parts):
            continue
        yield path


def manifest():
    lines = [
        "# Asset manifest\n",
        "All binary images, video, fonts, audio, and archives in this demo snapshot are listed below. Paths are relative to `restaurant/`. Reuse these exact files to recreate the saved demo.\n",
        "Regenerate or verify this file with `python3 tools/asset_manifest.py` or `python3 tools/asset_manifest.py --check`. Build output and installed dependencies are excluded.\n",
        "| Asset | Bytes | SHA-256 |",
        "|---|---:|---|",
    ]
    for path in assets():
        relative = path.relative_to(ROOT).as_posix()
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        lines.append(f"| `{relative}` | {path.stat().st_size} | `{digest}` |")
    return "\n".join(lines) + "\n"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    result = manifest()
    if args.check:
        if not OUTPUT.exists() or OUTPUT.read_text() != result:
            raise SystemExit("Asset manifest does not match this snapshot")
        print("Asset manifest verified")
    else:
        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT.write_text(result)
        print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    main()
