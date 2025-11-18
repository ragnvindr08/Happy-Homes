import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './NavBar.css';
import logo from '../images/logo.png';
import axios from 'axios';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { useNotifications } from './NotificationContext';
import TopBanner from './TopBanner';
import { getToken } from '../utils/auth';
import homeIcon from '../images/home.png';
import mapIcon from '../images/maps.png';
import bookingIcon from '../images/bookings.png';
import newsIcon from '../images/news.png';
import contactIcon from '../images/contact.png';
import profileIcon from '../images/profiles.png';
import adminIcon from '../images/admin.png';
import visitorIcon from '../images/visitor.png';

interface Profile {
  name?: string;
  username?: string;
  email?: string;
  is_staff?: boolean;
}

interface NavBarProps {
  profile?: Profile | null;
}

const NavBar: React.FC<NavBarProps> = ({ profile }) => {
  const navigate = useNavigate();
  const { notifications } = useNotifications();
  const [isAdmin, setIsAdmin] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isLoggedIn = !!getToken();

  // Detect clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check admin status
  useEffect(() => {
    const token = localStorage.getItem('access');
    if (token) {
      axios
        .get('http://localhost:8000/api/profile/', {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
          if (res.data.is_staff) setIsAdmin(true);
        })
        .catch(err => console.error(err));
    }
  }, []);

  return (
    <>
      <TopBanner message="Discover the best subdivisions in town! Book a viewing today & step into your future home!" />

      <nav className="navbar">
        <div className="navbar-content">
          {/* Logo */}
          <div className="navbar-logo" onClick={() => navigate('/')}>
            <img src={logo} alt="Happy Homes Logo" className="logo-image" />
          </div>

          {/* Hamburger Button for Mobile */}
          <div className="hamburger" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </div>

          {/* Navigation Links */}
          <ul className={`navbar-links ${isMobileMenuOpen ? 'active' : ''}`}>
            <li onClick={() => { navigate('/home'); setIsMobileMenuOpen(false); }}>
              <img src={homeIcon} alt="Home" className="icon" /> Home
            </li>

            <li className="dropdown">
              <span onClick={() => setOpenDropdown(!openDropdown)}>
                <img src={mapIcon} alt="Explore" className="icon" /> Explore
              </span>
              <ul className={`dropdown-menu ${openDropdown ? 'show' : ''}`}>
                <li onClick={() => { navigate('/map'); setIsMobileMenuOpen(false); }}>Subdivision Map</li>
                <li onClick={() => { navigate('/house-sales'); setIsMobileMenuOpen(false); }}>House Sale & Rent</li>
                {/* <li onClick={() => { navigate('/house-rent'); setIsMobileMenuOpen(false); }}>House for Rent</li>
                <li onClick={() => { navigate('/store-nearby'); setIsMobileMenuOpen(false); }}>Store Nearby</li> */}
              </ul>
            </li>

            <li onClick={() => { navigate('/calendar'); setIsMobileMenuOpen(false); }}>
              <img src={bookingIcon} alt="Booking" className="icon" /> Booking
            </li>

            <li onClick={() => { navigate('/news'); setIsMobileMenuOpen(false); }}>
              <img src={newsIcon} alt="News & Alerts" className="icon" /> News & Alerts
            </li>

            <li onClick={() => { navigate('/contact'); setIsMobileMenuOpen(false); }}>
              <img src={contactIcon} alt="Contact" className="icon" /> Contact
            </li>

            {isLoggedIn && (
                <>
    <li onClick={() => { navigate('/profile'); setIsMobileMenuOpen(false); }}>
      <img src={profileIcon} alt="Profile" className="icon" /> Profile
    </li>

    <li className="visitor" onClick={() => { navigate('/resident-dashboard'); setIsMobileMenuOpen(false); }}>
      <img src={visitorIcon} alt="Visitor" className="icon" /> Visitors
    </li>
  </>
            )}

            {isAdmin && (
              <li onClick={() => { navigate('/admin-dashboard'); setIsMobileMenuOpen(false); }}>
                <img style={{ filter: 'none' }} src={adminIcon} alt="Admin Dashboard" className="icon" /> Admin Dashboard
              </li>
            )}
          </ul>

          {/* Right Side (Notifications + Profile) */}
          <div className="navbar-right">
            <div className="notification-bell" ref={dropdownRef}>
              <NotificationsIcon
                style={{ cursor: 'pointer', fontSize: 28 }}
                onClick={() => setOpenDropdown(!openDropdown)}
              />
              {notifications.length > 0 && (
                <span className="notification-count">{notifications.length}</span>
              )}

              {openDropdown && (
                <div className="notification-dropdown">
                  {notifications.length === 0 && <p className="notif-empty">No notifications</p>}
                  {notifications.map((note, index) => (
                    <p key={index} className="notif-item">{note}</p>
                  ))}
                </div>
              )}
            </div>

            {profile && (
              <div className="navbar-profile">
                Welcome, {profile.username || profile.name || 'User'}!
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default NavBar;
