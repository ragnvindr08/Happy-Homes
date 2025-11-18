// src/pages/UserMapPage.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./MapPage.css";
import NavBar from "./NavBar";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import houseIconUrl from "../images/house.png";
import courtIconUrl from "../images/court.png";
import poolIconUrl from "../images/pool.png";

// Fix Leaflet default icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Types
interface Pin {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  status?: "Available" | "Occupied" | "Reserved";
  description?: string;
  image?: string;
  price?: string;
  square_meter?: number | string;
  average_rating?: number;
  review_count?: number;
}

interface Review {
  id: number;
  pin: number;
  pin_name: string;
  user: number;
  user_name: string;
  user_profile_image?: string;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
}

// Custom icons
const houseIcon = new L.Icon({
  iconUrl: houseIconUrl,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
  shadowUrl: markerShadow,
  shadowSize: [41, 41],
  shadowAnchor: [12, 41],
});

const courtIcon = new L.Icon({
  iconUrl: courtIconUrl,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
  shadowUrl: markerShadow,
  shadowSize: [41, 41],
  shadowAnchor: [12, 41],
});

const poolIcon = new L.Icon({
  iconUrl: poolIconUrl,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
  shadowUrl: markerShadow,
  shadowSize: [41, 41],
  shadowAnchor: [12, 41],
});

// Get icon based on name
const getPinIcon = (pinName: string) => {
  const name = pinName.toLowerCase();
  if (name.includes("court") || name.includes("basketball")) return courtIcon;
  if (name.includes("pool") || name.includes("swimming")) return poolIcon;
  return houseIcon;
};

// Resize fix for Leaflet
const ResizeFix: React.FC = () => {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 200);
  }, [map]);
  return null;
};

// Pin Popup Content Component
interface PinPopupContentProps {
  pin: Pin;
  reviews: Review[];
  activeTab: "overview" | "reviews";
  setActiveTab: (tab: "overview" | "reviews") => void;
  isAuthenticated: boolean;
  showReviewForm: boolean;
  setShowReviewForm: (show: boolean) => void;
  reviewRating: number;
  setReviewRating: (rating: number) => void;
  reviewComment: string;
  setReviewComment: (comment: string) => void;
  handleSubmitReview: () => void;
  renderStars: (rating: number) => React.ReactNode;
  formatDate: (dateString: string) => string;
  fetchReviews: () => void;
}

