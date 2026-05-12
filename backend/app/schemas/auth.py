"""
Authentication request/response schemas.
"""

from pydantic import BaseModel


class UserResponse(BaseModel):
    """Response model for authenticated user info."""

    staff_id: str
    email: str

    class Config:
        from_attributes = True
