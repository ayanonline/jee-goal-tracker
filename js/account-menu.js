document.addEventListener("DOMContentLoaded", () => {
    const accountIcon = document.querySelector(".account-icon");
    const dropdown = document.querySelector(".account-dropdown");

    if (!accountIcon || !dropdown) return;

    accountIcon.setAttribute("tabindex", "0");
    accountIcon.setAttribute("aria-haspopup", "true");
    accountIcon.setAttribute("aria-expanded", "false");

    function setOpen(isOpen) {
        accountIcon.classList.toggle("dropdown-open", isOpen);
        accountIcon.classList.toggle("active", isOpen);
        accountIcon.setAttribute("aria-expanded", String(isOpen));
    }

    accountIcon.addEventListener("click", (event) => {
        if (event.target.closest(".account-dropdown a")) return;
        event.stopPropagation();
        setOpen(!accountIcon.classList.contains("active"));
    });

    accountIcon.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen(!accountIcon.classList.contains("active"));
        }

        if (event.key === "Escape") {
            setOpen(false);
        }
    });

    document.addEventListener("click", (event) => {
        if (!event.target.closest(".account-menu")) {
            setOpen(false);
        }
    });
});
