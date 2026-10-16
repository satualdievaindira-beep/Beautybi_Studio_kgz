"""Простой сервер для статического сайта Beauty Bi Studio.
Запуск:  python server.py   (порт берётся из переменной PORT, по умолчанию 8000)
"""
import os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get("PORT", "8000"))


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "public, max-age=300")
        super().end_headers()


if __name__ == "__main__":
    handler = partial(Handler, directory=ROOT)
    with ThreadingHTTPServer(("0.0.0.0", PORT), handler) as httpd:
        print(f"Сайт запущен: http://localhost:{PORT}")
        httpd.serve_forever()
