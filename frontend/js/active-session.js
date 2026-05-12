// Healing Cocoon active session logic
// Loads session from backend and provides timer/controls.

const BACKEND_URL = "http://127.0.0.1:8000";

// Helper: Get Bearer token from localStorage
function getAuthToken() {
    return localStorage.getItem("healingCocoonAuthToken") || "demo_token";
}

// Helper: Fetch from backend with auth
async function fetchBackend(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            Authorization: `Bearer ${getAuthToken()}`,
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
        const response = await fetch(`${BACKEND_URL}${endpoint}`, finalOptions);

        if (!response.ok) {
            throw new Error(`Backend error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Backend request failed:", error);
        throw error;
    }
}

const sessionIdRaw = localStorage.getItem("healingCocoonSessionId");
const emptyState = document.getElementById("emptyState");
const sessionContent = document.getElementById("sessionContent");
const activeMessage = document.getElementById("activeMessage");
const activeStateBadge = document.getElementById("activeStateBadge");

const countdownTimer = document.getElementById("countdownTimer");
const sessionStatusText = document.getElementById("sessionStatusText");
const cocoonStatusText = document.getElementById("cocoonStatusText");
const pauseButton = document.getElementById("pauseButton");
const endButton = document.getElementById("endButton");
const emergencyButton = document.getElementById("emergencyButton");

const environmentPreview = document.getElementById("environmentPreview");
const previewTitle = document.getElementById("previewTitle");
const previewLabel = document.getElementById("previewLabel");

let sessionData = null;
let timerId = null;
let isPaused = false;
let isStopped = false;
let remainingSeconds = 0;
let currentSessionId = null;

function toTitleCase(input) {
    if (!input) {
        return "-";
    }

    return String(input)
        .replace(/-/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function parseDurationToSeconds(durationText) {
    const matched = String(durationText || "").match(/\d+/);
    const minutes = matched ? Number(matched[0]) : 0;
    return minutes * 60;
}

function formatTime(totalSeconds) {
    const safeSeconds = Math.max(0, totalSeconds);
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function setMessage(text, type) {
    activeMessage.textContent = text;
    activeMessage.className = `status-message ${type || ""}`.trim();
}

function getAccessibilitySummary(data) {
    const activeSettings = [];

    if (data.wheelchair_access) {
        activeSettings.push("Wheelchair access");
    }
    if (data.removable_seat) {
        activeSettings.push("Removable seat");
    }
    if (data.low_stimulation_mode) {
        activeSettings.push("Low stimulation");
    }
    if (data.caregiver_assistance) {
        activeSettings.push("Caregiver assistance");
    }

    return activeSettings.length ? activeSettings.join(", ") : "Standard mode";
}

function applyEnvironmentMood(environmentName) {
    const normalized = String(environmentName || "").toLowerCase();

    environmentPreview.classList.remove("ocean", "forest", "space", "garden");

    if (normalized.includes("ocean")) {
        environmentPreview.classList.add("ocean");
        previewLabel.textContent = "Calming";
        return;
    }

    if (normalized.includes("forest")) {
        environmentPreview.classList.add("forest");
        previewLabel.textContent = "Nature";
        return;
    }

    if (normalized.includes("space")) {
        environmentPreview.classList.add("space");
        previewLabel.textContent = "Immersive";
        return;
    }

    environmentPreview.classList.add("garden");
    previewLabel.textContent = "Gentle";
}

function renderSessionData(data) {
    document.getElementById("childNameValue").textContent = toTitleCase(
        data.child_name,
    );
    document.getElementById("ageRangeValue").textContent =
        data.age_range || "-";
    document.getElementById("environmentValue").textContent =
        data.environment || "-";
    document.getElementById("durationValue").textContent =
        `${data.duration_minutes} min` || "-";
    document.getElementById("soundValue").textContent = data.sound_level || "-";
    document.getElementById("scentValue").textContent = data.scent_level || "-";
    document.getElementById("accessibilityValue").textContent =
        getAccessibilitySummary(data);
    document.getElementById("notesValue").textContent =
        data.notes || "No notes added.";

    document.getElementById("summaryVisual").textContent =
        data.environment || "-";
    document.getElementById("summarySound").textContent =
        data.sound_level || "-";
    document.getElementById("summaryScent").textContent =
        data.scent_level || "-";
    document.getElementById("summaryAccessibility").textContent =
        getAccessibilitySummary(data);

    previewTitle.textContent = data.environment || "Environment";
    applyEnvironmentMood(data.environment);
}

function stopTimer() {
    if (timerId) {
        window.clearInterval(timerId);
        timerId = null;
    }
}

function tickTimer() {
    if (isPaused || isStopped) {
        return;
    }

    if (remainingSeconds <= 0) {
        stopTimer();
        sessionStatusText.textContent = "Completed";
        cocoonStatusText.textContent = "Session completed";
        activeStateBadge.textContent = "Completed";
        setMessage("Session completed successfully", "success");
        return;
    }

    remainingSeconds -= 1;
    countdownTimer.textContent = formatTime(remainingSeconds);
}

function startTimer() {
    stopTimer();
    countdownTimer.textContent = formatTime(remainingSeconds);
    timerId = window.setInterval(tickTimer, 1000);
}

function handlePauseToggle() {
    if (isStopped) {
        return;
    }

    isPaused = !isPaused;
    pauseButton.textContent = isPaused ? "Resume Session" : "Pause Session";
    sessionStatusText.textContent = isPaused ? "Paused" : "Active";
    cocoonStatusText.textContent = isPaused
        ? "Paused by staff"
        : "Running normally";
    activeStateBadge.textContent = isPaused ? "Paused" : "Session running";

    if (isPaused) {
        setMessage("Session paused", "");
    } else {
        setMessage("Session resumed", "success");
    }
}

function handleEndSession() {
    if (isStopped) {
        return;
    }

    isStopped = true;
    stopTimer();
    sessionStatusText.textContent = "Ended";
    cocoonStatusText.textContent = "Stopped by staff";
    activeStateBadge.textContent = "Ended";
    setMessage("Session ended successfully", "success");

    // Update backend
    if (currentSessionId) {
        updateSessionStatus("completed");
    }

    window.setTimeout(() => {
        window.location.href = "dashboard.html";
    }, 1000);
}

function handleEmergencyStop() {
    isStopped = true;
    stopTimer();
    sessionStatusText.textContent = "Emergency Stop";
    cocoonStatusText.textContent = "Immediate stop activated";
    activeStateBadge.textContent = "Emergency";
    pauseButton.disabled = true;
    endButton.disabled = true;
    setMessage("Emergency stop activated. Please assist immediately.", "error");

    // Update backend
    if (currentSessionId) {
        updateSessionStatus("emergency_stopped");
    }
}

function setupEmptyState() {
    emptyState.hidden = false;
    sessionContent.hidden = true;
    activeStateBadge.textContent = "No session";
}

async function updateSessionStatus(status) {
    try {
        await fetchBackend(`/api/sessions/${currentSessionId}`, {
            method: "PATCH",
            body: JSON.stringify({ status: status }),
        });
    } catch (error) {
        console.warn("Could not update session status on backend:", error);
    }
}

async function bootstrap() {
    // Try to load from backend first
    if (sessionIdRaw) {
        try {
            currentSessionId = parseInt(sessionIdRaw);
            sessionData = await fetchBackend(
                `/api/sessions/${currentSessionId}`,
            );
        } catch (error) {
            console.warn(
                "Could not load from backend, trying localStorage:",
                error,
            );
            sessionData = null;
        }
    }

    // Fallback to localStorage
    if (!sessionData) {
        const sessionDataRaw = localStorage.getItem("healingCocoonSession");
        if (!sessionDataRaw) {
            setupEmptyState();
            return;
        }

        try {
            sessionData = JSON.parse(sessionDataRaw);
        } catch (error) {
            setupEmptyState();
            return;
        }
    }

    if (
        !sessionData ||
        (!sessionData.child_name && !sessionData.childFirstName)
    ) {
        setupEmptyState();
        return;
    }

    if (!sessionData) {
        return;
    }

    emptyState.hidden = true;
    sessionContent.hidden = false;

    renderSessionData(sessionData);
    remainingSeconds = parseDurationToSeconds(
        `${sessionData.duration_minutes || 10} min`,
    );

    if (!remainingSeconds) {
        remainingSeconds = 300;
    }

    // Update backend to mark session as active
    if (currentSessionId) {
        await updateSessionStatus("active");
    }

    startTimer();
}

pauseButton.addEventListener("click", handlePauseToggle);
endButton.addEventListener("click", handleEndSession);
emergencyButton.addEventListener("click", handleEmergencyStop);

bootstrap();
