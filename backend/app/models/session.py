"""
Session database model.
Represents a child's cocoon session.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from app.db.database import Base


class SessionModel(Base):
    """Database model for a cocoon session."""

    __tablename__ = "sessions"

    # Core identifiers
    id = Column(Integer, primary_key=True, index=True)

    # Child information
    child_name = Column(String(255), nullable=False)
    age_range = Column(String(50), nullable=False)  # e.g., "5-8", "8-12"

    # Environment settings
    environment = Column(
        String(100), nullable=False
    )  # Ocean, Forest, Space, Calm Garden
    sound_level = Column(String(50), nullable=False)  # Soft, Medium, Strong
    scent_level = Column(String(50), nullable=False)  # Soft, Medium, Strong
    duration_minutes = Column(Integer, nullable=False)

    # Accessibility settings
    wheelchair_access = Column(Boolean, default=False)
    removable_seat = Column(Boolean, default=False)
    low_stimulation_mode = Column(Boolean, default=False)
    caregiver_assistance = Column(Boolean, default=False)

    # Additional info
    notes = Column(Text, nullable=True)

    # Session state
    status = Column(
        String(50), default="pending"
    )  # pending, active, completed, cancelled

    # Tracking
    created_by_staff_id = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Session {self.id}: {self.child_name} - {self.environment}>"