const PinPopupContent: React.FC<PinPopupContentProps> = ({
  pin,
  reviews,
  activeTab,
  setActiveTab,
  isAuthenticated,
  showReviewForm,
  setShowReviewForm,
  reviewRating,
  setReviewRating,
  reviewComment,
  setReviewComment,
  handleSubmitReview,
  renderStars,
  formatDate,
  fetchReviews
}) => {
  return (
    <div style={{ 
      minWidth: '320px', 
      maxWidth: '380px',
      fontFamily: 'Roboto, Arial, sans-serif'
    }}>
      {/* Image Section */}
      {pin.image && (
        <div style={{
          width: '100%',
          height: 'auto',
          overflow: 'hidden',
          borderRadius: '8px 8px 0 0',
          margin: '-10px -10px 12px -10px',
          backgroundColor: '#f5f5f5'
        }}>
          <img 
            src={pin.image.startsWith('http') ? pin.image : `http://localhost:8000${pin.image}`}
            alt={pin.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block'
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement!.style.display = 'none';
            }}
          />
        </div>
      )}
      
      {/* Title Section */}
      <div style={{
        marginBottom: '12px',
        paddingBottom: '10px',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: '500',
          color: '#1a1a1a',
          lineHeight: '1.4',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {pin.name.toLowerCase().includes("court") && ""}
          {pin.name.toLowerCase().includes("pool") && ""}
          {!pin.name.toLowerCase().includes("court") && !pin.name.toLowerCase().includes("pool") && ""}
          <span>{pin.name}</span>
        </h3>
        {/* Rating Display */}
       

      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #e0e0e0',
        marginBottom: '12px'
      }}>
        <button
          onClick={() => setActiveTab("overview")}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            
            color: activeTab === 'overview' ? 'rgb(46, 125, 50)' : '#666',
            fontWeight: activeTab === 'overview' ? '500' : '400',
            fontSize: '14px'
          }}
        >
          Overview
        </button>

      </div>

      {/* Tab Content */}
      {activeTab === "overview" ? (
        <div>
          {/* Status Badge */}
          {pin.status && (
            <div style={{ marginBottom: '12px' }}>
              <span style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '16px',
                fontSize: '12px',
                fontWeight: '500',
                backgroundColor: pin.status === 'Available' ? '#e8f5e9' : 
                               pin.status === 'Occupied' ? '#fff3e0' : 
                               pin.status === 'Reserved' ? '#fce4ec' : '#f5f5f5',
                color: pin.status === 'Available' ? '#2e7d32' : 
                      pin.status === 'Occupied' ? '#f57c00' : 
                      pin.status === 'Reserved' ? '#c2185b' : '#616161',
                border: `1px solid ${pin.status === 'Available' ? '#a5d6a7' : 
                                pin.status === 'Occupied' ? '#ffcc80' : 
                                pin.status === 'Reserved' ? '#f48fb1' : '#e0e0e0'}`
              }}>
                {pin.status}
              </span>
            </div>
          )}
          
          {/* Address Section */}
          {pin.description && (
            <div style={{
              marginBottom: '12px',
              paddingBottom: '12px',
              borderBottom: '1px solid #f0f0f0'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}>
                <span style={{
                  fontSize: '16px',
                  color: '#666',
                  marginTop: '2px'
                }}></span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '11px',
                    color: '#666',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '4px',
                    fontWeight: '500'
                  }}>
                    Address and Description
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#1a1a1a',
                    lineHeight: '1.5'
                  }}>
                    {pin.description}
                  </div>
                </div>
              </div>
            </div>
          )}

                    {/* Address Section */}
          {pin.price && (
            <div style={{
              marginBottom: '12px',
              paddingBottom: '12px',
              borderBottom: '1px solid #f0f0f0'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}>
                <span style={{
                  fontSize: '16px',
                  color: '#666',
                  marginTop: '2px'
                }}></span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '11px',
                    color: '#666',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '4px',
                    fontWeight: '500'
                  }}>
                    Price (Peso)
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#1a1a1a',
                    lineHeight: '1.5'
                  }}>
                    {pin.price}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Square Meter Section */}
          {pin.square_meter && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 0'
            }}>
              <span style={{
                fontSize: '16px',
                color: '#666'
              }}></span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '11px',
                  color: '#666',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '4px',
                  fontWeight: '500'
                }}>
                  Area
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#1a1a1a',
                  fontWeight: '500'
                }}>
                  {pin.square_meter} m²
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {/* Write Review Button */}
          {isAuthenticated && !showReviewForm && (
            <button
              onClick={() => setShowReviewForm(true)}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '16px',
                backgroundColor: '#4285f4',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Write a Review
            </button>
          )}

          {/* Review Form */}
         

        </div>
      )}
    </div>
  );
};

