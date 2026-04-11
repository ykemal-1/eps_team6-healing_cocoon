// Healing Cocoon active session logic
// Loads demo data from localStorage and provides timer/controls.

const sessionDataRaw = localStorage.getItem("healingCocoonSession");
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

    if (data.wheelchairAccess) {
        activeSettings.push("Wheelchair access");
    }
    if (data.removableSeat) {
        activeSettings.push("Removable seat");
    }
    if (data.lowStimulation) {
        activeSettings.push("Low stimulation");
    }
    if (data.caregiverAssistance) {
        activeSettings.push("Caregiver assistance");
    }

    return activeSettings.length ? activeSettings.join(", ") : "Standard mode";
}

function formatIntensity(value, label) {
    if (label) {
        return value ? `${label} (${value}%)` : label;
    }

    return `${value || "0"}%`;
}

function getStoredLevelLabel(data, key, percentKey) {
    if (data[key]) {
        return data[key];
    }

    const numericValue = Number(data[percentKey] || 0);

    if (numericValue < 35) {
        return "Soft";
    }

    if (numericValue < 70) {
        return "Medium";
    }

    return "Strong";
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
        data.childFirstName,
    );
    document.getElementById("ageRangeValue").textContent = data.ageRange || "-";
    document.getElementById("environmentValue").textContent =
        data.environment || "-";
    document.getElementById("durationValue").textContent = data.duration || "-";
    document.getElementById("soundValue").textContent = formatIntensity(
        data.soundIntensity,
        getStoredLevelLabel(data, "soundLevel", "soundIntensity"),
    );
    document.getElementById("scentValue").textContent = formatIntensity(
        data.scentIntensity,
        getStoredLevelLabel(data, "scentLevel", "scentIntensity"),
    );
    document.getElementById("accessibilityValue").textContent =
        getAccessibilitySummary(data);
    document.getElementById("notesValue").textContent =
        data.notes || "No notes added.";

    document.getElementById("summaryVisual").textContent =
        data.environment || "-";
    document.getElementById("summarySound").textContent = formatIntensity(
        data.soundIntensity,
        getStoredLevelLabel(data, "soundLevel", "soundIntensity"),
    );
    document.getElementById("summaryScent").textContent = formatIntensity(
        data.scentIntensity,
        getStoredLevelLabel(data, "scentLevel", "scentIntensity"),
    );
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
}

function setupEmptyState() {
    emptyState.hidden = false;
    sessionContent.hidden = true;
    activeStateBadge.textContent = "No session";
}

function bootstrap() {
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

    if (!sessionData || !sessionData.childFirstName) {
        setupEmptyState();
        return;
    }

    emptyState.hidden = true;
    sessionContent.hidden = false;

    renderSessionData(sessionData);
    remainingSeconds = parseDurationToSeconds(sessionData.duration);

    if (!remainingSeconds) {
        remainingSeconds = 300;
    }

    startTimer();
}

pauseButton.addEventListener("click", handlePauseToggle);
endButton.addEventListener("click", handleEndSession);
emergencyButton.addEventListener("click", handleEmergencyStop);

bootstrap();
