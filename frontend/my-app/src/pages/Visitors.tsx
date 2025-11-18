import React, { useState, useEffect } from "react";
import axios from "axios";
import { getToken, logout } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import "./VisitorPage.css";



// ---------------- Types ----------------
interface VisitorStatus {
  id: number;
  name: string;
  gmail: string;
  contact_number?: string | null; // optional
  status: "pending" | "approved" | "declined";
  time_in: string | null;
  time_out: string | null;
}

interface ResidentPin {
  id: number;
  pin: string;
}

// ---------------- API Endpoints ----------------
const RESIDENT_PIN_API = "http://127.0.0.1:8000/api/resident-pin/my/";
const VISITOR_API = "http://127.0.0.1:8000/api/visitor/";
const GUEST_CHECKIN_API = "http://127.0.0.1:8000/api/visitor/guest-checkin/";
const GUEST_STATUS_API = "http://127.0.0.1:8000/api/visitor/guest-status/";

// ---------------- Component ----------------
const VisitorPage: React.FC = () => {
  const [residentPin, setResidentPin] = useState<ResidentPin | null>(null);
  const [visitorName, setVisitorName] = useState("");
  const [visitorGmail, setVisitorGmail] = useState("");
  const [visitorContact, setVisitorContact] = useState(""); 
  const [reasonOrPin, setReasonOrPin] = useState("");
  const [statusList, setStatusList] = useState<VisitorStatus[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [guestMode, setGuestMode] = useState(false);

  const navigate = useNavigate();
  const token = getToken();

  // ---------------- Fetch resident PIN ----------------
  useEffect(() => {
    if (!token) {
      setGuestMode(true);
      return;
    }

    const fetchResidentPin = async () => {
      try {
        const res = await axios.get<ResidentPin>(RESIDENT_PIN_API, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setResidentPin(res.data);
      } catch (err) {
        console.error(err);
        logout();
        navigate("/login");
      }
    };

    fetchResidentPin();
  }, [token, navigate]);

  // ---------------- Format time ----------------
  const formatTime = (time: string | null) => {
    if (!time) return "-";
    const date = new Date(time);
    const hours = date.getHours() % 12 || 12;
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = date.getHours() >= 12 ? "PM" : "AM";
    return `${hours}:${minutes} ${ampm}`;
  };

  // ---------------- Guest submits check-in ----------------
  const handleGuestSubmit = async () => {
    if (!visitorName || !visitorGmail || !reasonOrPin) {
      setMessage("❌ Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const payload = {
        name: visitorName,
        gmail: visitorGmail,
        contact_number: visitorContact || null,
        pin: reasonOrPin,
      };
      await axios.post(GUEST_CHECKIN_API, payload);
      setMessage("Visitor check-in submitted (guest)!");
      setVisitorName("");
      setVisitorGmail("");
      setVisitorContact("");
      setReasonOrPin("");
    } catch (err: any) {
      console.error(err);
      setMessage(err.response?.data?.error || "❌ Failed to submit check-in.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Guest checks status ----------------
  const handleCheckStatus = async () => {
    if (!visitorName || !visitorGmail || !reasonOrPin) {
      setMessage("❌ Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await axios.get<VisitorStatus[]>(GUEST_STATUS_API, {
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

  // ---------------- Single Time In / Time Out Button ----------------
  const handleTimeButton = async (visitor: VisitorStatus) => {
    const action = !visitor.time_in ? "time-in" : "time-out";
    setMessage(null);

    try {
      let headers: any = { "Content-Type": "application/json" };
      let payload: any = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      } else {
        payload = { email: visitor.gmail, pin: reasonOrPin };
        if (!visitor.gmail || !reasonOrPin) {
          setMessage("❌ Guest must provide Gmail and Resident PIN to update Time.");
          return;
        }
      }

      const res = await axios.patch(`${VISITOR_API}${visitor.id}/${action}/`, payload, { headers });

      setStatusList((prev: VisitorStatus[]) =>
        prev.map((v) =>
          v.id === visitor.id
            ? { ...v, time_in: v.time_in || res.data.time_in, time_out: res.data.time_out }
            : v
        )
      );

      setMessage(`⏱️ ${action === "time-in" ? "Time In" : "Time Out"} updated!`);
    } catch (err: any) {
      console.error(err);
      setMessage(err.response?.data?.error || "❌ Failed to update time.");
    }
  };

  // ---------------- Render ----------------
  return (
    <div className="visitor-page">
      <h1>Visitor Check-In</h1>

      {message && (
        <p className={`message ${message.startsWith("✅") || message.startsWith("⏱️") ? "success" : "error"}`}>
          {message}
        </p>
      )}

      {guestMode && (
        <div className="visitor-form">
          <label>Full Name</label>
          <input
            type="text"
            value={visitorName}
            onChange={(e) => setVisitorName(e.target.value)}
            placeholder="Full Name"
          />

          <label>Gmail (Optional)</label>
          <input
            type="email"
            value={visitorGmail}
            onChange={(e) => setVisitorGmail(e.target.value)}
            placeholder="example@gmail.com"
          />

          <label>Contact Number (Optional)</label>
          <input
            type="text"
            value={visitorContact}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "");
              if (val.length <= 11) setVisitorContact(val);
            }}
            placeholder="09xxxxxxxxx (Max 11 digits)"
          />

          <label>Resident PIN</label>
          <input
            type="text"
            value={reasonOrPin}
            onChange={(e) => setReasonOrPin(e.target.value)}
            placeholder="Enter resident PIN"
          />

          <button onClick={handleGuestSubmit} disabled={loading} className="submit">
            {loading ? "Processing..." : "Submit Check-In"}
          </button>

          <button onClick={handleCheckStatus} disabled={loading} className="check">
            {loading ? "Checking..." : "Check Status"}
          </button>
        </div>
      )}

      {statusList.length > 0 && (
        <div className="visitor-status">
          {statusList.map((visitor: VisitorStatus) => (
            <div key={visitor.id} className="visitor-card">
              <p>Name: {visitor.name}</p>
              <p>Gmail: {visitor.gmail}</p>
              {visitor.contact_number && <p>Contact: {visitor.contact_number}</p>}
              <p>Time In: {formatTime(visitor.time_in)}</p>
              <p>Time Out: {formatTime(visitor.time_out)}</p>

              {!visitor.time_out ? (
                <button
                  className={`time-btn ${!visitor.time_in ? "time-in" : "time-out"}`}
                  onClick={() => handleTimeButton(visitor)}
                >
                  {!visitor.time_in ? "Time In" : "Time Out"}
                </button>
              ) : (
                <button className="time-btn done" disabled>
                  Done
                </button>
              )}

              <p className={`status ${visitor.status}`}>Status: {visitor.status.toUpperCase()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VisitorPage;




// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { getToken, logout } from "../utils/auth";
// import { useNavigate } from "react-router-dom";
// import "./VisitorPage.css";

// interface VisitorStatus {
//   id: number;
//   name: string;
//   gmail: string;
//   status: "pending" | "approved" | "declined";
//   time_in: string | null;
//   time_out: string | null;
// }

// interface ResidentPin {
//   id: number;
//   pin: string;
// }

// const RESIDENT_PIN_API = "http://127.0.0.1:8000/api/resident-pin/my/";
// const VISITOR_API = "http://127.0.0.1:8000/api/visitor/";
// const GUEST_CHECKIN_API = "http://127.0.0.1:8000/api/visitor/guest-checkin/";
// const GUEST_STATUS_API = "http://127.0.0.1:8000/api/visitor/guest-status/";

// const VisitorPage: React.FC = () => {
//   const [residentPin, setResidentPin] = useState<ResidentPin | null>(null);
//   const [visitorName, setVisitorName] = useState("");
//   const [visitorGmail, setVisitorGmail] = useState("");
//   const [reasonOrPin, setReasonOrPin] = useState("");
//   const [statusList, setStatusList] = useState<VisitorStatus[]>([]);
//   const [message, setMessage] = useState<string | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [guestMode, setGuestMode] = useState(false);

//   const navigate = useNavigate();
//   const token = getToken();

//   // ---------------- Fetch resident PIN ----------------
//   useEffect(() => {
//     if (!token) {
//       setGuestMode(true);
//       return;
//     }

//     const fetchResidentPin = async () => {
//       try {
//         const res = await axios.get(RESIDENT_PIN_API, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         setResidentPin(res.data);
//       } catch (err) {
//         console.error(err);
//         logout();
//         navigate("/login");
//       }
//     };

//     fetchResidentPin();
//   }, [token, navigate]);

//   // ---------------- Format time ----------------
//   const formatTime = (time: string | null) => {
//     if (!time) return "-";
//     const date = new Date(time);
//     let hours = date.getHours();
//     const minutes = date.getMinutes().toString().padStart(2, "0");
//     const ampm = hours >= 12 ? "PM" : "AM";
//     hours = hours % 12 || 12;
//     return `${hours}:${minutes} ${ampm}`;
//   };

//   // ---------------- Guest submits check-in ----------------
//   const handleGuestSubmit = async () => {
//     if (!visitorName || !visitorGmail || !reasonOrPin) {
//       setMessage("❌ Please fill in all fields.");
//       return;
//     }
//     setLoading(true);
//     setMessage(null);

//     try {
//       const payload = { name: visitorName, gmail: visitorGmail, pin: reasonOrPin };
//       await axios.post(GUEST_CHECKIN_API, payload);
//       setMessage("✅ Visitor check-in submitted (guest)!");
//       setVisitorName("");
//       setVisitorGmail("");
//       setReasonOrPin("");
//     } catch (err: any) {
//       console.error(err);
//       setMessage(err.response?.data?.error || "❌ Failed to submit check-in.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ---------------- Guest checks status ----------------
//   const handleCheckStatus = async () => {
//     if (!visitorName || !visitorGmail || !reasonOrPin) {
//       setMessage("❌ Please fill in all fields.");
//       return;
//     }
//     setLoading(true);
//     setMessage(null);

//     try {
//       const res = await axios.get(GUEST_STATUS_API, {
//         params: { name: visitorName, gmail: visitorGmail, pin: reasonOrPin },
//       });
//       setStatusList(res.data);
//       if (res.data.length === 0) setMessage("❌ No visitor record found.");
//     } catch (err: any) {
//       console.error(err);
//       setMessage(err.response?.data?.error || "❌ Failed to fetch status.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ---------------- Single Time In / Time Out Button ----------------
// const handleTimeButton = async (visitor: VisitorStatus) => {
//   const action = !visitor.time_in ? "time-in" : "time-out";
//   setMessage(null);

//   try {
//     let headers: any = { "Content-Type": "application/json" };
//     let payload: any = {};

//     if (token) {
//       headers.Authorization = `Bearer ${token}`;
//     } else {
//       payload = { email: visitor.gmail, pin: reasonOrPin };
//       if (!visitor.gmail || !reasonOrPin) {
//         setMessage("❌ Guest must provide Gmail and Resident PIN to update Time.");
//         return;
//       }
//     }

//     const res = await axios.patch(
//       `${VISITOR_API}${visitor.id}/${action}/`,
//       payload,
//       { headers }
//     );

//     // Merge the existing visitor data with the updated fields
//     setStatusList((prev) =>
//       prev.map((v) =>
//         v.id === visitor.id
//           ? { ...v, time_in: v.time_in || res.data.time_in, time_out: res.data.time_out }
//           : v
//       )
//     );

//     setMessage(`⏱️ ${action === "time-in" ? "Time In" : "Time Out"} updated!`);
//   } catch (err: any) {
//     console.error(err);
//     setMessage(err.response?.data?.error || "❌ Failed to update time.");
//   }
// };
//   return (
//     <div className="visitor-page">
//       <h1>Visitor Check-In</h1>

//       {message && (
//         <p className={`message ${message.startsWith("✅") || message.startsWith("⏱️") ? "success" : "error"}`}>
//           {message}
//         </p>
//       )}

//       {guestMode && (
//         <div className="visitor-form">
//           <label>Full Name</label>
//           <input type="text" value={visitorName} onChange={(e) => setVisitorName(e.target.value)} placeholder="Full Name" />

//           <label>Gmail</label>
//           <input type="email" value={visitorGmail} onChange={(e) => setVisitorGmail(e.target.value)} placeholder="example@gmail.com" />

//           <label>Resident PIN</label>
//           <input type="text" value={reasonOrPin} onChange={(e) => setReasonOrPin(e.target.value)} placeholder="Enter resident PIN" />

//           <button onClick={handleGuestSubmit} disabled={loading} className="submit">
//             {loading ? "Processing..." : "Submit Check-In"}
//           </button>

//           <button onClick={handleCheckStatus} disabled={loading} className="check">
//             {loading ? "Checking..." : "Check Status"}
//           </button>
//         </div>
//       )}

// {statusList.length > 0 && (
//   <div className="visitor-status">
//     {statusList.map((v) => (
//       <div key={v.id} className="visitor-card">
//         <p>Name: {v.name}</p>
//         <p>📧 Gmail: {v.gmail}</p>
//         <p>🕒 Time In: {formatTime(v.time_in)}</p>
//         <p>🕓 Time Out: {formatTime(v.time_out)}</p>

//         {!v.time_out ? (
//           <button
//             className={`time-btn ${!v.time_in ? "time-in" : "time-out"}`}
//             onClick={() => handleTimeButton(v)}
//           >
//             {!v.time_in ? "⏱️ Time In" : "⏱️ Time Out"}
//           </button>
//         ) : (
//           <button className="time-btn done" disabled>
//             ✅ Done
//           </button>
//         )}

//         <p className={`status ${v.status}`}>Status: {v.status.toUpperCase()}</p>
//       </div>
//     ))}
//   </div>
// )}
//     </div>
//   );
// };

// export default VisitorPage;
