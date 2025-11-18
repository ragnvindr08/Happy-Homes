import React, { useEffect, useState } from 'react';
import { getToken, logout } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import NavBar from './NavBar';
import Footer from './Footer';
import newsAlertIcon from '../images/newsalert.png';
import logOut from '../images/logout1.png'; 
import './HomePage.css';

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_staff: boolean;
  profile?: {
    contact_number?: string;
    profile_image?: string;
  };
}

interface NewsItem {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

interface AlertItem {
  id: number;
  title: string;
  message: string;
  severity: string;
  created_at: string;
}

type CombinedItem = {
  id: number;
  type: 'news' | 'alert';
  title: string;
  message: string;
  category: string;
  urgent: boolean;
  timestamp: string;
};

const HomePage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [combinedItems, setCombinedItems] = useState<CombinedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/login');
      return;
    }

    // Fetch profile
    fetch('http://127.0.0.1:8000/api/profile/', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then((data: User) => setUser(data))
      .catch(() => {
        logout();
        navigate('/login');
      });
  }, [navigate]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    async function fetchNewsAlerts() {
      try {
        const [newsRes, alertsRes] = await Promise.all([
          fetch('http://127.0.0.1:8000/api/news/', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('http://127.0.0.1:8000/api/alerts/', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!newsRes.ok || !alertsRes.ok) throw new Error('Failed to fetch');

        const newsData: NewsItem[] = await newsRes.json();
        const alertsData: AlertItem[] = await alertsRes.json();

        const combined: CombinedItem[] = [
          ...newsData.map((n) => ({
            id: n.id,
            type: 'news' as const,
            title: n.title,
            message: n.content,
            category: 'Community',
            urgent: false,
            timestamp: n.created_at,
          })),
          ...alertsData.map((a) => ({
            id: a.id,
            type: 'alert' as const,
            title: a.title,
            message: a.message,
            category: a.severity,
            urgent: a.severity === 'critical',
            timestamp: a.created_at,
          })),
        ];

        // Sort: urgent first, then by timestamp
        combined.sort((a, b) => {
          if (a.urgent && !b.urgent) return -1;
          if (!a.urgent && b.urgent) return 1;
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });

        setCombinedItems(combined);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchNewsAlerts();
  }, []);

  if (!user) return <p className="loading">Loading...</p>;

  return (
    <div className="homepage-container">
      <NavBar />

      <div className="home-flex-container flex-3">
        {/* --- Profile --- */}
        <div className="profile-section">
          {user.profile?.profile_image && (
            <img src={user.profile.profile_image} alt="Profile" className="profile-img" />
          )}
          <h2 className="profile-title">
            Welcome, {`${user.first_name} ${user.last_name}`.trim() || user.username}
          </h2>
          <div className="profile-info">
            <p><strong>Username:</strong> {user.username}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Name:</strong> {`${user.first_name} ${user.last_name}`.trim() || 'N/A'}</p>
            <p><strong>Contact:</strong> {user.profile?.contact_number || 'N/A'}</p>
            <p><strong>Role:</strong> {user.is_staff ? 'Admin' : 'User'}</p>
          </div>
          <button
            className="logout-btn"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            <img src={logOut} alt="Logout" />
          </button>
          <div className="about-profile">
<p className="welcome-text">
  Welcome to <strong>Happy Homes</strong> — your trusted partner in finding the perfect home! Whether you're searching for a cozy apartment, a spacious family house, or a modern condo, we are here to guide you every step of the way. Our goal is to make your home-finding journey simple, joyful, and stress-free. Explore our carefully curated listings, connect with trusted sellers, and discover homes that match your lifestyle, preferences, and dreams. At <strong>Happy Homes</strong>, we don’t just help you find a house — we help you create a place where happiness lives.  
  <br /><br />
  We believe that a home is more than just walls and a roof; it’s a sanctuary where memories are made, families grow, and life’s special moments unfold. Our dedicated team is committed to providing personalized support, expert advice, and timely updates to ensure that you always have the best opportunities at your fingertips. Join our community of happy homeowners and start your journey toward a brighter, more comfortable future today!
</p>

          </div>
        </div>

        {/* --- Services --- */}
        <div className="services-section">
          <p className="services-subtitle">Our Services</p>
          <h2 className="services-title">Our Main Focus</h2>
          <div className="services-cards">
            <div className="service-card">
              <img src={require('../images/service-1.png')} alt="Buy a Home" />
              <h3>Buy a Home</h3>
              <p>Find your dream home today among our exclusive listings.</p>
              {/* <a href="#">Find A Home →</a> */}
            </div>
            <div className="service-card">
              <img src={require('../images/service-2.png')} alt="Rent a Home" />
              <h3>Rent a Home</h3>
              <p>Rent homes with ease and enjoy a thriving community life.</p>
              {/* <a href="#">Find A Home →</a> */}
            </div>
            <div className="service-card">
              <img src={require('../images/service-3.png')} alt="Book Amenities" />
              <h3>Book Amenities</h3>
              <p>Reserve amenities like pool and courts instantly.</p>
              {/* <a href="#">Reserve Now →</a> */}
            </div>
          </div>
        </div>

        {/* --- News & Alerts --- */}
        <div className="services-section">
          <p className="services-subtitle">News & Alerts</p>
          <h2 className="services-title">Latest Updates</h2>
          {loading ? (
            <p>Loading news and alerts...</p>
          ) : combinedItems.length === 0 ? (
            <p>No news or alerts available.</p>
          ) : (
            combinedItems.map((item) => (
              <div key={item.id} className="service-card" > 
                <h3>{item.title}</h3>
                <p>{item.message}</p>
                <small>{new Date(item.timestamp).toLocaleString()}</small>
              </div>
            ))
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default HomePage;
