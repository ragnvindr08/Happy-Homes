// src/components/MapPage.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  LayersControl,
  Circle,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./MapPage.css";
import NavBar from "./NavBar";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  // BarChart,
  // Bar,
  // XAxis,
  // YAxis,
  // ResponsiveContainer,
} from "recharts";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import houseIconUrl from "../images/house.png";
import circleImage from '../images/circle.png';
import { getToken } from "../utils/auth";

// import { useNotifications } from "../pages/NotificationContext"; // import your context

// Temporary notification function for debugging
const useNotifications = () => {
  return {
    addNotification: (message: string) => {
      console.log('Notification:', message);
      alert(message); // Use alert for debugging
    }
  };
};

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
  status?: string;
  description?: string;
  price?: string;
  occupant?: string;
  image?: string;
  square_meter?: number | string;
  
}

// Sample mock pins data for when backend is not available
const samplePins: Pin[] = [
  { id: 1, name: "Sample House 1", latitude: 14.408017, longitude: 120.949452 },
  { id: 2, name: "Sample House 2", latitude: 14.408500, longitude: 120.949800 },
  { id: 3, name: "Sample House 3", latitude: 14.407800, longitude: 120.949200 },
  { id: 4, name: "Sample House 4", latitude: 14.408300, longitude: 120.948900 },
  { id: 5, name: "Sample House 5", latitude: 14.407500, longitude: 120.949600 },
];

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

// Get CSRF token with fallback
const getCSRFToken = (): string => {
  const token = getCookie("csrftoken");
  if (!token) {
    console.warn("CSRF token not found, using empty string");
  }
  return token || "";
};

// Build Authorization header from JWT (if available)
const getAuthHeaders = () => {
  const token = getToken && getToken();
  return token ? { Authorization: `Bearer ${token}` } : {} as Record<string, string>;
};

// Map Controller Component to get map instance
const MapController: React.FC<{ onMapReady: (map: L.Map) => void }> = ({ onMapReady }) => {
  const map = useMap();
  React.useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);
  return null;
};

// House Search Component
interface HouseSearchProps {
  pins: Pin[];
  onSearch: (filteredPins: Pin[]) => void;
  mapInstance?: L.Map | null;
}

const HouseSearch: React.FC<HouseSearchProps> = ({ pins, onSearch, mapInstance }) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [resultCount, setResultCount] = useState<number>(pins.length);
  const [matchedPins, setMatchedPins] = useState<Pin[]>([]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      onSearch(pins);
      setResultCount(pins.length);
      setMatchedPins([]);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = pins.filter((pin) => {
      const nameMatch = pin.name?.toLowerCase().includes(query) || false;
      const occupantMatch = pin.occupant?.toLowerCase().includes(query) || false;
      return nameMatch || occupantMatch;
    });

    onSearch(filtered);
    setResultCount(filtered.length);
    setMatchedPins(filtered);

    // Navigate to first result if found
    if (filtered.length > 0 && mapInstance) {
      const firstPin = filtered[0];
      if (firstPin) {
        mapInstance.flyTo([firstPin.latitude, firstPin.longitude], 19, {
          duration: 1.5
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, pins.length]); // Only depend on pins.length to prevent loops

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        margin: '20px 0 10px',
        padding: '0 20px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by house name or occupant..."
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '10px',
            border: '2px solid #2e6F40',
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            outline: 'none',
            backgroundColor: 'white',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#24572b';
            e.target.style.boxShadow = '0 4px 16px rgba(46, 111, 64, 0.25)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#2e6F40';
            e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
          }}
        />
        {searchQuery && matchedPins.length > 0 && (
          <div
            style={{
              marginTop: '10px',
              padding: '12px',
              backgroundColor: '#e8f5e8',
              borderRadius: '8px',
              border: '1px solid #2e6F40',
            }}
          >
            <div style={{ fontSize: '12px', color: '#2e6F40', fontWeight: 'bold', marginBottom: '8px' }}>
              {resultCount} result{resultCount === 1 ? '' : 's'} found:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {matchedPins.slice(0, 5).map((pin) => (
                <div
                  key={pin.id}
                  style={{
                    padding: '8px',
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: '#333',
                    border: '1px solid #ddd',
                  }}
                >
                  <strong style={{ color: '#2e6F40' }}>🏠 {pin.name}</strong>
                  {pin.occupant && (
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                      👤 Occupant: {pin.occupant}
                    </div>
                  )}
                </div>
              ))}
              {matchedPins.length > 5 && (
                <div style={{ fontSize: '11px', color: '#666', fontStyle: 'italic', textAlign: 'center' }}>
                  ... and {matchedPins.length - 5} more
                </div>
              )}
            </div>
          </div>
        )}
        {searchQuery && matchedPins.length === 0 && (
          <div
            style={{
              marginTop: '6px',
              fontSize: '12px',
              color: '#dc3545',
              textAlign: 'center',
              padding: '8px',
              backgroundColor: '#fff3cd',
              borderRadius: '6px',
            }}
          >
            No results found
          </div>
        )}
      </div>
    </div>
  );
};

// Custom house icon - moved inside component to ensure proper initialization
const createHouseIcon = () => {
  try {
    return new L.Icon({
  iconUrl: houseIconUrl,
      iconSize: [35, 35], // Consistent size
      iconAnchor: [17.5, 35], // Perfect center alignment - bottom center
      popupAnchor: [0, -35],
  shadowUrl: markerShadow,
  shadowSize: [41, 41],
  shadowAnchor: [12, 41],
});
  } catch (error) {
    console.error('Error creating house icon:', error);
    // Fallback to default icon
    return new L.Icon.Default();
  }
};

