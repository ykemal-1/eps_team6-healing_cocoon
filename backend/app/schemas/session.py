"""
Session request/response schemas.
"""

from datetime import datetime
from pydantic import BaseModel


class SessionCreate(BaseModel):
    """Schema for creating a new session."""

    child_name: str
    age_range: str
    environment: str
    sound_level: str
    scent_level: str
    duration_minutes: int
    wheelchair_access: bool = False
    removable_seat: bool = False
    low_stimulation_mode: bool = False
    caregiver_assistance: bool = False
    notes: str | None = None


class SessionUpdate(BaseModel):
    """Schema for updating a session."""

    status: str | None = None
    notes: str | None = None


class SessionResponse(BaseModel):
    """Schema for session responses."""

    id: int
    child_name: str
    age_range: str
    environment: str
    sound_level: str
    scent_level: str
    duration_minutes: int
    wheelchair_access: bool
    removable_seat: bool
    low_stimulation_mode: bool
    caregiver_assistance: bool
    notes: str | None
    status: str
    created_by_staff_id: str
    created_at: datetime

    class Config:
        from_attributes = True
