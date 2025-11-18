import React, { createContext, useContext, useState, ReactNode } from 'react';

interface NotificationContextType {
  notifications: string[];
  addNotification: (msg: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<string[]>([]);

  const addNotification = (msg: string) => {
    setNotifications(prev => [msg, ...prev]);
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};
