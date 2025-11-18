import React, { useEffect, useState } from "react";
import axios from "axios";
import NavBar from "./NavBar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Link } from "react-router-dom";
import "./visitorsTracking.css";
import { getToken } from "../utils/auth";

interface Visitor {
  id: number;
  name: string;
  contact_number?: string;
  status: string;
  time_in?: string;
  time_out?: string;
}

const API_URL = "http://127.0.0.1:8000/api/admin/visitors/";

const VisitorsTracking: React.FC = () => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [searchQuery, setSearchQuery] = useState(""); // <-- new state for search
  const token = getToken();

  useEffect(() => {
    if (token) fetchVisitors();
  }, [token]);

  const fetchVisitors = async () => {
    try {
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVisitors(res.data);
    } catch (err) {
      console.error("Failed to fetch visitors", err);
      toast.error("Failed to fetch visitors");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`${API_URL}${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Visitor deleted successfully");
      fetchVisitors();
    } catch (err) {
      console.error("Failed to delete visitor", err);
      toast.error("Failed to delete visitor");
    }
  };

  const formatTime = (time?: string) => {
    if (!time) return "-";
    const date = new Date(time);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const formatDate = (time?: string) => {
    if (!time) return "-";
    const date = new Date(time);
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  };

  const handleTestNotification = () => {
    toast.info("✅ Test notification");
  };

  const totalVisitors = visitors.length;
  const checkedInToday = visitors.filter(v => v.time_in && new Date(v.time_in).toDateString() === new Date().toDateString()).length;
  const totalTimedOut = visitors.filter(v => v.time_out).length;

  // Filter visitors by search query (name, contact, or status)
  const filteredVisitors = visitors.filter(v =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.contact_number?.includes(searchQuery) ?? false) ||
    v.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <div className="visitors-tracking-container">
            <h2>Visitors Tracking</h2>

            <div className="analytics-grid">
              <div className="analytics-card">
                <h3>Total Visitors</h3>
                <p>{totalVisitors}</p>
              </div>
              <div className="analytics-card">
                <h3>Checked-in Today</h3>
                <p>{checkedInToday}</p>
              </div>
              <div className="analytics-card">
                <h3>With Time Out</h3>
                <p>{totalTimedOut}</p>
              </div>
            </div>

            {/* Search input */}
            <div style={{ margin: "20px 0" }}>
              <input
                type="text"
                placeholder="Search by name, contact, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="table-wrapper">
              <table className="visitors-table">
                <thead>
                  <tr>
                    <th>Name of Visitors</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Time In</th>
                    <th>Time Out</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisitors.map((v) => (
                    <tr key={v.id}>
                      <td>{v.name}</td>
                      <td>{v.contact_number || "-"}</td>
                      <td>{v.status}</td>
                      <td>{formatDate(v.time_in || v.time_out)}</td>
                      <td>{formatTime(v.time_in)}</td>
                      <td>{formatTime(v.time_out)}</td>
                      <td>
                        <button
                          className="btn btn-decline"
                          onClick={() => handleDelete(v.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredVisitors.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center" }}>No visitors found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default VisitorsTracking;
