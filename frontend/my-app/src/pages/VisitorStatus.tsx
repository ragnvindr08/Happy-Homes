import React, { useState, useEffect } from "react";
import axios from "axios";
import { getToken, logout } from "../utils/auth";
import { useNavigate } from "react-router-dom";

interface VisitorStatus {
  id: number;
  name: string;
  gmail: string;
  status: "pending" | "approved" | "declined";
  time_in: string | null;
  time_out: string | null;
}

const TIME_API = "http://127.0.0.1:8000/api/visitor/"; // patch for time in/out
const GUEST_STATUS_API = "http://127.0.0.1:8000/api/visitor/guest-status/";

const VisitorPage: React.FC = () => {
  const [visitorName, setVisitorName] = useState("");
  const [visitorGmail, setVisitorGmail] = useState("");
  const [reasonOrPin, setReasonOrPin] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [statusList, setStatusList] = useState<VisitorStatus[]>([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const token = getToken();

  const formatTime = (time: string | null) => {
    if (!time) return "-";
    const date = new Date(time);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  // ---------------- Check visitor status ----------------
  const handleCheckStatus = async () => {
    if (!visitorName || !visitorGmail || !reasonOrPin) {
      setMessage("❌ Please fill in all fields.");
      return;
    }

    setLoading(true);
    setMessage(null);
    setStatusList([]);

    try {
      const res = await axios.get(GUEST_STATUS_API, {
        params: { name: visitorName, gmail: visitorGmail, pin: reasonOrPin },
      });
      setStatusList(res.data);
      if (res.data.length === 0) setMessage("❌ No visitor record found.");
    } catch (err: any) {
      console.error(err);
      setMessage(err.response?.data?.error || "❌ Failed to fetch status.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Update Time In ----------------
  const handleTimeIn = async (id: number) => {
    try {
      const now = new Date().toISOString();
      await axios.patch(`${TIME_API}${id}/time-in/`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStatusList(prev =>
        prev.map(v => (v.id === id ? { ...v, time_in: now } : v))
      );
      setMessage("⏱️ Time In updated!");
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to update Time In.");
    }
  };

  // ---------------- Update Time Out ----------------
  const handleTimeOut = async (id: number) => {
    try {
      const now = new Date().toISOString();
      await axios.patch(`${TIME_API}${id}/time-out/`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStatusList(prev =>
        prev.map(v => (v.id === id ? { ...v, time_out: now } : v))
      );
      setMessage("⏱️ Time Out updated!");
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to update Time Out.");
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-center">Visitor Check-In</h1>

      {message && (
        <p className={message.startsWith("✅") || message.startsWith("⏱️") ? "text-green-600" : "text-red-600"}>
          {message}
        </p>
      )}

      <div className="max-w-md mx-auto bg-white p-6 rounded-2xl shadow-md">
        <label className="block mb-2 font-semibold">Full Name</label>
        <input
          type="text"
          value={visitorName}
          onChange={(e) => setVisitorName(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
          placeholder="John Doe"
        />
        <label className="block mb-2 font-semibold">Gmail</label>
        <input
          type="email"
          value={visitorGmail}
          onChange={(e) => setVisitorGmail(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
          placeholder="example@gmail.com"
        />
        <label className="block mb-2 font-semibold">Resident PIN</label>
        <input
          type="text"
          value={reasonOrPin}
          onChange={(e) => setReasonOrPin(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
          placeholder="Enter resident PIN"
        />
        <button
          onClick={handleCheckStatus}
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
        >
          {loading ? "Checking..." : "Check Status"}
        </button>
      </div>

      {statusList.length > 0 && (
        <div className="max-w-md mx-auto mt-6">
          <h2 className="text-xl font-semibold mb-2">Visitor Status</h2>
          {statusList.map((v) => (
            <div
              key={v.id}
              className="bg-white p-4 rounded-2xl shadow-md border border-gray-200 mb-4"
            >
              <p className="font-semibold">Name: {v.name}</p>
              <p>📧 Gmail: {v.gmail || "-"}</p>
              <p>🕒 Time In: {formatTime(v.time_in)}</p>
              <p>🕓 Time Out: {formatTime(v.time_out)}</p>

              <div className="mt-2 flex gap-2">
                {!v.time_in && (
                  <button
                    onClick={() => handleTimeIn(v.id)}
                    className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded"
                  >
                    ⏱️ Time In
                  </button>
                )}
                {!v.time_out && (
                  <button
                    onClick={() => handleTimeOut(v.id)}
                    className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded"
                  >
                    ⏱️ Time Out
                  </button>
                )}
              </div>

              <p
                className={`mt-2 font-bold ${
                  v.status === "approved"
                    ? "text-green-600"
                    : v.status === "declined"
                    ? "text-red-600"
                    : "text-yellow-600"
                }`}
              >
                Status: {v.status.toUpperCase()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VisitorPage;
