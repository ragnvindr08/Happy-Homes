import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./visitors.css";

// ----- Visitor Form Component -----
const VisitorForm = ({ onConfirm }: { onConfirm: (visitorData: any) => void }) => {
  const [visitorName, setVisitorName] = useState("");
  const [pinDigits, setPinDigits] = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const firstPinRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (firstPinRef.current) {
      firstPinRef.current.focus();
    }
  }, []);

  const handlePinChange = (value: string, idx: number) => {
    if (/^\d?$/.test(value)) {
      const newPin = [...pinDigits];
      newPin[idx] = value;
      setPinDigits(newPin);

      if (value && idx < 5) {
        const nextInput = document.getElementById(`pin-${idx + 1}`);
        if (nextInput) (nextInput as HTMLInputElement).focus();
      } else if (!value && idx > 0) {
        const prevInput = document.getElementById(`pin-${idx - 1}`);
        if (prevInput) (prevInput as HTMLInputElement).focus();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pin = pinDigits.join("");

    if (pinDigits.some((digit) => digit === "")) {
      alert("Please enter complete 6-digit PIN");
      return;
    }

    setLoading(true);

    try {
      // Simulate delay (API call)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Dummy credentials
      const validName = "Test Visitor";
      const validPin = "123456";

      if (visitorName.trim() === validName && pin === validPin) {
        const dummyData = {
          visitorName,
          pin,
          verificationCode: "123456",
          homeownerInfo: { name: "John Doe", address: "123 Main St" },
        };
        onConfirm(dummyData);
      } else {
        alert("Invalid visitor name or PIN");
      }
    } catch (error) {
      alert("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="visitor-form" onSubmit={handleSubmit}>
      <img src="/logo.png" alt="Logo" className="logo" />

      <input
        className="visitor-input"
        value={visitorName}
        onChange={(e) => setVisitorName(e.target.value)}
        placeholder="Visitor Name"
        required
        disabled={loading}
      />

      <label htmlFor="pin-0" className="pin-label">
        PIN given by homeowner
      </label>

      <div className="pin-inputs">
        {pinDigits.map((digit, idx) => (
          <input
            key={idx}
            id={`pin-${idx}`}
            className="pin-input"
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handlePinChange(e.target.value, idx)}
            required
            autoComplete="off"
            disabled={loading}
            ref={idx === 0 ? firstPinRef : null}
          />
        ))}
      </div>

      <button className="visitor-button" type="submit" disabled={loading}>
        {loading ? "Verifying..." : "Send Confirmation"}
      </button>
    </form>
  );
};

// ----- Main Visitors Page -----
const VisitorsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="visitors-page">
      <VisitorForm
        onConfirm={(data) => {
          // Navigate to /verified and pass homeownerInfo
          navigate("/verified", { state: { homeownerInfo: data.homeownerInfo } });
        }}
      />
    </div>
  );
};

export default VisitorsPage;
