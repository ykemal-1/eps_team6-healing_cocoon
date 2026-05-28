"""
Authentication routes.
"""

from fastapi import APIRouter, Depends
from app.core.auth import get_demo_staff_user

router = APIRouter(prefix="/api", tags=["auth"])


@router.get("/me")
async def get_current_user_info(user: dict = Depends(get_demo_staff_user)):
    """
    Demo route that returns a stable staff identity.

    Returns a demo payload so the frontend can identify the staff member
    even when Clerk auth is not configured.
    """
    return {"message": "Demo authenticated", "user": user}
