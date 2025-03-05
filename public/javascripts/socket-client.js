const socket = io();

// Listen for reportUpdated events
socket.on("reportUpdated", (data) => {
  let notifications = JSON.parse(sessionStorage.getItem("notifications")) || [];
  notifications.push(data.message);
  sessionStorage.setItem("notifications", JSON.stringify(notifications));
  location.reload();
});

// Listen for reportAssigned events
socket.on("reportAssigned", (data) => {
  let notifications = JSON.parse(sessionStorage.getItem("notifications")) || [];
  notifications.push(data.message);
  sessionStorage.setItem("notifications", JSON.stringify(notifications));
  location.reload();
});

// Listen for reportStatusUpdated event
socket.on("reportStatusUpdated", (data) => {
  let notifications = JSON.parse(sessionStorage.getItem("notifications")) || [];
  notifications.push(data.message);
  sessionStorage.setItem("notifications", JSON.stringify(notifications));
  location.reload();
});

// Listen for nearby-alert event
socket.on("nearby-alert", (data) => {
  console.log("Received at client");
  showToast(data.message, "warning");
});
