const showToast = (message) => {
    const toastContainer = document.getElementById("toastContainer");

    // Create a new toast element
    const newToast = document.createElement("div");
    newToast.className = "toast show";  // Keep the toast visible
    newToast.setAttribute("role", "alert");
    newToast.setAttribute("aria-live", "assertive");
    newToast.setAttribute("aria-atomic", "true");
    newToast.setAttribute("data-bs-autohide", "false"); // Prevent auto-hide

    // Set toast HTML
    newToast.innerHTML = `
        <div class="toast-header">
            <strong class="me-auto">Notification</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">${message}</div>
    `;

    // Append to toast container
    toastContainer.appendChild(newToast);

    // Initialize Bootstrap toast and show
    const toast = new bootstrap.Toast(newToast);
    toast.show();

    // Remove toast from DOM when closed
    newToast.addEventListener("hidden.bs.toast", () => {
        newToast.remove();
    });
};

window.addEventListener("load", () => {
    let notifications = JSON.parse(sessionStorage.getItem("notifications")) || [];

    notifications.forEach((message) => {
        showToast(message);
    });

    // Clear sessionStorage after displaying
    sessionStorage.removeItem("notifications");
});
