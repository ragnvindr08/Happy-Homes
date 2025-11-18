import React, { useEffect, useState } from "react";
import axios from "axios";
import NavBar from "./NavBar";
import "./AdminBooking.css";
import { useNotifications } from "./NotificationContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Link } from "react-router-dom";

interface Booking {
  id: number;
  facility_id: number;
  facility_name: string;
  date: string;
  start_time: string;
  end_time: string;
  status: "pending" | "approved" | "rejected";
  user_name?: string;
}

const AdminBookingPage: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>(""); // <-- search state
  const { addNotification } = useNotifications();

  useEffect(() => {
    const savedToken = localStorage.getItem("access");
    if (savedToken) setToken(savedToken);
  }, []);

  const axiosInstance = axios.create({
    baseURL: "http://127.0.0.1:8000/api/",
    timeout: 10000,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const fetchBookings = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get("bookings/");
      setBookings(res.data);
    } catch (err: any) {
      toast.error("Failed to load bookings. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [token]);

  const handleAction = async (id: number, action: "approved" | "rejected") => {
    if (!token) return;
    try {
      await axiosInstance.patch(`bookings/${id}/`, { status: action });
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: action } : b))
      );
      toast.success(`Booking ${action} successfully!`);
    } catch {
      toast.error("Failed to update booking status.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    if (!window.confirm("Are you sure you want to delete this booking?")) return;
    try {
      await axiosInstance.delete(`bookings/${id}/`);
      setBookings((prev) => prev.filter((b) => b.id !== id));
      toast.success("Booking deleted successfully.");
    } catch {
      toast.error("Failed to delete booking.");
    }
  };

  const formatTimeTo12Hour = (time24?: string): string => {
    if (!time24 || !time24.includes(":")) return "--";
    const [hourStr, minute] = time24.split(":");
    const hour = parseInt(hourStr ?? "", 10);
    if (isNaN(hour)) return "--";
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute} ${ampm}`;
  };

  // Filter bookings by date
  let filteredBookings = selectedDate
    ? bookings.filter((b) => b.date === selectedDate)
    : bookings;

  // Apply search filter
  filteredBookings = filteredBookings.filter((b) =>
    b.facility_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
    b.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <NavBar />
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="dashboard-layout">
        {/* Sidebar */}
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
          </ul>
        </aside>

        {/* Main content */}
        <div className="admin-booking-container">
          <h2>Admin Booking Management</h2>

          {/* Date Filter */}
          <div className="date-filter">
            <label htmlFor="date-input">Choose Date:</label>
            <input
              id="date-input"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            {selectedDate && (
              <button className="clear-btn" onClick={() => setSelectedDate("")}>
                Clear
              </button>
            )}
          </div>

          {/* Search Filter */}
          <div style={{ margin: "15px 0" }}>
            <input
              type="text"
              placeholder="Search by facility, user, or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : filteredBookings.length === 0 ? (
            <p>No bookings {selectedDate ? `for ${selectedDate}` : ""}.</p>
          ) : (
            <div className="table-wrapper">
              <table className="booking-table">
                <thead>
                  <tr>
                    <th>Facility</th>
                    <th>User</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((b) => (
                    <tr key={b.id}>
                      <td>{b.facility_name}</td>
                      <td>{b.user_name || "N/A"}</td>
                      <td>{b.date}</td>
                      <td>
                        {formatTimeTo12Hour(b.start_time)} - {formatTimeTo12Hour(b.end_time)}
                      </td>
                      <td className={`status ${b.status}`}>{b.status}</td>
                      <td>
                        {b.status === "pending" ? (
                          <div className="action-buttons">
                            <button
                              className="approve-btn"
                              onClick={() => handleAction(b.id, "approved")}
                            >
                              Approve
                            </button>
                            <button
                              className="reject-btn"
                              onClick={() => handleAction(b.id, "rejected")}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <button
                            className="delete-btn"
                            onClick={() => handleDelete(b.id)}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminBookingPage;



// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import NavBar from "./NavBar";
// import "./AdminBooking.css";
// import { useNotifications } from "./NotificationContext";
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import { Link } from 'react-router-dom'; 

// interface Booking {
//   id: number;
//   facility_id: number;
//   facility_name: string;
//   date: string;
//   start_time: string;
//   end_time: string;
//   status: "pending" | "approved" | "rejected";
//   user_name?: string;
// }

// const isOverlapping = (current: Booking, others: Booking[]) => {
//   return others.some(
//     (other) =>
//       other.id !== current.id &&
//       other.facility_id === current.facility_id &&
//       other.date === current.date &&
//       timeRangesOverlap(current.start_time, current.end_time, other.start_time, other.end_time)
//   );
// };

// const timeRangesOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
//   return (
//     start1 < end2 &&
//     end1 > start2
//   );
// };

// const AdminBookingPage: React.FC = () => {
//   const [token, setToken] = useState<string | null>(null);
//   const [bookings, setBookings] = useState<Booking[]>([]);
//   const [loading, setLoading] = useState(true);
//   const { addNotification } = useNotifications();

//   // Load JWT token
//   useEffect(() => {
//     const savedToken = localStorage.getItem("access");
//     if (savedToken) setToken(savedToken);
//   }, []);

//   // Axios instance with timeout
//   const axiosInstance = axios.create({
//     baseURL: "http://127.0.0.1:8000/api/",
//     timeout: 10000, // 10 seconds timeout
//     headers: token ? { Authorization: `Bearer ${token}` } : {},
//   });

//   // Fetch bookings
//   const fetchBookings = async (retryCount = 0) => {
//     if (!token) return;
//     setLoading(true);
//     try {
//       const res = await axiosInstance.get("bookings/");
//       setBookings(res.data);
//     } catch (err: any) {
//       console.error("Fetch bookings error:", err);
//       if (retryCount < 2) {
//         console.log("Retrying fetch...");
//         fetchBookings(retryCount + 1);
//       } else {
//         addNotification("Failed to load bookings. Please check your connection.");
//         toast.error("Failed to load bookings. Please check your connection.");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchBookings();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [token]);

//   // Approve/Reject action
//   const handleAction = async (id: number, action: "approved" | "rejected") => {
//     if (!token) return;
//     try {
//       await axiosInstance.patch(`bookings/${id}/`, { status: action });

//       // Optimistically update state to reduce extra network calls
//       setBookings((prev) =>
//         prev.map((b) => (b.id === id ? { ...b, status: action } : b))
//       );

//       addNotification(`Booking ${action} successfully!`);
//       toast.success(`Booking ${action} successfully!`);
//     } catch (err: any) {
//       console.error("Action error:", err);
//       const msg = err?.response?.data?.detail || "Failed to update status.";
//       addNotification(`❌ ${msg}`);
//       toast.error(`❌ ${msg}`);
//     }
//   };

//     const handleTestNotification = () => {
//       const msg = '✅ Test notification';
//       addNotification(msg);
//       toast.info(msg);
//     };

//  const formatTimeTo12Hour = (time24?: string): string => {
//   if (!time24 || !time24.includes(":")) return "--"; // Handle missing or invalid format

//   const [hourStr, minute] = time24.split(":");

//   const hour = parseInt(hourStr ?? "", 10);
//   if (isNaN(hour)) return "--"; // Extra safety for invalid hour

//   const ampm = hour >= 12 ? "PM" : "AM";
//   const displayHour = hour % 12 || 12; // Convert '0' to '12'

//   return `${displayHour}:${minute} ${ampm}`;
// };   

// const handleDelete = async (id: number) => {
//   if (!token) return;

//   const confirmDelete = window.confirm("Are you sure you want to delete this booking?");
//   if (!confirmDelete) return;

//   try {
//     await axiosInstance.delete(`bookings/${id}/`);

//     setBookings((prev) => prev.filter((b) => b.id !== id));

//     addNotification("Booking deleted successfully.");
//     toast.success("Booking deleted successfully.");
//   } catch (err: any) {
//     console.error("Delete error:", err);
//     const msg = err?.response?.data?.detail || "Failed to delete booking.";
//     addNotification(`❌ ${msg}`);
//     toast.error(`❌ ${msg}`);
//   }
// };

//   return (
//     <>
//       <NavBar />
//       <ToastContainer position="top-right" autoClose={3000} />
//             <div className="dashboard-layout">
//         <aside className="dashboard-sidebar">
//           <h2 className="sidebar-title">Admin Panel</h2>
//           <ul className="sidebar-menu">
//             <li><Link to="/admin-dashboard/map">Manage Pins on Map</Link></li>
//             <li><Link to="/admin-dashboard/users">Manage Users</Link></li>
//             <li><Link to="/admin-booking">Booking</Link></li>
//             <li><Link to="/visitors-tracking">Visitors Tracking</Link></li>
//             <hr style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />
//             <li><button onClick={handleTestNotification}>Test Notification</button></li>
//           </ul>
//         </aside>
//       <div className="admin-booking-container">
//         <h2>Admin Booking Management</h2>

//         {loading ? (
//           <p>Loading...</p>
//         ) : bookings.length === 0 ? (
//           <p>No bookings.</p>
//         ) : (
//           <div className="table-responsive">
//             <table className="booking-table">
//               <thead>
//                 <tr>
//                   <th>Facility</th>
//                   <th>User</th>
//                   <th>Date</th>
//                   <th>Time</th>
//                   <th>Status</th>
//                   <th>Action</th>
//                 </tr>
//               </thead>
// <tbody>
// {bookings.map((b) => {
//   const hasConflict = isOverlapping(b, bookings);

//   return (
//     <tr key={b.id} className={hasConflict ? "conflict-row" : ""}>
//       <td>{b.facility_name}</td>
//       <td>{b.user_name || "N/A"}</td>
//       <td>{b.date}</td>
//       <td style={{ textAlign: "center" }}>
//         {formatTimeTo12Hour(b.start_time)} - {formatTimeTo12Hour(b.end_time)}
//       </td>
//       <td
//         style={{
//           color:
//             b.status === "approved"
//               ? "green"
//               : b.status === "rejected"
//               ? "red"
//               : "orange",
//           fontWeight: "bold",
//         }}
//       >
//         {b.status}
//       </td>
// <td>
//   {b.status === "pending" ? (
//     <>
//       <button
//         className="approve-btn"
//         onClick={() => handleAction(b.id, "approved")}
//       >
//         Approve
//       </button>
//       <button
//         className="reject-btn"
//         onClick={() => handleAction(b.id, "rejected")}
//       >
//         Reject
//       </button>

//     </>
//   ) : (
//     <>
//       {/* <span style={{ color: b.status === "approved" ? "green" : "red" }}>
//         {b.status === "approved" ? "✅ Approved" : "❌ Rejected"}
//       </span> */}
//       <br />
//       <button
//         className="delete-btn"
//         onClick={() => handleDelete(b.id)}
//         style={{ marginTop: "5px" }}
//       >
//         Delete
//       </button>
//     </>
//   )}
// </td>
//     </tr>
//   );
// })}
// </tbody>
//             </table>
//           </div>
//         )}
//       </div>
//       </div>
//     </>
//   );
// };

// export default AdminBookingPage;
