# Healing Cocoon Backend

Clean FastAPI backend for the Healing Cocoon student project.

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Run the Backend

**Option A: Using the launcher script**

```bash
python run.py
```

**Option B: Using uvicorn directly**

```bash
uvicorn app.main:app --reload
```

The backend will start on `http://127.0.0.1:8000`

### 3. Check It's Working

**Health check:**

```bash
curl http://127.0.0.1:8000/health
```

**Public ping (no auth required):**

```bash
curl http://127.0.0.1:8000/api/public/ping
```

**API documentation (interactive):**
Open http://127.0.0.1:8000/docs in your browser

---

## Architecture Overview

```
app/
├── main.py              → FastAPI app setup, route registration, CORS
├── core/
│   ├── config.py        → Configuration settings
│   └── auth.py          → Authentication/authorization (Bearer token)
├── db/
│   ├── database.py      → SQLAlchemy setup
│   └── init_db.py       → Database initialization
├── models/
│   ├── session.py       → SessionModel (ORM)
│   └── settings.py      → SettingsModel (ORM)
├── schemas/
│   ├── auth.py          → Pydantic schemas for auth
│   ├── session.py       → Pydantic schemas for sessions
│   └── settings.py      → Pydantic schemas for settings
├── routes/
│   ├── health.py        → Health check endpoints (no auth)
│   ├── auth.py          → Authentication endpoints
│   ├── sessions.py      → Session CRUD endpoints
│   ├── settings.py      → Settings endpoints
│   └── accessibility.py → Accessibility endpoints
├── services/
│   ├── session_service.py    → Session business logic
│   └── settings_service.py   → Settings business logic
└── hardware/
    ├── projector.py     → Projector controller (placeholder)
    ├── scent.py         → Scent diffuser controller (placeholder)
    ├── audio.py         → Audio system controller (placeholder)
    └── cocoon_controller.py  → Master cocoon coordinator
```

---

## API Endpoints

### Public Endpoints (No Authentication)

**Health Check**

```http
GET /health
```

**Public Ping**

```http
GET /api/public/ping
```

### Protected Endpoints (Require Bearer Token)

All protected endpoints expect an `Authorization` header with a Bearer token:

```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Get Current User**

```http
GET /api/me
```

**Sessions**

```http
POST /api/sessions                    → Create session
GET /api/sessions                     → List all sessions
GET /api/sessions/{session_id}        → Get session by ID
PATCH /api/sessions/{session_id}      → Update session
DELETE /api/sessions/{session_id}     → Delete session
```

**Settings**

```http
GET /api/settings                     → Get practice settings
POST /api/settings                    → Update settings
```

**Accessibility**

```http
GET /api/accessibility                → Get accessibility settings
POST /api/accessibility               → Update accessibility settings
```

---

## How to Call the Backend from Frontend

Your frontend HTML pages can call this backend using `fetch()`. Here's how:

### 1. Public Endpoint (No Auth)

```javascript
// Test public endpoint
fetch("http://127.0.0.1:8000/api/public/ping")
    .then((res) => res.json())
    .then((data) => console.log(data))
    .catch((err) => console.error("Error:", err));
```

### 2. Protected Endpoint (With Bearer Token)

```javascript
// Example: Get current user (requires auth)
const token = "your_bearer_token_here";

fetch("http://127.0.0.1:8000/api/me", {
    method: "GET",
    headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    },
})
    .then((res) => res.json())
    .then((data) => console.log(data))
    .catch((err) => console.error("Error:", err));
```

### 3. Create a Session

```javascript
const token = "your_bearer_token_here";
const sessionData = {
    child_name: "Emma",
    age_range: "8-12",
    environment: "Ocean",
    sound_level: "Soft",
    scent_level: "Medium",
    duration_minutes: 15,
    wheelchair_access: false,
    removable_seat: false,
    low_stimulation_mode: false,
    caregiver_assistance: true,
    notes: "First time visitor, a bit nervous",
};

fetch("http://127.0.0.1:8000/api/sessions", {
    method: "POST",
    headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    },
    body: JSON.stringify(sessionData),
})
    .then((res) => res.json())
    .then((data) => {
        console.log("Session created:", data);
        sessionId = data.id;
    })
    .catch((err) => console.error("Error:", err));
```

### 4. Get All Sessions

```javascript
const token = "your_bearer_token_here";

fetch("http://127.0.0.1:8000/api/sessions", {
    method: "GET",
    headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    },
})
    .then((res) => res.json())
    .then((data) => console.log("All sessions:", data))
    .catch((err) => console.error("Error:", err));
