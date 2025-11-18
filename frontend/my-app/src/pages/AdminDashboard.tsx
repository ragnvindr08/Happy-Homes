import React, { useEffect, useState } from 'react';
import NavBar from './NavBar';
import { useNotifications } from './NotificationContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './AdminDashboard.css';
import { Link } from 'react-router-dom';
import { getToken } from '../utils/auth';

import userIcon from "../images/user.png";
import bookingIcon from "../images/booking.png";
import pendingIcon from "../images/pending.png";
import mapIcon from "../images/map.png";
import occupiedIcon from "../images/occupied.png";
import availableIcon from "../images/available.png";


import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#4caf50', '#2c7c4bff', '#262927ff'];

const AdminDashboard: React.FC = () => {
  const { addNotification } = useNotifications();
  const [stats, setStats] = useState({ total_users: 0, active_bookings: 0, pending_approvals: 0 });
  const [pinStats, setPinStats] = useState({ total_pins: 0, occupied: 0, available: 0, max_subdivisions: 200 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = getToken();

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const [dashboardRes, pinRes] = await Promise.all([
          fetch('http://localhost:8000/api/admin/dashboard-stats/', { headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } }),
          fetch('http://localhost:8000/api/admin/pin-stats/', { headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } }),
        ]);
        if (!dashboardRes.ok) throw new Error('Failed to fetch dashboard stats');
        if (!pinRes.ok) throw new Error('Failed to fetch pin stats');
        const dashboardData = await dashboardRes.json();
        const pinData = await pinRes.json();
        setStats(dashboardData);
        setPinStats(pinData);
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchStats();
  }, [token]);

  const handleTestNotification = () => {
    const msg = '✅ Test notification';
    addNotification(msg);
    toast.info(msg);
  };

  const pinChartData = [
    { name: 'Occupied', value: pinStats.occupied },
    { name: 'Available', value: pinStats.available },
  ];

  const bookingChartData = [
    { name: 'Total Users', value: stats.total_users },
    { name: 'Active Bookings', value: stats.active_bookings },
    { name: 'Pending Approvals', value: stats.pending_approvals },
  ];

  return (
    <>
      <NavBar />
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="dashboard-layout">
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
            <li><button onClick={handleTestNotification}>Test Notification</button></li>
          </ul>
        </aside>

        <main className="dashboard-main">
          {/* <p className="dashboard-subtitle">Here you can manage users, monitor activities, and configure your app.</p> */}

          {loading ? (
            <div>Loading dashboard stats...</div>
          ) : error ? (
            <div style={{ color: 'red' }}>Error: {error}</div>
          ) : (
            <>


<div className="dashboard-cards">
  <div className="card">
    <div className="card-content">
      <img src={userIcon} alt="Users" />
      <div className="card-text">
        <h3>Total Users</h3>
        <p>{stats.total_users}</p>
      </div>
    </div>
  </div>

  <div className="card">
    <div className="card-content">
      <img src={bookingIcon} alt="Bookings" />
      <div className="card-text">
        <h3>Active Bookings</h3>
        <p>{stats.active_bookings}</p>
      </div>
    </div>
  </div>

  <div className="card">
    <div className="card-content">
      <img src={pendingIcon} alt="Pending" />
      <div className="card-text">
        <h3>Pending Booking</h3>
        <p>{stats.pending_approvals}</p>
      </div>
    </div>
  </div>

  <div className="card">
    <div className="card-content">
      <img src={mapIcon} alt="Map" />
      <div className="card-text">
        <h3>Total Map Pins</h3>
        <p>{pinStats.total_pins}</p>
      </div>
    </div>
  </div>

  <div className="card">
    <div className="card-content">
      <img src={occupiedIcon} alt="Occupied" />
      <div className="card-text">
        <h3>Occupied</h3>
        <p>{pinStats.occupied}</p>
      </div>
    </div>
  </div>

  <div className="card">
    <div className="card-content">
      <img src={availableIcon} alt="Available" />
      <div className="card-text">
        <h3>Available Pins</h3>
        <p>{pinStats.available}</p>
      </div>
    </div>
  </div>
</div>



<div className="dashboard-graphs"> 
  <div className="graph-card">
    <div className="graph-header">
      <img src={occupiedIcon} alt="Occupied Icon" className="graph-icon" />
      <h3>Occupied and Availability</h3>
    </div>
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={pinChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
          {pinChartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  </div>

  <div className="graph-card">
    <div className="graph-header">
      <img src={bookingIcon} alt="Booking Icon" className="graph-icon" />
      <h3>Booking & User Stats</h3>
    </div>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={bookingChartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" fill="#2c7c4bff" />
      </BarChart>
    </ResponsiveContainer>
  </div>
</div>
            </>
          )}
        </main>
      </div>
    </>
  );
};

export default AdminDashboard;
