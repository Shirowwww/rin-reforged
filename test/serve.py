#!/usr/bin/env python3
"""Serve test/pages over HTTP.

The pages keep their .php names so the script sees a realistic
location; python's default handler would send those as a download, so
the extension is mapped to text/html here.

    python test/serve.py [port]
"""

import functools
import http.server
import os
import socketserver
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8731
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "pages")


class Handler(http.server.SimpleHTTPRequestHandler):
    # charset spelled out on every type, because the board spells it
    # out and a page that does not gets decoded as windows-1252. The
    # bundle inlined into these pages carries Russian release words, a
    # middot and an ellipsis; mis-decoded, one of its character classes
    # becomes a range out of order and the whole script dies on that
    # page alone. That is not a bug worth reproducing in the harness.
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".php": "text/html; charset=utf-8",
        ".html": "text/html; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
    }

    def end_headers(self):
        """?tt=1 turns Trusted Types on for that response.

        Two features fetch a page of the board and parse it, and under
        `require-trusted-types-for 'script'` the only way to do that
        throws. Whether the policy the script creates actually rescues
        it is not a thing to reason about — it is a header away.
        """
        if "tt=1" in (self.path.split("?", 1)[1] if "?" in self.path else ""):
            self.send_header("Content-Security-Policy", "require-trusted-types-for 'script'")
        super().end_headers()

    def translate_path(self, path):
        """Let ?start=N pick a different file.

        A static server answers viewtopic.php?start=0 and
        viewtopic.php?start=60 with the same bytes, which makes a
        multi-page topic impossible to fixture — and reading every page
        of a topic is exactly what the index does. So a request whose
        query carries start=N is served from <name>.start-N.php when
        that file exists, and from the plain file when it does not.
        """
        query = ""
        if "?" in path:
            path, query = path.split("?", 1)
        resolved = super().translate_path(path)

        start = None
        for part in query.split("&"):
            if part.startswith("start="):
                start = part[len("start="):]
        if start is not None and resolved.endswith(".php"):
            variant = resolved[: -len(".php")] + ".start-" + start + ".php"
            if os.path.exists(variant):
                return variant
        return resolved

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    handler = functools.partial(Handler, directory=ROOT)
    # Threaded: one hanging request must not block the whole page.
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    socketserver.ThreadingTCPServer.daemon_threads = True
    with socketserver.ThreadingTCPServer(("127.0.0.1", PORT), handler) as httpd:
        print("http://localhost:%d/forum/viewforum.php?f=10" % PORT)
        httpd.serve_forever()
