// Healing Cocoon accessibility settings logic
// Stores settings in localStorage and updates the live preview.

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
}

function handleReset() {
    currentSettings = { ...defaultSettings };
    syncUI();
    saveSettings(currentSettings);
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
