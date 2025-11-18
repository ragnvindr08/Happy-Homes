import React, { useEffect, useState, ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NavBar from './NavBar';
import Footer from './Footer';
import { getToken, logout } from '../utils/auth';
import './AdminSalePage.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Profile {
  is_verified?: boolean;
}

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_staff: boolean;
  profile?: Profile;
}

interface House {
  id: number;
  title: string;
  description: string;
  price: number;
  location: string;
  image?: string;
  user?: User;
}

const AdminSalePage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalHouse, setModalHouse] = useState<House | null>(null);
  const [search, setSearch] = useState('');

  // Edit states
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

  const navigate = useNavigate();
  const token = getToken();

  // Fetch admin profile
  const fetchUserProfile = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://127.0.0.1:8000/api/profile/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Unauthorized');
      const data: User = await res.json();
      if (!data.is_staff) throw new Error('Access denied');
      setUser(data);
    } catch {
      logout();
      navigate('/login');
    }
  };

  // Fetch all houses
  const fetchHouses = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/houses/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch houses');
      const data: House[] = await res.json();
      setHouses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchHouses();
  }, []);

  const filteredHouses = houses.filter(
    h =>
      h.title.toLowerCase().includes(search.toLowerCase()) ||
      h.location.toLowerCase().includes(search.toLowerCase()) ||
      h.description.toLowerCase().includes(search.toLowerCase())
  );

  // Open modal
  const openModal = (house: House) => {
    setModalHouse(house);
    setEditMode(false);
    setEditTitle(house.title);
    setEditPrice(house.price.toString());
    setEditLocation(house.location);
    setEditDescription(house.description);
    setEditImage(null);
    setEditImagePreview(house.image || null);
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this house?')) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/houses/${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setHouses(houses.filter(h => h.id !== id));
        setModalHouse(null);
        toast.success('House deleted successfully');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete house');
    }
  };

  // Handle edit save
  const handleSaveEdit = async () => {
    if (!modalHouse) return;
    const formData = new FormData();
    formData.append('title', editTitle);
    formData.append('price', editPrice);
    formData.append('location', editLocation);
    formData.append('description', editDescription);
    if (editImage) formData.append('image', editImage);

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/houses/${modalHouse.id}/`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to update house');
      const updated = await res.json();
      setHouses(houses.map(h => (h.id === updated.id ? updated : h)));
      setModalHouse(updated);
      setEditMode(false);
      toast.success('House updated successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update house');
    }
  };

  // Handle image change for edit
  const handleEditImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditImage(file);
      setEditImagePreview(URL.createObjectURL(file));
    }
  };

  if (loading) return <p className="loading">Loading houses...</p>;

  return (
    <>
      <NavBar />
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="dashboard-layout">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <h2 className="sidebar-title">Admin Panel</h2>
          <ul className="sidebar-menu">
            <li><Link to="/admin-dashboard/map">Manage Pins on Map</Link></li>
            <li><Link to="/admin-dashboard/users">Manage Users</Link></li>
            <li><Link to="/admin-booking">Booking</Link></li>
            <li><Link to="/activity-log">Activity Log</Link></li>
            <li><Link to="/visitors-tracking">Visitors Tracking</Link></li>
            <li><Link to="/booking-reports">Booking Reports</Link></li>
            <li><Link to="/admin-sales">Sale & Rent List</Link></li>
            <li><Link to="/admin-verification">User Verification</Link></li>
            <hr style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />
          </ul>
        </aside>

        {/* Main Content */}
        <main className="dashboard-main">
          {user && <h2>Admin, {user.first_name}</h2>}

          {/* Search */}
          <div className="search-wrapper">
            <input
              type="text"
              placeholder="Search by title, location, or description..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Houses Grid */}
          <div className="houses-grid">
            {filteredHouses.length === 0 ? (
              <p>No houses found.</p>
            ) : (
              filteredHouses.map(house => (
                <div
                  key={house.id}
                  className="house-grid-card"
                  onClick={() => openModal(house)}
                >
                  {house.image ? (
                    <img src={house.image} alt={house.title} />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                  <div className="house-grid-overlay">
                    <h4>{house.title}</h4>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Modal */}
          {modalHouse && (
            <div className="modal-overlay" onClick={() => setModalHouse(null)}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                {editMode ? (
                  <>
                    <input value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                    <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} />
                    <input value={editLocation} onChange={e => setEditLocation(e.target.value)} />
                    <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} />
                    <input type="file" accept="image/*" onChange={handleEditImageChange} />
                    {editImagePreview && <img src={editImagePreview} alt="Preview" />}
                    <button onClick={handleSaveEdit}>Save</button>
                    <button onClick={() => setEditMode(false)}>Cancel</button>
                  </>
                ) : (
                  <>
                    {modalHouse.image && <img src={modalHouse.image} alt={modalHouse.title} />}
                    <h3>{modalHouse.title}</h3>
                    <p>{modalHouse.description}</p>
                    <p><strong>Price:</strong> ₱{Number(modalHouse.price).toLocaleString()}</p>
                    <p><strong>Location:</strong> {modalHouse.location}</p>
                    {modalHouse.user && <p><strong>Owner:</strong> {modalHouse.user.first_name} {modalHouse.user.last_name}</p>}
                    <button onClick={() => setEditMode(true)}>Edit</button>
                    <button onClick={() => handleDelete(modalHouse.id)}>Delete</button>
                    <button onClick={() => setModalHouse(null)}>Close</button>
                  </>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
      <Footer />
    </>
  );
};

export default AdminSalePage;
