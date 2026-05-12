"""
Business logic for settings management.
"""

from sqlalchemy.orm import Session
from app.models.settings import SettingsModel
from app.schemas.settings import SettingsUpdate


def get_or_create_settings(db: Session) -> SettingsModel:
    """Get the single settings record, creating it if needed."""
    settings = db.query(SettingsModel).first()

    if not settings:
        # Create default settings
        settings = SettingsModel(
            practice_name="Healing Cocoon Clinic",
            contact_email="info@clinic.com",
            contact_phone="+32 123 45 67 89",
            location="Main Street 10, Antwerp",
            number_of_cocoons=2,
            default_environment="Ocean",
            default_sound_level="Soft",
            default_scent_level="Soft",
            default_session_duration=10,
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)

    return settings


def update_settings(db: Session, settings_data: SettingsUpdate) -> SettingsModel:
    """Update practice settings."""
    settings = get_or_create_settings(db)

    update_data = settings_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(settings, key, value)

    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings
