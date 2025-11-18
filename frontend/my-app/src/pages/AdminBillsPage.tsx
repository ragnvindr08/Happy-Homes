// src/pages/AdminBillsPage.tsx
import React, { useEffect, useState, ChangeEvent } from 'react';
import NavBar from './NavBar';
import { getToken } from '../utils/auth';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './AdminBillsPage.css';

interface BillingUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  profile?: {
    billing_records?: string[];
  };
}

const API_BASE = 'http://127.0.0.1:8000'; // change if different

const AdminBillsPage: React.FC = () => {
  const [users, setUsers] = useState<BillingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalBillingUrl, setModalBillingUrl] = useState<string | null>(null);
  const [selectedUserIdForUpload, setSelectedUserIdForUpload] = useState<number | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const token = getToken();

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async () => {
    if (!token) {
      toast.error('No token found');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401) {
        toast.error('Unauthorized');
        setLoading(false);
        return;
      }
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const normalizeToStoragePath = (urlOrPath: string) => {
    // Accept absolute URL or /media/... or direct storage path.
    if (!urlOrPath) return urlOrPath;
    // if absolute, remove base origin
    if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
      try {
        const u = new URL(urlOrPath);
        const path = u.pathname; // e.g. /media/billing/user_1/file.pdf
        return path.replace(/^\//, '').replace(/^media\//, '');
      } catch (e) {
        // fallback
        return urlOrPath;
      }
    }
    // if starts with /media/
    if (urlOrPath.startsWith('/')) {
      return urlOrPath.replace(/^\//, '').replace(/^media\//, '');
    }
    // if starts with media/
    if (urlOrPath.startsWith('media/')) {
      return urlOrPath.replace(/^media\//, '');
    }
    // if starts with billing/ already
    return urlOrPath;
  };

  const handleDeleteBilling = async (userId: number, billPath: string) => {
    if (!window.confirm('Are you sure you want to delete this billing record?')) return;
    if (!token) {
      toast.error('No token');
      return;
    }

    // Backend expects a billing param that can be absolute URL or storage path.
    // We will send the relative storage path to be safe.
    const storagePath = normalizeToStoragePath(billPath); // e.g. billing/user_1/file.pdf

    try {
      const res = await fetch(
        `${API_BASE}/api/admin/users/${userId}/delete-billing/?billing=${encodeURIComponent(storagePath)}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        setUsers(prev =>
          prev.map(u =>
            u.id === userId
              ? {
                  ...u,
                  profile: {
                    ...u.profile,
                    billing_records: u.profile?.billing_records?.filter(b => b !== billPath) ?? [],
                  },
                }
              : u
          )
        );
        toast.success('✅ Billing deleted successfully');
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(`❌ Failed to delete: ${(data && (data.detail || data.error)) || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      toast.error('❌ Network error while deleting billing');
    }
  };

  // Upload file to authenticated user's profile (or you can adapt to admin uploading to specific user)
  // This implementation uploads to current logged-in user. If you need admin uploading for other users,
  // implement a separate endpoint on backend to accept user_id and attach file to that user's profile.
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setUploadFile(file);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      toast.error('Please choose a file first');
      return;
    }
    if (!token) {
      toast.error('No token');
      return;
    }

    const form = new FormData();
    form.append('billing', uploadFile);

    try {
      const res = await fetch(`${API_BASE}/api/billing/upload/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      if (res.ok) {
        const data = await res.json();
        toast.success('Uploaded billing file');

        // After upload, refresh user list (or optimistically add to state)
        fetchUsers();
        setUploadFile(null);
        // reset file input if desired
        (document.getElementById('billing-file-input') as HTMLInputElement | null)?.value && ((document.getElementById('billing-file-input') as HTMLInputElement).value = '');
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.detail || d.error || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error uploading file');
    }
  };

  if (loading) return <p>Loading billing records...</p>;

  return (
    <>
      <NavBar />
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="admin-billing-container">
        <h1>All Billing Records</h1>

        <div className="upload-section" style={{ marginBottom: 20 }}>
          <form onSubmit={handleUpload}>
            <label>
              Upload billing for current user:
              <input id="billing-file-input" type="file" onChange={handleFileChange} />
            </label>
            <button type="submit">Upload</button>
          </form>
        </div>

        {users.map(user => (
          <div key={user.id} className="user-billing-section">
            <h3>{user.first_name} {user.last_name} ({user.username})</h3>
            {user.profile?.billing_records && user.profile.billing_records.length > 0 ? (
              <div className="billing-list">
                {user.profile.billing_records.map((bill, i) => {
                  // bill is an absolute URL (from the backend). Keep as-is for preview.
                  const url = bill.startsWith('http') ? bill : `${API_BASE}${bill}`;
                  return (
                    <div key={i} className="billing-item">
                      <img
                        src={url.endsWith('.pdf') ? '/images/document.png' : url}
                        alt={`Bill ${i}`}
                        onClick={() => setModalBillingUrl(url)}
                        style={{ width: 120, height: 80, objectFit: 'cover', cursor: 'pointer' }}
                      />
                      <button
                        className="delete-billing-btn"
                        onClick={() => handleDeleteBilling(user.id, bill)}
                        title="Delete billing"
                        style={{ marginLeft: 8 }}
                      >
                        ❌
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p>No bills uploaded</p>
            )}
          </div>
        ))}

        {/* Billing Modal */}
        {modalBillingUrl && (
          <div className="billing-modal-overlay" onClick={() => setModalBillingUrl(null)} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div className="billing-modal" onClick={(e) => e.stopPropagation()} style={{
              width: '80%', height: '80%', background: '#fff', padding: 20, borderRadius: 8, overflow: 'auto'
            }}>
              {modalBillingUrl.endsWith('.pdf') ? (
                <iframe src={modalBillingUrl} title="Billing PDF" className="billing-frame" style={{ width: '100%', height: '100%' }} />
              ) : (
                <img src={modalBillingUrl} alt="Billing" className="billing-frame" style={{ maxWidth: '100%', maxHeight: '100%' }} />
              )}
              <div style={{ marginTop: 8, textAlign: 'right' }}>
                <button className="close-modal-btn" onClick={() => setModalBillingUrl(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminBillsPage;
