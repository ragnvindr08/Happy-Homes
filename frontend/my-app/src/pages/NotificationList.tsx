// src/components/NotificationList.tsx
import React, { useEffect, useState } from "react";
import { useNotifications } from "../pages/NotificationContext";

interface NotificationItem {
  id: number;
  message: string;
}

const NotificationList: React.FC = () => {
  const { notifications } = useNotifications();
  const [items, setItems] = useState<NotificationItem[]>([]);

  // Track notifications with IDs for animation & auto-remove
  useEffect(() => {
    if (notifications.length === 0) return;

    const newNotification: NotificationItem = {
      id: Date.now(),
      message: notifications[0] ?? "",
    };
    setItems((prev) => [newNotification, ...prev]);

    // Auto-remove after 4 seconds
    const timer = setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== newNotification.id));
    }, 4000);

    return () => clearTimeout(timer);
  }, [notifications]);

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {items.map((item) => (
        <div
          key={item.id}
          style={{
            background: "#2e6F40",
            color: "white",
            padding: "10px 15px",
            borderRadius: "6px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            animation: "fadein 0.3s, fadeout 0.5s 3.5s",
          }}
        >
          {item.message}
        </div>
      ))}
      <style>
        {`
          @keyframes fadein { from { opacity: 0; } to { opacity: 1; } }
          @keyframes fadeout { from { opacity: 1; } to { opacity: 0; } }
        `}
      </style>
    </div>
  );
};

export default NotificationList;
