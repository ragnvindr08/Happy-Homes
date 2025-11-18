import React, { useEffect, useState } from "react";
import axios from "axios";

interface Visitor {
  id: number;
  name: string;
  gmail: string;
  pin_entered: string;
  reason: string;
  time_in: string;
  time_out: string | null;
  status: "pending" | "approved" | "declined";
}

const API_URL = "http://127.0.0.1:8000/api/visitor/";

const VisitorDashboard: React.FC = () => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [visitorName, setVisitorName] = useState("");
  const [visitorGmail, setVisitorGmail] = useState("");
  const [visitorReason, setVisitorReason] = useState("");
  const [residentPin, setResidentPin] = useState("");
  const [message, setMessage] = useState("");

  // Fetch visitors for resident dashboard
  const fetchVisitors = async () => {
    try {
      const res = await axios.get(`${API_URL}all/`); // backend endpoint for resident view
      setVisitors(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
    const interval = setInterval(fetchVisitors, 15000);
    return () => clearInterval(interval);
  }, []);

  // Approve visitor
  const handleApprove = async (id: number) => {
    try {
      await axios.post(`${API_URL}approval/${id}/`, { approve: true });
      setVisitors((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status: "approved", time_in: new Date().toISOString() } : v))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Decline visitor
  const handleDecline = async (id: number) => {
    try {
      await axios.post(`${API_URL}approval/${id}/`, { approve: false });
      setVisitors((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status: "declined", time_out: new Date().toISOString() } : v))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Visitor check-in form
  const handleCheckin = async () => {
    if (!visitorName || !visitorGmail || !visitorReason || !residentPin) {
      setMessage("Please fill all fields.");
      return;
    }
    try {
      await axios.post(`${API_URL}checkin/`, {
        name: visitorName,
        gmail: visitorGmail,
        reason: visitorReason,
        pin: residentPin,
      });
      setMessage("Visitor check-in request submitted!");
      setVisitorName("");
      setVisitorGmail("");
      setVisitorReason("");
      setResidentPin("");
      fetchVisitors();
    } catch (err) {
      console.error(err);
      setMessage("Failed to submit visitor request.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">👮 Visitor System</h1>

      {/* Visitor check-in form */}
      <div className="bg-white p-6 rounded-2xl shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Visitor Check-in</h2>
        <input
          type="text"
          placeholder="Visitor Name"
          className="border p-2 rounded mb-2 w-full"
          value={visitorName}
          onChange={(e) => setVisitorName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Gmail"
          className="border p-2 rounded mb-2 w-full"
          value={visitorGmail}
          onChange={(e) => setVisitorGmail(e.target.value)}
        />
        <input
          type="text"
          placeholder="Reason for Visit"
          className="border p-2 rounded mb-2 w-full"
          value={visitorReason}
          onChange={(e) => setVisitorReason(e.target.value)}
        />
        <input
          type="text"
          placeholder="Resident PIN"
          className="border p-2 rounded mb-2 w-full"
          value={residentPin}
          onChange={(e) => setResidentPin(e.target.value)}
        />
        <button
          onClick={handleCheckin}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded mt-2"
        >
          Submit Request
        </button>
        {message && <p className="text-green-600 mt-2">{message}</p>}
      </div>

      {/* Residents dashboard */}
      <h2 className="text-2xl font-semibold mb-4">Pending Visitors</h2>
      {loading ? (
        <p>Loading visitors...</p>
      ) : visitors.length === 0 ? (
        <p>No visitor requests.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visitors.map((visitor) => (
            <div
              key={visitor.id}
              className="bg-white p-4 rounded-2xl shadow-md border border-gray-200 hover:shadow-lg transition"
            >
              <p className="font-semibold">Name: {visitor.name}</p>
              <p>📧 Gmail: {visitor.gmail}</p>
              <p>📝 Reason: {visitor.reason}</p>
              <p>🔑 PIN Entered: {visitor.pin_entered}</p>
              <p>🕒 Time In: {visitor.time_in}</p>
              <p>🕓 Time Out: {visitor.time_out || "-"}</p>
              <p
                className={`mt-2 font-bold ${
                  visitor.status === "approved"
                    ? "text-green-600"
                    : visitor.status === "declined"
                    ? "text-red-600"
                    : "text-yellow-600"
                }`}
              >
                Status: {visitor.status.toUpperCase()}
              </p>
              {visitor.status === "pending" && (
                <div className="mt-4 flex justify-between">
                  <button
                    onClick={() => handleApprove(visitor.id)}
                    className="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded"
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => handleDecline(visitor.id)}
                    className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded"
                  >
                    ❌ Decline
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VisitorDashboard;
