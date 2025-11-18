import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import NavBar from "./NavBar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Link } from "react-router-dom";
import "./visitorsTracking.css";

interface Booking {
  id: number;
  facility_id: number;
  facility_name: string;
  date: string;
  start_time: string;
  end_time: string;
  status: "pending" | "approved" | "rejected";
  user_name?: string;
  created_at?: string;
}

interface BookingStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  byFacility: { [key: string]: number };
  byDate: { [key: string]: number };
}

const BookingReports: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState<string>("");
  const [filterFacility, setFilterFacility] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  useEffect(() => {
    const savedToken = localStorage.getItem("access");
    if (savedToken) {
      setToken(savedToken);
      // Check if user is admin
      axios.get("http://127.0.0.1:8000/api/profile/", {
        headers: { Authorization: `Bearer ${savedToken}` }
      })
      .then(res => {
        const adminStatus = res.data.is_staff || false;
        setIsAdmin(adminStatus);
        if (!adminStatus) {
          toast.error("Access denied. Admin only.");
        }
      })
      .catch(() => setIsAdmin(false));
    }
  }, []);

  const axiosInstance = useMemo(() => {
    return axios.create({
      baseURL: "http://127.0.0.1:8000/api/",
      timeout: 10000,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }, [token]);

  const fetchBookings = async () => {
    if (!token || !isAdmin) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get("bookings/");
      setBookings(res.data || []);
    } catch (err: any) {
      console.error("Failed to fetch bookings", err);
      toast.error("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && isAdmin) {
      fetchBookings();
    }
  }, [token, isAdmin]);

  const formatTime = (time?: string) => {
    if (!time) return "-";
    const [hourStr, minuteStr] = time.split(":");
    let hour = Number(hourStr ?? 0);
    const minute = Number(minuteStr ?? 0);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${minute.toString().padStart(2, "0")} ${ampm}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Calculate statistics
  const stats: BookingStats = useMemo(() => {
    const stats: BookingStats = {
      total: bookings.length,
      approved: 0,
      pending: 0,
      rejected: 0,
      byFacility: {},
      byDate: {},
    };

    bookings.forEach((booking) => {
      // Count by status
      if (booking.status === "approved") stats.approved++;
      else if (booking.status === "pending") stats.pending++;
      else if (booking.status === "rejected") stats.rejected++;

      // Count by facility
      const facilityName = booking.facility_name || "Unknown";
      stats.byFacility[facilityName] = (stats.byFacility[facilityName] || 0) + 1;

      // Count by date
      stats.byDate[booking.date] = (stats.byDate[booking.date] || 0) + 1;
    });

    return stats;
  }, [bookings]);

  // Filter bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      if (filterDate && booking.date !== filterDate) return false;
      if (filterFacility && booking.facility_name !== filterFacility) return false;
      if (filterStatus && booking.status !== filterStatus) return false;
      return true;
    });
  }, [bookings, filterDate, filterFacility, filterStatus]);

  // Get unique facilities for filter
  const uniqueFacilities = useMemo(() => {
    return Array.from(new Set(bookings.map((b) => b.facility_name).filter(Boolean)));
  }, [bookings]);

  if (!isAdmin) {
    return (
      <>
        <NavBar />
        <div style={{ padding: "50px", textAlign: "center" }}>
          <h2>Access Denied</h2>
          <p>This page is only accessible to administrators.</p>
        </div>
      </>
    );
  }

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

        <main className="dashboard-main">
          <div className="visitors-tracking-container">
            <h2>Booking Reports & Analytics</h2>

            {/* Statistics Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              <div style={{
                backgroundColor: '#2e6F40',
                color: 'white',
                padding: '20px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <h3 style={{ margin: 0, fontSize: '32px' }}>{stats.total}</h3>
                <p style={{ margin: '5px 0 0 0' }}>Total Bookings</p>
              </div>
              <div style={{
                backgroundColor: '#2e6F40',
                color: 'white',
                padding: '20px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <h3 style={{ margin: 0, fontSize: '32px' }}>{stats.approved}</h3>
                <p style={{ margin: '5px 0 0 0' }}>Approved</p>
              </div>
              <div style={{
                backgroundColor: '#f0ad4e',
                color: 'white',
                padding: '20px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <h3 style={{ margin: 0, fontSize: '32px' }}>{stats.pending}</h3>
                <p style={{ margin: '5px 0 0 0' }}>Pending</p>
              </div>
              <div style={{
                backgroundColor: '#d9534f',
                color: 'white',
                padding: '20px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <h3 style={{ margin: 0, fontSize: '32px' }}>{stats.rejected}</h3>
                <p style={{ margin: '5px 0 0 0' }}>Rejected</p>
              </div>
            </div>

            {/* Filters */}
            <div style={{
              display: 'flex',
              gap: '15px',
              marginBottom: '20px',
              flexWrap: 'wrap',
              padding: '15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Filter by Date:</label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Filter by Facility:</label>
                <select
                  value={filterFacility}
                  onChange={(e) => setFilterFacility(e.target.value)}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '150px' }}
                >
                  <option value="">All Facilities</option>
                  {uniqueFacilities.map((facility) => (
                    <option key={facility} value={facility}>
                      {facility}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Filter by Status:</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '150px' }}
                >
                  <option value="">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  onClick={() => {
                    setFilterDate("");
                    setFilterFacility("");
                    setFilterStatus("");
                  }}
                  style={{
                    padding: '8px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Bookings Table */}
            <div className="table-wrapper">
              <table className="visitors-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Facility</th>
                    <th>User</th>
                    <th>Date</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Status</th>
                    
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>
                        Loading bookings...
                      </td>
                    </tr>
                  ) : filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>
                        No bookings found
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((booking) => (
                      <tr key={booking.id}>
                        <td>{booking.id}</td>
                        <td>{booking.facility_name || "N/A"}</td>
                        <td>{booking.user_name || "N/A"}</td>
                        <td>{formatDate(booking.date)}</td>
                        <td>{formatTime(booking.start_time)}</td>
                        <td>{formatTime(booking.end_time)}</td>
                        <td>
                          <span
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontWeight: 'bold',
                              color: 'white',
                              backgroundColor:
                                booking.status === "approved"
                                  ? "#2e6F40"
                                  : booking.status === "rejected"
                                  ? "#d9534f"
                                  : "#f0ad4e",
                            }}
                          >
                            {booking.status.toUpperCase()}
                          </span>
                        </td>
                        
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Facility Statistics */}
            {Object.keys(stats.byFacility).length > 0 && (
              <div style={{ marginTop: '30px' }}>
                <h3>Bookings by Facility</h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '15px'
                }}>
                  {Object.entries(stats.byFacility).map(([facility, count]) => (
                    <div
                      key={facility}
                      style={{
                        padding: '15px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        border: '1px solid #ddd'
                      }}
                    >
                      <strong>{facility}</strong>
                      <p style={{ margin: '5px 0 0 0', fontSize: '24px', color: '#2e6F40' }}>{count}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default BookingReports;


