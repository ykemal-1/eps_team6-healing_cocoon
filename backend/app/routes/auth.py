"""
Authentication routes.
"""

from fastapi import APIRouter, Depends
from app.core.auth import verify_staff_request

router = APIRouter(prefix="/api", tags=["auth"])


@router.get("/me")
async def get_current_user_info(user: dict = Depends(verify_staff_request)):
    """
    Protected route for authenticated staff users.

    Returns the Clerk-authenticated payload so the frontend can identify
    the signed-in staff member.
    """
    return {"message": "Authenticated", "user": user}
