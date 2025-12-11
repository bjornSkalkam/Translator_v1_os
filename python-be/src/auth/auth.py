import os
import logging
import requests
from flask import request, make_response, jsonify
from jose import jwt
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# Load from environment
API_KEY = os.getenv("API_KEY", "change-me-in-production")
TENANT_ID = os.getenv("TENANT_ID")
CLIENT_ID = os.getenv("CLIENT_ID")

JWKS_URL = f"https://login.microsoftonline.com/{TENANT_ID}/discovery/v2.0/keys"
ISSUER = f"https://login.microsoftonline.com/{TENANT_ID}/v2.0"

# cache JWKS keys
_jwks_cache = None


def get_jwks_keys():
    global _jwks_cache
    if _jwks_cache is None:
        resp = requests.get(JWKS_URL)
        resp.raise_for_status()
        _jwks_cache = resp.json()
    return _jwks_cache


def validate_jwt_token(token):
    keys = get_jwks_keys()
    header = jwt.get_unverified_header(token)

    key = next((k for k in keys["keys"] if k["kid"] == header["kid"]), None)
    if not key:
        raise Exception("Public key not found.")

    payload = jwt.decode(
        token,
        key,
        algorithms=["RS256"],
        audience=CLIENT_ID,
        issuer=ISSUER,
    )

    return payload


def register_auth_check(app):
    @app.before_request
    def verify_auth():
        logger.debug("verify_auth: method=%s, path=%s", request.method, request.path)
        if request.method == "OPTIONS":
            return

        # Skip auth for docs, health checks, static files, frontend routes
        if (
            request.path.startswith("/docs")
            or request.path.startswith("/api/docs")
            or request.path.startswith("/api/swagger")
            or request.path.startswith("/api/v1/misc/ping")
            or request.path.startswith("/swagger")
            or request.path.startswith("/swaggerui")
            or request.path.startswith("/openapi")
            or request.path.startswith("/static")
            or not request.path.startswith("/api/")
        ):
            return

        # First check API key (internal services)
        provided_key = request.headers.get("x-api-key")
        if provided_key == API_KEY:
            logger.debug("Authenticated with API key")
            return

        # If no API key, try Bearer token (Microsoft Entra)
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]
            try:
                payload = validate_jwt_token(token)
                logger.debug(
                    "Authenticated with Microsoft Entra token. Subject: %s",
                    payload.get("sub"),
                )
                return
            except Exception as e:
                logger.warning("JWT validation error: %s", str(e))

        # If neither succeeded
        return make_response(
            jsonify({"error": "Invalid or missing authentication"}), 401
        )
