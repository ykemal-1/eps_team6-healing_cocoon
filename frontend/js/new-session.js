// Healing Cocoon new session form logic
// Sends session data to backend and keeps validation simple and readable.

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

const form = document.getElementById("newSessionForm");
const statusMessage = document.getElementById("sessionStatus");
const saveDraftBtn = document.getElementById("saveDraftBtn");
const soundIntensity = document.getElementById("soundIntensity");
const scentIntensity = document.getElementById("scentIntensity");
const soundValue = document.getElementById("soundValue");
const scentValue = document.getElementById("scentValue");
const environmentCards = document.querySelectorAll(".environment-card");

const fields = {
    childFirstName: {
        input: document.getElementById("childFirstName"),
        error: document.getElementById("childFirstNameError"),
        message: "Please enter the child’s first name.",
    },
    ageRange: {
        input: document.getElementById("ageRange"),
        error: document.getElementById("ageRangeError"),
        message: "Please select an age range.",
    },
    duration: {
        input: document.getElementById("duration"),
        error: document.getElementById("durationError"),
        message: "Please select a duration.",
    },
};

const environmentError = document.getElementById("environmentError");
let selectedEnvironment = "";
let redirectTimer = null;
let isSubmitting = false;

function setFieldError(fieldKey, message) {
    fields[fieldKey].error.textContent = message;
    fields[fieldKey].input.setAttribute("aria-invalid", "true");
}

function clearFieldError(fieldKey) {
    fields[fieldKey].error.textContent = "";
    fields[fieldKey].input.setAttribute("aria-invalid", "false");
}

function clearEnvironmentError() {
    environmentError.textContent = "";
}

function setEnvironmentError(message) {
    environmentError.textContent = message;
}

function updateSliderValue(slider, output) {
    output.textContent = `${slider.value}%`;
}

function serializeFormData() {
    const formData = new FormData(form);
    return {
        child_name: formData.get("childFirstName").trim(),
        age_range: formData.get("ageRange"),
        environment: selectedEnvironment,
        sound_level: mapPercentToLevel(parseInt(soundIntensity.value)),
        scent_level: mapPercentToLevel(parseInt(scentIntensity.value)),
        duration_minutes: extractDurationMinutes(formData.get("duration")),
        wheelchair_access: formData.has("wheelchairAccess"),
        removable_seat: formData.has("removableSeat"),
        low_stimulation_mode: formData.has("lowStimulation"),
        caregiver_assistance: formData.has("caregiverAssistance"),
        notes: formData.get("notes").trim(),
    };
}

function mapPercentToLevel(percent) {
    return percent < 35 ? "Soft" : percent < 70 ? "Medium" : "Strong";
}

function extractDurationMinutes(durationText) {
    const match = (durationText || "").match(/\d+/);
    return match ? parseInt(match[0]) : 10;
}

function saveSessionLocally(data) {
    localStorage.setItem("healingCocoonSession", JSON.stringify(data));
}

function validateForm() {
    let valid = true;

    Object.keys(fields).forEach((fieldKey) => {
        const value = fields[fieldKey].input.value.trim();

        if (!value) {
            setFieldError(fieldKey, fields[fieldKey].message);
            valid = false;
        } else {
            clearFieldError(fieldKey);
        }
    });

    if (!selectedEnvironment) {
        setEnvironmentError("Please choose one environment.");
        valid = false;
    } else {
        clearEnvironmentError();
    }

    return valid;
}

function markSelectedEnvironment(targetCard) {
    environmentCards.forEach((card) => {
        const isSelected = card === targetCard;
        card.classList.toggle("selected", isSelected);
        card.setAttribute("aria-pressed", String(isSelected));
    });
}

function setStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type || ""}`.trim();
}

Object.keys(fields).forEach((fieldKey) => {
    fields[fieldKey].input.addEventListener("input", () => {
        if (fields[fieldKey].input.value.trim()) {
            clearFieldError(fieldKey);
        }
    });
});

environmentCards.forEach((card) => {
    card.addEventListener("click", () => {
        selectedEnvironment = card.dataset.environment;
        markSelectedEnvironment(card);
        clearEnvironmentError();
    });
});

[soundIntensity, scentIntensity].forEach((slider) => {
    slider.addEventListener("input", () => {
        if (slider === soundIntensity) {
            updateSliderValue(soundIntensity, soundValue);
        } else {
            updateSliderValue(scentIntensity, scentValue);
        }
    });
});

function persistAndRedirect(stateMessage) {
    if (redirectTimer) {
        window.clearTimeout(redirectTimer);
    }

    setStatus(stateMessage, "success");
    saveSession(serializeFormData(), stateMessage);

    redirectTimer = window.setTimeout(() => {
        window.location.href = "active-session.html";
    }, 1000);
}

form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!validateForm()) {
        setStatus("Please check the highlighted fields.", "error");
        return;
    }

    persistToBackendAndRedirect();
});

saveDraftBtn.addEventListener("click", () => {
    saveSessionLocally(serializeFormData());
    setStatus("Draft saved successfully", "success");
});

async function persistToBackendAndRedirect() {
    if (isSubmitting) return;

    isSubmitting = true;
    setStatus("Creating session...", "");

    try {
        const sessionData = serializeFormData();
        saveSessionLocally(sessionData);

        const createdSession = await fetchBackend("/api/sessions", {
            method: "POST",
            body: JSON.stringify(sessionData),
        });

        console.log("Session created on backend:", createdSession);
        localStorage.setItem(
            "healingCocoonSessionId",
            String(createdSession.id),
        );

        setStatus("Session created successfully", "success");

        if (redirectTimer) {
            window.clearTimeout(redirectTimer);
        }

        redirectTimer = window.setTimeout(() => {
            window.location.href = "active-session.html";
        }, 1000);
    } catch (error) {
        console.error("Error creating session:", error);
        setStatus(
            "Failed to create session. Check backend connection.",
            "error",
        );
        isSubmitting = false;
    }
}

updateSliderValue(soundIntensity, soundValue);
updateSliderValue(scentIntensity, scentValue);
