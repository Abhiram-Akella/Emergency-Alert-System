import { useRef, useEffect, useState } from "react";
import Map, { Marker, Popup, Source, Layer } from "react-map-gl";
import { MAPBOX_TOKEN, EMERGENCY_TYPES } from "../config/constants";

const EmergencyMap = ({
  reports = [],
  height = "400px",
  interactive = true,
  onMarkerClick,
  showNavigation = false,
  destinationCoords = null,
}) => {
  const mapRef = useRef(null);
  const watchIdRef = useRef(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [viewState, setViewState] = useState({
    latitude: 28.6139,
    longitude: 77.209,
    zoom: 10,
  });
  const [route, setRoute] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  // Get user's location and watch for changes
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          
          // Only set view state if there are no reports
          if (reports.length === 0) {
            setViewState({
              latitude,
              longitude,
              zoom: 10,
            });
          }

          if (showNavigation && destinationCoords) {
            getRoute({ latitude, longitude }, destinationCoords);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );

      if (showNavigation && destinationCoords) {
        // Watch position changes
        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation({ latitude, longitude });
            // Update route with new position
            getRoute({ latitude, longitude }, destinationCoords);
          },
          (error) => {
            console.error("Error watching location:", error);
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          }
        );

        // Cleanup
        return () => {
          if (watchIdRef.current) {
            navigator.geolocation.clearWatch(watchIdRef.current);
          }
        };
      }
    }
  }, [showNavigation, destinationCoords, reports.length]);

  // Update map center if we have reports
  useEffect(() => {
    if (reports.length > 0) {
      // Center map on the first report
      setViewState({
        latitude: reports[0].latitude,
        longitude: reports[0].longitude,
        zoom: 11,
      });
    }
  }, [reports]);

  // Fetch route from Mapbox Directions API
  const getRoute = async (start, end) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
      );
      const data = await response.json();

      if (data.routes && data.routes[0]) {
        setRoute({
          type: "Feature",
          properties: {},
          geometry: data.routes[0].geometry,
        });

        // Adjust map viewport to show the entire route
        const coordinates = data.routes[0].geometry.coordinates;
        const bounds = coordinates.reduce(
          (bounds, coord) => {
            return {
              minLng: Math.min(bounds.minLng, coord[0]),
              maxLng: Math.max(bounds.maxLng, coord[0]),
              minLat: Math.min(bounds.minLat, coord[1]),
              maxLat: Math.max(bounds.maxLat, coord[1]),
            };
          },
          {
            minLng: coordinates[0][0],
            maxLng: coordinates[0][0],
            minLat: coordinates[0][1],
            maxLat: coordinates[0][1],
          }
        );

        mapRef.current?.fitBounds(
          [
            [bounds.minLng, bounds.minLat],
            [bounds.maxLng, bounds.maxLat],
          ],
          {
            padding: 50,
            duration: 1000, // Smooth animation
          }
        );
      }
    } catch (error) {
      console.error("Error fetching route:", error);
    }
  };

  // Get marker color based on emergency type
  const getMarkerColor = (type) => {
    const emergencyType = EMERGENCY_TYPES.find((t) => t.value === type);
    switch (emergencyType?.color) {
      case "emergency-fire":
        return "#ef4444";
      case "emergency-medical":
        return "#10b981";
      case "emergency-crime":
        return "#f59e0b";
      default:
        return "#6366f1";
    }
  };

  const handleMarkerClick = (report) => {
    setSelectedReport(report);
    if (onMarkerClick) {
      onMarkerClick(report);
    }
  };

  return (
    <div style={{ height, width: "100%" }}>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        interactive={interactive}
      >
        {/* Route layer */}
        {route && (
          <Source type="geojson" data={route}>
            <Layer
              id="route"
              type="line"
              paint={{
                "line-color": "#3b82f6",
                "line-width": 4,
                "line-opacity": 0.75,
              }}
            />
          </Source>
        )}

        {/* User location marker */}
        {userLocation && (
          <Marker
            longitude={userLocation.longitude}
            latitude={userLocation.latitude}
            color="#3b82f6"
          >
            <div className="relative">
              <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
              {/* Accuracy radius indicator */}
              <div className="absolute -inset-4 bg-blue-500 rounded-full opacity-20 animate-pulse" />
            </div>
          </Marker>
        )}

        {/* Emergency markers */}
        {reports.map((report) => (
          <Marker
            key={report._id}
            latitude={report.latitude}
            longitude={report.longitude}
            color={getMarkerColor(report.type)}
            onClick={() => handleMarkerClick(report)}
          />
        ))}

        {selectedReport && (
          <Popup
            latitude={selectedReport.latitude}
            longitude={selectedReport.longitude}
            closeOnClick={false}
            onClose={() => setSelectedReport(null)}
            anchor="bottom"
            offset={[0, -10]}
          >
            <div className="p-2">
              <h3 className="font-bold text-sm">{selectedReport.type}</h3>
              <p className="text-xs text-gray-600">
                {selectedReport.description}
              </p>
              <p className="text-xs mt-1">
                <span
                  className={`badge ${
                    selectedReport.status === "Pending"
                      ? "badge-pending"
                      : selectedReport.status === "Assigned"
                      ? "badge-assigned"
                      : selectedReport.status === "In Progress"
                      ? "badge-in-progress"
                      : "badge-resolved"
                  }`}
                >
                  {selectedReport.status}
                </span>
              </p>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
};

export default EmergencyMap;