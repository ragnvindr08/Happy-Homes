import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from './NavBar';
import Footer from './Footer';
import { getToken, logout } from '../utils/auth';
import './HouseSalePage.css';
import houseicon from '../images/houseicon.png';

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

const HouseSalePage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [houses, setHouses] = useState<House[]>([]);
  const [filteredHouses, setFilteredHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modalHouse, setModalHouse] = useState<House | null>(null);
  const navigate = useNavigate();
  const token = getToken();

  // Fetch user profile
  const fetchUserProfile = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://127.0.0.1:8000/api/profile/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Unauthorized');
      const data: User = await res.json();
      setUser(data);
    } catch {
      logout();
      navigate('/login');
    }
  };

  // Fetch houses
  const fetchHouses = async () => {
    try {
      const url = token
        ? 'http://127.0.0.1:8000/api/houses/'
        : 'http://127.0.0.1:8000/api/guest/houses/';
      const res = await fetch(url, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
      if (!res.ok) throw new Error('Failed to fetch houses');
      const data: House[] = await res.json();
      setHouses(data);
      setFilteredHouses(data);
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

  // Handle image selection
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Handle house upload
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title || !price || !location) return alert('Fill required fields');
    if (!token) return alert('You must be logged in');
    if (!user?.profile?.is_verified)
      return alert('Your account is not verified. Upload your documents in your profile.');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('price', price);
    formData.append('location', location);
    formData.append('description', description);
    if (image) formData.append('image', image);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/houses/', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to upload house');
      const newHouse = await res.json();
      setHouses([newHouse, ...houses]);
      setFilteredHouses([newHouse, ...houses]);
      setTitle('');
      setPrice('');
      setLocation('');
      setDescription('');
      setImage(null);
      setImagePreview(null);
    } catch (err) {
      console.error(err);
      alert(err);
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this house?')) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/houses/${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setHouses(houses.filter(h => h.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Handle edit
  const handleEdit = async (house: House) => {
    const newTitle = prompt('Enter new title', house.title);
    if (!newTitle) return;
    try {
      const formData = new FormData();
      formData.append('title', newTitle);
      formData.append('price', house.price.toString());
      formData.append('location', house.location);
      formData.append('description', house.description);
      if (image) formData.append('image', image);

      const res = await fetch(`http://127.0.0.1:8000/api/houses/${house.id}/`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to update');
      const updated = await res.json();
      setHouses(houses.map(h => (h.id === house.id ? updated : h)));
      setFilteredHouses(filteredHouses.map(h => (h.id === house.id ? updated : h)));
    } catch (err) {
      console.error(err);
    }
  };

  // Search
  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    const filtered = houses.filter(
      h =>
        h.title.toLowerCase().includes(value.toLowerCase()) ||
        h.location.toLowerCase().includes(value.toLowerCase()) ||
        h.description.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredHouses(filtered);
  };

  if (loading) return <p className="loading">Loading houses...</p>;

  return (
    <div className="house-sale-page">
      <NavBar />
      {user && <h2>Welcome, {user.first_name} {user.last_name}!</h2>}

      {/* Search Bar */}
      <div className="search-wrapper">
        <input
          type="text"
          placeholder="Search by title, location, or description..."
          value={search}
          onChange={handleSearch}
        />
      </div>

      {/* House Upload Form */}
      {user && (
        <form  className="house-upload-form" onSubmit={handleSubmit}>
          <h3 style={{color:'#555', alignItems:'center', display:'flex'}}><img src={houseicon} alt="House Icon" style={{ width: '80px', verticalAlign: 'middle', marginRight: '8px' }} />Sale or Rent</h3>
          {!user.profile?.is_verified && (
            <p style={{ color: 'red', fontWeight: 'bold' }}>
              Your account is not verified. Upload your documents in your profile to enable house uploads.
            </p>
          )}
          <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required disabled={!user.profile?.is_verified} />
          <input type="number" placeholder="Price" value={price} onChange={e => setPrice(e.target.value)} required disabled={!user.profile?.is_verified} />
          <input type="text" placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} required disabled={!user.profile?.is_verified} />
          <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} disabled={!user.profile?.is_verified} />
          <div className="file-upload-wrapper">
            <label htmlFor="houseImage" className="custom-file-label">Upload House Image</label>
            <input id="houseImage" type="file" accept="image/*" onChange={handleImageChange} disabled={!user.profile?.is_verified} />
            {imagePreview && <div className="image-preview"><img src={imagePreview} alt="Preview" /></div>}
          </div>
          <button type="submit" disabled={!user.profile?.is_verified}>Upload</button>
        </form>
      )}

      {/* Houses Grid */}
      <div className="houses-container">
        {filteredHouses.length === 0 ? (
          <p>No houses found.</p>
        ) : (
          <div className="houses-grid">
            {filteredHouses.map(house => (
              <div
                key={house.id}
                className="house-grid-card"
                onClick={() => setModalHouse(house)}
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
            ))}
          </div>
        )}
      </div>

      {/* Modal for House Details */}
      {modalHouse && (
        <div className="modal-overlay" onClick={() => setModalHouse(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            {modalHouse.image && <img src={modalHouse.image} alt={modalHouse.title} />}
            <h3>{modalHouse.title}</h3>
            <p>{modalHouse.description}</p>
            <p><strong>Price:</strong> ₱{Number(modalHouse.price).toLocaleString()}</p>
            <p><strong>Location:</strong> {modalHouse.location}</p>
            {modalHouse.user && <p><strong>Owner:</strong> {modalHouse.user.first_name} {modalHouse.user.last_name}</p>}
            {user && modalHouse.user && modalHouse.user.id === user.id && (
              <div className="house-actions">
                <button onClick={() => handleEdit(modalHouse)}>Edit</button>
                <button onClick={() => handleDelete(modalHouse.id)}>Delete</button>
              </div>
            )}
            <button className="close-btn" onClick={() => setModalHouse(null)}>Close</button>
          </div>
        </div>
      )}

      
    </div>
  );
};

export default HouseSalePage;
