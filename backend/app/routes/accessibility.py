"""
Accessibility settings routes.
"""

from fastapi import APIRouter, Depends
from app.core.auth import verify_staff_request

router = APIRouter(prefix="/api/accessibility", tags=["accessibility"])


@router.get("")
async def get_accessibility_settings(
    current_user: dict = Depends(verify_staff_request),
):
    """
    Get accessibility settings.
    Requires: Bearer token in Authorization header

    Currently returns mock accessibility configuration.
    TODO: Connect to database model for persistence.
    """
    return {
        "reducedMotion": False,
        "highContrast": False,
        "largeText": False,
        "focusIndicators": True,
    }


@router.post("")
async def update_accessibility_settings(
    settings: dict, current_user: dict = Depends(verify_staff_request)
):
    """
    Update accessibility settings.
    Requires: Bearer token in Authorization header

    TODO: Persist accessibility settings to database.
    """
    return {"message": "Accessibility settings updated", "settings": settings}
