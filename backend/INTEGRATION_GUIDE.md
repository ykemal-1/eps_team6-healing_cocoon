# Frontend ↔ Backend Integration Guide

This guide shows how your frontend HTML/JavaScript pages in `frontend/pages/` can communicate with this backend.

## Setup Overview

```
Frontend (HTML/CSS/JS in browser)
         ↓ (HTTP fetch requests)
Backend (FastAPI on localhost:8000)
         ↓
Database (SQLite)
```

## Quick Integration Example

### 1. Update Your Frontend JavaScript

In your frontend pages (e.g., `frontend/pages/dashboard.html`), you can now fetch data from the backend.

**Example: Create a new session from new-session.html**

```javascript
// In frontend/js/new-session.js

const API_URL = "http://127.0.0.1:8000";
const BEARER_TOKEN = "demo_token"; // For now, any token works

async function saveSessionToBackend(sessionData) {
    try {
        const response = await fetch(`${API_URL}/api/sessions`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${BEARER_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                child_name: sessionData.childName,
                age_range: sessionData.ageRange,
                environment: sessionData.environment,
                sound_level: sessionData.soundLevel,
                scent_level: sessionData.scentLevel,
                duration_minutes: parseInt(sessionData.duration),
                wheelchair_access: sessionData.wheelchairAccess,
                removable_seat: sessionData.removableSeat,
                low_stimulation_mode: sessionData.lowStimulationMode,
                caregiver_assistance: sessionData.caregiverAssistance,
                notes: sessionData.notes,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const session = await response.json();
        console.log("Session saved to backend:", session);
        return session.id; // Return session ID for future reference
    } catch (error) {
        console.error("Error saving session:", error);
    }
}
```

### 2. Fetch Sessions List (Dashboard)

In `frontend/js/dashboard.js`:

