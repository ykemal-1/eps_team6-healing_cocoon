"""
Database initialization script.
Creates tables on startup.
"""

from app.db.database import Base, engine


def init_db():
    """Create all database tables."""
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()
    print("✓ Database tables created successfully")