// Custom preview icon for new pins
const createPreviewIcon = () => {
  try {
    return new L.Icon({
      iconUrl: houseIconUrl,
      iconSize: [40, 40], // Slightly larger for preview
      iconAnchor: [20, 40], // Perfect center alignment
      popupAnchor: [0, -40],
      shadowUrl: markerShadow,
      shadowSize: [41, 41],
      shadowAnchor: [12, 41],
    });
  } catch (error) {
    console.error('Error creating preview icon:', error);
    return new L.Icon.Default();
  }
};

// Pin form component
interface PinFormProps {
  clickedCoords: {lat: number, lng: number} | null;
  onSubmit: (pinData: {name: string, description: string, price: string, status: string, square_meter?: string, image?: File}) => void;
  onCancel: () => void;
}

const PinForm: React.FC<PinFormProps> = ({ clickedCoords, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    status: 'Available',
    square_meter: ''
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Pin form submitted with data:', formData);
    if (!formData.name.trim()) {
      console.log('Form validation failed - name is empty');
      return;
    }
    const submitData = {
      name: formData.name,
      description: formData.description,
      price: formData.price,
      status: formData.status,
      ...(formData.square_meter && { square_meter: formData.square_meter }),
      ...(selectedImage && { image: selectedImage })
    };
    onSubmit(submitData);
  };

  console.log('PinForm rendered, clickedCoords:', clickedCoords);
  
  if (!clickedCoords) {
    console.log('PinForm not rendered - no clickedCoords');
    return null;
  }

  return (
    <div className="pin-form-modal">
      <div className="pin-form-content">
        <h3>Add New Pin at EXACT Location</h3>
        
        <div style={{ 
          backgroundColor: '#e8f5e8', 
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          border: '2px solid #2e6F40',
          textAlign: 'center'
        }}>
          <strong style={{color: '#2e6F40', fontSize: '16px'}}>Pin Location:</strong><br/>
          <div style={{marginTop: '10px'}}>
            <span style={{fontWeight: 'bold'}}>Latitude:</span> 
            <span style={{color: '#2e6F40', fontWeight: 'bold', fontSize: '18px'}}> {clickedCoords.lat}</span><br/>
            <span style={{fontWeight: 'bold'}}>Longitude:</span> 
            <span style={{color: '#2e6F40', fontWeight: 'bold', fontSize: '18px'}}> {clickedCoords.lng}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div>
            <label style={{fontWeight: 'bold', color: '#333'}}>House Name:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Enter house name"
              required
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                marginTop: '5px'
              }}
            />
          </div>
          
          <div style={{marginTop: '15px'}}>
            <label style={{fontWeight: 'bold', color: '#333'}}>Description:</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe the house (optional)"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                marginTop: '5px',
                minHeight: '60px',
                resize: 'vertical'
              }}
            />
          </div>
          
          <div style={{marginTop: '15px'}}>
            <label style={{fontWeight: 'bold', color: '#333'}}>Price:</label>
            <input
              type="text"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              placeholder="Monthly rent/price (optional)"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                marginTop: '5px'
              }}
            />
          </div>
          
          <div style={{marginTop: '15px'}}>
            <label style={{fontWeight: 'bold', color: '#333'}}>Status:</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                marginTop: '5px'
              }}
            >
              <option value="Available">🟢 Available</option>
              <option value="Occupied">🔴 Occupied</option>
              <option value="Reserved">🟡 Reserved</option>
            </select>
          </div>
          
          <div style={{marginTop: '15px'}}>
            <label style={{fontWeight: 'bold', color: '#333'}}>Square Meter:</label>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.square_meter}
                onChange={(e) => setFormData({...formData, square_meter: e.target.value})}
                placeholder="Example: 50.00"
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  marginTop: '5px'
                }}
              />
              <span style={{
                color: '#2e6F40',
                fontWeight: 'bold',
                fontSize: '14px',
                marginTop: '5px'
              }}>m²</span>
            </div>
            <small style={{color: '#666', fontSize: '11px', marginTop: '4px', display: 'block'}}>
              Enter the total house area in square meters (example: 50.00 m²)
            </small>
          </div>
          
          <div style={{marginTop: '15px'}}>
            <label style={{fontWeight: 'bold', color: '#333', display: 'block', marginBottom: '8px'}}>Image:</label>
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
            
            {/* Custom upload button */}
            <button
              type="button"
              onClick={handleImageButtonClick}
              style={{
                width: '100%',
                padding: '12px 20px',
                backgroundColor: selectedImage ? '#28a745' : '#2e6F40',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background-color 0.3s ease',
                marginBottom: '10px'
              }}
              onMouseOver={(e) => {
                if (!selectedImage) {
                  e.currentTarget.style.backgroundColor = '#24572b';
                }
              }}
              onMouseOut={(e) => {
                if (!selectedImage) {
                  e.currentTarget.style.backgroundColor = '#2e6F40';
                }
              }}
            >
              {selectedImage ? (
                <>Image Selected - Click to Change</>
              ) : (
                <>Choose Image to Upload</>
              )}
            </button>
            
            {/* Show selected file name */}
            {selectedImage && (
              <div style={{
                padding: '8px',
                backgroundColor: '#e8f5e8',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#2e6F40',
                marginBottom: '10px',
                textAlign: 'center'
              }}>
                📄 {selectedImage.name}
              </div>
            )}
            
            {/* Image preview */}
            {imagePreview && (
              <div style={{marginTop: '10px', textAlign: 'center'}}>
                <div style={{fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: 'bold'}}>
                  Image Preview:
                </div>
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  style={{
                    maxWidth: '100%',
                    maxHeight: '200px',
                    borderRadius: '6px',
                    border: '2px solid #2e6F40',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  style={{
                    marginTop: '10px',
                    padding: '6px 12px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  🗑️ Remove Image
                </button>
              </div>
            )}
          </div>
          
          <div className="form-buttons" style={{marginTop: '20px', display: 'flex', gap: '10px'}}>
            <button 
              type="submit" 
              style={{
                backgroundColor: '#2e6F40', 
                color: 'white',
                padding: '12px 20px',
                fontSize: '16px',
                fontWeight: 'bold',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                flex: 1
              }}
            >
              Place Pin at Exact Location
            </button>
            <button 
              type="button" 
              onClick={onCancel}
              style={{
                backgroundColor: '#6c757d', 
                color: 'white',
                padding: '12px 20px',
                fontSize: '16px',
                fontWeight: 'bold',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Inline editor shown inside a pin's Popup
interface PinPopupEditorProps {
  pin: Pin;
  isAdmin: boolean;
  onDelete: (pin: Pin) => void;
  onUpdated: () => void; // call fetchPins on success
  setPins: React.Dispatch<React.SetStateAction<Pin[]>>; // fallback local update
}

const PinPopupEditor: React.FC<PinPopupEditorProps> = ({ pin, isAdmin, onDelete, onUpdated, setPins }) => {
  const { addNotification } = useNotifications();

  const detectStatusFromName = (name: string): "Available" | "Occupied" | "Reserved" => {
    const lower = name.toLowerCase();
    if (lower.includes("reserved")) return "Reserved";
    if (lower.includes("occupied")) return "Occupied";
    return "Available";
  };

  const [editName, setEditName] = useState<string>(pin.name.replace(/\s*-(?:\s*)(Occupied|Reserved)/i, ""));
  const [editStatus, setEditStatus] = useState<"Available" | "Occupied" | "Reserved">(
    (pin.status as any) || detectStatusFromName(pin.name)
  );
  const [editOccupant, setEditOccupant] = useState<string>(pin.occupant || "");
  const [editPrice, setEditPrice] = useState<string>(pin.price || "");
  const [editDescription, setEditDescription] = useState<string>(pin.description || "");
  const [editSquareMeter, setEditSquareMeter] = useState<string>(
    pin.square_meter !== undefined && pin.square_meter !== null ? String(pin.square_meter) : ""
  );
  const [saving, setSaving] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const resolveImageUrl = useCallback((imagePath?: string | null) => {
    if (!imagePath) return null;
    return imagePath.startsWith('http') ? imagePath : `http://localhost:8000${imagePath}`;
  }, []);
  const [imagePreview, setImagePreview] = useState<string | null>(resolveImageUrl(pin.image));

  const buildNameWithStatus = (baseName: string, status: string): string => {
    const clean = baseName.trim().replace(/\s*-(?:\s*)(Occupied|Reserved)/i, "");
    return status === "Available" ? clean : `${clean} - ${status}`;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!isAdmin) return;
    setSaving(true);
    const newName = buildNameWithStatus(editName, editStatus);
    const normalizedSquareMeter = editSquareMeter.trim();

    console.log('Updating pin:', pin.id, 'to name:', newName);

    const headers: Record<string, string> = {
      "X-CSRFToken": getCSRFToken(),
      ...getAuthHeaders(),
    };

    // Use FormData if image is being uploaded, otherwise use JSON
    let body: FormData | string;
    if (selectedImage) {
      const formData = new FormData();
      formData.append('name', newName);
      formData.append('latitude', pin.latitude.toString());
      formData.append('longitude', pin.longitude.toString());
      formData.append('status', editStatus);
      formData.append('occupant', editOccupant);
      formData.append('price', editPrice);
      formData.append('description', editDescription);
      formData.append('image', selectedImage);
      formData.append('square_meter', normalizedSquareMeter);
      body = formData;
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify({
        name: newName,
        latitude: pin.latitude,
        longitude: pin.longitude,
        status: editStatus,
        occupant: editOccupant,
        price: editPrice,
        description: editDescription,
        square_meter: normalizedSquareMeter || null,
      });
    }

    fetch(`http://localhost:8000/api/url/${pin.id}/`, {
      method: "PUT",
      credentials: "include",
      headers,
      body,
    })
      .then((res) => {
        console.log('Update response status:', res.status);
        if (res.ok) {
          return res.json();
        } else {
          throw new Error(`Backend error: ${res.status} ${res.statusText}`);
        }
      })
      .then((data) => {
        console.log('Pin updated successfully:', data);
        // Update local state immediately
        setPins((prev) => prev.map((p) => (p.id === pin.id ? {
          ...p,
          name: newName,
          status: editStatus,
          occupant: editOccupant,
          price: editPrice,
          description: editDescription,
          image: data.image || p.image,
          square_meter: data.square_meter ?? normalizedSquareMeter
        } : p)));
        const updatedImagePath = data.image ?? pin.image;
        setImagePreview(resolveImageUrl(updatedImagePath));
        addNotification(`✏️ Pin updated to "${newName}"`);
        onUpdated();
        setSelectedImage(null); // Clear selected image after save
        // Close popup after successful save
        setTimeout(() => {
          const closeButton = document.querySelector('.leaflet-popup-close-button');
          if (closeButton) {
            (closeButton as HTMLElement).click();
          }
        }, 500);
      })
      .catch((err) => {
        console.log('Backend update failed, updating locally:', err.message);
        // Local fallback
        setPins((prev) => prev.map((p) => (p.id === pin.id ? {
          ...p,
          name: newName,
          status: editStatus,
          occupant: editOccupant,
          price: editPrice,
          description: editDescription,
          square_meter: normalizedSquareMeter
        } : p)));
        if (!selectedImage) {
          setImagePreview(resolveImageUrl(pin.image));
        }
        addNotification(`✏️ Pin updated locally to "${newName}" (backend offline)`);
        setSelectedImage(null);
        // Close popup for local updates too
        setTimeout(() => {
          const closeButton = document.querySelector('.leaflet-popup-close-button');
          if (closeButton) {
            (closeButton as HTMLElement).click();
          }
        }, 500);
      })
      .finally(() => setSaving(false));
  };

  return (
    <div style={{ minWidth: '240px', maxWidth: '280px' }}>
      <div style={{ marginBottom: '12px', textAlign: 'center', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
        <strong style={{ color: '#2e6F40', fontSize: '14px' }}>House Details</strong><br/>
        <small style={{ color: '#666', fontSize: '11px' }}>
          {isAdmin ? 'Click to edit information' : 'House information'}
        </small>
      </div>
      
      <div style={{ marginBottom: 8 }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 2, color: '#333', fontSize: '12px' }}>House Name:</label>
        {isAdmin ? (
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '12px' }}
            placeholder="Enter house name"
          />
        ) : (
          <div style={{ 
            width: '100%', 
            padding: '6px', 
            borderRadius: '4px', 
            backgroundColor: '#f8f9fa', 
            fontSize: '12px',
            border: '1px solid #e9ecef',
            color: '#495057'
          }}>
            {editName || 'No name set'}
          </div>
        )}
      </div>
      
      <div style={{ marginBottom: 8 }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 2, color: '#333', fontSize: '12px' }}>Occupant:</label>
        {isAdmin ? (
          <input
            value={editOccupant}
            onChange={(e) => setEditOccupant(e.target.value)}
            style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '12px' }}
            placeholder="Who lives here?"
          />
        ) : (
          <div style={{ 
            width: '100%', 
            padding: '6px', 
            borderRadius: '4px', 
            backgroundColor: '#f8f9fa', 
            fontSize: '12px',
            border: '1px solid #e9ecef',
            color: '#495057'
          }}>
            {editOccupant || 'No occupant set'}
          </div>
        )}
      </div>
      
      <div style={{ marginBottom: 8 }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 2, color: '#333', fontSize: '12px' }}>Status:</label>
        {isAdmin ? (
          <select
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value as any)}
            style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '12px' }}
          >
            <option value="Available">🟢 Available</option>
            <option value="Occupied">🔴 Occupied</option>
            <option value="Reserved">🟡 Reserved</option>
          </select>
        ) : (
          <div style={{ 
            width: '100%', 
            padding: '6px', 
            borderRadius: '4px', 
            backgroundColor: '#f8f9fa', 
            fontSize: '12px',
            border: '1px solid #e9ecef',
            color: '#495057'
          }}>
            {editStatus === 'Available' ? '🟢 Available' : 
             editStatus === 'Occupied' ? '🔴 Occupied' : 
             editStatus === 'Reserved' ? '🟡 Reserved' : 'Unknown'}
          </div>
        )}
      </div>
      
      <div style={{ marginBottom: 8 }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 2, color: '#333', fontSize: '12px' }}>Price:</label>
        {isAdmin ? (
          <input
            value={editPrice}
            onChange={(e) => setEditPrice(e.target.value)}
            style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '12px' }}
            placeholder="Monthly rent/price"
          />
        ) : (
          <div style={{ 
            width: '100%', 
            padding: '6px', 
            borderRadius: '4px', 
            backgroundColor: '#f8f9fa', 
            fontSize: '12px',
            border: '1px solid #e9ecef',
            color: '#495057'
          }}>
            {editPrice || 'No price set'}
          </div>
        )}
      </div>
      
      <div style={{ marginBottom: 8 }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 2, color: '#333', fontSize: '12px' }}>Description:</label>
        {isAdmin ? (
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ddd', minHeight: '40px', fontSize: '12px', resize: 'none' }}
            placeholder="Additional details"
          />
        ) : (
          <div style={{ 
            width: '100%', 
            padding: '6px', 
            borderRadius: '4px', 
            backgroundColor: '#f8f9fa', 
            fontSize: '12px',
            border: '1px solid #e9ecef',
            color: '#495057',
            minHeight: '40px',
            display: 'flex',
            alignItems: 'center'
          }}>
            {editDescription || 'No description available'}
          </div>
        )}
      </div>
      
      <div style={{ marginBottom: 8 }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 2, color: '#333', fontSize: '12px' }}>Square Meter:</label>
        {isAdmin ? (
          <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
            <input
              type="number"
              step="0.01"
              min="0"
              value={editSquareMeter}
              onChange={(e) => setEditSquareMeter(e.target.value)}
              style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '12px' }}
              placeholder="Example: 50.00"
            />
            <span style={{color: '#2e6F40', fontWeight: 'bold', fontSize: '12px'}}>m²</span>
          </div>
        ) : (
          <div style={{ 
            width: '100%', 
            padding: '6px', 
            borderRadius: '4px', 
            backgroundColor: '#f8f9fa', 
            fontSize: '12px',
            border: '1px solid #e9ecef',
            color: '#495057'
          }}>
            {editSquareMeter ? `${editSquareMeter} m²` : 'No area set'}
          </div>
        )}
      </div>
      
      <div style={{ marginBottom: 8 }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 2, color: '#333', fontSize: '12px' }}>Image:</label>
        {isAdmin ? (
          <>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '12px' }}
            />
            {imagePreview && (
              <div style={{ marginTop: '8px', textAlign: 'center' }}>
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  style={{
                    maxWidth: '100%',
                    maxHeight: '150px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>
            )}
          </>
        ) : (
          <div style={{ 
            width: '100%', 
            padding: '6px', 
            borderRadius: '4px', 
            backgroundColor: '#f8f9fa', 
            fontSize: '12px',
            border: '1px solid #e9ecef',
            color: '#495057',
            textAlign: 'center'
          }}>
            {imagePreview ? (
              <img 
                src={imagePreview} 
                alt="House" 
                style={{
                  maxWidth: '100%',
                  maxHeight: '150px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}
              />
            ) : (
              'No image available'
            )}
          </div>
        )}
      </div>
      
      {isAdmin && (
        <div style={{ display: 'flex', gap: 6, marginTop: '12px' }}>
          <button 
            onClick={handleSave} 
            disabled={saving}
            style={{
              backgroundColor: '#2e6F40',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              flex: 1,
              fontSize: '11px',
              fontWeight: 'bold'
            }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button 
            onClick={() => onDelete(pin)}
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 'bold'
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

// ClickCoordinates component
interface ClickCoordinatesProps {
  setCoords: React.Dispatch<React.SetStateAction<string>>;
  isAdmin: boolean;
  refreshPins: () => void;
  setPins: React.Dispatch<React.SetStateAction<Pin[]>>;
  setPreviewCoords: React.Dispatch<React.SetStateAction<{lat: number, lng: number} | null>>;
  setShowPinForm: React.Dispatch<React.SetStateAction<boolean>>;
  setClickedCoords: React.Dispatch<React.SetStateAction<{lat: number, lng: number} | null>>;
}

const ClickCoordinates: React.FC<ClickCoordinatesProps> = ({
  setCoords,
  isAdmin,
  refreshPins,
  setPins,
  setPreviewCoords,
  setShowPinForm,
  setClickedCoords,
}) => {
  const { addNotification } = useNotifications();

  useMapEvents({
    click(e) {
      console.log('Map clicked! isAdmin:', isAdmin);
      
      // Allow pin placement for admin users (or temporarily for all users for testing)
      if (!isAdmin) {
        console.log('Pin placement disabled - user is not admin');
        addNotification('❌ Pin placement is only available for admin users');
        return;
      }
      
      // Get exact click coordinates
      const { lat, lng } = e.latlng;
      
      // Use 6 decimal places for good precision
      const preciseLat = parseFloat(lat.toFixed(6));
      const preciseLng = parseFloat(lng.toFixed(6));
      
      console.log('Map clicked at:', preciseLat, preciseLng);
      console.log('Setting coordinates and showing form...');
      
      // Display coordinates
      setCoords(`${preciseLat}, ${preciseLng}`);
      
      // Set the clicked coordinates for the form
      setClickedCoords({ lat: preciseLat, lng: preciseLng });
      
      // Show preview marker at exact location
      setPreviewCoords({ lat: preciseLat, lng: preciseLng });
      
      // Show the pin form
      setShowPinForm(true);
      
      console.log('Pin form should now be visible');
      addNotification(`Clicked at: ${preciseLat}, ${preciseLng} - Pin form opened!`);
    },
  });

  return null;
};

// Main MapPage component
const MapPage: React.FC<MapPageProps> = ({ isAdmin }) => {
  const [pins, setPins] = useState<Pin[]>([]);
  const [filteredPins, setFilteredPins] = useState<Pin[]>([]);
  const [coords, setCoords] = useState<string>("");
  const [previewCoords, setPreviewCoords] = useState<{lat: number, lng: number} | null>(null);
  const [showPinForm, setShowPinForm] = useState<boolean>(false);
  const [clickedCoords, setClickedCoords] = useState<{lat: number, lng: number} | null>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const { addNotification } = useNotifications();
  const pinsRef = React.useRef<Pin[]>([]);

  console.log('MapPage rendered with isAdmin:', isAdmin);
  console.log('Current state - showPinForm:', showPinForm, 'clickedCoords:', clickedCoords);

  const circleCenter: [number, number] = [14.408017, 120.949452];
  const circleRadius = 150;

  // Update ref whenever pins change
  useEffect(() => {
    pinsRef.current = pins;
  }, [pins]);

  const fetchPins = useCallback(() => {
    console.log('Fetching pins from backend...');
    // Try to fetch from backend first, fallback to sample data
    fetch("http://localhost:8000/api/url/", {
      credentials: "include",
    })
      .then((res) => {
        console.log('Fetch response status:', res.status);
        if (res.ok) {
          return res.json();
        } else {
          throw new Error(`Backend error: ${res.status} ${res.statusText}`);
        }
      })
      .then((data: Pin[]) => {
        console.log('Fetched pins from backend:', data);
        setPins(data); 
      })
      .catch((err) => {
        // Use sample data when backend is not available
        console.log("Backend not available, using sample data:", err.message);
        setPins(samplePins);
        // addNotification(`ℹ️ Using sample data (${samplePins.length} pins loaded)`);
      });
  }, []); // Remove addNotification dependency to prevent loops

  useEffect(() => fetchPins(), [fetchPins]);

  // Update filtered pins when pins change
  useEffect(() => {
    setFilteredPins(pins);
  }, [pins]);

  // Debug: Log pins whenever they change
  useEffect(() => {
    console.log('Pins state updated:', pins);
  }, [pins]);

  const handlePinSubmit = (pinData: {name: string, description: string, price: string, status: string, square_meter?: string, image?: File}) => {
    if (!clickedCoords) {
      console.error('No clicked coordinates available');
      return;
    }

    const newPin: Pin = {
      id: Math.floor(Date.now() + Math.random() * 1000), // Better ID generation
      name: pinData.name,
      latitude: clickedCoords.lat,
      longitude: clickedCoords.lng,
      status: pinData.status,
      description: pinData.description,
      price: pinData.price,
      ...(pinData.square_meter && { square_meter: pinData.square_meter }),
    };

    console.log('Creating new pin:', newPin);

    // Use FormData if image is present, otherwise use JSON
    const formData = new FormData();
    formData.append('name', newPin.name);
    formData.append('latitude', newPin.latitude.toString());
    formData.append('longitude', newPin.longitude.toString());
    formData.append('status', pinData.status);
    formData.append('description', pinData.description);
    formData.append('price', pinData.price);
    
    if (pinData.square_meter) {
      formData.append('square_meter', pinData.square_meter);
    }
    
    if (pinData.image) {
      formData.append('image', pinData.image);
    }

    const headers: Record<string, string> = {
      "X-CSRFToken": getCSRFToken(),
      ...getAuthHeaders(),
    };

    // Use FormData if image exists, otherwise use JSON
    const body = pinData.image ? formData : JSON.stringify({
      name: newPin.name,
      latitude: newPin.latitude,
      longitude: newPin.longitude,
      status: pinData.status,
      description: pinData.description,
      price: pinData.price,
      ...(pinData.square_meter && { square_meter: pinData.square_meter }),
    });

    if (!pinData.image) {
      headers["Content-Type"] = "application/json";
    }

    // Try to save to backend first
    fetch("http://localhost:8000/api/url/", {
      method: "POST",
      credentials: "include",
      headers,
      body,
    })
      .then((res) => {
        console.log('Backend response status:', res.status);
        if (res.ok) {
        return res.json();
        } else {
          throw new Error(`Backend error: ${res.status} ${res.statusText}`);
        }
      })
      .then((data) => {
        console.log('Pin saved successfully to backend:', data);
        // Use backend response to ensure all fields are present
        const backendPin: Pin = {
          id: data.id,
          name: data.name,
          latitude: data.latitude,
          longitude: data.longitude,
          status: data.status,
          description: data.description,
          price: data.price,
          occupant: data.occupant,
          image: data.image,
          square_meter: data.square_meter,
        };
        setPins((prevPins: Pin[]) => [...prevPins, backendPin]);
        addNotification(`✅ Pin "${newPin.name}" added successfully!`);
        fetchPins(); // Refresh from backend
        fetchOccupancyData(); // Update occupancy data
        
        // Immediately update occupancy data based on new pin
        const isOccupied = (pinData.status || '').toLowerCase() === 'occupied' || newPin.name.toLowerCase().includes('occupied');
        setOccupancyData(prev => {
          const newOccupied = prev.occupied + (isOccupied ? 1 : 0);
          const newTotal = prev.total + 1;
          return {
            ...prev,
            occupied: newOccupied,
            available: Math.max(0, newTotal - newOccupied),
            total: newTotal,
            total_pins: prev.total_pins + 1,
            occupied_pins: prev.occupied_pins + (isOccupied ? 1 : 0),
            available_pins: prev.available_pins + (isOccupied ? 0 : 1),
            occupancy_rate: newTotal > 0 ? (newOccupied / newTotal) * 100 : 0
          };
        });
      })
      .catch((err) => {
        console.log('Backend not available, saving locally:', err.message);
        // Local fallback - add immediately to state
        setPins((prevPins: Pin[]) => [...prevPins, newPin]);
        addNotification(`✅ Pin "${newPin.name}" added locally (backend offline)`);
        fetchOccupancyData(); // Update occupancy data
        
        // Immediately update occupancy data based on new pin
        const isOccupied = (pinData.status || '').toLowerCase() === 'occupied' || newPin.name.toLowerCase().includes('occupied');
        setOccupancyData(prev => {
          const newOccupied = prev.occupied + (isOccupied ? 1 : 0);
          const newTotal = prev.total + 1;
          return {
            ...prev,
            occupied: newOccupied,
            available: Math.max(0, newTotal - newOccupied),
            total: newTotal,
            total_pins: prev.total_pins + 1,
            occupied_pins: prev.occupied_pins + (isOccupied ? 1 : 0),
            available_pins: prev.available_pins + (isOccupied ? 0 : 1),
            occupancy_rate: newTotal > 0 ? (newOccupied / newTotal) * 100 : 0
          };
        });
      })
      .finally(() => {
        // Clear everything
        setShowPinForm(false);
        setPreviewCoords(null);
        setClickedCoords(null);
        setCoords("");
      });
  };

  const handlePinCancel = () => {
    setShowPinForm(false);
    setPreviewCoords(null);
    setClickedCoords(null);
    setCoords("");
  };

  // Real-time occupancy data from backend
  const [occupancyData, setOccupancyData] = useState({
    total: 0,
    occupied: 0,
    available: 0,
    occupancy_rate: 0,
    total_pins: 0,
    occupied_pins: 0,
    available_pins: 0
  });

  // Fetch real-time occupancy data
  const fetchOccupancyData = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:8000/api/subdivisions/occupancy_stats/", {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setOccupancyData(data);
        console.log('Occupancy data updated:', data);
      } else {
        console.log('Failed to fetch occupancy data, using fallback');
        // Use current pins from ref for fallback
        const currentPins = pinsRef.current;
        const occupiedCount = currentPins.filter((pin) =>
          pin.name.toLowerCase().includes("occupied")
        ).length;
        const totalPins = currentPins.length;
        const maxSubdivisions = totalPins;
        
        setOccupancyData({
          total: maxSubdivisions,
          occupied: occupiedCount,
          available: maxSubdivisions - occupiedCount,
          occupancy_rate: maxSubdivisions > 0 ? (occupiedCount / maxSubdivisions) * 100 : 0,
          total_pins: totalPins,
          occupied_pins: occupiedCount,
          available_pins: totalPins - occupiedCount
        });
      }
      } catch (error) {
      console.log('Error fetching occupancy data:', error);
      // Use fallback calculation from current pins ref
      const currentPins = pinsRef.current;
      const occupiedCount = currentPins.filter((pin) =>
        pin.name.toLowerCase().includes("occupied")
      ).length;
      const totalPins = currentPins.length;
      const maxSubdivisions = totalPins;
      
      setOccupancyData({
        total: maxSubdivisions,
        occupied: occupiedCount,
        available: maxSubdivisions - occupiedCount,
        occupancy_rate: maxSubdivisions > 0 ? (occupiedCount / maxSubdivisions) * 100 : 0,
        total_pins: totalPins,
        occupied_pins: occupiedCount,
        available_pins: totalPins - occupiedCount
      });
    }
  }, []); // No dependencies - uses ref to get current pins

  // Update occupancy data when pins length changes
  useEffect(() => {
    fetchOccupancyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pins.length]); // Only depend on pins.length, not the entire pins array

  // Real-time data fetching function
  const fetchRealTimeData = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:8000/api/subdivisions/real_time_data/", {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Real-time data received:', data);
        
        // Update pins
        setPins(data.pins);
        
        // Update occupancy data
        setOccupancyData(data.occupancy);
        
        console.log(`Data updated at ${data.timestamp}`);
      } else {
        console.log('Failed to fetch real-time data, using individual fetches');
        // Use direct fetch instead of callbacks to avoid dependency issues
        fetch("http://localhost:8000/api/url/", {
          credentials: "include",
        })
          .then((res) => res.ok ? res.json() : Promise.reject())
          .then((data: Pin[]) => setPins(data))
          .catch(() => {});
        
        fetch("http://localhost:8000/api/subdivisions/occupancy_stats/", {
          credentials: "include",
        })
          .then((res) => res.ok ? res.json() : Promise.reject())
          .then((data) => setOccupancyData(data))
          .catch(() => {});
      }
    } catch (error) {
      console.log('Error fetching real-time data:', error);
      // Fallback to individual fetches
      fetch("http://localhost:8000/api/url/", {
        credentials: "include",
      })
        .then((res) => res.ok ? res.json() : Promise.reject())
        .then((data: Pin[]) => setPins(data))
        .catch(() => {});
      
      fetch("http://localhost:8000/api/subdivisions/occupancy_stats/", {
        credentials: "include",
      })
        .then((res) => res.ok ? res.json() : Promise.reject())
        .then((data) => setOccupancyData(data))
        .catch(() => {});
    }
  }, []); // Remove dependencies to prevent loops

  // Auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Auto-refreshing real-time data...');
      fetchRealTimeData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount, interval will use the latest fetchRealTimeData

  const pieData = [
    { name: "Occupied", value: Math.max(0, occupancyData.occupied) },
    { name: "Available", value: Math.max(0, occupancyData.available) },
  ];
  const pieTotal = (pieData?.[0]?.value ?? 0) + (pieData?.[1]?.value ?? 0);

  const COLORS = ["#2e6F40", "#cccccc"];

