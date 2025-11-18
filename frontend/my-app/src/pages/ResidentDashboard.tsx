import React, { useEffect, useState } from "react";
import axios from "axios";
import { getToken, logout } from "../utils/auth";
import { useNavigate, Link } from "react-router-dom";
import "./ResidentDashboard.css";
import NavBar from "./NavBar"; // ✅ Added NavBar import

interface VisitorType {
  id: number;
  name: string;
  gmail: string | null;
  contact_number?: string | null; // <-- optional contact number
  reason: string;
  time_in: string | null;
  time_out: string | null;
  status: "pending" | "approved" | "declined";
  resident: {
    pin: string | null;
    user: {
      username: string;
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

interface UserProfile {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

const VISITORS_API = "http://127.0.0.1:8000/api/visitor/";
const PROFILE_API = "http://127.0.0.1:8000/api/profile/";
const RESIDENT_PIN_API = "http://127.0.0.1:8000/api/resident-pin/my/";

const ResidentDashboard: React.FC = () => {
  const [visitors, setVisitors] = useState<VisitorType[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [residentPin, setResidentPin] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();
  const token = getToken();

  if (!token) navigate("/login");

  // ---------------- Fetch profile ----------------
  const fetchProfile = async () => {
    try {
      const res = await axios.get(PROFILE_API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(res.data);
    } catch (err) {
      console.error(err);
      logout();
      navigate("/login");
    }
  };

  // ---------------- Fetch resident PIN ----------------
  const fetchResidentPin = async () => {
    try {
      const res = await axios.get(RESIDENT_PIN_API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResidentPin(res.data.pin);
    } catch (err) {
      console.error("Failed to fetch PIN:", err);
    }
  };

  // ---------------- Fetch visitors ----------------
  const fetchVisitors = async () => {
    setLoading(true);
    try {
      const res = await axios.get<VisitorType[]>(VISITORS_API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVisitors(res.data);
    } catch (err) {
      console.error("Failed to fetch visitors:", err);
      setMessage(
        "❌ Failed to fetch visitors. Make sure backend is running and token is valid."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchResidentPin();
    fetchVisitors();

    const interval = setInterval(() => {
      fetchProfile();
      fetchResidentPin();
      fetchVisitors();
    }, 15000); // refresh every 15s

    return () => clearInterval(interval);
  }, []);

  // ---------------- Approve / Decline / Delete ----------------
  const handleApprove = async (id: number) => {
    try {
      await axios.patch(
        `${VISITORS_API}${id}/`,
        { status: "approved" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVisitors((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status: "approved" } : v))
      );
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to approve visitor");
    }
  };

  const handleDecline = async (id: number) => {
    try {
      await axios.patch(
        `${VISITORS_API}${id}/`,
        { status: "declined" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVisitors((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status: "declined" } : v))
      );
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to decline visitor");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this visitor?")) return;

    try {
      await axios.delete(`${VISITORS_API}${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVisitors((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to delete visitor");
    }
  };

  // ---------------- Format time to 12-hour ----------------
  const formatTime = (time: string | null) => {
    if (!time) return "-";
    const date = new Date(time);
    if (isNaN(date.getTime())) return "-";
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  if (!profile) return <p>Loading profile...</p>;

  return (
    <>
      <NavBar /> {/* ✅ Added NavBar at the top */}

    <div className="resident-dashboard-container">
      <div className="resident-dashboard">
        <h1>🏠 Resident Dashboard</h1>
        <p>
          Welcome, <strong>{profile.first_name} {profile.last_name}</strong> ({profile.username}) | Email: {profile.email}
        </p>
        <p style={{ fontWeight: "bold", marginTop: "10px" }}>
          Visitor PIN: {residentPin || "No PIN yet"}
        </p>

        {message && (
          <p className={`message ${message.startsWith("❌") ? "error" : "success"}`}>
            {message}
          </p>
        )}

        <h2>Visitor Requests</h2>

        {loading ? (
          <p>Loading visitors...</p>
        ) : visitors.length === 0 ? (
          <p>No visitor requests.</p>
        ) : (
          <div className="visitor-cards">
            {visitors.map((v) => (
              <div key={v.id} className="visitor-card">
                <p className="font-semibold">Name: {v.name}</p>
                <p>Gmail: {v.gmail || v.resident?.user?.email || "-"}</p>
                {v.contact_number && <p>Contact: {v.contact_number}</p>} {/* Display contact if available */}
                <p>Time In: {formatTime(v.time_in)}</p>
                <p>Time Out: {formatTime(v.time_out)}</p>

                <p
                  className={`status ${
                    v.status === "approved"
                      ? "approved"
                      : v.status === "declined"
                      ? "declined"
                      : "pending"
                  }`}
                >
                  Status: {v.status.toUpperCase()}
                </p>

                <div className="flex gap-2 mt-2">
                  {v.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleApprove(v.id)}
                        className="bg-green-500"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDecline(v.id)}
                        className="bg-red-500"
                      >
                        Decline
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(v.id)}
                    className="bg-gray-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ResidentDashboard;
