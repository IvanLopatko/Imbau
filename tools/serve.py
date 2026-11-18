#!/usr/bin/env python3
"""Local preview server for the prototype that forbids caching.

The plain `python3 -m http.server` lets the browser keep old copies of HTML pages
for hours, so after an edit some pages still show the previous version.
This server answers every request with `Cache-Control: no-store`.

Run from the prototype folder:  python3 tools/serve.py [port]   (default 8766)
"""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, max-age=0')
        super().end_headers()

    def log_message(self, fmt, *args):  # keep the terminal quiet
        pass


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8766
    root = Path(__file__).resolve().parent.parent
    handler = partial(NoCacheHandler, directory=str(root))
    print(f'IMBAU prototype: http://127.0.0.1:{port}/sitemap.html  (no caching)')
    ThreadingHTTPServer(('127.0.0.1', port), handler).serve_forever()
