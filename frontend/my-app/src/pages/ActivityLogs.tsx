// src/pages/ActivityLog.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Link } from "react-router-dom";
import NavBar from "./NavBar";// make sure the path is correct
import "./ActivityLog.css";

interface HistoryRecord {
  id: number;
  history_date: string;
  history_type: string; // "+", "~", "-"
  history_user: string | null;
  model_name: string;
}

const historyTypeMap: Record<string, string> = {
  "+": "Created",
  "~": "Updated",
  "-": "Deleted",
};

const ActivityLog: React.FC = () => {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const handleTestNotification = () => {
    toast.info("This is a test notification!");
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/user-history/", {
          withCredentials: true, // if using session auth
        });
        setRecords(res.data);
      } catch (err) {
        console.error("Failed to fetch history", err);
        toast.error("Failed to fetch activity log");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <div>Loading activity log...</div>;

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <NavBar />
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

        <main className="dashboard-content">
          <h2>User Activity Log</h2>
          <div className="activity-log-table-container">
            <table className="activity-log-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Model</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>{new Date(record.history_date).toLocaleString()}</td>
                    <td>{record.history_user || "System"}</td>
                    <td>{historyTypeMap[record.history_type] || record.history_type}</td>
                    <td>{record.model_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </>
  );
};

export default ActivityLog;
