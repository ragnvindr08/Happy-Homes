import React from "react";
import { useLocation, Navigate } from "react-router-dom";
import './verified.css';

const VerifiedPage = ({
  homeownerInfo,
}: {
  homeownerInfo: { name: string; address: string };
}) => (
  <div className="verified-container">
    <div className="verified-info">
      <h1 className="verified-title">Visitor Verified!</h1>
      <p>Welcome to the subdivision.</p>
    </div>
    <div className="homeowner-info">
      <h2 className="homeowner-title">Homeowner Information</h2>
      <p>
        <strong>Name:</strong> {homeownerInfo.name}
      </p>
      <p>
        <strong>Address:</strong> {homeownerInfo.address}
      </p>
    </div>
  </div>
);

const Verified = () => {
  const location = useLocation();
  const homeownerInfo = location.state?.homeownerInfo;

  if (!homeownerInfo) {
    return <Navigate to="/" replace />;
  }

  return <VerifiedPage homeownerInfo={homeownerInfo} />;
};

export default Verified;
