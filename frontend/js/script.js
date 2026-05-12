// Healing Cocoon login form logic
// Includes simple, friendly client-side validation and redirect simulation.

const loginForm = document.getElementById("loginForm");
const statusMessage = document.getElementById("statusMessage");
const passwordToggle = document.getElementById("passwordToggle");
const allowedUsername = "Team6";
const allowedPassword = "Spring2026T6";

const fields = {
    practiceName: {
        input: document.getElementById("practiceName"),
        error: document.getElementById("practiceNameError"),
        message: "Please enter your practice name.",
    },
    emailOrUsername: {
        input: document.getElementById("emailOrUsername"),
        error: document.getElementById("emailOrUsernameError"),
        message: "Please enter your email or username.",
    },
    password: {
        input: document.getElementById("password"),
        error: document.getElementById("passwordError"),
        message: "Please enter your password.",
    },
};

function setFieldError(fieldKey, message) {
    const field = fields[fieldKey];
    field.error.textContent = message;
    field.input.setAttribute("aria-invalid", "true");
}

function clearFieldError(fieldKey) {
    const field = fields[fieldKey];
    field.error.textContent = "";
    field.input.setAttribute("aria-invalid", "false");
}

function validateForm() {
    let isValid = true;

    Object.keys(fields).forEach((key) => {
        const value = fields[key].input.value.trim();

        if (!value) {
            setFieldError(key, fields[key].message);
            isValid = false;
        } else {
            clearFieldError(key);
        }
    });

    return isValid;
}

// Clear the error for each field as soon as the user types.
Object.keys(fields).forEach((key) => {
    fields[key].input.addEventListener("input", () => {
        if (fields[key].input.value.trim()) {
            clearFieldError(key);
        }
    });
});

passwordToggle.addEventListener("click", () => {
    const passwordField = fields.password.input;
    const isHidden = passwordField.type === "password";

    passwordField.type = isHidden ? "text" : "password";
    passwordToggle.textContent = isHidden ? "Hide" : "Show";
    passwordToggle.setAttribute(
        "aria-label",
        isHidden ? "Hide password" : "Show password",
    );
    passwordToggle.setAttribute("aria-pressed", String(isHidden));
});

loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    statusMessage.textContent = "";
    statusMessage.classList.remove("success");

    const valid = validateForm();

    if (!valid) {
        statusMessage.textContent =
            "Please check the fields above and try again.";
        return;
    }

    // Demo authentication for student project.
    const usernameValue = fields.emailOrUsername.input.value.trim();
    const passwordValue = fields.password.input.value.trim();

    if (
        usernameValue !== allowedUsername ||
        passwordValue !== allowedPassword
    ) {
        if (usernameValue !== allowedUsername) {
            setFieldError("emailOrUsername", "Use the demo username: Team6.");
        }

        if (passwordValue !== allowedPassword) {
            setFieldError("password", "Use the demo password: Spring2026T6.");
        }

        statusMessage.textContent =
            "Login details are incorrect. Please try again.";
        return;
    }

    statusMessage.textContent =
        "Login successful - redirecting to dashboard...";
    statusMessage.classList.add("success");

    // Simulate redirect after successful login validation.
    window.setTimeout(() => {
        window.location.href = "dashboard.html";
    }, 1500);
});
