import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import NavBar from "./NavBar";
import "./Calendar.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const localizer = momentLocalizer(moment);

interface Facility {
  id: number;
  name: string;
}

interface Booking {
  id: number;
  facility_id: number;
  facility_name: string;
  date: string;
  start_time: string;
  end_time: string;
  status: "pending" | "approved" | "rejected";
}

interface AvailableSlot {
  id?: number;
  facility_id: number;
  date: string;
  start_time: string;
  end_time: string;
}

const CalendarPage: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<number | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [date, setDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [showSlotManager, setShowSlotManager] = useState(false);
  const [slotDate, setSlotDate] = useState<Date>(new Date());
  const [slotStartTime, setSlotStartTime] = useState("09:00");
  const [slotEndTime, setSlotEndTime] = useState("17:00");

  // Get token from localStorage and check admin status
  useEffect(() => {
    const savedToken = localStorage.getItem("access");
    if (savedToken) {
      setToken(savedToken);
      // Check if user is admin
      axios.get("http://127.0.0.1:8000/api/profile/", {
        headers: { Authorization: `Bearer ${savedToken}` }
      })
      .then(res => setIsAdmin(res.data.is_staff || false))
      .catch(() => setIsAdmin(false));
    }
  }, []);

  // Axios instance
  const axiosInstance = useMemo(() => {
    return axios.create({
      baseURL: "http://127.0.0.1:8000/api/",
      timeout: 10000,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }, [token]);

  // Fetch facilities
  const fetchFacilities = useCallback(async () => {
    try {
      const res = await axiosInstance.get("facilities/");
      setFacilities(res.data);
    } catch (err) {
      console.error("Fetch facilities error:", err);
      toast.error("Error fetching facilities");
    }
  }, [axiosInstance]);

  // Fetch bookings
  const fetchBookings = useCallback(
    async (facilityId: number) => {
      if (!token) return;
      try {
        const res = await axiosInstance.get(`bookings/?facility_id=${facilityId}`);
        setBookings(res.data);
      } catch (err) {
        console.error("Fetch bookings error:", err);
        toast.error("Error fetching bookings");
      }
    },
    [axiosInstance, token]
  );

  // Fetch available slots (all users can view, but only admin can manage)
  const fetchAvailableSlots = useCallback(
    async (facilityId: number) => {
      if (!token) return;
      try {
        const res = await axiosInstance.get(`available-slots/?facility_id=${facilityId}`);
        setAvailableSlots(res.data || []);
      } catch (err) {
        // If endpoint doesn't exist, just set empty array
        setAvailableSlots([]);
      }
    },
    [axiosInstance, token]
  );

  useEffect(() => {
    if (token) fetchFacilities();
  }, [token, fetchFacilities]);

  useEffect(() => {
    if (selectedFacility) {
      fetchBookings(selectedFacility);
      fetchAvailableSlots(selectedFacility); // All users can view available slots
    }
  }, [selectedFacility, fetchBookings, fetchAvailableSlots]);

  // Add available slot (admin only)
  const handleAddSlot = async () => {
    if (!token || !isAdmin || !selectedFacility) return;
    
    const slotDateStr = `${slotDate.getFullYear()}-${(slotDate.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${slotDate.getDate().toString().padStart(2, "0")}`;

    try {
      await axiosInstance.post("available-slots/", {
        facility_id: selectedFacility,
        date: slotDateStr,
        start_time: slotStartTime,
        end_time: slotEndTime,
      });
      toast.success("Available time slot added!");
      fetchAvailableSlots(selectedFacility);
      setShowSlotManager(false);
    } catch (err: any) {
      toast.error(`Failed to add slot: ${err.response?.data?.detail || err.message}`);
    }
  };

  // Delete available slot (admin only)
  const handleDeleteSlot = async (slotId: number) => {
    if (!token || !isAdmin) return;
    if (!window.confirm("Are you sure you want to delete this available slot?")) return;
    
    try {
      await axiosInstance.delete(`available-slots/${slotId}/`);
      toast.success("Available slot deleted!");
      if (selectedFacility) fetchAvailableSlots(selectedFacility);
    } catch (err) {
      toast.error("Failed to delete slot.");
    }
  };

  // Convert 24-hour time to AM/PM
  const formatAMPM = (time?: string) => {
    if (!time) return "";
    const [hourStr, minuteStr] = time.split(":");
    let hour = Number(hourStr ?? 0);
    const minute = Number(minuteStr ?? 0);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${minute.toString().padStart(2, "0")} ${ampm}`;
  };

  // Check if time slot is within available slots
  const isTimeSlotAvailable = () => {
    // If no slots are set by admin, DO NOT allow bookings (strict mode)
    if (availableSlots.length === 0) return false;
    
    // Format date as YYYY-MM-DD to match slot dates
    const bookingDate = `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
    
    // Convert times to minutes for accurate comparison
    const bookingStartMin = timeToMinutes(startTime);
    const bookingEndMin = timeToMinutes(endTime);
    
    // Check if the booking time falls within any available slot
    const isAvailable = availableSlots.some((slot) => {
      if (slot.date !== bookingDate) return false;
      
      const slotStartMin = timeToMinutes(slot.start_time);
      const slotEndMin = timeToMinutes(slot.end_time);
      
      // Check if booking time is completely within the slot
      // Booking must start at or after slot start, and end at or before slot end
      return slotStartMin <= bookingStartMin && slotEndMin >= bookingEndMin;
    });
    
    return isAvailable;
  };

  // Check for duplicate booking
  const isDuplicateBooking = () =>
    bookings.some(
      (b) =>
        b.date === date.toISOString().split("T")[0] &&
        ((b.start_time <= startTime && startTime < b.end_time) ||
          (b.start_time < endTime && endTime <= b.end_time) ||
          (startTime <= b.start_time && b.end_time <= endTime))
    );

  // Book a facility
  const handleBook = async () => {
    if (!token) return toast.error("You are not logged in!");
    if (!selectedFacility) return toast.error("Select a facility first!");

    const today = new Date();
    const selectedDate = new Date(date);
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) return toast.error("You cannot book a past date!");
    if (isDuplicateBooking()) return toast.error("This time slot is already booked!");
    
    // Format date as YYYY-MM-DD to match slot dates (avoid timezone issues)
    const bookingDate = `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
    
    // Check if admin has set available slots - if yes, enforce them strictly
    if (availableSlots.length > 0) {
      if (!isTimeSlotAvailable()) {
        const availableForDate = availableSlots.filter(s => s.date === bookingDate);
        
        if (availableForDate.length === 0) {
          const dateStr = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          return toast.error(`No available slots set for ${dateStr}. Please contact admin to set available time slots.`);
        } else {
          const timeRanges = availableForDate.map(s => 
            `${formatAMPM(s.start_time)} - ${formatAMPM(s.end_time)}`
          ).join(', ');
          return toast.error(`Selected time is not within available slots. Available times: ${timeRanges}`);
        }
      }
    } else {
      // No slots set by admin - don't allow booking
      return toast.error("No available time slots have been set by admin. Please contact admin to set available time slots before booking.");
    }

    // Format date as YYYY-MM-DD (avoid timezone issues)
    const bookingDateStr = `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;

    try {
      await axiosInstance.post("bookings/", {
        facility_id: selectedFacility,
        date: bookingDateStr,
        start_time: startTime,
        end_time: endTime,
      });
      toast.success("Booking successful!");
      // Refresh both bookings and available slots to update the display
      await fetchBookings(selectedFacility);
      await fetchAvailableSlots(selectedFacility);
    } catch (err: any) {
      toast.error(`Booking failed: ${JSON.stringify(err.response?.data || err)}`);
    }
  };

  // Delete booking
  const handleDelete = async (id: number) => {
    if (!token) return;
    if (!window.confirm("Are you sure you want to delete this booking?")) return;
    try {
      await axiosInstance.delete(`bookings/${id}/`);
      setBookings((prev) => prev.filter((b) => b.id !== id));
      toast.info("Booking deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete booking.");
    }
  };

  // Map bookings to calendar events
  const bookingEvents = bookings.map((b) => {
    const [yearStr, monthStr, dayStr] = b.date.split("-");
    const year = Number(yearStr ?? new Date().getFullYear());
    const month = Number(monthStr ?? 1);
    const day = Number(dayStr ?? 1);

    const [startHourStr, startMinStr] = b.start_time.split(":");
    const [endHourStr, endMinStr] = b.end_time.split(":");

    const startHour = Number(startHourStr ?? 0);
    const startMin = Number(startMinStr ?? 0);
    const endHour = Number(endHourStr ?? 0);
    const endMin = Number(endMinStr ?? 0);

    let bgColor = "#f0ad4e"; // pending
    if (b.status === "approved") bgColor = "#2e6F40";
    else if (b.status === "rejected") bgColor = "#d9534f";

    return {
      title: `${b.facility_name} (${formatAMPM(b.start_time)} - ${formatAMPM(b.end_time)}) [${b.status.toUpperCase()}]`,
      start: new Date(year, month - 1, day, startHour, startMin),
      end: new Date(year, month - 1, day, endHour, endMin),
      bookingId: b.id,
      bgColor,
      isBooking: true,
    };
  });

  // Helper function to convert time string to minutes for accurate comparison
  const timeToMinutes = (timeStr: string): number => {
    const normalized = timeStr.split(':').slice(0, 2).join(':');
    const [hours, minutes] = normalized.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  };

  // Check if two time ranges overlap (exclusive of exact boundaries)
  const hasTimeOverlap = (start1: number, end1: number, start2: number, end2: number): boolean => {
    // Two ranges overlap if they share any common time
    // Range 1: [start1, end1), Range 2: [start2, end2)
    // They overlap if: start1 < end2 AND start2 < end1
    // This correctly excludes adjacent slots (e.g., 1:00-2:00 and 2:00-3:00 don't overlap)
    // Example: Slot 1 (60-120) and Slot 2 (120-180)
    //   hasTimeOverlap(60, 120, 120, 180) = (60 < 180) && (120 < 120) = true && false = false ✓
    // Example: Slot 1 (60-120) and Booking (60-120) - same time
    //   hasTimeOverlap(60, 120, 60, 120) = (60 < 120) && (60 < 120) = true && true = true ✓
    const overlaps = start1 < end2 && start2 < end1;
    return overlaps;
  };

  // Map available slots to calendar events (green palette)
  // Filter out slots that are already booked
  const slotEvents = availableSlots
    .filter((slot) => {
      // Check if this slot overlaps with any approved or pending booking
      const slotDate = slot.date;
      const hasConflict = bookings.some((booking) => {
        if (booking.date !== slotDate) return false;
        if (booking.status === "rejected") return false; // Ignore rejected bookings
        
        // Convert times to minutes for accurate comparison
        const slotStartMin = timeToMinutes(slot.start_time);
        const slotEndMin = timeToMinutes(slot.end_time);
        const bookingStartMin = timeToMinutes(booking.start_time);
        const bookingEndMin = timeToMinutes(booking.end_time);
        
        // Check for actual time overlap (excludes adjacent slots)
        return hasTimeOverlap(slotStartMin, slotEndMin, bookingStartMin, bookingEndMin);
      });
      return !hasConflict;
    })
    .map((slot) => {
      const [yearStr, monthStr, dayStr] = slot.date.split("-");
      const year = Number(yearStr ?? new Date().getFullYear());
      const month = Number(monthStr ?? 1);
      const day = Number(dayStr ?? 1);

      const [startHourStr, startMinStr] = slot.start_time.split(":");
      const [endHourStr, endMinStr] = slot.end_time.split(":");

      const startHour = Number(startHourStr ?? 0);
      const startMin = Number(startMinStr ?? 0);
      const endHour = Number(endHourStr ?? 0);
      const endMin = Number(endMinStr ?? 0);

      return {
        title: `Available: ${formatAMPM(slot.start_time)} - ${formatAMPM(slot.end_time)}`,
        start: new Date(year, month - 1, day, startHour, startMin),
        end: new Date(year, month - 1, day, endHour, endMin),
        slotId: slot.id,
        slotDate: slot.date,
        slotStartTime: slot.start_time,
        slotEndTime: slot.end_time,
        bgColor: "#90EE90", // Light green
        borderColor: "#2e6F40", // Dark green border
        isSlot: true,
      };
    });

  // Combine all events
  const events = [...bookingEvents, ...slotEvents];

  // Scrollable date row
  const DateRow: React.FC<{ currentDate: Date; onSelectDate: (d: Date) => void }> = ({
    currentDate,
    onSelectDate,
  }) => {
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
      <div
        style={{
          display: "flex",
          gap: "6px",
          overflowX: "auto",
          padding: "6px 0",
          marginBottom: "10px",
        }}
      >
        {dates.map((day) => {
          const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
          const isPast = dateObj < today;

          return (
            <button
              key={day}
              disabled={isPast}
              onClick={() => onSelectDate(dateObj)}
              style={{
                padding: "6px 10px",
                borderRadius: "4px",
                border:
                  dateObj.toDateString() === date.toDateString() ? "2px solid #2e6f40" : "1px solid #ccc",
                backgroundColor: isPast
                  ? "#ddd"
                  : dateObj.toDateString() === date.toDateString()
                  ? "#2e6f40"
                  : "#fff",
                color: isPast ? "#888" : dateObj.toDateString() === date.toDateString() ? "#fff" : "#000",
                cursor: isPast ? "not-allowed" : "pointer",
                minWidth: "36px",
                textAlign: "center",
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <NavBar />

      <div className="calendar-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Facility Booking</h2>
          {isAdmin && (
            <div>
              <button 
                onClick={() => setShowSlotManager(!showSlotManager)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#2e6F40',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                {showSlotManager ? 'Hide' : 'Manage'} Available Time Slots
              </button>
            </div>
          )}
        </div>

        {isAdmin && showSlotManager && (
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '2px solid #2e6F40'
          }}>
            <h3 style={{ marginTop: 0, color: '#2e6F40' }}>
              Set Available Time Slots {selectedFacility && facilities.find(f => f.id === selectedFacility) && `for ${facilities.find(f => f.id === selectedFacility)?.name}`}
            </h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Date:</label>
                <input
                  type="date"
                  value={`${slotDate.getFullYear()}-${(slotDate.getMonth() + 1)
                    .toString()
                    .padStart(2, "0")}-${slotDate.getDate().toString().padStart(2, "0")}`}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => {
                    const [yearStr, monthStr, dayStr] = e.target.value.split("-");
                    const year = Number(yearStr ?? new Date().getFullYear());
                    const month = Number(monthStr ?? 1);
                    const day = Number(dayStr ?? 1);
                    setSlotDate(new Date(year, month - 1, day));
                  }}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Start Time:</label>
                <input
                  type="time"
                  value={slotStartTime}
                  onChange={(e) => setSlotStartTime(e.target.value)}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>End Time:</label>
                <input
                  type="time"
                  value={slotEndTime}
                  onChange={(e) => setSlotEndTime(e.target.value)}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>
              <button
                onClick={handleAddSlot}
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#2e6F40',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  height: 'fit-content'
                }}
              >
                Add Slot
              </button>
            </div>
            
            {availableSlots.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <h4>Current Available Slots:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {availableSlots.map((slot, idx) => (
                    <div
                      key={slot.id || idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px',
                        backgroundColor: 'white',
                        borderRadius: '4px',
                        border: '1px solid #ddd'
                      }}
                    >
                      <span>
                        <strong>{slot.date}</strong> - {formatAMPM(slot.start_time)} to {formatAMPM(slot.end_time)}
                      </span>
                      {slot.id && (
                        <button
                          onClick={() => handleDeleteSlot(slot.id!)}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#d9534f',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="booking-form">
          <select
            value={selectedFacility || ""}
            onChange={(e) => setSelectedFacility(Number(e.target.value))}
          >
            <option value="">Select Facility</option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={`${date.getFullYear()}-${(date.getMonth() + 1)
              .toString()
              .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => {
              const [yearStr, monthStr, dayStr] = e.target.value.split("-");
              const year = Number(yearStr ?? new Date().getFullYear());
              const month = Number(monthStr ?? 1);
              const day = Number(dayStr ?? 1);
              // Create date in local timezone to avoid date shifting
              const newDate = new Date(year, month - 1, day);
              newDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
              setDate(newDate);
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '12px', color: '#666' }}>
              Or click an <span style={{ color: '#2e6F40', fontWeight: 'bold' }}>Available</span> time slot in the calendar
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="time" 
                value={startTime} 
                onChange={(e) => setStartTime(e.target.value)}
                style={{ flex: 1 }}
              />
              <input 
                type="time" 
                value={endTime} 
                onChange={(e) => setEndTime(e.target.value)}
                style={{ flex: 1 }}
              />
            </div>
          </div>

          <button onClick={handleBook}>Book</button>
        </div>

        <div className="calendar-flex">
          <div className="appointments-list">
            <h3>Scheduled Appointments</h3>
            {bookings.length === 0 ? (
              <p>No bookings yet for this facility.</p>
            ) : (
              <ul>
                {bookings
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map((b) => (
                    <li key={b.id} className="appointment-item">
                      <strong>{b.facility_name}</strong> — {b.date} (
                      {formatAMPM(b.start_time)} - {formatAMPM(b.end_time)})
                      <span
                        style={{
                          marginLeft: "10px",
                          fontWeight: "bold",
                          color:
                            b.status === "approved"
                              ? "#2e6F40"
                              : b.status === "rejected"
                              ? "#d9534f"
                              : "#f0ad4e",
                        }}
                      >
                        {b.status.toUpperCase()}
                      </span>
                      <button className="delete-btn" onClick={() => handleDelete(b.id)}>
                        Delete
                      </button>
                    </li>
                  ))}
              </ul>
            )}

            {/* Available Slots Display */}
            {availableSlots.length > 0 && (
              <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '8px', border: '2px solid #2e6F40' }}>
                <h3 style={{ marginTop: 0, color: '#2e6F40', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}></span>
                  Available Time Slots {selectedFacility && facilities.find(f => f.id === selectedFacility) && `- ${facilities.find(f => f.id === selectedFacility)?.name}`}
                </h3>
                <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px', fontStyle: 'italic' }}>
                  Click on any available slot in the calendar to auto-fill the booking form
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                  {availableSlots
                    .filter((slot) => {
                      // Filter out slots that are already booked
                      const slotDate = slot.date;
                      const hasConflict = bookings.some((booking) => {
                        if (booking.date !== slotDate) return false;
                        if (booking.status === "rejected") return false;
                        
                        // Convert times to minutes for accurate comparison
                        const slotStartMin = timeToMinutes(slot.start_time);
                        const slotEndMin = timeToMinutes(slot.end_time);
                        const bookingStartMin = timeToMinutes(booking.start_time);
                        const bookingEndMin = timeToMinutes(booking.end_time);
                        
                        // Check for actual time overlap (excludes adjacent slots)
                        return hasTimeOverlap(slotStartMin, slotEndMin, bookingStartMin, bookingEndMin);
                      });
                      return !hasConflict;
                    })
                    .sort((a, b) => {
                      // Sort by date first, then by start time
                      if (a.date !== b.date) return a.date.localeCompare(b.date);
                      return a.start_time.localeCompare(b.start_time);
                    })
                    .map((slot, idx) => (
                      <div
                        key={slot.id || idx}
                        style={{
                          padding: '12px',
                          backgroundColor: 'white',
                          borderRadius: '6px',
                          border: '2px dashed #2e6F40',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#90EE90';
                          e.currentTarget.style.transform = 'scale(1.02)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'white';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                        onClick={() => {
                          // Auto-fill form when clicking available slot
                          const [yearStr, monthStr, dayStr] = slot.date.split("-");
                          const year = Number(yearStr);
                          const month = Number(monthStr);
                          const day = Number(dayStr);
                          // Create date in local timezone to avoid date shifting
                          const slotDate = new Date(year, month - 1, day);
                          slotDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
                          setDate(slotDate);
                          setStartTime(slot.start_time);
                          setEndTime(slot.end_time);
                          toast.success(`Selected: ${formatAMPM(slot.start_time)} - ${formatAMPM(slot.end_time)}`);
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong style={{ color: '#2e6F40', fontSize: '14px' }}>
                               {new Date(slot.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </strong>
                            <div style={{ marginTop: '4px', fontSize: '13px', color: '#333' }}>
                               {formatAMPM(slot.start_time)} - {formatAMPM(slot.end_time)}
                            </div>
                          </div>
                          <span style={{ 
                            fontSize: '11px', 
                            color: '#2e6F40', 
                            fontWeight: 'bold',
                            padding: '4px 8px',
                            backgroundColor: '#e8f5e8',
                            borderRadius: '4px'
                          }}>
                            CLICK TO BOOK
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
                {availableSlots.filter((slot) => {
                  const slotDate = slot.date;
                  const hasConflict = bookings.some((booking) => {
                    if (booking.date !== slotDate) return false;
                    if (booking.status === "rejected") return false;
                    
                    // Convert times to minutes for accurate comparison
                    const slotStartMin = timeToMinutes(slot.start_time);
                    const slotEndMin = timeToMinutes(slot.end_time);
                    const bookingStartMin = timeToMinutes(booking.start_time);
                    const bookingEndMin = timeToMinutes(booking.end_time);
                    
                    // Check for actual time overlap (excludes adjacent slots)
                    return hasTimeOverlap(slotStartMin, slotEndMin, bookingStartMin, bookingEndMin);
                  });
                  return !hasConflict;
                }).length === 0 && (
                  <p style={{ textAlign: 'center', color: '#666', fontStyle: 'italic', marginTop: '10px' }}>
                    No available slots at the moment
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="calendar-wrapper">
            {/* Scrollable Date Row */}
            <DateRow currentDate={date} onSelectDate={(d) => setDate(d)} />

            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              defaultView="month"
              views={["month", "week", "day", "agenda"]}
              style={{ height: "600px" }}
              date={date}
              onNavigate={(newDate) => {
                const today = new Date();
                const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

                if (newDate < startOfToday) {
                  toast.warn("You cannot view past dates.");
                  setDate(startOfToday);
                } else {
                  setDate(newDate);
                }
              }}
              eventPropGetter={(event: any) => ({
                style: {
                  backgroundColor: event.bgColor || "#2e6F40",
                  color: event.isSlot ? "#2e6F40" : "white", // Dark green text for slots, white for bookings
                  borderRadius: "6px",
                  padding: "2px 4px",
                  border: event.isSlot ? `2px solid ${event.borderColor || "#2e6F40"}` : "none",
                  borderStyle: event.isSlot ? "dashed" : "solid",
                  fontWeight: event.isSlot ? "bold" : "normal",
                  opacity: event.isSlot ? 0.7 : 1,
                  cursor: event.isSlot ? "pointer" : "default",
                },
              })}
              onSelectEvent={(event: any) => {
                if (event.isSlot) {
                  // If clicking an available slot, auto-fill the booking form
                  // Use the slot date directly to avoid timezone issues
                  if (event.slotDate) {
                    const [yearStr, monthStr, dayStr] = event.slotDate.split("-");
                    const year = Number(yearStr);
                    const month = Number(monthStr) - 1; // JavaScript months are 0-indexed
                    const day = Number(dayStr);
                    const slotDate = new Date(year, month, day);
                    setDate(slotDate);
                  } else {
                    // Fallback: Use event.start but adjust for timezone
                    const slotDate = new Date(event.start);
                    slotDate.setHours(0, 0, 0, 0); // Reset time to avoid timezone issues
                    setDate(slotDate);
                  }
                  
                  // Use the exact times from the slot (more reliable than extracting from Date)
                  if (event.slotStartTime && event.slotEndTime) {
                    setStartTime(event.slotStartTime);
                    setEndTime(event.slotEndTime);
                  } else {
                    // Fallback: Extract time from the slot
                    const startHours = event.start.getHours().toString().padStart(2, "0");
                    const startMinutes = event.start.getMinutes().toString().padStart(2, "0");
                    const endHours = event.end.getHours().toString().padStart(2, "0");
                    const endMinutes = event.end.getMinutes().toString().padStart(2, "0");
                    
                    setStartTime(`${startHours}:${startMinutes}`);
                    setEndTime(`${endHours}:${endMinutes}`);
                  }
                  
                  toast.success(`Available slot selected! Time: ${formatAMPM(event.slotStartTime || event.start)} - ${formatAMPM(event.slotEndTime || event.end)}`);
                } else {
                  // Show booking info for existing bookings
                  toast.info(`Booking info:\n${event.title}`);
                }
              }}
            />
          </div>
        </div>
      </div>

      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </>
  );
};

export default CalendarPage;
