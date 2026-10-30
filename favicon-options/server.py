"""Serve the review folder and save review notes locally; never serves site/."""
import argparse
import json
from http.server import SimpleHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def clean_path(self):
        path = urlsplit(self.path).path
        prefix = f"/port/{self.server.server_port}"
        if path == prefix or path.startswith(prefix + "/"):
            path = path[len(prefix):] or "/"
        return path

    def do_GET(self):
        self.path = self.clean_path()
        if self.path == "/review-notes.json" and not (ROOT / "review-notes.json").exists():
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b"{}")
        else:
            super().do_GET()

    def do_POST(self):
        if self.clean_path() != "/review-notes.json":
            self.send_error(404)
            return
        try:
            size = int(self.headers.get("Content-Length", "0"))
            if not 0 < size < 65536:
                raise ValueError("Invalid payload size")
            payload = json.loads(self.rfile.read(size))
            allowed = {c["id"] for c in json.loads((ROOT / "manifest.json").read_text())}
            if not isinstance(payload, dict) or not set(payload).issubset(allowed):
                raise ValueError("Invalid candidate")
            for value in payload.values():
                if not isinstance(value, dict) or not isinstance(value.get("notes"), str) or not isinstance(value.get("shortlisted"), bool):
                    raise ValueError("Invalid note")
        except (ValueError, TypeError):
            self.send_error(400, "Invalid review notes")
            return
        temporary = ROOT / "review-notes.json.tmp"
        temporary.write_text(json.dumps(payload, indent=2) + "\n")
        temporary.replace(ROOT / "review-notes.json")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(b'{"saved":true}')

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=4317)
    args = parser.parse_args()
    HTTPServer(("0.0.0.0", args.port), Handler).serve_forever()
