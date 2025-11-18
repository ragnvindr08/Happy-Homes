import React, { useEffect, useState } from 'react';
import { getToken } from '../utils/auth';
import './AdminUsersPage.css';
import NavBar from './NavBar';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import { useNotifications } from './NotificationContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Link } from 'react-router-dom';

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
    document?: string;
    is_verified?: boolean;
    billing_records?: string[];
  };
}

// Billing modal component
interface BillingModalProps {
  records: string[];
  onClose: () => void;
  startIndex: number;
}

const BillingModal: React.FC<BillingModalProps> = ({ records, onClose, startIndex }) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  const handlePrev = () => setCurrentIndex(prev => (prev === 0 ? records.length - 1 : prev - 1));
  const handleNext = () => setCurrentIndex(prev => (prev === records.length - 1 ? 0 : prev + 1));

const currentRecordRaw = records[currentIndex]; // might be undefined
const currentRecord = currentRecordRaw
  ? currentRecordRaw.startsWith('http')
    ? currentRecordRaw
    : `http://127.0.0.1:8000${currentRecordRaw}`
  : ''; // fallback to empty string

const isPDF = currentRecord.endsWith('.pdf');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="modal-body">
          {isPDF ? (
            <iframe src={currentRecord} style={{ width: '100%', height: '80vh' }} title="PDF Viewer" />
          ) : (
            <img src={currentRecord} alt={`Billing ${currentIndex}`} style={{ maxWidth: '100%', maxHeight: '80vh' }} />
          )}
        </div>
        {records.length > 1 && (
          <div className="modal-controls">
            <button onClick={handlePrev}>Prev</button>
            <span>{currentIndex + 1} / {records.length}</span>
            <button onClick={handleNext}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGraph, setShowGraph] = useState(false);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({});
  const token = getToken();
  const { addNotification } = useNotifications();

  // Billing modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalRecords, setModalRecords] = useState<string[]>([]);
  const [modalStartIndex, setModalStartIndex] = useState(0);

  // Fetch users
  const fetchUsers = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://127.0.0.1:8000/api/admin/users/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        alert('Unauthorized: Admin only');
        return;
      }
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Toggle verification
  const toggleVerification = async (user: User) => {
    if (!token || !user.profile) return;
    try {
      const endpoint = user.profile.is_verified
        ? `http://127.0.0.1:8000/api/admin/reject-user/${user.id}/`
        : `http://127.0.0.1:8000/api/admin/verify-user/${user.id}/`;

      const res = await fetch(endpoint, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        setUsers(users.map(u =>
          u.id === user.id
            ? { ...u, profile: { ...u.profile, is_verified: !u.profile?.is_verified } }
            : u
        ));
        toast.success(user.profile.is_verified ? '❌ User unverified successfully' : '✅ User verified successfully');
      } else {
        const data = await res.json();
        toast.error(`❌ Failed: ${data.detail || 'Unknown error'}`);
      }
    } catch (err) {
      toast.error('❌ Network error while toggling verification');
    }
  };

  // Delete user
  const handleDelete = async (id: number, isStaff: boolean) => {
    if (isStaff) {
      toast.error('❌ Cannot delete an admin user.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/admin/users/${id}/delete/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== id));
        addNotification('User deleted successfully');
        toast.success('User deleted successfully');
      } else {
        const data = await res.json();
        const msg = data?.detail || 'Failed to delete user';
        addNotification(`❌ ${msg}`);
        toast.error(`❌ ${msg}`);
      }
    } catch (err) {
      addNotification('❌ Failed to delete user');
      toast.error('❌ Failed to delete user');
    }
  };

  // Edit user
  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      profile: { contact_number: user.profile?.contact_number || '' },
    });
  };

  const handleEditSave = async () => {
    if (!editingUser) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/admin/users/${editingUser.id}/update/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('✅ User updated successfully');
        setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...formData } as User : u));
        setEditingUser(null);
      } else {
        toast.error(`❌ Failed to update user: ${data.detail || 'Error'}`);
      }
    } catch (err) {
      toast.error('❌ Network error while updating user');
    }
  };

  if (loading) return <p>Loading users...</p>;

  // Graph data
  const totalUsers = users.length;
  const staffUsers = users.filter(u => u.is_staff).length;
  const regularUsers = totalUsers - staffUsers;

  const barData = [
    { type: 'Staff', count: staffUsers },
    { type: 'Regular', count: regularUsers },
  ];

  const pieData = [
    { name: 'Staff', value: staffUsers },
    { name: 'Regular', value: regularUsers },
  ];

  const COLORS = ['#2b2b2b', 'rgb(46, 111, 64)'];

  // Search filter
  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase())
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
          </ul>
        </aside>

        <div className="admin-dashboard-container">
          <h1>Admin Users Dashboard</h1>
          <button className="toggle-graph-btn" onClick={() => setShowGraph(!showGraph)}>
            {showGraph ? 'Hide Graph' : 'Show Graph'}
          </button>

          <div className="search-container">
            <input
              type="text"
              placeholder="Search users by name, username or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>

          <div className={`dashboard-flex ${showGraph ? 'graph-visible' : ''}`}>
            {showGraph && (
              <div className="dashboard-graph">
                <h3 style={{ color: 'rgb(46, 111, 64)' }}>User Distribution</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barData}>
                    <XAxis dataKey="type" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="rgb(46, 111, 64)" />
                  </BarChart>
                </ResponsiveContainer>

                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>

                <p style={{ textAlign: 'center', marginTop: '10px', fontWeight: 'bold', color: 'rgb(46, 111, 64)' }}>
                  Total Users:
                  <p className="total-users">{totalUsers}</p>
                </p>
              </div>
            )}

            <div className="dashboard-table">
              <div className="table-responsive">
                <table className="admin-users-table">
                  <thead>
                    <tr>
                      <th>Profile</th>
                      <th>ID</th>
                      <th>Username</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Contact Number</th>
                      <th>Admin</th>
                      <th>Verified</th>
                      <th>Billing</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id} className={user.is_staff ? 'admin-row' : ''}>
                        <td>
                          {user.profile?.profile_image ? (
                            <img
                              src={user.profile.profile_image}
                              alt={user.username}
                              className="profile-thumb"
                            />
                          ) : (
                            <div className="profile-thumb-placeholder">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </td>
                        <td>{user.id}</td>
                        <td>{user.username}</td>
                        <td>{user.first_name} {user.last_name}</td>
                        <td>{user.email}</td>
                        <td>{user.profile?.contact_number || '-'}</td>
                        <td>{user.is_staff ? 'Yes' : 'No'}</td>
                        <td>
                          {user.profile?.document && (
                            <p style={{ margin: 0 }}>
                              <strong>Document:</strong>{" "}
                              <a
                                href={user.profile.document.startsWith('http')
                                  ? user.profile.document
                                  : `http://127.0.0.1:8000${user.profile.document}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View
                              </a>
                            </p>
                          )}
                          <p style={{ margin: 0 }}>
                            <strong>Status:</strong>{" "}
                            {user.profile?.is_verified ? (
                              <span style={{ color: 'green' }}> Verified</span>
                            ) : user.profile?.document ? (
                              <span style={{ color: 'orange' }}> Pending Verification...</span>
                            ) : (
                              <span style={{ color: 'red' }}> Not Verified</span>
                            )}
                          </p>
                        </td>

                        {/* Billing Column */}
                        <td>
                          {user.profile?.billing_records && user.profile.billing_records.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                              {user.profile.billing_records.slice(0, 3).map((bill, i) => {
                                const url = bill.startsWith('http') ? bill : `http://127.0.0.1:8000${bill}`;
                                const isPDF = url.endsWith('.pdf');
                                return isPDF ? (
                                  <img
                                    key={i}
                                    src="/images/document.png"
                                    alt="PDF"
                                    style={{ width: '50px', height: '50px', cursor: 'pointer' }}
                                    onClick={() => { setModalRecords(user.profile!.billing_records!); setModalStartIndex(i); setModalOpen(true); }}
                                  />
                                ) : (
                                  <img
                                    key={i}
                                    src={url}
                                    alt={`Bill ${i}`}
                                    style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }}
                                    onClick={() => { setModalRecords(user.profile!.billing_records!); setModalStartIndex(i); setModalOpen(true); }}
                                  />
                                );
                              })}
                              {user.profile.billing_records.length > 3 && (
                                <div
                                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '50px', height: '50px', background: '#eee', borderRadius: '4px', cursor: 'pointer' }}
                                  onClick={() => { setModalRecords(user.profile!.billing_records!); setModalStartIndex(3); setModalOpen(true); }}
                                >
                                  +{user.profile.billing_records.length - 3}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span>No bills uploaded</span>
                          )}
                        </td>

                        <td>
                          <button onClick={() => handleEditClick(user)}>Edit</button>
                          {!user.is_staff && (
                            <button onClick={() => handleDelete(user.id, user.is_staff)}>Delete</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredUsers.length === 0 && <p>No users found.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {editingUser && (
        <div className="edit-modal-overlay">
          <div className="edit-modal">
            <h2>Edit User: {editingUser.username}</h2>
            <input
              type="text"
              placeholder="First Name"
              value={formData.first_name || ''}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Last Name"
              value={formData.last_name || ''}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <input
              type="text"
              placeholder="Contact Number"
              value={formData.profile?.contact_number || ''}
              onChange={(e) => setFormData({
                ...formData,
                profile: { ...formData.profile, contact_number: e.target.value }
              })}
            />
            <div className="modal-buttons">
              <button onClick={handleEditSave}>Save</button>
              <button onClick={() => setEditingUser(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Billing modal */}
      {modalOpen && (
        <BillingModal
          records={modalRecords}
          startIndex={modalStartIndex}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
};

export default AdminUsersPage;
