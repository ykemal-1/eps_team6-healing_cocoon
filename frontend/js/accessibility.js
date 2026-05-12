// Healing Cocoon accessibility settings logic
// Syncs settings with backend and updates the live preview.

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

const STORAGE_KEY = "healingCocoonAccessibilitySettings";

const settingInputs = document.querySelectorAll("[data-setting]");
const notesField = document.getElementById("accessibilityNotes");
const saveButton = document.getElementById("saveAccessibilityBtn");
const resetButton = document.getElementById("resetAccessibilityBtn");
const message = document.getElementById("accessibilityMessage");

const previewFields = {
    wheelchairAccess: document.getElementById("previewWheelchair"),
    removableSeat: document.getElementById("previewSeat"),
    rampAccess: document.getElementById("previewRamp"),
    lowStimulation: document.getElementById("previewLowStimulation"),
};

const defaultSettings = {
    wheelchairAccess: false,
    removableSeat: false,
    rampAccess: false,
    lowStimulation: false,
    caregiverAssistance: false,
    reducedScent: false,
    audioGuidance: false,
    notes: "",
};

let currentSettings = { ...defaultSettings };

function loadSettings() {
    const rawSettings = localStorage.getItem(STORAGE_KEY);

    if (!rawSettings) {
        return { ...defaultSettings };
    }

    try {
        return { ...defaultSettings, ...JSON.parse(rawSettings) };
    } catch (error) {
        return { ...defaultSettings };
    }
}

function saveSettings(settings) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function setMessage(text, type) {
    message.textContent = text;
    message.className = `status-message ${type || ""}`.trim();
}

function updatePreview() {
    previewFields.wheelchairAccess.textContent =
        currentSettings.wheelchairAccess ? "Yes" : "No";
    previewFields.removableSeat.textContent = currentSettings.removableSeat
        ? "Yes"
        : "No";
    previewFields.rampAccess.textContent = currentSettings.rampAccess
        ? "Yes"
        : "No";
    previewFields.lowStimulation.textContent = currentSettings.lowStimulation
        ? "Yes"
        : "No";
}

function syncUI() {
    settingInputs.forEach((input) => {
        const key = input.dataset.setting;
        input.checked = Boolean(currentSettings[key]);
    });

    notesField.value = currentSettings.notes || "";
    updatePreview();
}

function collectSettings() {
    const nextSettings = { ...currentSettings };

    settingInputs.forEach((input) => {
        nextSettings[input.dataset.setting] = input.checked;
    });

    nextSettings.notes = notesField.value.trim();
    return nextSettings;
}

function handleSave() {
    currentSettings = collectSettings();
    saveSettings(currentSettings);
    updatePreview();
    setMessage("Accessibility settings saved successfully", "success");

    // Sync to backend
    syncSettingsToBackend(currentSettings);
}

async function syncSettingsToBackend(settings) {
    try {
        await fetchBackend("/api/accessibility", {
            method: "POST",
            body: JSON.stringify(settings),
        });
        console.log("Accessibility settings synced to backend");
    } catch (error) {
        console.warn(
            "Could not sync accessibility settings to backend:",
            error,
        );
    }
}

function handleReset() {
    currentSettings = { ...defaultSettings };
    syncUI();
    saveSettings(currentSettings);
    syncSettingsToBackend(currentSettings);
    setMessage("Settings reset to default", "success");
}

settingInputs.forEach((input) => {
    input.addEventListener("change", () => {
        updatePreview();
    });
});

saveButton.addEventListener("click", handleSave);
resetButton.addEventListener("click", handleReset);

currentSettings = loadSettings();
syncUI();

// Try to load settings from backend on page load
async function loadSettingsFromBackend() {
    try {
        const backendSettings = await fetchBackend("/api/accessibility");
        if (backendSettings) {
            currentSettings = { ...currentSettings, ...backendSettings };
            syncUI();
            console.log("Loaded accessibility settings from backend");
        }
    } catch (error) {
        console.warn(
            "Could not load accessibility settings from backend, using local:",
            error,
        );
    }
}

loadSettingsFromBackend();
