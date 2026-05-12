"""Authentication utilities and dependencies for staff-only endpoints."""

import logging
from typing import Any

from clerk_backend_api import Clerk
from clerk_backend_api.security import AuthenticateRequestOptions
from fastapi import HTTPException, Request, status

from app.core.config import settings

logger = logging.getLogger(__name__)

# Reusable Clerk backend client.
# It is also used as the source of the secret key for token verification.
clerk = Clerk(bearer_auth=settings.CLERK_SECRET_KEY)


def _build_auth_options() -> AuthenticateRequestOptions:
    """Build Clerk authenticate_request options from environment configuration."""
    return AuthenticateRequestOptions(
        secret_key=settings.CLERK_SECRET_KEY,
        authorized_parties=(
            [settings.CLERK_AUTHORIZED_PARTY]
            if settings.CLERK_AUTHORIZED_PARTY
            else None
        ),
        # Accept any valid Clerk token type (session_token, jwt, etc.)
        accepts_token=["any"],
    )


async def verify_staff_request(request: Request) -> dict[str, Any]:
    """
    FastAPI dependency for staff-only authentication.

    Expected header:
    Authorization: Bearer <Clerk session token>

    Returns:
    - Clerk JWT payload when the request is authenticated.

    Raises:
    - HTTP 401 when token is missing or invalid.
    """
    if not settings.CLERK_SECRET_KEY:
        logger.error("[verify_staff_request] CLERK_SECRET_KEY is not set!")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Server is missing CLERK_SECRET_KEY",
        )

    # Debug: Log what we're receiving
    auth_header = request.headers.get("Authorization", "")
    logger.info(
        f"[verify_staff_request] Authorization header present: {bool(auth_header)}"
    )

    if not auth_header:
        logger.warning("[verify_staff_request] ✗ No Authorization header found!")
    elif auth_header.startswith("Bearer "):
        token_preview = auth_header[7:70] if len(auth_header) > 7 else "N/A"
        logger.info(
            f"[verify_staff_request] ✓ Bearer token found, preview: {token_preview}..."
        )
    else:
        logger.warning(
            f"[verify_staff_request] ✗ Auth header doesn't start with 'Bearer': {auth_header[:30]}..."
        )

    # The Clerk SDK can authenticate a FastAPI Request directly.
    try:
        request_state = clerk.authenticate_request(request, _build_auth_options())
        logger.info(
            f"[verify_staff_request] Clerk auth result - is_signed_in: {request_state.is_signed_in}, has_payload: {request_state.payload is not None}"
        )

        if request_state.is_signed_in:
            logger.info(f"[verify_staff_request] ✓ Clerk auth succeeded")
        else:
            logger.warning(
                f"[verify_staff_request] ✗ Clerk auth failed (is_signed_in=False)"
            )

    except Exception as e:
        logger.error(
            f"[verify_staff_request] ✗ Clerk.authenticate_request threw error: {type(e).__name__}: {e}"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation error: {str(e)}",
        )

    if not request_state.is_signed_in or request_state.payload is None:
        logger.warning(
            f"[verify_staff_request] ✗ Final auth check failed - is_signed_in={request_state.is_signed_in}, payload={request_state.payload is not None}"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized",
        )

    logger.info(f"[verify_staff_request] ✓ Auth successful, returning payload")
    return request_state.payload


# Backward-compatible alias used by existing routes.
get_current_user = verify_staff_request
