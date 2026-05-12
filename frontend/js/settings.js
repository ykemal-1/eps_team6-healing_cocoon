// Healing Cocoon settings logic
// Saves and loads general platform settings from backend.

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

const SETTINGS_KEY = "healingCocoonPlatformSettings";

const saveButton = document.getElementById("saveSettingsBtn");
const resetButton = document.getElementById("resetSettingsBtn");
const settingsMessage = document.getElementById("settingsMessage");
const settingFields = document.querySelectorAll("[data-setting]");

const defaultSettings = {
    practiceName: "Bright Smile Dental",
    contactEmail: "info@practice.com",
    contactPhone: "+351 123 45 67 89",
    location: "Main street 10, Porto",
    cocoonCount: "2",

    defaultEnvironment: "Ocean",
    defaultSoundLevel: "Soft",
    defaultScentLevel: "Soft",
    defaultDuration: "10 min",
    autoStartChildView: false,

    reducedMotion: false,
    highContrast: false,

    notifySessionEnd: true,
    notifyEmergencyStop: true,
    notifyDailySummary: false,
    notifyMaintenance: true,

    storeSessionHistory: true,
    anonymizeChildNames: false,
    clearSessionAfterUse: false,
};

let currentSettings = { ...defaultSettings };

function loadSettings() {
    const raw = localStorage.getItem(SETTINGS_KEY);

    if (!raw) {
        return { ...defaultSettings };
    }

    try {
        return { ...defaultSettings, ...JSON.parse(raw) };
    } catch (error) {
        return { ...defaultSettings };
    }
}

function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function setStatus(message, type) {
    settingsMessage.textContent = message;
    settingsMessage.className = `status-message ${type || ""}`.trim();
}

function syncUIFromState() {
    settingFields.forEach((field) => {
        const key = field.dataset.setting;
        const value = currentSettings[key];

        if (field.type === "checkbox") {
            field.checked = Boolean(value);
        } else {
            field.value = value ?? "";
        }
    });
}

function collectSettingsFromUI() {
    const nextSettings = { ...defaultSettings };

    settingFields.forEach((field) => {
        const key = field.dataset.setting;

        if (field.type === "checkbox") {
            nextSettings[key] = field.checked;
        } else {
            nextSettings[key] = field.value.trim();
        }
    });

    return nextSettings;
}

function handleSave() {
    currentSettings = collectSettingsFromUI();
    saveSettings(currentSettings);
    setStatus("Settings saved successfully", "success");
    syncSettingsToBackend(currentSettings);
}

async function syncSettingsToBackend(settings) {
    try {
        // Convert camelCase to snake_case for backend
        const backendData = {
            practice_name: settings.practiceName,
            contact_email: settings.contactEmail,
            contact_phone: settings.contactPhone,
            location: settings.location,
            number_of_cocoons: settings.cocoonCount,
            default_environment: settings.defaultEnvironment,
            default_sound_level: settings.defaultSoundLevel,
            default_scent_level: settings.defaultScentLevel,
            default_session_duration: parseInt(settings.defaultDuration) || 10,
            auto_start_child_view: settings.autoStartChildView,
            session_end_notifications: settings.notifySessionEnd,
            emergency_stop_alerts: settings.notifyEmergencyStop,
            daily_usage_summary: settings.notifyDailySummary,
            maintenance_reminders: settings.notifyMaintenance,
            store_session_history: settings.storeSessionHistory,
            anonymize_child_names: settings.anonymizeChildNames,
            auto_clear_session_data: settings.clearSessionAfterUse,
        };

        await fetchBackend("/api/settings", {
            method: "POST",
            body: JSON.stringify(backendData),
        });
        console.log("Settings synced to backend");
    } catch (error) {
        console.warn("Could not sync settings to backend:", error);
    }
}

function handleReset() {
    currentSettings = { ...defaultSettings };
    syncUIFromState();
    saveSettings(currentSettings);
    setStatus("Settings reset to default", "success");
    syncSettingsToBackend(currentSettings);
}

saveButton.addEventListener("click", handleSave);
resetButton.addEventListener("click", handleReset);

currentSettings = loadSettings();
syncUIFromState();

// Try to load settings from backend on page load
async function loadSettingsFromBackend() {
    try {
        const backendSettings = await fetchBackend("/api/settings");

        // Convert snake_case from backend to camelCase for UI
        const uiSettings = {
            practiceName: backendSettings.practice_name,
            contactEmail: backendSettings.contact_email,
            contactPhone: backendSettings.contact_phone,
            location: backendSettings.location,
            cocoonCount: String(backendSettings.number_of_cocoons || 1),
            defaultEnvironment: backendSettings.default_environment,
            defaultSoundLevel: backendSettings.default_sound_level,
            defaultScentLevel: backendSettings.default_scent_level,
            defaultDuration: `${backendSettings.default_session_duration} min`,
            autoStartChildView: backendSettings.auto_start_child_view,
            notifySessionEnd: backendSettings.session_end_notifications,
            notifyEmergencyStop: backendSettings.emergency_stop_alerts,
            notifyDailySummary: backendSettings.daily_usage_summary,
            notifyMaintenance: backendSettings.maintenance_reminders,
            storeSessionHistory: backendSettings.store_session_history,
            anonymizeChildNames: backendSettings.anonymize_child_names,
            clearSessionAfterUse: backendSettings.auto_clear_session_data,
        };

        currentSettings = { ...currentSettings, ...uiSettings };
        syncUIFromState();
        console.log("Loaded settings from backend");
    } catch (error) {
        console.warn(
            "Could not load settings from backend, using local:",
            error,
        );
    }
}

loadSettingsFromBackend();