const UserMapPage: React.FC = () => {
  const [pins, setPins] = useState<Pin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "reviews">("overview");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const circleCenter: [number, number] = [14.408017, 120.949452];
  const circleRadius = 150;

  const fetchPins = useCallback(() => {
    fetch("http://localhost:8000/api/url/", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data: Pin[]) => setPins(data))
      .catch((err) => console.error("Error fetching pins:", err));
  }, []);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("access");
    setIsAuthenticated(!!token);
  }, []);

  // Fetch reviews for selected pin
  const fetchReviews = useCallback(async (pinId: number) => {
    try {
      const token = localStorage.getItem("access");
      const response = await fetch(`http://localhost:8000/api/reviews/?pin_id=${pinId}`, {
        headers: token ? {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        } : {
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await fetchPins();
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [fetchPins]);

  // Handle pin popup open
  const handlePinPopupOpen = (pin: Pin) => {
    setSelectedPin(pin);
    setActiveTab("overview");
    fetchReviews(pin.id);
  };

  // Submit review
  const handleSubmitReview = async () => {
    if (!selectedPin || !isAuthenticated) {
      alert("Please log in to write a review");
      return;
    }

    try {
      const token = localStorage.getItem("access");
      const response = await fetch("http://localhost:8000/api/reviews/", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pin: selectedPin.id,
          rating: reviewRating,
          comment: reviewComment
        })
      });

      if (response.ok) {
        setReviewRating(5);
        setReviewComment("");
        setShowReviewForm(false);
        fetchReviews(selectedPin.id);
        // Refresh pins to update rating
        fetchPins();
      } else {
        const error = await response.json();
        alert(error.detail || "Failed to submit review");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review");
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Render stars
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < rating ? '#FFA500' : '#ddd', fontSize: '16px' }}>
        ★
      </span>
    ));
  };

  if (isLoading) {
    return (
      <>
        <NavBar profile={null} />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            fontSize: "18px",
            color: "#2e6F40",
          }}
        >
          Loading map data...
        </div>
      </>
    );
  }

  const filteredPins = pins.filter((pin) => {
    const searchLower = search.toLowerCase();
    return (
      (pin.status && pin.status.toLowerCase().includes(searchLower)) ||
      (pin.description && pin.description.toLowerCase().includes(searchLower))
    );
  });

  return (
    <>
      <NavBar profile={null} />
      <div style={{ position: "relative", height: "100vh", width: "100%" }}>
        {/* Search Input Overlay */}
        <div
          style={{
            position: "absolute",
            top: 10,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            width: "90%",
            maxWidth: "400px",
          }}
        >
          <input
            type="text"
            placeholder="Search by status or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 15px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              fontSize: "14px",
              backgroundColor: "white",
              boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            }}
          />
        </div>

        <MapContainer
          center={circleCenter}
          zoom={19}
          style={{ height: "100%", width: "100%" }}
          attributionControl={false}
          zoomControl={true}
          scrollWheelZoom={true}
        >
          <ResizeFix />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Circle
            center={circleCenter}
            radius={circleRadius}
            pathOptions={{ color: "green", fillColor: "red", fillOpacity: 0 }}
          />
          {filteredPins.map((pin) => {
            const name =
              pin.name.toLowerCase().includes("court") ||
              pin.name.toLowerCase().includes("pool")
                ? pin.name
                : "Unknown";

            return (
              <Marker
                key={pin.id}
                position={[pin.latitude, pin.longitude]}
                icon={getPinIcon(pin.name)}
                eventHandlers={{
                  popupopen: () => handlePinPopupOpen(pin)
                }}
              >
                <Popup minWidth={320} maxWidth={380} className="google-map-popup">
                  <PinPopupContent 
                    pin={pin}
                    reviews={reviews}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    isAuthenticated={isAuthenticated}
                    showReviewForm={showReviewForm}
                    setShowReviewForm={setShowReviewForm}
                    reviewRating={reviewRating}
                    setReviewRating={setReviewRating}
                    reviewComment={reviewComment}
                    setReviewComment={setReviewComment}
                    handleSubmitReview={handleSubmitReview}
                    renderStars={renderStars}
                    formatDate={formatDate}
                    fetchReviews={() => fetchReviews(pin.id)}
                  />
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </>
  );
};

export default UserMapPage;




// // src/pages/UserMapPage.tsx
// import React, { useEffect, useState, useCallback } from "react";
// import {
//   MapContainer,
//   TileLayer,
//   Marker,
//   Popup,
//   Circle,
//   useMap,
// } from "react-leaflet";
// import L from "leaflet";
// import "leaflet/dist/leaflet.css";
// import "./MapPage.css";
// import NavBar from "./NavBar";

// import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
// import markerIcon from "leaflet/dist/images/marker-icon.png";
// import markerShadow from "leaflet/dist/images/marker-shadow.png";
// import houseIconUrl from "../images/house.png";
// import courtIconUrl from "../images/court.png";
// import poolIconUrl from "../images/pool.png";

// // Fix Leaflet default icon paths
// delete (L.Icon.Default.prototype as any)._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: markerIcon2x,
//   iconUrl: markerIcon,
//   shadowUrl: markerShadow,
// });

// // Type for a map pin
// interface Pin {
//   id: number;
//   name: string;
//   latitude: number;
//   longitude: number;
// }

// // Type for facility booking
// interface FacilityBooking {
//   id: number;
//   facility_id: number;
//   facility_name: string;
//   date: string;
//   start_time: string;
//   end_time: string;
//   status: "pending" | "approved" | "rejected";
//   user_name: string;
// }

// // Custom house icon
// const houseIcon = new L.Icon({
//   iconUrl: houseIconUrl,
//   iconSize: [30, 30],
//   iconAnchor: [15, 30],
//   popupAnchor: [0, -30],
//   shadowUrl: markerShadow,
//   shadowSize: [41, 41],
//   shadowAnchor: [12, 41],
// });

// // Custom court icon (basketball)
// const courtIcon = new L.Icon({
//   iconUrl: courtIconUrl,
//   iconSize: [30, 30],
//   iconAnchor: [15, 30],
//   popupAnchor: [0, -30],  
//   className: "court-marker",
// });


// // Custom pool icon (swimming)
// const poolIcon = new L.Icon({
//   iconUrl: poolIconUrl,
//   iconSize: [30, 30],
//   iconAnchor: [15, 30],
//   popupAnchor: [0, -30],
//   className: "pool-marker",
// });

// // Function to get appropriate icon based on pin name
// const getPinIcon = (pinName: string) => {
//   const name = pinName.toLowerCase();
//   if (name.includes("court") || name.includes("basketball")) {
//     return courtIcon;
//   } else if (name.includes("pool") || name.includes("swimming")) {
//     return poolIcon;
//   }
//   return houseIcon;
// };

// // ✅ Fix for Leaflet container resize issues
// const ResizeFix: React.FC = () => {
//   const map = useMap();
//   useEffect(() => {
//     setTimeout(() => {
//       map.invalidateSize();
//     }, 200);
//   }, [map]);
//   return null;
// };

// // Main UserMapPage component
// const UserMapPage: React.FC = () => {
//   const [pins, setPins] = useState<Pin[]>([]);
//   const [bookings, setBookings] = useState<FacilityBooking[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isAuthenticated, setIsAuthenticated] = useState(false);

//   const circleCenter: [number, number] = [14.408017, 120.949452];
//   const circleRadius = 150;

//   const fetchPins = useCallback(() => {
//     fetch("http://localhost:8000/api/url/", {
//       credentials: "include",
//     })
//       .then((res) => res.json())
//       .then((data: Pin[]) => setPins(data))
//       .catch((err) => console.error("Error fetching pins:", err));
//   }, []);

//   const fetchBookings = useCallback(() => {
//     const token = localStorage.getItem("access");

//     if (!token) {
//       console.log("No authentication token found, skipping bookings fetch");
//       setBookings([]);
//       setIsAuthenticated(false);
//       return;
//     }

//     setIsAuthenticated(true);

//     fetch("http://127.0.0.1:8000/api/bookings/", {
//       credentials: "include",
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//       },
//     })
//       .then((res) => {
//         if (!res.ok) {
//           if (res.status === 401) {
//             console.log("Authentication failed, user not logged in");
//             setBookings([]);
//             return;
//           }
//           throw new Error(`HTTP error! status: ${res.status}`);
//         }
//         return res.json();
//       })
//       .then((data) => {
//         if (Array.isArray(data)) {
//           setBookings(data);
//         } else {
//           console.warn("Bookings data is not an array:", data);
//           setBookings([]);
//         }
//       })
//       .catch((err) => {
//         console.error("Error fetching bookings:", err);
//         setBookings([]);
//       });
//   }, []);

//   useEffect(() => {
//     const loadData = async () => {
//       setIsLoading(true);
//       try {
//         await Promise.all([fetchPins(), fetchBookings()]);
//       } catch (error) {
//         console.error("Error loading data:", error);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     loadData();
//   }, [fetchPins, fetchBookings]);

//   const getFacilityBookings = (pinName: string) => {
//     if (!Array.isArray(bookings)) return [];

//     const name = pinName.toLowerCase();
//     if (name.includes("court")) {
//       return bookings.filter((b) =>
//         b.facility_name.toLowerCase().includes("court")
//       );
//     } else if (name.includes("pool")) {
//       return bookings.filter((b) =>
//         b.facility_name.toLowerCase().includes("pool")
//       );
//     }
//     return [];
//   };

//   if (isLoading) {
//     return (
//       <>
//         <NavBar profile={null} />
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "center",
//             alignItems: "center",
//             height: "50vh",
//             fontSize: "18px",
//             color: "#2e6F40",
//           }}
//         >
//           Loading map data...
//         </div>
//       </>
//     );
//   }

//   return (
//     <>
//       <NavBar profile={null} />
//       <h1 className="map-title">
//         <img
//           src={require("../images/circle.png")}
//           alt="Happy Homes Icon"
//           style={{
//             width: "40px",
//             verticalAlign: "middle",
//             marginRight: "10px",
//           }}
//         />
//         Happy Homes Map
//       </h1>

// <div className="user-map-container"
//   style={{
//     display: "flex",
//     gap: "20px",
//     maxWidth: "1200px",
//     margin: "20px auto",
//   }}
// >
//   {/* Facility Information Panel (Left) */}
//   <div
//     className="facility-info-panel"
//     style={{
//       flex: 1,
//       padding: "20px",
//       backgroundColor: "#f8f9fa",
//       borderRadius: "10px",
//       boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
//       overflowY: "auto",
//       maxHeight: "70vh",
//     }}
//   >
//     <h3 style={{ color: "#2e6F40", marginBottom: "15px" }}>
//       🏢 Facility Information
//     </h3>

//     {!isAuthenticated && (
//       <div
//         style={{
//           backgroundColor: "#fff3cd",
//           border: "1px solid #ffeaa7",
//           borderRadius: "8px",
//           padding: "15px",
//           marginBottom: "20px",
//           color: "#856404",
//         }}
//       >
//         <strong>ℹ️ Note:</strong> Please{" "}
//         <a href="/login" style={{ color: "#2e6F40", textDecoration: "underline" }}>
//           log in
//         </a>{" "}
//         to view bookings.
//       </div>
//     )}

//     <div
//       style={{
//         display: "grid",
//         gridTemplateColumns: "1fr",
//         gap: "15px",
//       }}
//     >
//       {pins
//         .filter(
//           (pin) =>
//             pin.name.toLowerCase().includes("court") ||
//             pin.name.toLowerCase().includes("pool")
//         )
//         .map((facility) => {
//           const facilityBookings = getFacilityBookings(facility.name);
//           const approvedBookings = facilityBookings.filter(
//             (b) => b.status === "approved"
//           );

//           return (
//             <div
//               key={facility.id}
//               style={{
//                 backgroundColor: "white",
//                 padding: "15px",
//                 borderRadius: "8px",
//                 border: "1px solid #dee2e6",
//               }}
//             >
//               <h4 style={{ color: "#2e6F40", margin: "0 0 10px 0" }}>
//                 {facility.name}
//               </h4>
//               <p style={{ margin: "5px 0", fontSize: "14px" }}>
//                 {/* {facility.latitude.toFixed(4)}, {facility.longitude.toFixed(4)} */}
//               </p>
//               {isAuthenticated ? (
//                 <>
//                   <p style={{ margin: "5px 0", fontSize: "14px" }}>
//                     Total Bookings: <p style={{ color: "#2e6F40" }}>{approvedBookings.length}</p>
//                   </p>
//                   {approvedBookings.length > 0 && (
//                     <div style={{ marginTop: "10px" }}>
//                       <strong style={{ fontSize: "12px", color: "#666" }}>
//                         Recent Bookings:
//                       </strong>
//                       <div
//                         style={{
//                           maxHeight: "100px",
//                           overflowY: "auto",
//                           marginTop: "5px",
//                         }}
//                       >
// {approvedBookings.slice(0, 3).map((booking) => {
// const formatTime = (timeStr: string): string => {
//   const [hourStr, minuteStr] = timeStr.split(":");
//   const hour = Number(hourStr);
//   const minute = Number(minuteStr);

//   if (isNaN(hour) || isNaN(minute)) {
//     return timeStr;
//   }

//   const ampm = hour >= 12 ? "PM" : "AM";
//   const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
//   const formattedMinute = minute.toString().padStart(2, "0");

//   return `${formattedHour}:${formattedMinute} ${ampm}`;
//   };

//   return (
//     <div
//       key={booking.id}
//       style={{
//         fontSize: "11px",
//         padding: "2px 0",
//         borderBottom: "1px solid #eee",
//       }}
//     >
//       {booking.date} - {formatTime(booking.start_time)} to {formatTime(booking.end_time)}
//     </div>
//   );
// })}
//                       </div>
//                     </div>
//                   )}
//                 </>
//               ) : (
//                 <p
//                   style={{
//                     margin: "5px 0",
//                     fontSize: "14px",
//                     color: "#666",
//                     fontStyle: "italic",
//                   }}
//                 >
//                   📅 Booking info available after login
//                 </p>
//               )}
//             </div>
//           );
//         })}
//     </div>
//   </div>

//   {/* Map (Right) */}
//   <div
//     className="map-wrapper"
//     style={{
//       flex: 2,
//       height: "70vh",
//       minHeight: "400px",
//       border: "1px solid #2b2b2b",
//       borderRadius: "10px",
//     }}
//   >
//     <MapContainer
//       center={circleCenter}
//       zoom={19}
//       style={{ height: "100%", width: "100%", borderRadius: "10px" }}
//       attributionControl={false}
//       zoomControl={true}
//       scrollWheelZoom={true}
//     >
//       <ResizeFix />
//       <TileLayer
//         attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
//         url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//       />
//       <Circle
//         center={circleCenter}
//         radius={circleRadius}
//         pathOptions={{ color: "green", fillColor: "red", fillOpacity: 0 }}
//       />
//       {pins.map((pin) => (
//         <Marker
//           key={pin.id}
//           position={[pin.latitude, pin.longitude]}
//           icon={getPinIcon(pin.name)}
//         >
//           <Popup>
//             <strong>{pin.name}</strong>
//           </Popup>
//         </Marker>
//       ))}
//     </MapContainer>
//   </div>
// </div>
 
//         {/* Facility Information Panel */}
//         <div
//           className="facility-info-panel"
//           style={{
//             maxWidth: "1200px",
//             margin: "0 auto 20px",
//             padding: "20px",
//             backgroundColor: "#f8f9fa",
//             borderRadius: "10px",
//             boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
//           }}
//         >
//           <h3 style={{ color: "#2e6F40", marginBottom: "15px" }}>
//             🏢 Facility Information
//           </h3>

//           {!isAuthenticated && (
//             <div
//               style={{
//                 backgroundColor: "#fff3cd",
//                 border: "1px solid #ffeaa7",
//                 borderRadius: "8px",
//                 padding: "15px",
//                 marginBottom: "20px",
//                 color: "#856404",
//               }}
//             >
//               <strong>ℹ️ Note:</strong> To view booking information and make
//               reservations, please{" "}
//               <a
//                 href="/login"
//                 style={{ color: "#2e6F40", textDecoration: "underline" }}
//               >
//                 log in
//               </a>{" "}
//               to your account.
//             </div>
//           )}
//           <div
//             style={{
//               display: "grid",
//               gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
//               gap: "15px",
//             }}
//           >
//             {pins
//               .filter(
//                 (pin) =>
//                   pin.name.toLowerCase().includes("court") ||
//                   pin.name.toLowerCase().includes("pool")
//               )
//               .map((facility) => {
//                 const facilityBookings = getFacilityBookings(facility.name);
//                 const approvedBookings = facilityBookings.filter(
//                   (b) => b.status === "approved"
//                 );

//                 return (
//                   <div
//                     key={facility.id}
//                     style={{
//                       backgroundColor: "white",
//                       padding: "15px",
//                       borderRadius: "8px",
//                       border: "1px solid #dee2e6",
//                     }}
//                   >
//                     <h4 style={{ color: "#2e6F40", margin: "0 0 10px 0" }}>
//                       {facility.name}
//                     </h4>
//                     <p style={{ margin: "5px 0", fontSize: "14px" }}>
//                       📍 Location: {facility.latitude.toFixed(4)},{" "}
//                       {facility.longitude.toFixed(4)}
//                     </p>
//                     {isAuthenticated ? (
//                       <>
//                         <p style={{ margin: "5px 0", fontSize: "14px" }}>
//                           📅 Total Bookings: {approvedBookings.length}
//                         </p>
//                         {approvedBookings.length > 0 && (
//                           <div style={{ marginTop: "10px" }}>
//                             <strong
//                               style={{ fontSize: "12px", color: "#666" }}
//                             >
//                               Recent Bookings:
//                             </strong>
//                             <div
//                               style={{
//                                 maxHeight: "100px",
//                                 overflowY: "auto",
//                                 marginTop: "5px",
//                               }}
//                             >
//                               {approvedBookings.slice(0, 3).map((booking) => (
//                                 <div
//                                   key={booking.id}
//                                   style={{
//                                     fontSize: "11px",
//                                     padding: "2px 0",
//                                     borderBottom: "1px solid #eee",
//                                   }}
//                                 >
//                                   {booking.date} - {booking.start_time} to{" "}
//                                   {booking.end_time}
//                                 </div>
//                               ))}
//                             </div>
//                           </div>
//                         )}
//                       </>
//                     ) : (
//                       <p
//                         style={{
//                           margin: "5px 0",
//                           fontSize: "14px",
//                           color: "#666",
//                           fontStyle: "italic",
//                         }}
//                       >
//                         📅 Booking information available after login
//                       </p>
//                     )}
//                   </div>
//                 );
//               })}
//           </div>
//         </div>
      
//    </>
//   );
// };

// export default UserMapPage;