const handleDelete = (pin: Pin) => {
  if (!window.confirm(`Are you sure you want to delete pin "${pin.name}"?`)) return;
  
  console.log('Deleting pin:', pin.id);
  
  // Try backend first, fallback to local state update
  fetch(`http://localhost:8000/api/url/${pin.id}/`, {
    method: "DELETE",
    credentials: "include",
    headers: { "X-CSRFToken": getCSRFToken(), ...getAuthHeaders() },
  })
    .then((res) => {
      console.log('Delete response status:', res.status);
      if (res.ok) {
        // Remove from local state immediately
        setPins((prevPins: Pin[]) => prevPins.filter(p => p.id !== pin.id));
        addNotification(`🗑️ Pin "${pin.name}" deleted!`);
        fetchPins(); // Refresh from backend
        fetchOccupancyData(); // Update occupancy data
        
        // Immediately update occupancy data based on deleted pin
        const wasOccupied = pin.name.toLowerCase().includes('occupied');
        setOccupancyData(prev => {
          const newOccupied = Math.max(0, prev.occupied - (wasOccupied ? 1 : 0));
          const newTotal = Math.max(0, prev.total - 1);
          return {
            ...prev,
            occupied: newOccupied,
            available: Math.max(0, newTotal - newOccupied),
            total: newTotal,
            total_pins: Math.max(0, prev.total_pins - 1),
            occupied_pins: Math.max(0, prev.occupied_pins - (wasOccupied ? 1 : 0)),
            available_pins: Math.max(0, prev.available_pins - (wasOccupied ? 0 : 1)),
            occupancy_rate: newTotal > 0 ? (newOccupied / newTotal) * 100 : 0
          };
        });
      } else {
        throw new Error(`Backend error: ${res.status} ${res.statusText}`);
      }
    })
    .catch((err) => {
      console.log('Backend delete failed, deleting locally:', err.message);
      // Handle locally when backend is not available
      setPins((prevPins: Pin[]) => prevPins.filter(p => p.id !== pin.id));
      addNotification(`🗑️ Pin "${pin.name}" deleted locally (backend offline)`);
      fetchOccupancyData(); // Update occupancy data
      
      // Immediately update occupancy data based on deleted pin
      const wasOccupied = pin.name.toLowerCase().includes('occupied');
      setOccupancyData(prev => {
        const newOccupied = Math.max(0, prev.occupied - (wasOccupied ? 1 : 0));
        const newTotal = Math.max(0, prev.total - 1);
        return {
          ...prev,
          occupied: newOccupied,
          available: Math.max(0, newTotal - newOccupied),
          total: newTotal,
          total_pins: Math.max(0, prev.total_pins - 1),
          occupied_pins: Math.max(0, prev.occupied_pins - (wasOccupied ? 1 : 0)),
          available_pins: Math.max(0, prev.available_pins - (wasOccupied ? 0 : 1)),
          occupancy_rate: newTotal > 0 ? (newOccupied / newTotal) * 100 : 0
        };
        
      });
    });
    
};

