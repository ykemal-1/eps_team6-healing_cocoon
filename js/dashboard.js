// Healing Cocoon dashboard interactions
// Keeps the page lively with small, accessible UI touches only.

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

if (greetingText && timeBadge) {
    const greeting = getGreeting();
    greetingText.textContent = `${greeting}, Bright Smile Dental`;
    timeBadge.textContent = `${greeting} overview`;
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
