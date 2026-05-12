// Healing Cocoon child view logic
// Keeps the interface simple, visual, and easy to use for children.

const sessionRaw = localStorage.getItem("healingCocoonSession");
const childGreeting = document.getElementById("childGreeting");
let worldCards = Array.from(document.querySelectorAll(".child-world-card"));
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

function attachWorldListeners() {
    worldCards.forEach((card) => {
        card.addEventListener("click", () => {
            selectWorld(card);
        });
        card.addEventListener("keydown", (ev) => {
            if (ev.key === "Enter" || ev.key === " ") {
                ev.preventDefault();
                selectWorld(card);
            }
        });
    });
}

attachWorldListeners();

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

// See more toggle: reveal extra worlds
const seeMoreBtn = document.getElementById("seeMoreWorlds");
const worldGrid = document.querySelector(".child-world-grid");
if (seeMoreBtn && worldGrid) {
    seeMoreBtn.addEventListener("click", () => {
        const expanded = worldGrid.classList.toggle("expanded");
        seeMoreBtn.textContent = expanded ? "Show fewer" : "See more...";
        seeMoreBtn.setAttribute("aria-expanded", expanded ? "true" : "false");

        // Rebuild worldCards list and reattach listeners when expanded
        worldCards = Array.from(document.querySelectorAll(".child-world-card"));
        attachWorldListeners();
    });
}

// Breathing exercise control (line indicator, CSS-driven continuous loop)
const breathingBtn = document.getElementById("startBreathingBtn");
const breathingIndicator = document.getElementById("breathingIndicator");
const breathingInstruction = document.getElementById("breathingInstruction");
const breathingLine = document.querySelector(".breathing-line");

let breathingActive = false;
let breathingInterval = null;
let breathPhase = 0; // 0 = inhale, 1 = exhale

function startBreathing() {
    if (!breathingLine) return;
    breathingLine.classList.add("playing");
    // start in inhale
    breathingLine.classList.remove("exhale");
    breathingLine.classList.add("inhale");
    breathingActive = true;
    breathPhase = 0;
    breathingInstruction.textContent = "Breathe in...";
    playChime(880, 0.12);
    // toggle phase every 4s to match CSS 8s total loop
    breathingInterval = setInterval(() => {
        breathPhase = 1 - breathPhase;
        if (breathPhase === 0) {
            // inhale
            breathingLine.classList.remove("exhale");
            breathingLine.classList.add("inhale");
            breathingInstruction.textContent = "Breathe in...";
            playChime(880, 0.12);
        } else {
            // exhale
            breathingLine.classList.remove("inhale");
            breathingLine.classList.add("exhale");
            breathingInstruction.textContent = "Breathe out...";
            playChime(440, 0.16);
        }
    }, 4000);
}

function stopBreathing() {
    if (!breathingLine) return;
    breathingLine.classList.remove("playing");
    breathingActive = false;
    if (breathingInterval) {
        clearInterval(breathingInterval);
        breathingInterval = null;
    }
    breathingInstruction.textContent =
        "Follow the moving line and breathe slowly.";
}

// Simple WebAudio chime: frequency in Hz, duration in seconds
function playChime(freq = 660, duration = 0.12) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.value = freq;
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
        o.connect(g);
        g.connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + duration + 0.02);
        // close context after a short delay to free resources
        setTimeout(
            () => {
                if (ctx.close) ctx.close();
            },
            (duration + 0.05) * 1000,
        );
    } catch (e) {
        console.warn("Audio unavailable:", e && e.message);
    }
}

if (breathingBtn) {
    breathingBtn.addEventListener("click", () => {
        if (!breathingActive) {
            breathingBtn.textContent = "Pause";
            breathingBtn.setAttribute("aria-pressed", "true");
            startBreathing();
        } else {
            breathingBtn.textContent = "Begin";
            breathingBtn.setAttribute("aria-pressed", "false");
            stopBreathing();
        }
    });
}
