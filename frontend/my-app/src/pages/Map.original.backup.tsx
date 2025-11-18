import React, { useEffect, useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useNotifications } from "../pages/NotificationContext"; 
import "./MapPage.css";
import NavBar from "./NavBar";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import houseIconUrl from "../images/house.png";
import courtIconUrl from "../images/court.png";
import poolIconUrl from "../images/pool.png";


// Create custom icons using data URLs






// ✅ Court icon
const courtIcon = new L.Icon({
  iconUrl: courtIconUrl,   // court.png
  iconSize: [30, 30],
  iconAnchor: [25, 50],
  popupAnchor: [0, -50],
  className: "court-marker",
});

const poolIcon = new L.Icon({
  iconUrl: poolIconUrl,    // pool.png
  iconSize: [30, 30],
  iconAnchor: [25, 50],
  popupAnchor: [0, -50],
  className: "pool-marker",
});



// Fix Leaflet default icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Type for a map pin
interface Pin {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
}

// Type for facility booking
interface FacilityBooking {
  id: number;
  facility_id: number;
  facility_name: string;
  date: string;
  start_time: string;
  end_time: string;
  status: "pending" | "approved" | "rejected";
  user_name: string;
}

// Props for MapPage
interface MapPageProps {
  isAdmin: boolean;
}

// Helper to get CSRF token
function getCookie(name: string): string | null {
  let cookieValue: string | null = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.startsWith(name + "=")) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

const csrftoken = getCookie("csrftoken") || "";

// SearchBar component - temporarily disabled to fix positioning issues
// const SearchBar: React.FC = () => {
//   const map = useMap();

//   useEffect(() => {
//     try {
//       const provider = new OpenStreetMapProvider();
//       const searchControl = new (GeoSearchControl as any)({
//         provider,
//         style: "bar",
//         autoClose: true,
//         keepResult: true,
//         searchLabel: "Search location...",
//       });

//       if (map && map.addControl) {
//         map.addControl(searchControl);
//         return () => {
//           try {
//             if (map && map.removeControl) {
//               map.removeControl(searchControl);
//             }
//           } catch (error) {
//             console.warn("Error removing search control:", error);
//           }
//         };
//       }
//     } catch (error) {
//       console.warn("Error initializing search control:", error);
//     }
//   }, [map]);

//   return null;
// };

// Custom house icon
const houseIcon = new L.Icon({
  iconUrl: houseIconUrl,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
  shadowUrl: markerShadow,
  shadowSize: [41, 41],
  shadowAnchor: [12, 41],
});

// Custom court icon (basketball)
// const courtIcon = new L.Icon({
//   iconUrl: courtIconUrl,   // ✅ use Court.png
//   iconSize: [50, 50],
//   iconAnchor: [15, 30],
//   popupAnchor: [0, -30],
//   // shadowUrl: markerShadow,
//   // // shadowSize: [41, 41],
//   // shadowAnchor: [12, 41],
//   className: "court-marker",
// });

// // Custom pool icon (swimming)
// const poolIcon = new L.Icon({
//   iconUrl: poolIconUrl,    // ✅ use Pool.png
//   iconSize: [50, 50],
//   iconAnchor: [15, 30],
//   popupAnchor: [0, -30],
//   // shadowUrl: markerShadow,
//   // // shadowSize: [41, 41],
//   // shadowAnchor: [12, 41],
//   className: "pool-marker",
// });

// Function to get appropriate icon based on pin name
const getPinIcon = (pinName: string) => {
  const name = pinName.toLowerCase();
  if (name.includes('court') || name.includes('basketball')) {
    return courtIcon;
  } else if (name.includes('pool') || name.includes('swimming')) {
    return poolIcon;
  }
  return houseIcon;
};

// ClickCoordinates component
interface ClickCoordinatesProps {
  setCoords: React.Dispatch<React.SetStateAction<string>>;
  isAdmin: boolean;
  refreshPins: () => void;
}

