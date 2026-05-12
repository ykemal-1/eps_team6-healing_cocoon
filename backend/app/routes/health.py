"""
Health check routes - no authentication required.
"""

from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """
    Health check endpoint.
    Used by deployment tools and monitoring to verify the backend is running.
    """
    return {"status": "ok", "service": "Healing Cocoon Backend"}


@router.get("/api/public/ping")
async def public_ping():
    """
    Public ping endpoint for testing.
    Accessible without authentication.
    """
    return {"message": "pong", "status": "connected"}


@router.get("/api/public/clerk-config")
async def public_clerk_config():
    """
    Public frontend auth config.
    Exposes only the Clerk publishable key (never the secret key).
    """
    return {"publishableKey": settings.CLERK_PUBLISHABLE_KEY}