```javascript
async function loadSessionsFromBackend() {
    try {
        const response = await fetch(`${API_URL}/api/sessions`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${BEARER_TOKEN}`,
                "Content-Type": "application/json",
            },
        });

        const sessions = await response.json();
        console.log("Sessions from backend:", sessions);

        // Now render sessions in your dashboard
        renderSessionsTable(sessions);
    } catch (error) {
        console.error("Error loading sessions:", error);
    }
}
```

### 3. Update Active Session Status

In `frontend/js/active-session.js`:

```javascript
async function endSessionInBackend(sessionId) {
    try {
        const response = await fetch(`${API_URL}/api/sessions/${sessionId}`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${BEARER_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                status: "completed",
            }),
        });

        const updatedSession = await response.json();
        console.log("Session ended:", updatedSession);
    } catch (error) {
        console.error("Error ending session:", error);
    }
}
```

### 4. Sync Settings Between Frontend & Backend

In `frontend/js/settings.js`:

```javascript
async function syncSettingsWithBackend() {
    try {
        // Load from backend
        const response = await fetch(`${API_URL}/api/settings`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${BEARER_TOKEN}`,
                "Content-Type": "application/json",
            },
        });

        const backendSettings = await response.json();

        // Compare with localStorage and merge
        const localSettings = JSON.parse(
            localStorage.getItem("healingCocoonPlatformSettings") || "{}",
        );

        // Update backend with any local changes
        if (Object.keys(localSettings).length > 0) {
            await fetch(`${API_URL}/api/settings`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${BEARER_TOKEN}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(localSettings),
            });
        }
    } catch (error) {
        console.error("Error syncing settings:", error);
    }
}
```

## Important Constants

Add this to the top of your frontend JavaScript files:

```javascript
// Backend Configuration
const BACKEND_URL = "http://127.0.0.1:8000";
const API_PREFIX = "/api";
const FULL_API_URL = BACKEND_URL + API_PREFIX;

// Authentication (placeholder - will use real Clerk token later)
const BEARER_TOKEN =
    localStorage.getItem("healingCocoonAuthToken") || "demo_token";

// API Endpoints
const ENDPOINTS = {
    HEALTH: `${BACKEND_URL}/health`,
    PING: `${FULL_API_URL}/public/ping`,
    ME: `${FULL_API_URL}/me`,
    SESSIONS: `${FULL_API_URL}/sessions`,
    SETTINGS: `${FULL_API_URL}/settings`,
    ACCESSIBILITY: `${FULL_API_URL}/accessibility`,
};
```

## Fetch Helper Function

Create a utility function for cleaner code:

```javascript
async function fetchBackend(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            Authorization: `Bearer ${BEARER_TOKEN}`,
            "Content-Type": "application/json",
        },
    };

    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...(options.headers || {}),
        },
    };

    try {
        const response = await fetch(endpoint, finalOptions);

        if (!response.ok) {
            throw new Error(
                `Backend error: ${response.status} ${response.statusText}`,
            );
        }

        return await response.json();
    } catch (error) {
        console.error("Backend request failed:", error);
        throw error;
    }
}

// Usage:
// const sessions = await fetchBackend(ENDPOINTS.SESSIONS);
// const newSession = await fetchBackend(ENDPOINTS.SESSIONS, {
//   method: 'POST',
//   body: JSON.stringify(sessionData)
// });
```

## Current Architecture

Your frontend can now work in two modes:

### Mode 1: LocalStorage Only (Current)

- Data is stored in browser's localStorage
- Perfect for local testing
- No backend needed
- Changes are local to the device

### Mode 2: Backend Sync (New)

- Data is stored in backend database
- Can access from any device
- Multiple users see same data
- Persistent storage

### Hybrid Approach (Recommended for Now)

```javascript
// Save both locally and to backend
async function saveSession(sessionData) {
    // Save to localStorage (for offline/instant feedback)
    localStorage.setItem("healingCocoonSession", JSON.stringify(sessionData));

    // Also sync to backend (for persistence)
    try {
        await saveSessionToBackend(sessionData);
    } catch (error) {
        console.warn("Backend sync failed, using local storage", error);
    }
}
```

## Common Integration Patterns

### Pattern 1: Load on Page Load

```javascript
async function initializePage() {
    // Load from backend on page load
    const sessions = await fetchBackend(ENDPOINTS.SESSIONS);
    renderDashboard(sessions);
}

// Call on page load
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializePage);
} else {
    initializePage();
}
```

### Pattern 2: Real-time Updates

```javascript
// Poll backend every 5 seconds
setInterval(async () => {
    const sessions = await fetchBackend(ENDPOINTS.SESSIONS);
    updateDashboard(sessions);
}, 5000);
```

### Pattern 3: Error Handling

```javascript
async function loadSessionWithFallback(sessionId) {
    try {
        // Try backend first
        return await fetchBackend(`${ENDPOINTS.SESSIONS}/${sessionId}`);
    } catch (error) {
        console.warn("Backend failed, using localStorage", error);
        // Fallback to localStorage
        return JSON.parse(localStorage.getItem("sessionCache") || "{}");
    }
}
```

## Testing Integration

### 1. Test Backend is Running

```javascript
// In browser console:
fetch("http://127.0.0.1:8000/health")
    .then((r) => r.json())
    .then((d) => console.log(d));
// Should log: {status: "ok", service: "Healing Cocoon Backend"}
```

### 2. Test Public Endpoint

```javascript
// In browser console:
fetch("http://127.0.0.1:8000/api/public/ping")
    .then((r) => r.json())
    .then((d) => console.log(d));
// Should log: {message: "pong", status: "connected"}
```

### 3. Test Protected Endpoint

```javascript
// In browser console:
fetch("http://127.0.0.1:8000/api/me", {
    headers: { Authorization: "Bearer demo_token" },
})
    .then((r) => r.json())
    .then((d) => console.log(d));
// Should log: {staff_id: "mock_staff_001", email: "staff@clinic.com"}
```

## Migration Checklist

- [ ] Backend is running on localhost:8000
- [ ] CORS is configured to allow your frontend URL
- [ ] Add API endpoints constants to frontend JS files
- [ ] Add fetchBackend helper function
- [ ] Update new-session.js to save sessions to backend
- [ ] Update dashboard.js to load sessions from backend
- [ ] Update active-session.js to update session status
- [ ] Update settings.js to sync with backend
- [ ] Test each endpoint with browser console
- [ ] Verify CORS isn't blocking requests
- [ ] Check browser DevTools Network tab for errors

## Troubleshooting

### CORS Error

```
Access to fetch at 'http://127.0.0.1:8000/api/sessions' from origin
'http://localhost:5500' has been blocked by CORS policy
```

**Fix:** Update CORS_ORIGINS in `app/core/config.py`

### 401 Unauthorized

```json
{ "detail": "Missing bearer token" }
```

**Fix:** Add Authorization header with Bearer token

### Connection Refused

```
Failed to fetch: TypeError: Failed to fetch
```

**Fix:** Make sure backend is running (`python run.py`)

### Empty Response

**Fix:** Check Content-Type header is 'application/json'

## Next Steps

1. ✅ Backend is ready
2. → Integrate frontend with backend endpoints
3. → Test each page's API calls
4. → Later: Replace mock auth with real Clerk integration
5. → Later: Add real hardware integration

---

Good luck! Ask if you need help integrating specific pages.
