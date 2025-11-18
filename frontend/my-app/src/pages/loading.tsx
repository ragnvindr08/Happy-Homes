import React, { useEffect, useState } from "react";
import "./loading.css";

const Loading: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="loading-overlay">
      <div className="loading-box">
        {isOnline ? (
          <span className="loader"></span>
        ) : (
          <>
            <div className="no-signal-icon">📡</div>
            <p className="no-signal-text">No Internet Connection</p>
            <small className="retry-text">Please check your network</small>
          </>
        )}
      </div>
    </div>
  );
};

export default Loading;
