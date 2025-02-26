const socket = io();

// Listen for reportUpdated events
socket.on("reportUpdated",(data)=>{
    alert(data.message);
    location.reload();
});

// Listen for reportAssigned events
socket.on("reportAssigned",(data)=>{
    alert(data.message);
    location.reload();
})

// Listen for reportStatusUpdated event
socket.on("reportStatusUpdated",(data)=>{
    alert(data.message);
    location.reload();
})