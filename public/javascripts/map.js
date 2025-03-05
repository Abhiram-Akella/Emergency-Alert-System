let mapInstance = null;
let routeControl = null;

async function showMap(lat, lng, type, mode = "admin") {
    const modal = new bootstrap.Modal(document.getElementById('mapModal'));
    modal.show();

    setTimeout(async () => {
        if (mapInstance !== null) {
            mapInstance.remove();
            mapInstance = null;
            document.getElementById('map').innerHTML = "";
        }

        mapInstance = L.map('map').setView([lat, lng], 14);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(mapInstance);

        // Emergency Location Marker (Red)
        L.marker([lat, lng], {
            icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
            })
        })
        .addTo(mapInstance)
        .bindPopup(`<b>Emergency Location</b><br>Type: ${type}`)
        .openPopup();

        if (mode === "admin") {
            try {
                // Fetch responders from the backend
                const res = await fetch(`/users/responder/type?type=${type}`);
                const responders = await res.json();
                
                responders.forEach(responder => {
                    L.marker([responder.location.latitude, responder.location.longitude], {
                        icon: L.icon({
                            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
                            iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
                        })
                    })
                    .addTo(mapInstance)
                    .bindPopup(`<b>Responder: ${responder.name}</b>`);
                });
            } catch (error) {
                console.error("Error fetching responders:", error);
            }
        } else if (mode === "responder") {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((position) => {
                    const responderLat = position.coords.latitude;
                    const responderLng = position.coords.longitude;

                    // Show route from responder to emergency location
                    routeControl = L.Routing.control({
                        waypoints: [
                            L.latLng(responderLat, responderLng), // Start: Responder
                            L.latLng(lat, lng) // Destination: Emergency Site
                        ],
                        routeWhileDragging: true
                    }).addTo(mapInstance);
                }, (error) => {
                    console.error("Geolocation error:", error);
                });
            } else {
                alert("Geolocation not supported.");
            }
        }
    }, 500);
}
