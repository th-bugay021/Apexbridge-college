export function toggleDropdown(id, button) {
    const dropdown = document.getElementById(id);
    const isOpen = dropdown.classList.contains("show");

    // Close all dropdowns first
    document.querySelectorAll(".dropdown").forEach(menu => {
        menu.classList.remove("show");
    });

    document.querySelectorAll(".downsp").forEach(arrow => {
        arrow.style.transform = "rotate(0deg)";
    });

    // Open the selected dropdown if it was closed
    if (!isOpen) {
        dropdown.classList.add("show");

        const arrow = button.querySelector(".downsp");
        arrow.style.transform = "rotate(180deg)";
    }
}

// Close dropdowns when clicking outside
document.addEventListener("click", function(event) {
    if (!event.target.closest(".rfc")) {
        document.querySelectorAll(".dropdown").forEach(menu => {
            menu.classList.remove("show");
        });

        document.querySelectorAll(".downsp").forEach(arrow => {
            arrow.style.transform = "rotate(0deg)";
        });
    }
});
