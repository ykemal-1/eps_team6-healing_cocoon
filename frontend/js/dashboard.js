// Healing Cocoon dashboard interactions
// Fetches user info from backend and keeps the page lively with UI touches.

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

function getGreeting() {
    const hour = new Date().getHours();

    if (hour < 12) {
        return "Good morning";
    }

    if (hour < 18) {
        return "Good afternoon";
    }

    return "Good evening";
}

const greetingText = document.getElementById("greetingText");
const timeBadge = document.getElementById("timeBadge");

// Initialize greeting and fetch user info
async function initializeDashboard() {
    const greeting = getGreeting();

    try {
        // Fetch current user from backend
        const user = await fetchBackend("/api/me");

        // Get practice name from settings or use default
        try {
            const settings = await fetchBackend("/api/settings");
            greetingText.textContent = `${greeting}, ${settings.practice_name}`;
        } catch (error) {
            // Fallback to default if settings fails
            greetingText.textContent = `${greeting}, Healing Cocoon`;
        }

        if (timeBadge) {
            timeBadge.textContent = `${greeting} overview`;
        }
    } catch (error) {
        // Fallback if backend unavailable
        if (greetingText) {
            greetingText.textContent = `${greeting}, Healing Cocoon`;
        }
        if (timeBadge) {
            timeBadge.textContent = `${greeting} overview`;
        }
        console.warn("Could not fetch user info, using defaults");
    }
}

// Keep navigation buttons feeling responsive on hover and focus.
const navItems = document.querySelectorAll(".nav-item, .action-card");

navItems.forEach((item) => {
    item.addEventListener("mouseenter", () => {
        item.classList.add("is-hovered");
    });

    item.addEventListener("mouseleave", () => {
        item.classList.remove("is-hovered");
    });
});

// Initialize when page loads
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeDashboard);
} else {
    initializeDashboard();
}
