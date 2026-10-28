"""jiro-motion CLI. Run through scripts/jm, which manages the virtualenv."""

import argparse
import sys

from .spec import DEFAULT_SPEC


def main(argv=None):
    parser = argparse.ArgumentParser(prog="jm", description="Render Jiro as a transparent overlay on any video.")
    sub = parser.add_subparsers(dest="command", required=True)

    r = sub.add_parser("render", help="footage in; overlay.webm, overlay.mov, composite.mp4, debug.mp4 and check report out")
    r.add_argument("input", help="input video (any ffmpeg-readable file)")
    r.add_argument("--out", required=True, help="output directory")
    r.add_argument("--type", default="product_demo", help="video type column of the frequency table")
    r.add_argument("--seed", type=int, default=0, help="seed; same seed + same input = same overlay")
    r.add_argument("--lines", help="lines to say: .txt (one per line) or .json ([\"text\"] or [{text, scene|at}])")
    r.add_argument("--cuts", help="comma-separated cut times in seconds, or 'none'; default: auto-detect hard cuts")
    r.add_argument("--mascot-height", type=float, help="mascot box height in px (default 10%% of frame height)")
    r.add_argument("--sample-interval", type=float, default=0.5, help="seconds between text-detection samples")
    r.add_argument("--reuse-textmap", action="store_true", help="reuse OUT/textmap.json from an earlier run")
    r.add_argument("--no-debug", action="store_true", help="skip debug.mp4")
    r.add_argument("--spec", default=str(DEFAULT_SPEC))

    c = sub.add_parser("check", help="re-run the checker on a render directory")
    c.add_argument("out")
    c.add_argument("--type", help="video type (default: the one the render used)")
    c.add_argument("--spec", default=str(DEFAULT_SPEC))

    t = sub.add_parser("tables", help="print the human-readable spec tables (Markdown) generated from the JSON")
    t.add_argument("--spec", default=str(DEFAULT_SPEC))
    t.add_argument("--write", help="write to this file instead of stdout")

    v = sub.add_parser("review", help="build a static review page for a render directory")
    v.add_argument("out")
    v.add_argument("--title", default="Jiro motion review")
    v.add_argument("--spec", default=str(DEFAULT_SPEC))

    args = parser.parse_args(argv)
    if args.command == "render":
        from .render import run
        return run(args)
    if args.command == "check":
        import json
        from pathlib import Path
        from .render import run_check
        from .spec import load_spec
        video_type = args.type or json.loads((Path(args.out) / "timeline.json").read_text())["video_type"]
        report = run_check(load_spec(args.spec), video_type, args.out)
        print(report.to_markdown())
        return 0 if report.passed else 2
    if args.command == "tables":
        from .tables import markdown
        from .spec import load_spec
        text = markdown(load_spec(args.spec))
        if args.write:
            from pathlib import Path
            Path(args.write).write_text(text)
        else:
            print(text)
        return 0
    if args.command == "review":
        from .review import build
        from .spec import load_spec
        print(build(load_spec(args.spec), args.out, args.title))
        return 0
    return 1


if __name__ == "__main__":
    sys.exit(main())
