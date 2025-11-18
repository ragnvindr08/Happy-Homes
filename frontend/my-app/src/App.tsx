// src/App.tsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import MapPage from './pages/Map';
import UserMapPage from './pages/UserMapPage';
import NewsAlerts from './pages/NewsAlerts';
import Contact from './pages/Contact';
import Information from './pages/Information';
import FunctionHall from './pages/FunctionHall';
import AdminDashboard from './pages/AdminDashboard';
import { NotificationProvider } from './pages/NotificationContext';
import 'react-toastify/dist/ReactToastify.css';
import ProfilePage from './pages/ProfilePage';
import AdminUsersPage from './pages/AdminUsersPage';
import TrackingPage from './pages/tracking';
import AdminBookingPage from './pages/AdminBookingPage';
// import VisitorsPage from './pages/widget/visitors';
import Loading from "./pages/loading"; 
import CalendarPage from './pages/CalendarPage';
import Verified from './pages/widget/verifieds';
import VisitorsTracking from './pages/visitorsTracking';
import ResetPassword from './pages/ResetPassword';
import ActivityLog from './pages/ActivityLogs';
import AdminVerificationPage from './pages/AdminVerificationPage';
import Resident from './pages/Residents';
import VisitorPage from './pages/Visitors';
import ResidentsApproval from './pages/ResidentsApproval';
import ResidentDashboard from './pages/ResidentDashboard';
import VisitorDashboard from './pages/VisitorDashboard';
import VisitorStatus from './pages/VisitorStatus';
import BookingReports from './pages/BookingReports';
import HouseSalePage from './pages/HouseSalePage';
import AdminSalePage from './pages/AdminSalePage';
import AdminBillsPage from './pages/AdminBillsPage';

function AppContent() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [location]);

  if (loading) {
    return <Loading />;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/map" element={<UserMapPage />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/admin-dashboard/map" element={<MapPage isAdmin={true} />} />
      <Route path="/admin-dashboard/users" element={<AdminUsersPage />} />
      <Route path="/activity-log" element={<ActivityLog />} />
      <Route path="/information" element={<Information />} />
      <Route path="/news" element={<NewsAlerts />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/amenities/function-hall" element={<FunctionHall />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/tracking" element={<TrackingPage />} />
      {/* <Route path="/visitordummy" element={<VisitorsPage />} /> */}
      <Route path="/verified" element={<Verified />} />
      <Route path="/admin-booking" element={<AdminBookingPage />} />
      <Route path="/visitors-tracking" element={<VisitorsTracking />} />
      <Route path="/booking-reports" element={<BookingReports />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/admin-verification" element={<AdminVerificationPage  />} />
      <Route path="/residents" element={<Resident />} />  {/* Residents page */}
      <Route path="/visitors" element={<VisitorPage />} />   {/* Visitors page */}
      <Route path="/residents-approval" element={<ResidentsApproval />} />   {/* Residents Approval page */}
      <Route path="/resident-dashboard" element={<ResidentDashboard />} />   {/* Resident Dashboard page */}
      <Route path="/visitor-dashboard" element={<VisitorDashboard />} />   {/* Visitor Dashboard page */}
      <Route path="/visitor-status" element={<VisitorStatus />} />   {/* Visitor Status page */}
      <Route path="/house-sales" element={<HouseSalePage />} />   {/* House Sale page */}
      <Route path="/admin-sales" element={<AdminSalePage />} />   {/* Admin Sale page */}
      <Route path="/admin-bills" element={<AdminBillsPage/>} />   {/* Admin Bills page */}
      {/* Redirect unknown routes */}
      <Route path="*" element={<LoginPage />} />
    </Routes>
  );
}

function App() {
  return (
    <NotificationProvider>
      <Router>
        <AppContent />
      </Router>
    </NotificationProvider>
  );
}

export default App;
