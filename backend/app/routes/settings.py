"""
Practice settings management routes.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as DBSession
from app.db.database import get_db
from app.core.auth import verify_staff_request
from app.schemas.settings import SettingsUpdate, SettingsResponse
from app.services.settings_service import get_or_create_settings, update_settings

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=SettingsResponse)
async def get_settings(
    current_user: dict = Depends(verify_staff_request), db: DBSession = Depends(get_db)
):
    """
    Get current practice settings.
    Requires: Bearer token in Authorization header

    Returns the clinic configuration including defaults and preferences.
    """
    settings = get_or_create_settings(db)
    return settings


@router.post("", response_model=SettingsResponse)
async def update_practice_settings(
    settings_data: SettingsUpdate,
    current_user: dict = Depends(verify_staff_request),
    db: DBSession = Depends(get_db),
):
    """
    Update practice settings.
    Requires: Bearer token in Authorization header

    Only the fields you provide will be updated; omitted fields remain unchanged.
    """
    settings = update_settings(db, settings_data)
    return settings
