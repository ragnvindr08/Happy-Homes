import React, { useEffect, useState } from "react";
import axios from "axios";
import { getToken, logout } from "../utils/auth";
import { useNavigate, Link } from "react-router-dom";
import NavBar from "./NavBar";
import Footer from "./Footer";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import './AdminVerificationPage.css';

interface PendingUser {
  id: number;
  username: string;
  email: string;
  document: string | null;
  is_verified: boolean;
}

const AdminVerificationPage: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  const navigate = useNavigate();
  const token = getToken();

  if (!token) navigate("/login");

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://127.0.0.1:8000/api/admin/pending-verifications/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingUsers(res.data);
    } catch (err) {
      console.error(err);
      logout();
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const verifyUser = async (userId: number) => {
    setVerifying(true);
    try {
      await axios.put(`http://127.0.0.1:8000/api/admin/verify-user/${userId}/`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("User verified successfully!");
      fetchPendingUsers();
    } catch (err) {
      console.error(err);
      toast.error("Failed to verify user.");
    } finally {
      setVerifying(false);
    }
  };

  const rejectUser = async (userId: number) => {
    setVerifying(true);
    try {
      await axios.put(`http://127.0.0.1:8000/api/admin/reject-user/${userId}/`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("User rejected successfully!");
      fetchPendingUsers();
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject user.");
    } finally {
      setVerifying(false);
    }
  };

  if (loading) return <p>Loading pending verifications...</p>;

  return (
    <div>
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
          </ul>
        </aside>

        <main className="dashboard-content">
          <div className="verification-container">
            <h2>Pending User Verifications</h2>
            {pendingUsers.length === 0 ? (
              <p>No pending users to verify.</p>
            ) : (
              <div className="table-responsive">
                <table className="user-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Document</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingUsers.map(user => (
                      <tr key={user.id}>
                        <td>{user.username}</td>
                        <td>{user.email}</td>
                        <td>
                          {user.document ? (
                            <a
                              href={user.document.startsWith("http") ? user.document : `http://127.0.0.1:8000${user.document}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View Document
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td>
                          {user.is_verified ? (
                            <span style={{ color: 'green' }}>✅ Verified</span>
                          ) : user.document ? (
                            <span style={{ color: 'orange' }}>Pending Verification...</span>
                          ) : (
                            <span style={{ color: 'red' }}>❌ Not Verified</span>
                          )}
                        </td>
                        <td className="action-buttons">
                          <button
                            onClick={() => verifyUser(user.id)}
                            disabled={verifying}
                            className="accept-btn"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => rejectUser(user.id)}
                            disabled={verifying}
                            className="reject-btn"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default AdminVerificationPage;
