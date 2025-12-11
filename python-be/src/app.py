"""
DEBUG version of src/app.py - 02-04-2025
──────────────────────────────────────────
• Serves the Vite bundle for the React SPA.
• Logs every directory it checks for static assets / index.html.
• Prints a “running version …” banner and a startup scan of all
  candidate index.html files.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, abort, request, send_from_directory
from flask_cors import CORS
from flask_restx import Api

from auth import register_auth_check
from db.sql import init_db
from routes.misc import ns_misc
from routes.sessions import ns_sessions
from routes.languages import ns_languages

__version__ = "0.5.0‑debug"

# ── basic setup ──────────────────────────────────────────────────────────────
load_dotenv()
logging.basicConfig(level=logging.INFO)
logging.info("🚀 running version %s of app.py", __version__)

BASE_DIR = Path(__file__).resolve().parent  # /app/src
APP_DIR = BASE_DIR.parent  # /app

CANDIDATE_STATIC_DIRS: list[Path] = [
    BASE_DIR / "static",  # /app/src/static      ← expected
    APP_DIR / "static",  # /app/static
    APP_DIR / "public",  # /app/public
    BASE_DIR / "public",  # /app/src/public
    Path("/app/static"),
    Path("/app/src/static"),
    Path.cwd() / "static",
    Path.cwd() / "src" / "static",
    Path("/frontend/dist"),
    Path("/tmp/static"),
]

PRIMARY_STATIC = CANDIDATE_STATIC_DIRS[0]

app = Flask(
    __name__,
    static_folder=str(PRIMARY_STATIC),
    static_url_path="/static",  # expose assets at /static/…
)

CORS(
    app,
    resources={r"/api/v1/*": {"origins": "*"}},
    allow_headers=["Content-Type", "x-api-key"],
)

init_db(app)
register_auth_check(app)

api = Api(
    app,
    title="Translator API",
    version="1.0",
    prefix="/api",
    doc="/api/docs",
)

api.add_namespace(ns_misc, path="/v1/misc")
api.add_namespace(ns_sessions, path="/v1/sessions")
api.add_namespace(ns_languages, path="/v1/languages")


# ── helpers ──────────────────────────────────────────────────────────────────
def _log_candidate(kind: str, target: Path, exists: bool) -> None:
    logging.info("[DEBUG] %-6s %s → %s", kind, target, "FOUND" if exists else "missing")


# all debug logs
# @app.before_request
# def _log_request() -> None:
#     logging.info(
#         "[REQ] %s %s | %s", request.method, request.path, dict(request.headers)
#     )


# ── SPA / asset catch‑all ────────────────────────────────────────────────────
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def spa(path: str):
    """
    • /api/* handled by blueprints.
    • Returns the requested static asset if found.
    • Otherwise falls back to index.html from the first directory that has it.
    """
    logging.info("[DEBUG] spa() entered with path='%s'", path)

    if path.startswith("api/"):
        abort(404)

    if path:  # asset request
        for d in CANDIDATE_STATIC_DIRS:
            candidate = d / path
            _log_candidate("ASSET", candidate, candidate.exists())
            if candidate.exists():
                return send_from_directory(d, path)

    # index.html fallback
    for d in CANDIDATE_STATIC_DIRS:
        candidate = d / "index.html"
        _log_candidate("INDEX", candidate, candidate.exists())
        if candidate.exists():
            return send_from_directory(d, "index.html")

    logging.error("[404] index.html not found in any candidate directory")
    return "Not Found", 404


# ── main ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    # Startup scan: which candidate index.html files actually exist?
    logging.info("🔍 startup scan of candidate index.html locations:")
    for d in CANDIDATE_STATIC_DIRS:
        try:
            p = d / "index.html"
            logging.info("    %s → %s", "FOUND " if p.exists() else "missing", p)
        except Exception as exc:  # noqa: BLE001
            logging.warning("    error checking %s: %s", d, exc)

    port = int(os.getenv("PORT", 80))
    logging.info("Starting Flask dev server on port %s", port)
    app.run(host="0.0.0.0", port=port, debug=True)