const ClickCoordinates: React.FC<ClickCoordinatesProps> = ({
  setCoords,
  isAdmin,
  refreshPins,
}) => {
  const { addNotification } = useNotifications();

  useMapEvents({
    click(e) {
      try {
        if (!isAdmin) return;
        const { lat, lng } = e.latlng;
        setCoords(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        const name = prompt("Enter pin name:");
        if (!name) return;

        fetch("http://localhost:8000/api/url/", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrftoken,
          },
          body: JSON.stringify({
            name,
            latitude: lat,
            longitude: lng,
          }),
        })
          .then((res) => {
            if (!res.ok) throw new Error("Failed to add pin");
            return res.json();
          })
          .then(() => {
            addNotification(` Pin "${name}" added at (${lat.toFixed(6)}, ${lng.toFixed(6)})`);
            refreshPins();
          })
          .catch((err) => addNotification(`❌ Failed to add pin "${name}": ${err.message}`));
      } catch (error) {
        console.warn("Error handling map click:", error);
      }
    },
  });
  return null;
};

// Error Boundary Component for Map
class MapErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.warn("Map error caught by boundary:", error);
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn("Map error details:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// Main MapPage component
const MapPage: React.FC<MapPageProps> = ({ isAdmin }) => {
  const [pins, setPins] = useState<Pin[]>([]);
  const [coords, setCoords] = useState<string>("");
  const [bookings, setBookings] = useState<FacilityBooking[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);
  const [, setMapError] = useState<string | null>(null);
  // const [mapError, setMapError] = useState<string | null>(null);
  // const mapRef = useRef<L.Map | null>(null);
  const { addNotification } = useNotifications();

  const circleCenter: [number, number] = [14.408017, 120.949452];
  const circleRadius = 150;

  const fetchPins = useCallback(() => {
    fetch("http://localhost:8000/api/url/", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data: Pin[]) => setPins(data))
      .catch((err) => addNotification(`❌ Error fetching pins: ${err.message}`));
  }, [addNotification]);


  const fetchBookings = useCallback(() => {
    const token = localStorage.getItem("access");
    
    if (!token) {
      console.log("No authentication token found, skipping bookings fetch");
      setBookings([]);
      return;
    }

    fetch("http://127.0.0.1:8000/api/bookings/", {
      credentials: "include",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) {
            console.log("Authentication failed, user not logged in");
            addNotification("⚠️ Please log in to view booking information");
            setBookings([]);
            return;
          }
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        // Ensure data is an array
        if (Array.isArray(data)) {
          setBookings(data);
        } else {
          console.warn("Bookings data is not an array:", data);
          setBookings([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching bookings:", err);
        addNotification(`❌ Error fetching bookings: ${err.message}`);
        setBookings([]);
      });
  }, [addNotification]);

  useEffect(() => {
    // Global error handler for Leaflet
    const handleLeafletError = (event: ErrorEvent) => {
      if (event.message && event.message.includes('_leaflet_pos')) {
        console.warn("Leaflet positioning error caught:", event.message);
        event.preventDefault();
        setMapError("Map positioning error - please refresh");
        return false;
      }
    };

    window.addEventListener('error', handleLeafletError);

    const loadData = async () => {
      try {
        await Promise.all([fetchPins(), fetchBookings()]);
        // Add a longer delay to ensure DOM is fully ready
        setTimeout(() => {
          setIsMapReady(true);
          setMapError(null);
        }, 500);
      } catch (error) {
        console.error("Error loading data:", error);
        setMapError("Failed to load map data");
        setIsMapReady(true); // Still show map even if data fails
      }
    };
    
    loadData();

    return () => {
      window.removeEventListener('error', handleLeafletError);
    };
  }, [fetchPins, fetchBookings]);

  const occupiedCount = pins.filter((pin) =>
    pin.name.toLowerCase().includes("occupied")
  ).length;
  const maxSubdivisions = 200;
  const availableCount = Math.max(maxSubdivisions - occupiedCount, 0);

  const pieData = [
    { name: "Occupied", value: occupiedCount },
    { name: "Available", value: availableCount },
  ];

  const COLORS = ["#2e6F40", "#cccccc"];

const handleDelete = (pin: Pin) => {
  if (!window.confirm(`Are you sure you want to delete pin "${pin.name}"?`)) return;
  fetch(`http://localhost:8000/api/url/${pin.id}/`, {
    method: "DELETE",
    credentials: "include",
    headers: { "X-CSRFToken": csrftoken },
  })
    .then((res) => {
      if (!res.ok) throw new Error("Failed to delete pin");
      addNotification(`🗑️ Pin "${pin.name}" deleted!`);
      fetchPins();
    })
    .catch((err) => addNotification(`❌ Failed to delete pin "${pin.name}": ${err.message}`));
};

const handleEdit = (pin: Pin) => {
  const newName = prompt("Enter new name:", pin.name);
  if (!newName || newName === pin.name) return;
  fetch(`http://localhost:8000/api/url/${pin.id}/`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrftoken,
    },
    body: JSON.stringify({
      name: newName,
      latitude: pin.latitude,
      longitude: pin.longitude,
    }),
  })
    .then((res) => {
      if (!res.ok) throw new Error("Failed to update pin");
      return res.json();
    })
    .then(() => {
      addNotification(`✏️ Pin renamed from "${pin.name}" to "${newName}"`);
      fetchPins();
    })
    .catch((err) => addNotification(`❌ Failed to update pin "${pin.name}": ${err.message}`));
};

  // const luzonBounds: [[number, number], [number, number]] = [
  //   [12.0, 118.0],
  //   [19.0, 123.0],
  // ];

  if (!isMapReady) {
    return (
      <>
        <NavBar profile={null} />
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          height: "50vh",
          fontSize: "18px",
          color: "#2e6F40"
        }}>
          Loading map data...
        </div>
      </>
    );
  }

  return (
    <>
      <NavBar profile={null} />
      <h1 className="map-title">
        <img
          src={require("../images/circle.png")}
          alt="Happy Homes Icon"
          style={{
            width: "40px",
            verticalAlign: "middle",
            marginRight: "10px",
          }}
        />
        Happy Homes Map
      </h1>

      <div
        className="map-page-container"
        style={{
          display: "flex",
          gap: "20px",
          padding: "20px",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {/* Sidebar */}
        <div
          className="pins-sidebar"
          style={{
            width: "280px",
            backgroundColor: "#f5f5f5",
            borderRadius: "10px",
            padding: "15px",
            boxShadow: "0 0 8px rgba(0,0,0,0.1)",
            overflowY: "auto",
            maxHeight: "600px",
          }}
        >
          <h2>Pins List</h2>
          {pins.length === 0 && <p>No pins available.</p>}
          {pins.map((pin) => (
            <div
              key={pin.id}
              className="pin-item"
              style={{
                padding: "8px",
                borderBottom: "1px solid #ddd",
                fontSize: "14px",
              }}
            >
              <strong>{pin.name}</strong>
              <br />
              Status:{" "}
              {pin.name.toLowerCase().includes("occupied")
                ? "Occupied"
                : pin.name.toLowerCase().includes("court") || pin.name.toLowerCase().includes("pool")
                ? "Facility"
                : "Available"}
              
              {/* Show booking count for facilities */}
              {(pin.name.toLowerCase().includes("court") || pin.name.toLowerCase().includes("pool")) && (
                <div style={{ fontSize: "12px", color: "#666", marginTop: "3px" }}>
                  📅 {Array.isArray(bookings) ? bookings.filter(b => {
                    const pinName = pin.name.toLowerCase();
                    const facilityName = b.facility_name.toLowerCase();
                    return (pinName.includes('court') && facilityName.includes('court')) ||
                           (pinName.includes('pool') && facilityName.includes('pool'));
                  }).filter(b => b.status === "approved").length : 0} approved bookings
                </div>
              )}
              
              <div className="pin-actions" style={{ marginTop: "6px" }}>
                {isAdmin && (
                  <>
                    <button
                      onClick={() => handleEdit(pin)}
                      style={{
                        marginRight: "8px",
                        fontSize: "14px",
                        cursor: "pointer",
                        backgroundColor: "#2e6F40",
                        color: "white",
                        border: "none",
                        padding: "4px 8px",
                        borderRadius: "4px",
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(pin)}
                      style={{
                        fontSize: "14px",
                        cursor: "pointer",
                        backgroundColor: "#2e6F40",
                        color: "white",
                        border: "none",
                        padding: "4px 8px",
                        borderRadius: "4px",
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          
          {/* Booking Management Section */}
          {isAdmin && Array.isArray(bookings) && bookings.length > 0 && (
            <div style={{ marginTop: "20px", borderTop: "2px solid #ddd", paddingTop: "15px" }}>
              <h3 style={{ color: "#2e6F40", fontSize: "16px", marginBottom: "10px" }}>
                📅 Recent Bookings
              </h3>
              <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                {bookings
                  .filter(b => b.status === "approved")
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .slice(0, 5)
                  .map((booking) => (
                    <div key={booking.id} style={{
                      fontSize: "12px",
                      padding: "5px",
                      margin: "3px 0",
                      backgroundColor: "white",
                      borderRadius: "4px",
                      border: "1px solid #dee2e6"
                    }}>
                      <div style={{ fontWeight: "bold", color: "#2e6F40" }}>
                        {booking.facility_name}
                      </div>
                      <div style={{ color: "#666" }}>
                        {booking.date} - {booking.start_time} to {booking.end_time}
                      </div>
                      <div style={{ color: "#495057", fontSize: "11px" }}>
                        👤 {booking.user_name}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Map */}
        <div
          className="map-wrapper"
          style={{
            flex: 1,
            height: "600px",
            minHeight: "400px",
            border: "1px solid #2b2b2b",
            borderRadius: "10px",
            position: "relative",
          }}
        >
          <MapErrorBoundary
            fallback={
              <div style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#f8f9fa",
                borderRadius: "10px",
                color: "#6c757d"
              }}>
                <div style={{ textAlign: "center" }}>
                  <h3>Map temporarily unavailable</h3>
                  <p>Please refresh the page to try again.</p>
                  <button 
                    onClick={() => window.location.reload()}
                    style={{
                      padding: "10px 20px",
                      backgroundColor: "#2e6F40",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer"
                    }}
                  >
                    Refresh Page
                  </button>
                </div>
              </div>
            }
          >
            <MapContainer
  center={circleCenter}
  zoom={19}
  style={{ height: "100%", width: "100%", borderRadius: "10px" }}
  attributionControl={false}
  zoomControl={true}
  scrollWheelZoom={true}
  doubleClickZoom={true}
  dragging={true}
  whenReady={() => {
    console.log("Map is ready");
    setMapError(null);
  }}
>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickCoordinates
              setCoords={setCoords}
              isAdmin={isAdmin}
              refreshPins={fetchPins}
            />
            <Circle
              center={circleCenter}
              radius={circleRadius}
              pathOptions={{ color: "green", fillColor: "red", fillOpacity: 0 }}
            />
            {pins.map((pin) => (
              <Marker
                key={pin.id}
                position={[pin.latitude, pin.longitude]}
                icon={getPinIcon(pin.name)}
              >
                <Popup>
                  <div style={{ minWidth: "250px" }}>
                    <strong>{pin.name}</strong>
                    <br />
                    Status:{" "}
                    <span style={{ 
                      color: pin.name.toLowerCase().includes("occupied") ? "#d9534f" : 
                             pin.name.toLowerCase().includes("court") || pin.name.toLowerCase().includes("pool") ? "#2e6F40" : "#28a745",
                      fontWeight: "bold"
                    }}>
                      {pin.name.toLowerCase().includes("occupied")
                        ? "Occupied"
                        : pin.name.toLowerCase().includes("court") || pin.name.toLowerCase().includes("pool")
                        ? "Facility"
                        : "Available"}
                    </span>
                    
                    {/* Show booking information for Court and Pool */}
                    {(pin.name.toLowerCase().includes("court") || pin.name.toLowerCase().includes("pool")) && (
                      <div style={{ marginTop: "10px" }}>
                        <h4 style={{ margin: "5px 0", fontSize: "14px", color: "#2e6F40" }}>
                          📅 Current Bookings:
                        </h4>
                        <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                          {Array.isArray(bookings) && bookings
                            .filter(b => {
                              const pinName = pin.name.toLowerCase();
                              const facilityName = b.facility_name.toLowerCase();
                              return (pinName.includes('court') && facilityName.includes('court')) ||
                                     (pinName.includes('pool') && facilityName.includes('pool'));
                            })
                            .filter(b => b.status === "approved")
                            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                            .slice(0, 5)
                            .map((booking) => (
                              <div key={booking.id} style={{ 
                                fontSize: "12px", 
                                margin: "5px 0",
                                padding: "5px",
                                backgroundColor: "#f8f9fa",
                                borderRadius: "4px",
                                border: "1px solid #dee2e6"
                              }}>
                                <div style={{ fontWeight: "bold", color: "#2e6F40" }}>
                                  {booking.date}
                                </div>
                                <div style={{ color: "#666" }}>
                                  {booking.start_time} - {booking.end_time}
                                </div>
                                <div style={{ color: "#495057", fontSize: "11px" }}>
                                  👤 Booked by: {booking.user_name}
                                </div>
                                <div style={{ 
                                  color: booking.status === "approved" ? "#28a745" : 
                                         booking.status === "pending" ? "#ffc107" : "#dc3545",
                                  fontSize: "10px",
                                  fontWeight: "bold"
                                }}>
                                  Status: {booking.status.toUpperCase()}
                                </div>
                              </div>
                            ))}
                          {Array.isArray(bookings) && bookings.filter(b => {
                            const pinName = pin.name.toLowerCase();
                            const facilityName = b.facility_name.toLowerCase();
                            return (pinName.includes('court') && facilityName.includes('court')) ||
                                   (pinName.includes('pool') && facilityName.includes('pool'));
                          }).filter(b => b.status === "approved").length === 0 && (
                            <div style={{ 
                              fontSize: "12px", 
                              color: "#6c757d", 
                              fontStyle: "italic",
                              textAlign: "center",
                              padding: "10px"
                            }}>
                              No bookings scheduled
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {isAdmin && (
                      <div className="pin-actions" style={{ marginTop: "10px" }}>
                        <button onClick={() => handleEdit(pin)}>✏️ Edit</button>
                        <button onClick={() => handleDelete(pin)}>🗑️ Delete</button>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          {coords && isAdmin && (
            <div className="coords-display" style={{ marginTop: 10 }}>
              📌 Last clicked: <strong>{coords}</strong>
            </div>
          )}
          </MapErrorBoundary>
        </div>

        {/* Chart */}
        <div className="chartsidebar">
          <h2>Subdivision Occupancy</h2>
          <PieChart width={350} height={250}> 
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) =>
                `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
              }
            >
              {pieData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
          <p style={{ textAlign: "center", marginTop: "10px" }}>
            {occupiedCount} / {maxSubdivisions} occupied
          </p>
          <h3 style={{ marginTop: "40px", color: "#2e6F40" }}>
            Occupancy Bar Chart
          </h3>
          <BarChart width={350} height={200} data={pieData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#2e6F40" />
          </BarChart>
        </div>
      </div>
    </>
  );
};

export default MapPage;

