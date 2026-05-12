"""
Main FastAPI application for Healing Cocoon backend.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.init_db import init_db
from app.routes import (
    health,
    auth,
    sessions,
    settings as settings_routes,
    accessibility,
)

# Initialize database tables
init_db()

# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for the Healing Cocoon student project",
    version="1.0.0",
)

# Configure CORS to allow frontend to call this API
app.add_middleware(
    CORSMiddleware,
    # Frontend dev origins are configured in app/core/config.py -> CORS_ORIGINS
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, PATCH, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Include routes
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(sessions.router)
app.include_router(settings_routes.router)
app.include_router(accessibility.router)


@app.get("/")
async def root():
    """Root endpoint - API welcome message."""
    return {
        "message": "Welcome to Healing Cocoon Backend",
        "docs": "/docs",
        "health": "/health",
        "public_api": "/api/public/ping",
    }


if __name__ == "__main__":
    # Run with: python -m app.main
    # Or: uvicorn app.main:app --reload
    import uvicorn

    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
