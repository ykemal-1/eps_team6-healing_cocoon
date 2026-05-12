"""
Settings request/response schemas.
"""

from datetime import datetime
from pydantic import BaseModel


class SettingsUpdate(BaseModel):
    """Schema for updating practice settings."""

    practice_name: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    location: str | None = None
    number_of_cocoons: int | None = None

    default_environment: str | None = None
    default_sound_level: str | None = None
    default_scent_level: str | None = None
    default_session_duration: int | None = None
    auto_start_child_view: bool | None = None

    session_end_notifications: bool | None = None
    emergency_stop_alerts: bool | None = None
    daily_usage_summary: bool | None = None
    maintenance_reminders: bool | None = None

    store_session_history: bool | None = None
    anonymize_child_names: bool | None = None
    auto_clear_session_data: bool | None = None


class SettingsResponse(BaseModel):
    """Schema for settings responses."""

    id: int
    practice_name: str
    contact_email: str
    contact_phone: str
    location: str
    number_of_cocoons: int

    default_environment: str
    default_sound_level: str
    default_scent_level: str
    default_session_duration: int
    auto_start_child_view: bool

    session_end_notifications: bool
    emergency_stop_alerts: bool
    daily_usage_summary: bool
    maintenance_reminders: bool

    store_session_history: bool
    anonymize_child_names: bool
    auto_clear_session_data: bool

    updated_at: datetime

    class Config:
        from_attributes = True