```

### 5. Update a Session

```javascript
const token = "your_bearer_token_here";
const sessionId = 1;

fetch(`http://127.0.0.1:8000/api/sessions/${sessionId}`, {
    method: "PATCH",
    headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    },
    body: JSON.stringify({
        status: "active",
    }),
})
    .then((res) => res.json())
    .then((data) => console.log("Session updated:", data))
    .catch((err) => console.error("Error:", err));
```

### 6. Get/Update Settings

```javascript
const token = "your_bearer_token_here";

// GET settings
fetch("http://127.0.0.1:8000/api/settings", {
    method: "GET",
    headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    },
})
    .then((res) => res.json())
    .then((data) => console.log("Current settings:", data))
    .catch((err) => console.error("Error:", err));

// UPDATE settings
const settingsUpdates = {
    practice_name: "Bright Smile Dental",
    default_environment: "Forest",
    number_of_cocoons: 3,
};

fetch("http://127.0.0.1:8000/api/settings", {
    method: "POST",
    headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    },
    body: JSON.stringify(settingsUpdates),
})
    .then((res) => res.json())
    .then((data) => console.log("Settings updated:", data))
    .catch((err) => console.error("Error:", err));
```

---

## Authentication Notes

### Current Status (Placeholder)

For now, the backend accepts **any non-empty Bearer token** as valid. This is for development purposes.

### Real Clerk Integration (TODO)

To integrate with Clerk authentication:

1. **Update `app/core/auth.py`:**
    - Replace the mock verification with real Clerk API calls
    - Import Clerk SDK
    - Validate tokens against Clerk
    - Extract user info from Clerk

2. **Frontend changes:**
    - Get Clerk token in your login flow
    - Pass it in Authorization header for protected routes

Example Clerk integration snippet (for later):

```python
# TODO: Real Clerk integration
import httpx

async def verify_token(credentials: HTTPAuthCredentials = Depends(security)) -> StaffUser:
    token = credentials.credentials

    # Call Clerk API to verify
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.clerk.com/v1/verify",
            headers={"Authorization": f"Bearer {token}"}
        )
        user_data = response.json()

    return StaffUser(
        staff_id=user_data['id'],
        email=user_data['email']
    )
```

---

## Database

The backend uses **SQLite** with automatic initialization:

- **File:** `healing_cocoon.db` (created automatically in project root)
- **Tables:**
    - `sessions` - Child cocoon sessions
    - `settings` - Practice settings and preferences

To reset the database:

```bash
# Delete the database file
rm healing_cocoon.db

# Restart the backend (will recreate empty database)
python run.py
```

---

## CORS (Cross-Origin Requests)

The backend allows frontend requests from:

- `http://localhost:3000`
- `http://localhost:5500`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:5500`
- `file://` (local development)

If your frontend is on a different port/domain, update `CORS_ORIGINS` in `app/core/config.py`.

---

## Hardware Integration (Placeholders)

The `app/hardware/` folder contains placeholder classes ready for future device integration:

- **ProjectorController** - Control environment visuals
- **ScentController** - Control scent diffuser
- **AudioController** - Control audio system
- **CocoonController** - Coordinate all hardware

Each has TODO comments showing where real hardware APIs would be integrated.

Example usage:

```python
from app.hardware.cocoon_controller import CocoonController

cocoon = CocoonController("cocoon_001")
cocoon.start_session(
    environment="Ocean",
    sound_level="Soft",
    scent_level="Medium"
)
# All hardware starts in sync

cocoon.emergency_stop()  # Emergency shutdown
```

---

## Development Checklist

- [x] FastAPI app with CORS enabled
- [x] SQLite database with SQLAlchemy ORM
- [x] Placeholder authentication (Bearer token)
- [x] Session CRUD endpoints
- [x] Settings management endpoints
- [x] Hardware controller placeholders
- [ ] Real Clerk authentication (future)
- [ ] Hardware device integration (future)
- [ ] Session telemetry logging (future)
- [ ] WebSocket support for real-time updates (future)

---

## Troubleshooting

**Port already in use:**

```bash
# Use a different port
uvicorn app.main:app --port 8001 --reload
```

**Database locked error:**

```bash
# SQLite sometimes locks; try restarting the backend
python run.py
```

**Import errors:**

```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

**CORS errors:**
Update `CORS_ORIGINS` in `app/core/config.py` to match your frontend URL.

---

## Questions?

Refer to the code comments throughout the backend - they explain design decisions and show where TODO items are located for future enhancements.
