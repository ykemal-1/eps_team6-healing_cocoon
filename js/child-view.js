// Healing Cocoon child view logic
// Keeps the interface simple, visual, and easy to use for children.

const sessionRaw = localStorage.getItem("healingCocoonSession");
const childGreeting = document.getElementById("childGreeting");
const worldCards = document.querySelectorAll(".child-world-card");
const childMessage = document.getElementById("childMessage");
const startButton = document.getElementById("startCalmSession");
const soundButtons = document.querySelectorAll('[data-control="sound"]');
const scentButtons = document.querySelectorAll('[data-control="scent"]');

let sessionData = null;
let selectedEnvironment = "";
let selectedSound = "Soft";
let selectedScent = "Soft";
let redirectTimer = null;

const levelToPercent = {
    Soft: 30,
    Medium: 60,
    Strong: 90,
};

function parseSession() {
    if (!sessionRaw) {
        return null;
    }

    try {
        return JSON.parse(sessionRaw);
    } catch (error) {
        return null;
    }
}

function setMessage(text, type) {
    childMessage.textContent = text;
    childMessage.className = `status-message ${type || ""}`.trim();
}

function getWelcomeName(data) {
    const name =
        data && data.childFirstName ? String(data.childFirstName).trim() : "";
    return name ? `Hi ${name} 👋` : "Hi there 👋";
}

function selectWorld(card) {
    worldCards.forEach((worldCard) => {
        const isSelected = worldCard === card;
        worldCard.classList.toggle("selected", isSelected);
        worldCard.setAttribute("aria-pressed", String(isSelected));
    });
    selectedEnvironment = card.dataset.environment;
}

function setLevel(buttonGroup, value, storageKey) {
    buttonGroup.forEach((button) => {
        const isActive = button.dataset.level === value;
        button.classList.toggle("active", isActive);
    });

    if (storageKey === "sound") {
        selectedSound = value;
    } else {
        selectedScent = value;
    }
}

function levelFromSessionValue(value) {
    const numeric = Number(value || 0);
    if (numeric < 35) {
        return "Soft";
    }
    if (numeric < 70) {
        return "Medium";
    }
    return "Strong";
}

function serializeChildSession() {
    const base = sessionData || {};

    return {
        ...base,
        environment: selectedEnvironment || base.environment || "Ocean",
        soundIntensity: String(levelToPercent[selectedSound] || 30),
        scentIntensity: String(levelToPercent[selectedScent] || 30),
        soundLevel: selectedSound,
        scentLevel: selectedScent,
        savedAt: new Date().toISOString(),
    };
}

function syncFromExistingSession() {
    if (!sessionData) {
        selectedEnvironment = "Ocean";
        selectedSound = "Soft";
        selectedScent = "Soft";
        return;
    }

    selectedEnvironment = sessionData.environment || "Ocean";
    selectedSound = levelFromSessionValue(sessionData.soundIntensity);
    selectedScent = levelFromSessionValue(sessionData.scentIntensity);
}

function applyDefaults() {
    const defaultWorld =
        Array.from(worldCards).find(
            (card) => card.dataset.environment === selectedEnvironment,
        ) || worldCards[0];
    if (defaultWorld) {
        selectWorld(defaultWorld);
    }

    setLevel(soundButtons, selectedSound, "sound");
    setLevel(scentButtons, selectedScent, "scent");
}

function saveAndStart() {
    const payload = serializeChildSession();
    localStorage.setItem("healingCocoonSession", JSON.stringify(payload));
    localStorage.setItem(
        "healingCocoonSessionState",
        "Child view session started",
    );

    setMessage("Your calming session is starting...", "success");

    if (redirectTimer) {
        window.clearTimeout(redirectTimer);
    }

    redirectTimer = window.setTimeout(() => {
        window.location.href = "active-session.html";
    }, 1000);
}

sessionData = parseSession();
childGreeting.textContent = getWelcomeName(sessionData);
syncFromExistingSession();
applyDefaults();

worldCards.forEach((card) => {
    card.addEventListener("click", () => {
        selectWorld(card);
    });
});

soundButtons.forEach((button) => {
    button.addEventListener("click", () => {
        setLevel(soundButtons, button.dataset.level, "sound");
    });
});

scentButtons.forEach((button) => {
    button.addEventListener("click", () => {
        setLevel(scentButtons, button.dataset.level, "scent");
    });
});

startButton.addEventListener("click", saveAndStart);
