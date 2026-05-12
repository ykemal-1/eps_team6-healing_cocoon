"""
Business logic for session management.
"""

from sqlalchemy.orm import Session
from app.models.session import SessionModel
from app.schemas.session import SessionCreate, SessionUpdate


def create_session(
    db: Session, session_data: SessionCreate, created_by_staff_id: str
) -> SessionModel:
    """Create a new cocoon session."""
    db_session = SessionModel(
        **session_data.model_dump(),
        created_by_staff_id=created_by_staff_id,
        status="pending"
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session


def get_session(db: Session, session_id: int) -> SessionModel | None:
    """Get a session by ID."""
    return db.query(SessionModel).filter(SessionModel.id == session_id).first()


def list_sessions(db: Session, skip: int = 0, limit: int = 100) -> list[SessionModel]:
    """List all sessions with pagination."""
    return db.query(SessionModel).offset(skip).limit(limit).all()


def update_session(
    db: Session, session_id: int, session_data: SessionUpdate
) -> SessionModel | None:
    """Update a session."""
    db_session = get_session(db, session_id)
    if not db_session:
        return None

    update_data = session_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_session, key, value)

    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session


def delete_session(db: Session, session_id: int) -> bool:
    """Delete a session."""
    db_session = get_session(db, session_id)
    if not db_session:
        return False

    db.delete(db_session)
    db.commit()
    return True
