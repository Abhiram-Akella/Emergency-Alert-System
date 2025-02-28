function getLocation(callback) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                //console.log("Updated Location:", latInput.value, lngInput.value);
                callback({latitude,longitude}); // Proceed only after setting location
            },
            (error) => {
                console.error("Error fetching location:", error.message);
                alert("Please allow location access.");
                callback(null);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    } else {
        alert("Geolocation is not supported by this browser.");
        if (callback) callback();
    }
}

getLocation((coords) => {
    if (coords) {
        console.log("Latitude:", coords.latitude, "Longitude:", coords.longitude);
        document.getElementById('latitude').value = coords.latitude;
        document.getElementById('longitude').value = coords.longitude;
    } else {
        alert("Failed to retrieve location.");
    }
});

window.getLocation = getLocation;