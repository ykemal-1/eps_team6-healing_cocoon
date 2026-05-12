"""
Practice settings database model.
Stores clinic configuration and preferences.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.db.database import Base


class SettingsModel(Base):
    """Database model for practice/clinic settings."""

    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)

    # Practice information
    practice_name = Column(String(255), nullable=False, default="Clinic")
    contact_email = Column(String(255), nullable=False)
    contact_phone = Column(String(20), nullable=False)
    location = Column(String(500), nullable=False)
    number_of_cocoons = Column(Integer, default=1)

    # Session defaults
    default_environment = Column(String(100), default="Ocean")
    default_sound_level = Column(String(50), default="Soft")
    default_scent_level = Column(String(50), default="Soft")
    default_session_duration = Column(Integer, default=10)  # minutes
    auto_start_child_view = Column(Boolean, default=False)

    # Notification settings
    session_end_notifications = Column(Boolean, default=True)
    emergency_stop_alerts = Column(Boolean, default=True)
    daily_usage_summary = Column(Boolean, default=False)
    maintenance_reminders = Column(Boolean, default=True)

    # Data handling settings
    store_session_history = Column(Boolean, default=True)
    anonymize_child_names = Column(Boolean, default=False)
    auto_clear_session_data = Column(Boolean, default=False)

    # Tracking
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Settings: {self.practice_name}>"
