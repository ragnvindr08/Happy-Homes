// src/pages/ResidentsApproval.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api/residents/";

interface Resident {
  id: number;
  username: string;
  email: string;
  address: string;
  contact_number: string;
  is_verified: boolean;
}

const ResidentsApproval: React.FC = () => {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResidents = async () => {
    try {
      const res = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setResidents(res.data);
    } catch (err) {
      console.error("Error fetching residents:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (id: number, approve: boolean) => {
    try {
      await axios.put(
        `${API_URL}${id}/`,
        { is_verified: approve },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      fetchResidents();
      alert(`Resident ${approve ? "approved ✅" : "declined ❌"} successfully.`);
    } catch (err) {
      console.error(err);
      alert("Action failed.");
    }
  };

  useEffect(() => {
    fetchResidents();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">👮 Resident Approval Dashboard</h1>
      <table className="min-w-full border border-gray-300 rounded-lg shadow-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Username</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Address</th>
            <th className="p-2 border">Contact</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {residents.map((res) => (
            <tr key={res.id}>
              <td className="p-2 border">{res.username}</td>
              <td className="p-2 border">{res.email}</td>
              <td className="p-2 border">{res.address}</td>
              <td className="p-2 border">{res.contact_number}</td>
              <td className="p-2 border">
                {res.is_verified ? (
                  <span className="text-green-600 font-semibold">Approved ✅</span>
                ) : (
                  <span className="text-red-500 font-semibold">Pending ❌</span>
                )}
              </td>
              <td className="p-2 border">
                <button
                  onClick={() => handleApproval(res.id, true)}
                  className="bg-green-500 text-white px-3 py-1 rounded mr-2"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleApproval(res.id, false)}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  Decline
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResidentsApproval;
