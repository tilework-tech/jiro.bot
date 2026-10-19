"""Local preview of site/ on port 4310 that maps extensionless page URLs to their .html files."""
import http.server
import os
import pathlib

SITE = pathlib.Path(__file__).resolve().parent.parent / "site"


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map,
                      ".md": "text/markdown; charset=utf-8", ".txt": "text/plain; charset=utf-8"}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(SITE), **kwargs)

    def send_head(self):
        path = self.path.split("?")[0]
        if not os.path.splitext(path)[1] and path != "/" and (SITE / f"{path.lstrip('/')}.html").exists():
            self.path = f"{path}.html"
        return super().send_head()


http.server.ThreadingHTTPServer(("0.0.0.0", int(os.environ.get("PORT", "4310"))), Handler).serve_forever()
