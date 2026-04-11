// Healing Cocoon new session form logic
// Stores demo data in localStorage and keeps validation simple and readable.

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
        childFirstName: formData.get("childFirstName").trim(),
        ageRange: formData.get("ageRange"),
        environment: selectedEnvironment,
        duration: formData.get("duration"),
        soundIntensity: soundIntensity.value,
        scentIntensity: scentIntensity.value,
        wheelchairAccess: formData.has("wheelchairAccess"),
        removableSeat: formData.has("removableSeat"),
        lowStimulation: formData.has("lowStimulation"),
        caregiverAssistance: formData.has("caregiverAssistance"),
        notes: formData.get("notes").trim(),
        savedAt: new Date().toISOString(),
    };
}

function saveSession(data, state) {
    localStorage.setItem("healingCocoonSession", JSON.stringify(data));
    localStorage.setItem("healingCocoonSessionState", state);
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

    persistAndRedirect("Session created successfully");
});

saveDraftBtn.addEventListener("click", () => {
    saveSession(serializeFormData(), "Draft saved successfully");
    setStatus("Draft saved successfully", "success");
});

updateSliderValue(soundIntensity, soundValue);
updateSliderValue(scentIntensity, scentValue);
