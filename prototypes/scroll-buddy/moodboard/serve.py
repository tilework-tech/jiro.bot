#!/usr/bin/env python3
"""Serve the moodboard folder and persist picks to picks.json."""
import argparse
import json
import os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
PICKS = os.path.join(HERE, "picks.json")


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def _json(self, status, payload):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _is_picks(self):
        return self.path.split("?", 1)[0].rstrip("/").endswith("/picks.json")

    def do_GET(self):
        if self._is_picks():
            data = {}
            if os.path.exists(PICKS):
                with open(PICKS, encoding="utf-8") as fh:
                    data = json.load(fh)
            return self._json(200, data)
        return super().do_GET()

    def do_POST(self):
        if not self._is_picks():
            return self._json(404, {"error": "not found"})
        length = int(self.headers.get("Content-Length", "0"))
        try:
            data = json.loads(self.rfile.read(length) or b"{}")
        except json.JSONDecodeError as exc:
            return self._json(400, {"error": str(exc)})
        with open(PICKS, "w", encoding="utf-8") as fh:
            json.dump(data, fh, indent=2)
        return self._json(200, {"ok": True})


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=4330)
    args = parser.parse_args()
    server = ThreadingHTTPServer(("0.0.0.0", args.port), partial(Handler, directory=HERE))
    print(f"moodboard on http://0.0.0.0:{args.port}/", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
