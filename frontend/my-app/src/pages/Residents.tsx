// Resident.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface Resident {
  pin: string | null;
}

const Resident = () => {
  const [resident, setResident] = useState<Resident | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const navigate = useNavigate();

  // Fetch Resident PIN
  const fetchPin = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    const token = localStorage.getItem("access_token");
    if (!token) {
      setError("No token found. Please log in.");
      navigate("/login");
      return;
    }

    try {
      const res = await axios.get("/api/resident-pin/my/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResident(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Unable to fetch PIN.");
    } finally {
      setLoading(false);
    }
  };

  // Generate a new PIN
  const generatePin = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    const token = localStorage.getItem("access_token");
    if (!token) {
      setError("No token found. Please log in.");
      navigate("/login");
      return;
    }

    try {
      const res = await axios.post(
        "/api/resident-pin/my/",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResident(res.data);
      setMessage("New PIN generated successfully!");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to generate PIN.");
    } finally {
      setLoading(false);
    }
  };

  // Copy PIN to clipboard
  const copyPin = () => {
    if (resident?.pin) {
      navigator.clipboard.writeText(resident.pin);
      setMessage("PIN copied to clipboard!");
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  };

  useEffect(() => {
    fetchPin();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-md bg-white rounded shadow mt-10">
      <h1 className="text-2xl font-bold mb-4">Your Visitor PIN</h1>

      {loading && <p className="text-blue-500">Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {message && <p className="text-green-500">{message}</p>}

      {resident && (
        <div className="mt-4">
          <p className="mb-2">Share this PIN with your visitors:</p>
          <h2 className="text-xl font-semibold mb-4">{resident.pin || "No PIN yet"}</h2>

          <div className="flex gap-2 mb-4">
            <button
              onClick={generatePin}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              disabled={loading}
            >
              {resident.pin ? "Generate New PIN" : "Generate PIN"}
            </button>

            <button
              onClick={copyPin}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              disabled={!resident.pin}
            >
              Copy PIN
            </button>
          </div>

          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default Resident;
    