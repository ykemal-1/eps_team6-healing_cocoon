"""
Session management routes.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession
from app.db.database import get_db
from app.core.auth import verify_staff_request
from app.schemas.session import SessionCreate, SessionUpdate, SessionResponse
from app.services.session_service import (
    create_session,
    get_session,
    list_sessions,
    update_session,
    delete_session,
)

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.post("", response_model=SessionResponse)
async def create_new_session(
    session_data: SessionCreate,
    current_user: dict = Depends(verify_staff_request),
    db: DBSession = Depends(get_db),
):
    """
    Create a new cocoon session for a child.
    Requires: Bearer token in Authorization header

    Returns the created session with ID.
    """
    staff_id = current_user.get("sub") or current_user.get("user_id") or "unknown_staff"
    db_session = create_session(
        db=db, session_data=session_data, created_by_staff_id=staff_id
    )
    return db_session


@router.get("")
async def list_all_sessions(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(verify_staff_request),
    db: DBSession = Depends(get_db),
):
    """
    List all sessions.
    Requires: Bearer token in Authorization header

    Query parameters:
    - skip: Number of sessions to skip (default: 0)
    - limit: Maximum number of sessions to return (default: 100)
    """
    sessions = list_sessions(db, skip=skip, limit=limit)
    return {
        "message": "Sessions fetched",
        "staff_user_id": current_user.get("sub") or current_user.get("user_id"),
        "items": sessions,
    }


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session_by_id(
    session_id: int,
    current_user: dict = Depends(verify_staff_request),
    db: DBSession = Depends(get_db),
):
    """
    Get a specific session by ID.
    Requires: Bearer token in Authorization header
    """
    db_session = get_session(db, session_id)
    if not db_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
        )
    return db_session


@router.patch("/{session_id}", response_model=SessionResponse)
async def update_session_by_id(
    session_id: int,
    session_data: SessionUpdate,
    current_user: dict = Depends(verify_staff_request),
    db: DBSession = Depends(get_db),
):
    """
    Update a session (e.g., change status to 'active' or 'completed').
    Requires: Bearer token in Authorization header
    """
    db_session = update_session(db, session_id, session_data)
    if not db_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
        )
    return db_session


@router.delete("/{session_id}")
async def delete_session_by_id(
    session_id: int,
    current_user: dict = Depends(verify_staff_request),
    db: DBSession = Depends(get_db),
):
    """
    Delete a session.
    Requires: Bearer token in Authorization header
    """
    success = delete_session(db, session_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
        )
    return {"message": "Session deleted successfully"}