const handleEdit = (pin: Pin) => {
  const newName = prompt("Enter new name:", pin.name);
  if (!newName || newName === pin.name) return;
  
  console.log('Editing pin:', pin.id, 'to name:', newName);
  
  // Try backend first, fallback to local state update
  fetch(`http://localhost:8000/api/url/${pin.id}/`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCSRFToken(),
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      name: newName,
      latitude: pin.latitude,
      longitude: pin.longitude,
    }),
  })
    .then((res) => {
      console.log('Edit response status:', res.status);
      if (res.ok) {
      return res.json();
      } else {
        throw new Error(`Backend error: ${res.status} ${res.statusText}`);
      }
    })
    .then((data) => {
      console.log('Pin edited successfully:', data);
      // Update local state immediately
      setPins((prevPins: Pin[]) => 
        prevPins.map(p => 
          p.id === pin.id ? { ...p, name: newName } : p
        )
      );
      addNotification(`✏️ Pin renamed from "${pin.name}" to "${newName}"`);
      fetchPins(); // Refresh from backend
      fetchOccupancyData(); // Update occupancy data
    })
    .catch((err) => {
      console.log('Backend edit failed, editing locally:', err.message);
      // Handle locally when backend is not available
      setPins((prevPins: Pin[]) => 
        prevPins.map(p => 
          p.id === pin.id ? { ...p, name: newName } : p
        )
      );
      addNotification(`✏️ Pin renamed from "${pin.name}" to "${newName}" locally (backend offline)`);
      fetchOccupancyData(); // Update occupancy data
    });
};

  const luzonBounds: [[number, number], [number, number]] = [
    [10.0, 115.0], // More reasonable bounds
    [20.0, 125.0],
  ];

  return (
    <>
      <NavBar profile={null} />
      <h1 className="map-title">
        <img
          src={circleImage}
          alt="Circle"
          style={{ width: '20px', height: '20px' }}
        />
        Happy Homes Map
      </h1>

      <HouseSearch pins={pins} onSearch={setFilteredPins} mapInstance={mapInstance} />

      <div
        className="map-page-container"
        style={{
          display: "flex",
          gap: "20px",
          padding: "20px",
          maxWidth: "1800px",
          width: "100%",
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
          {filteredPins.length === 0 && <p>No pins available.</p>}
          {filteredPins.map((pin) => (
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
                : "Available"}
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
                      Edit
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
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Map */}
        <div
          className="map-wrapper"
          style={{
            flex: 1,
            height: "700px",
            minWidth: "600px",
            border: "1px solid #2b2b2b",
            borderRadius: "10px",
            position: "relative",
            cursor: isAdmin ? "crosshair" : "default", // Show crosshair cursor for admin
          }}
        >
            <MapContainer
  center={circleCenter}
  zoom={19}
  style={{ height: "100%", width: "100%", borderRadius: "10px" }}
            attributionControl={false}
  zoomControl={true}
          >
            <MapController onMapReady={setMapInstance} />
            <ClickCoordinates
              setCoords={setCoords}
              isAdmin={isAdmin}
              refreshPins={fetchPins}
               setPins={setPins}
               setPreviewCoords={setPreviewCoords}
               setShowPinForm={setShowPinForm}
               setClickedCoords={setClickedCoords}
             />
            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="Street Map">
                <TileLayer
                  attribution=""
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  maxZoom={19}
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Satellite View">
                <TileLayer
                  attribution=""
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  maxZoom={19}
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="CartoDB Positron">
                <TileLayer
                  attribution=""
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  maxZoom={19}
                />
              </LayersControl.BaseLayer>
            </LayersControl>
            <Circle
              center={circleCenter}
              radius={circleRadius}
              pathOptions={{ color: "green", fillColor: "red", fillOpacity: 0 }}
            />
             
              {/* Preview marker for new pins */}
              {previewCoords && (
                <Marker
                  position={[previewCoords.lat, previewCoords.lng]}
                  icon={createPreviewIcon()}
                />
              )}
              
                          {filteredPins.map((pin) => {
                console.log('Rendering pin:', pin);
                return (
              <Marker
                key={pin.id}
                position={[pin.latitude, pin.longitude]}
                    icon={createHouseIcon()}
                  >
                   <Popup minWidth={240} maxWidth={280}>
                     <PinPopupEditor
                       pin={pin}
                       isAdmin={isAdmin}
                       onDelete={handleDelete}
                       onUpdated={fetchPins}
                       setPins={setPins}
                     />
                </Popup>
              </Marker>
                );
              })}
          </MapContainer>
          {coords && isAdmin && (
            <div className="coords-display">
              <strong>EXACT PIN LOCATION:</strong> <span style={{color: '#2e6F40', fontWeight: 'bold', fontSize: '16px'}}>{coords}</span>
              <br/>
              <small style={{color: '#666', fontStyle: 'italic'}}>Pin will be placed at this precise coordinate</small>
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="chartsidebar">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h2>Subdivision Occupancy</h2>
            <button 
              onClick={fetchRealTimeData}
              style={{
                backgroundColor: '#2e6F40',
                color: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
              title="Refresh real-time data"
            >
              Refresh
            </button>
          </div>
          <PieChart width={350} height={250} key={`pie-${pieData?.[0]?.value ?? 0}-${pieData?.[1]?.value ?? 0}`}>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              isAnimationActive={false}
              label={pieTotal > 0 ? ({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%` : false}
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
            {occupancyData.occupied} / {occupancyData.total} occupied
          </p>
          <p style={{ textAlign: "center", fontSize: "12px", color: "#666" }}>
            Occupancy Rate: {occupancyData.occupancy_rate.toFixed(1)}%
          </p>
          <p style={{ textAlign: "center", fontSize: "11px", color: "#888", marginTop: "5px" }}>
            Total Pins: {occupancyData.total_pins} | Occupied Pins: {occupancyData.occupied_pins}
          </p>
          {/* Removed Occupancy Bar Chart per request */}
        </div>
      </div>
      
      {/* Pin Form Overlay */}
      {showPinForm && (
        <PinForm
          clickedCoords={clickedCoords}
          onSubmit={handlePinSubmit}
          onCancel={handlePinCancel}
        />
      )}

      {/* Removed temporary inline testing form */}
    </>
  );
};

export default MapPage;