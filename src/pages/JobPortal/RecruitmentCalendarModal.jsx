import { useEffect, useState } from "react";
import "../../css/RecruitmentCalendarModal.css";
import EventEditorModal from "./EventEditorModal";
import Calender1 from "../../images/Calender1.svg";
import EditCalenderIcon from "../../images/EditCalenderIcon.svg";
import MeetingGroupIcon from "../../images/MeetingGroupIcon.svg";
import AddNewEventModal from "./AddNewEventModal";
import { FaPlus } from "react-icons/fa";
import { useSelector } from "react-redux";
import { BiSolidUserDetail } from "react-icons/bi";
import { HiOutlineExternalLink, HiOutlineX } from "react-icons/hi";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase"; // adjust path if different
import { Notification, toaster } from "rsuite";
import { 
  Calendar,
} from 'lucide-react';
import { MdEventRepeat } from "react-icons/md";
import ScheduleMeetingModal from "./ScheduleMeetingModal";
import { use } from "react";
import { showToast } from "../../components/ToastProvider";
import MeetingEditorModal from "./MeetingEditorModal";



const RecruitmentCalendarModal = ({ open, onClose, setTriggerFetchInterviews, setTriggerFetchResumes, companyId }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date()); // current real month
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Event editor states (kept but currently not updating real data)
  const [editorOpen, setEditorOpen] = useState(false);
  const [activeEvent, setActiveEvent] = useState(null);
  const [editorOpen1, setEditorOpen1] = useState(false);
  const [activeEvent1, setActiveEvent1] = useState(null);
  const [showFullMessage, setShowFullMessage] = useState(false);
  const [showResumePreview, setShowResumePreview] = useState(false);

  const [editorMeetingOpen, setEditorMeetingOpen] = useState(false);
  const [activeMeeting, setActiveMeeting] = useState(null);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Real data from Redux
  const { upcomingInterviews, loading } = useSelector(
    (state) => state.interviewMaster
  );

  const meetings = useSelector((state) => state.interviewMaster.meetings || []);


  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewEvent, setPreviewEvent] = useState(null);

  const handlePreviewClick = (event) => {
    setPreviewEvent(event);
    setPreviewOpen(true);
  };

  // useEffect(() => {
  //   console.log("mnbvc ▶ RecruitmentCalendarModal mounted with companyId:", companyId);
  // }, [companyId]);


const handleUpdateCandidateStatus = async (candidateId, newStatus) => {
  try {
    // console.log("mnbvc ▶ Updating status:", candidateId, newStatus);

    const resumeRef = doc(db, "resumeMaster", candidateId);

    await updateDoc(resumeRef, {
      status: newStatus,
      updatedAt: serverTimestamp(),
    });

    // console.log("mnbvc ▶ Status updated in Firebase");

    // 🔁 Refetch resumes
    setTriggerFetchResumes(prev => prev + 1);

  } catch (err) {
    console.error("mnbvc ▶ Failed to update status:", err);
  }
};


const handleUpdateInterviewStatus = async (interviewId, newStatus) => {
  try {
    // console.log("mnbvc ▶ Updating interview status:", interviewId, newStatus);

    const interviewRef = doc(db, "interviewMaster", interviewId);

    await updateDoc(interviewRef, {
      status: newStatus,
      updatedAt: serverTimestamp(),
    });

    // console.log("mnbvc ▶ Interview status updated in Firebase");

    // 🔁 Refetch interviews
    setTriggerFetchInterviews(prev => prev + 1);

    // ✅ Premium Success Toast
    showToast(
      "success",
      `Interview status changed to "${newStatus}"`,
      "Status Updated"
    );

  } catch (err) {
    console.error("mnbvc ▶ Failed to update interview status:", err);

    // ❌ Premium Error Toast
    showToast(
      "error",
      "Failed to update interview status. Please try again.",
      "Update Failed"
    );
  }
};

  

const handleStatusChange = (interviewId, applicationId, newStatus) => {
  console.log(`Updating interview ${interviewId} to status: ${newStatus}`);

  handleUpdateCandidateStatus(applicationId, newStatus);
  handleUpdateInterviewStatus(interviewId, newStatus);
};

  
  // Map Redux interviews → calendar events format
  const allEvents = upcomingInterviews.map((interview) => {
  const startDate = interview.interviewDate; // already JS Date
  const endDate = new Date(
    startDate.getTime() + (interview.durationMinutes || 45) * 60000 // fallback to 45 if missing
  );

  return {
    // Your original fields (unchanged)
    id: interview.id,
    date: startDate,
    time: startDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    
    timeRange: `${startDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })} - ${endDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`,
    title: `${interview.first_Name} ${interview.lastName} - ${interview.jobTitle}`,
    subtitle: `${interview.jobTitle} Interview`,
    location: "Google Meet",
    type: "interview",
    color: "blue",
    icon: "💻",

    // ← Now includes EVERY field from the interview object
    ...interview,
  };
});

// NEW: Map meetings to same event format for calendar
const meetingEvents = meetings.map((meeting) => {
  const startDate = meeting.date?.toDate?.() || new Date(meeting.date || Date.now());
  const endDate = new Date(startDate.getTime() + (meeting.duration || 30) * 60000);

  return {
    id: meeting.id,
    date: startDate,
    time: startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    period: startDate.getHours() >= 12 ? "PM" : "AM",
    title: meeting.title,
    candidate: meeting.members?.join(", ") || "Multiple participants",
    position: "Meeting",
    status: meeting.status || "scheduled",
    effectiveStatus: meeting.status || "Meeting scheduled",
    durationMinutes: meeting.duration || 30,
    endTime: endDate,
    category: "Meetings", // key for conditional rendering
    ...meeting,
  };
});

// Combine interviews + meetings
const combinedEvents = [...allEvents, ...meetingEvents];

//   console.log("[-----Modal] Raw upcomingInterviews from Redux:", upcomingInterviews);
// console.log("[-----Modal] Mapped allEvents count:", allEvents.length);
// console.log("[-----Modal] First 3 mapped events:", allEvents.slice(0, 3));

  if (!open) return null;

  // ──────────────────────────────────────────────
  // Event handlers (currently commented out functionality)
  // ──────────────────────────────────────────────
  const handleEditClick = (event) => {
    setActiveEvent(event);
    setEditorOpen(true);
    // setAllEvents is commented → no update for now
  };

  const handleEditMeetingClick = (event) => {
    setActiveMeeting(event);
    setEditorMeetingOpen(true);
  };

  const handleNewEventClick = () => {
    setEditorOpen1(true);
    console.log("New Event Clicked");
  };

  const handleSaveEvent = (updatedEvent) => {
    // setAllEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
    setEditorOpen(false);
    setActiveEvent(null);
  };

  const handleSaveEvent1 = (eventData) => {
    // setAllEvents(prev => [...prev, newEvent]);
    setEditorOpen1(false);
    setActiveEvent1(null);
  };

  const handleDeleteEvent = (eventId) => {
    // setAllEvents(prev => prev.filter(e => e.id !== eventId));
    setEditorOpen(false);
    setActiveEvent(null);
  };

  const handleDeleteEvent1 = (eventId) => {
    // setAllEvents(prev => prev.filter(e => e.id !== eventId));
    setEditorOpen1(false);
    setActiveEvent1(null);
  };

  // ──────────────────────────────────────────────
  // Calendar helpers
  // ──────────────────────────────────────────────
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, isCurrentMonth: false });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ day, isCurrentMonth: true });
    }
    return days;
  };

  const calendarDays = generateCalendarDays();
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handleDateClick = (day) => {
    if (day) {
      setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
    }
  };

  // const getEventsForDay = (day) => {
  //   if (!day) return [];
  //   const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
  //   return allEvents.filter(
  //     (event) => event.date.toDateString() === date.toDateString()
  //   );
  // };

  const getEventsForDay = (day) => {
  if (!day) return [];
  const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
  return combinedEvents.filter(
    (event) => event.date.toDateString() === date.toDateString()
  );
};

  const selectedDateEvents = getEventsForDay(selectedDate.getDate());

// Compact format: "9th – 15th Mar 26"
// Compact format: "9th – 15th Mar 26" (today to +6 days)
const getCompactWeekRange = () => {
  const today = new Date();
  const start = new Date(today); // today
  const end = new Date(today);
  end.setDate(today.getDate() + 6); // +6 days = 7-day period

  const dayStart = start.getDate();
  const dayEnd = end.getDate();
  const month = start.toLocaleDateString("en-IN", { month: "short" });
  const year = start.getFullYear().toString().slice(-2);

  const suffix = (n) => {
    if (n > 3 && n < 21) return "th";
    switch (n % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  };

  return `${dayStart}${suffix(dayStart)} – ${dayEnd}${suffix(dayEnd)} ${month} ${year}`;
};

// Full format for tooltip (e.g., "12 Mar 2026 – 18 Mar 2026")
const getThisWeekRangeFull = () => {
  const today = new Date();
  const start = new Date(today);
  const end = new Date(today);
  end.setDate(today.getDate() + 6);

  const format = (date) =>
    date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return `${format(start)} – ${format(end)}`;
};

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="header-left">
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <img src={Calender1} alt="" />
              <p
                style={{
                  fontSize: "24px",
                  color: "#101828",
                  fontWeight: 500,
                }}
              >
                Calendar
              </p>
            </div>
          </div>
          {/* <button className="close-button" onClick={onClose}>
            ×
          </button> */}
        </div>

        {/* Top Bar */}
        <div className="top-bar">
          <div className="recruitment-title">
            Recruitment Calendar
            <p className="top-bar-p">Manage your interviews and meetings</p>
          </div>

          <button className="new-event-btn" onClick={() => setIsScheduleModalOpen(true)}>
            <FaPlus /> New Meeting
          </button>
        </div>

        {/* Main Content */}
        <div className="main-content">
          {/* 1. Calendar */}
         <div className="calendar-section" style={{ padding: "0 4px" }}>
  {/* Month Navigation + Today Button */}
  <div className="month-nav" style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "10px",
    fontSize: "15px",
  }}>
    <button
      className="nav-arrow left"
      onClick={() =>
        setCurrentMonth(
          new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
        )
      }
      style={{
        fontSize: "20px",
        background: "none",
        border: "none",
        cursor: "pointer",
        color: "#666",
        padding: "4px 8px",
      }}
    >
      ‹
    </button>

    <div className="current-month" style={{ fontWeight: 600, color: "#333" }}>
      {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
    </div>

    <button
      onClick={() => {
        const today = new Date();
        setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
        handleDateClick(today.getDate());
      }}
      style={{
        padding: "6px 12px",
        background: "#1976d2",
        color: "#fff",
        border: "none",
        borderRadius: "20px",
        fontSize: "13px",
        fontWeight: 600,
        cursor: "pointer",
        boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
        marginTop:"7px"
      }}
    >
      Today
    </button>

    <button
      className="nav-arrow right"
      onClick={() =>
        setCurrentMonth(
          new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
        )
      }
      style={{
        fontSize: "20px",
        background: "none",
        border: "none",
        cursor: "pointer",
        color: "#666",
        padding: "4px 8px",
      }}
    >
      ›
    </button>
  </div>

  {/* Weekdays – Shortened */}
  <div className="weekdays" style={{
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    textAlign: "center",
    fontWeight: 600,
    color: "#777",
    marginBottom: "6px",
    fontSize: "12px",
  }}>
    {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
      <div key={day}>{day}</div>
    ))}
  </div>

  {/* Days Grid – Fixed fit, no overflow */}
  <div className="days-grid" style={{
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: "4px",
}}>
  {calendarDays.map((calendarDay, index) => {
    if (!calendarDay.day) {
      return <div key={index} style={{ height: "0", paddingBottom: "100%" }} />;
    }

    const dayDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      calendarDay.day
    );

    const events = getEventsForDay(calendarDay.day);
    const isToday = dayDate.toDateString() === new Date().toDateString();
    const isPast = dayDate < new Date().setHours(0, 0, 0, 0);
    const isSelected = selectedDate.toDateString() === dayDate.toDateString();

    // Check if any past interview is still "scheduled-pending"
    // const hasPending = isPast && events.some(e => e.effectiveStatus === "scheduled-pending");
    // const hasPending = isPast && events.some(e => e.status === "scheduled-pending");
    const hasPending = isPast && events.some(e => e.status === "scheduled-pending" || e.status === "scheduled");

    console.log("[CALENDAR] Combined events count:", combinedEvents.length);
    console.log("[CALENDAR] Meetings count:", meetingEvents.length);
    console.log("[CALENDAR] Sample meeting event:", meetingEvents[0]);


    return (
      <div
        key={index}
        className={`calendar-day 
          ${!calendarDay.isCurrentMonth ? "other-month" : ""}
          ${isSelected ? "selected-day" : ""}
          ${events.length > 0 ? "has-events" : ""}
          ${isToday ? "today-highlight" : ""}`}
        onClick={() => handleDateClick(calendarDay.day)}
        style={{
          // aspectRatio: "1 / 1",
          aspectRatio: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "8px",
          cursor: "pointer",
          background: isToday ? "#e3f2fd" : "transparent",
          border: isToday ? "2px solid #1976d2" : "1px solid #eee",
          transition: "all 0.2s",
          position: "relative",
          overflow: "hidden",
          fontSize: "13px",
          fontWeight: isToday ? 700 : 500,
          color: isToday ? "#1976d2" : "#444",
          boxSizing: "border-box",
          minHeight:"60px",
        }}
      >
        {/* Day number */}
        <span style={{ lineHeight: 1 }}>{calendarDay.day}</span>

        {/* Event count badge – different color for past pending */}
        {events.length > 0 && (
          <div style={{
            position: "absolute",
            // bottom: "4px",
            top: "0px",
            right: "1px",
            background: isPast 
              ? (hasPending ? "#ff0000" : "#9e9e9e")   // red if pending, gray if all updated
              : "#FFAB49",                             // default orange for today/upcoming
            color: "#fff",
            fontSize: "9px",
            fontWeight: 600,
            minWidth: "14px",
            height: "14px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 3px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          }}>
            {events.length}
          </div>
        )}
      </div>
    );
  })}
</div>

<div style={{
  marginTop: "20px",
  padding: "20px 24px",
  background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
  borderRadius: "16px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
  fontFamily: '"SF Pro", "SFProText", -apple-system, BlinkMacSystemFont, sans-serif',
  marginBottom: "15px",
}}>
  <h4 style={{
    margin: "0 0 16px",
    fontSize: "16px",
    fontWeight: 700,
    color: "#1e293b",
  }}>
    Calendar Quick Guide
  </h4>

  <div style={{
    display: "grid",
    gap: "12px",
  }}>
    {/* Today */}
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <div style={{
        width: "14px",
        height: "14px",
        borderRadius: "50%",
        background: "#e3f2fd",
        border: "2px solid #1976d2",
      }} />
      <div>
        <strong style={{ color: "#1976d2" }}>Today:</strong>
        <span style={{ color: "#64748b", fontSize: "13px", marginLeft: "8px" }}>
          Light blue ring + background
        </span>
      </div>
    </div>

    {/* Event badge - Today/Upcoming */}
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <div>
        <div style={{
        width: "14px",
        height: "14px",
        borderRadius: "50%",
        background: "#FFAB49",
      }} />
      </div>
      <div>
        <strong>Interviews today or upcoming:</strong>
        <span style={{ color: "#64748b", fontSize: "13px", marginLeft: "8px" }}>
          Orange circle shows total count
        </span>
      </div>
    </div>

    {/* Past - Pending */}
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <div>
        <div style={{
        width: "14px",
        height: "14px",
        borderRadius: "50%",
        background: "#ff0000",
      }} />
      </div>
      <div>
        <strong>Past day with pending status:</strong>
        <span style={{ color: "#64748b", fontSize: "13px", marginLeft: "8px" }}>
          Red badge = interview still "scheduled-pending" (needs update)
        </span>
      </div>
    </div>

    {/* Past - Updated */}
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <div>
        <div style={{
        width: "14px",
        height: "14px",
        borderRadius: "50%",
        background: "#9e9e9e",
      }} />
      </div>
      <div>
        <strong>Past day – all updated:</strong>
        <span style={{ color: "#64748b", fontSize: "13px", marginLeft: "8px" }}>
          Gray badge = all interviews have updated status
        </span>
      </div>
    </div>
  </div>

  {/* <p style={{
    marginTop: "16px",
    fontSize: "13px",
    color: "#64748b",
    lineHeight: 1.5,
  }}>
    Click any date to see full interview list. Use <strong>Today</strong> button to jump back instantly.
  </p> */}
</div>


</div>

          {/* 2. Events for selected date */}
          <div className="events-section">
            <div className="selected-date-header" style={{display:'flex', flexDirection:"row"}}>
              <div>
                <h3>
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </h3>
              </div>
              <div>
                <span className="event-count schedule-badge">
                {/* {selectedDateEvents.length} events scheduled */}
                {selectedDateEvents.length} 
              </span>
              </div>
            </div>

              <div className="all-events-list">
               {selectedDateEvents.length > 0 ? (
  selectedDateEvents.map((event) => (
    <div 
      key={event.id} 
      className="event-card-wrapper"
      onClick={() => handlePreviewClick(event)}
      style={{ cursor: "pointer" }}
    >
      {event.category === "Interviews" ? (
        // ── ORIGINAL INTERVIEW CARD (your code unchanged) ──
        <div
          className="event-card"
          style={{
            borderLeft: `4px solid ${
              event.status === "scheduled-pending"
                ? "#ff0000"
                : "#00B894"
            }`,
          }}
        >
          <div className="event-header">
            <div className={`event-category-tag ${event.color}`}>
              {event.category}
            </div>
            <span className="event-time-range">
              {event.timeRange}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: "77%" }}>
              <div className="event-title-main">{event.title}</div>
              <div className="event-subtitle">{event.subtitle}</div>

              {/* Reschedule Count */}
              {event.rescheduleHistory && event.rescheduleHistory.length > 0 && (
                <div
                  style={{
                    fontSize: "12px",
                    marginTop: "4px",
                    color: "#f59e0b",
                    fontWeight: 500,
                  }}
                >
                  <MdEventRepeat /> Rescheduled {event.rescheduleHistory.length}{" "}
                  {event.rescheduleHistory.length === 1 ? "time" : "times"}
                </div>
              )}

              <div className="event-location">{event.location}</div>

              {/* Status Section */}
              <div
                className="status-line"
                style={{ marginTop: "8px" }}
                onClick={(e) => e.stopPropagation()}
              >
                {(event.status || event.effectiveStatus) === "scheduled-pending" ? (
                  <select
                    value={event.status || event.effectiveStatus}
                    onChange={(e) =>
                      handleStatusChange(
                        event.id,
                        event.applicationId,
                        e.target.value
                      )
                    }
                    style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      border: "1px solid #ccc",
                      fontSize: "13px",
                      background: "#fff",
                      cursor: "pointer",
                      width: "210px",
                    }}
                  >
                    <option value="scheduled-pending" disabled>
                      Pending - Change Status
                    </option>

                    <option value="New">New</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Interview Scheduled">
                      Interview Scheduled
                    </option>
                    <option value="Rejected">Rejected</option>
                    <option value="Hired">Hired</option>
                    <option value="No Show">No Show</option>
                    <option value="Offer Extended">Offer Extended</option>
                    <option value="Offer Accepted">Offer Accepted</option>
                    <option value="Offer Declined">Offer Declined</option>
                  </select>
                ) : (
                  <span
                    className={`status-${(event.status || event.effectiveStatus)
                      ?.toLowerCase()
                      .replace(/\s+/g, "-")}`}
                  >
                    {event.status || event.effectiveStatus}
                  </span>
                )}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                width: "20%",
              }}
            >
              {(event.status || event.effectiveStatus) === "scheduled-pending" && (
                <div
                  className="event-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditClick(event);
                  }}
                  style={{
                    cursor: "pointer",
                    width: "100%",
                  }}
                >
                  <button
                    className="add-btn2"
                    type="button"
                    style={{ padding: "12px 8px" }}
                  >
                    <Calendar size={16} />
                    Reschedule
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // ── NEW MEETING CARD (similar layout) ──
        <div
          className="event-card"
          style={{
            borderLeft: `4px solid #FFAB49`, // orange for meetings
          }}
        >
          <div className="event-header">
            <div className={`event-category-tag green`}>
              {event.category || "Meeting"}
            </div>
            <span className="event-time-range">
              {event.timeRange || `${event.time} ${event.period}`}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: "74%" }}>
              <div className="event-title-main">{event.title}</div>
              <div className="event-subtitle">
                {event.members?.length || 0} participant{event.members?.length !== 1 ? "s" : ""}
              </div>

              {/* Optional: Add reschedule for meetings later */}
              {/* {event.rescheduleHistory && ...} */}

              <div className="event-location">
                {event.meetingLink ? (
                  <a href={event.meetingLink} target="_blank" rel="noopener noreferrer">
                    Join Meeting
                  </a>
                ) : "Google Meet"}
              </div>

              <div
                className="status-line"
                style={{ marginTop: "8px" }}
              >
                <span className="status-upcoming">
                  {event.effectiveStatus || event.status || "Scheduled"}
                </span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                width: "20%",
              }}
            >
              {/* Optional: Add edit/cancel button for meetings later */}
              {/* <span style={{ fontSize: "12px", color: "#6b7280" }}>
                General Meeting
              </span> */}

               <button
                className="add-btn2"
                type="button"
                style={{padding:"12px 8px"}}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditMeetingClick(event);
                }}
              >
                <Calendar size={16} />
                Reschedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  ))
) : (
  <div className="no-events">
    {loading ? "Loading..." : "No events scheduled"}
  </div>
)}
              </div>
          </div>

          {/* 3. Today's Schedule + Upcoming */}
          <div className="schedule-section">
            {/* Today's Schedule */}
            <div className="today-schedule">
              <div className="schedule-header">
                <h4>Today's Schedule</h4>
                <div className="schedule-badge">
                  {
                    combinedEvents.filter(
                      (e) => e.date.toDateString() === new Date().toDateString()
                    ).length
                  }
                </div>
              </div>
              <div className="schedule-events">
  {combinedEvents
    .filter((e) => e.date.toDateString() === new Date().toDateString())
    .sort((a, b) => {
      // Sort by time (earliest first)
      const timeA = a.time ? new Date(`1970-01-01T${a.time}:00`) : new Date(0);
      const timeB = b.time ? new Date(`1970-01-01T${b.time}:00`) : new Date(0);
      return timeA - timeB;
    })
    .map((event) => (
      <div
        key={event.id}
        className="today-event-card"
        onClick={() => handlePreviewClick(event)}
        style={{
          cursor: "pointer",
          transition: "all 0.2s ease",
          position: "relative",
          overflow: "visible",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
      >
        {/* Category Badge (top-right, same as upcoming column) */}
        <div
          style={{
            position: "absolute",
            top: "8px",
            right: "4px",
            padding: "4px 10px",
            background: event.category === "Interviews" ? "#FFAB49" : "#6366f1",
            color: "white",
            fontSize: "11px",
            fontWeight: 600,
            borderRadius: "20px",
            zIndex: 1,
          }}
        >
          {event.category}
        </div>

        {event.category === "Interviews" ? (
          // ── INTERVIEW CARD ──
          <>
            <div className="event-time-badge">
              <div className="time-hour">
                {event.time.split(":")[0]}
              </div>
              <div className="time-period">
                {event.time.includes("14:") ||
                event.time.includes("15:") ||
                event.time.includes("16:") ||
                event.time.includes("17:") ||
                event.time.includes("18:") ||
                event.time.includes("19:") ||
                event.time.includes("20:") ||
                event.time.includes("21:") ||
                event.time.includes("22:") ||
                event.time.includes("23:")
                  ? "PM"
                  : "AM"}
              </div>
            </div>

            <div className="event-content">
              <div className="event-title-short">
                {event.title.length > 26
                  ? event.title.substring(0, 26) + "..."
                  : event.title}
              </div>
              <div className="event-location">{event.location || "Online"}</div>
            </div>
          </>
        ) : (
          // ── MEETING CARD ──
          <>
            <div className="event-time-badge">
              <div className="time-hour">
                {event.time.split(":")[0]}
              </div>
              <div className="time-period">{event.period}</div>
            </div>

            <div className="event-content">
              <div className="event-title-short">
                {event.title.length > 28
                  ? event.title.substring(0, 28) + "..."
                  : event.title}
              </div>
              <div className="event-location">
                {event.members?.length || 0} participant
                {event.members?.length !== 1 ? "s" : ""}
              </div>
            </div>
          </>
        )}
      </div>
    ))}
</div>
            </div>

            {/* Upcoming this Week */}
<div className="upcoming-section">
  <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap", marginBottom: "16px", justifyContent:"space-between" }}>
    <h4 style={{ margin: 0, fontSize: "18px", fontWeight: 600, whiteSpace: "nowrap", color: "#111827" }}>
      Upcoming this Week
    </h4>

    {/* Date range – classic & premium look */}
    <span
      title={getThisWeekRangeFull()}   // ← tooltip shows full range on hover
      style={{
        fontSize: "12px",
        color: "#6b7280",
        fontWeight: 500,
        background: "#f3f4f6",
        padding: "6px 12px",
        borderRadius: "5px",
        whiteSpace: "nowrap",
        lineHeight: 1.3,
      }}
    >
      {getCompactWeekRange()}
    </span>
  </div>

  <div className="upcoming-events">
    {combinedEvents
      .filter((event) => {
        const eventDate = new Date(event.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const oneWeekLater = new Date(today);
        oneWeekLater.setDate(oneWeekLater.getDate() + 7);

        return eventDate >= tomorrow && eventDate <= oneWeekLater;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((event) => (
        <div
          key={event.id}
          className="upcoming-event-card"
          onClick={() => handlePreviewClick(event)}
          style={{
            cursor: "pointer",
            transition: "all 0.2s ease",
            position: "relative",
            overflow: "visible",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <div>
            {/* Category Badge */}
            <div
              style={{
                position: "absolute",
                top: "8px",
                right: "4px",
                padding: "4px 10px",
                background: event.category === "Interviews" ? "#FFAB49" : "#6366f1",
                color: "white",
                fontSize: "12px",
                fontWeight: 600,
                borderRadius: "20px",
                zIndex: 1,
              }}
            >
              {event.category}
            </div>

            <div className="upcoming-avatar">
              <img src={MeetingGroupIcon} alt="" />
            </div>
          </div>

          <div className="upcoming-content">
            {/* Title */}
            <div className="upcoming-candidate">
              {event.title.length > 25 ? event.title.substring(0, 25) + "..." : event.title}
            </div>

            {/* Date & Time */}
            <div className="upcoming-date-time">
              <strong>
                {new Date(event.date).toLocaleDateString("en-IN", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </strong>{" "}
              at{" "}
              {event.timeRange
                ? event.timeRange.split(" - ")[1] || event.timeRange
                : event.time || event.period || "N/A"}
            </div>

            {/* Location / Participants */}
            <div className="upcoming-location">
              {event.category === "Interviews" ? (
                <>{event.location || "Online"}</>
              ) : (
                <>{event.members?.length || 0} participant{event.members?.length !== 1 ? "s" : ""}</>
              )}
            </div>
          </div>
        </div>
      ))}
  </div>
</div>
          </div>
        </div>

        {/* Modals */}
        <EventEditorModal
          open={editorOpen}
          event={activeEvent}
          onClose={() => {
            setEditorOpen(false);
            setActiveEvent(null);
          }}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          setTriggerFetchInterviews={setTriggerFetchInterviews}
        />

        <AddNewEventModal
          open={editorOpen1}
          event={activeEvent1}
          onClose={() => {
            setEditorOpen1(false);
            setActiveEvent1(null);
          }}
          onSave={handleSaveEvent1}
          onDelete={handleDeleteEvent1}
        />




{previewOpen && previewEvent && (
  <div
    className="modal-overlay"
    onClick={() => setPreviewOpen(false)}
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2000,
      padding: "20px",
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        borderRadius: "16px",
        maxWidth: "700px",
        width: "100%",
        maxHeight: "90vh",
        overflowY: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        border: "1px solid rgba(255,171,73,0.15)",
      }}
    >
      {/* Header - Premium look (dynamic title) */}
      <div
        style={{
          background: "#FFAB49",
          color: "white",
          padding: "24px 32px",
          borderRadius: "16px 16px 0 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "28px", fontWeight: 700 }}>
            {previewEvent.category === "Meetings" ? "Meeting Scheduled" : "Interview Scheduled"}
          </h2>
          <p style={{ margin: "8px 0 0", fontSize: "16px", opacity: 0.95 }}>
            {previewEvent.date?.toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}{" "}
            • {previewEvent.timeRange || `${previewEvent.time} ${previewEvent.period}`}
          </p>
        </div>
        <button
          onClick={() => setPreviewOpen(false)}
          style={{
            background: "rgba(255,255,255,0.2)",
            border: "none",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            color: "white",
            fontSize: "28px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
          }}
          onMouseOver={(e) => (e.target.style.background = "rgba(255,255,255,0.35)")}
          onMouseOut={(e) => (e.target.style.background = "rgba(255,255,255,0.2)")}
        >
          ×
        </button>
      </div>

      {/* Body - Clean sections */}
      <div style={{ padding: "32px" }}>
        {previewEvent.category === "Interviews" ? (
          // ── YOUR ORIGINAL INTERVIEW PREVIEW (unchanged) ──
          <>
            {/* Candidate & Interviewer - Highlighted */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "24px",
                marginBottom: "32px",
              }}
            >
              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: "12px",
                  padding: "20px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div style={{ fontSize: "14px", color: "#64748b", marginBottom: "8px" }}>
                  CANDIDATE
                </div>
                <h3 style={{ margin: 0, fontSize: "22px", color: "#1e293b" }}>
                  {previewEvent.first_Name} {previewEvent.lastName}
                </h3>
                <p style={{ margin: "8px 0 0", color: "#475569" }}>
                  {previewEvent.userEmail}
                </p>
              </div>

              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: "12px",
                  padding: "20px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div style={{ fontSize: "14px", color: "#64748b", marginBottom: "8px" }}>
                  CONDUCTED BY
                </div>
                <h3 style={{ margin: 0, fontSize: "22px", color: "#1e293b" }}>
                  {previewEvent.interviewerName}
                </h3>
                <p style={{ margin: "8px 0 0", color: "#475569" }}>
                  {previewEvent.interviewerEmail}
                </p>
              </div>
            </div>

            {/* Job & Duration */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
                <div>
                  <div style={{ color: "#64748b", fontSize: "14px" }}>Job Title</div>
                  <div style={{ fontWeight: 600, fontSize: "18px" }}>
                    {previewEvent.jobTitle}
                  </div>
                </div>
                <div>
                  <div style={{ color: "#64748b", fontSize: "14px" }}>Location</div>
                  <div style={{ fontWeight: 600, fontSize: "18px" }}>
                    {previewEvent.jobLocation || "N/A"}
                  </div>
                </div>
                <div>
                  <div style={{ color: "#64748b", fontSize: "14px" }}>Duration</div>
                  <div style={{ fontWeight: 600, fontSize: "18px" }}>
                    {previewEvent.durationMinutes} minutes
                  </div>
                </div>
                <div>
                  <div style={{ color: "#64748b", fontSize: "14px" }}>Status</div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "18px",
                      color:
                        previewEvent.status === "scheduled-pending"
                          ? "#f59e0b"
                          : "#10b981",
                    }}
                  >
                    {previewEvent.status}
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Invites */}
            {previewEvent.additionalInvites?.length > 0 && (
              <div style={{ marginBottom: "24px" }}>
                <div style={{ color: "#64748b", fontSize: "14px", marginBottom: "8px" }}>
                  Additional Invites
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  {previewEvent.additionalInvites.map((email, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: "#e2e8f0",
                        padding: "6px 12px",
                        borderRadius: "20px",
                        fontSize: "14px",
                        color: "#334155",
                      }}
                    >
                      {email}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reschedule History (unchanged) */}
            {previewEvent.rescheduleHistory &&
              previewEvent.rescheduleHistory.length > 0 && (
                <div
                  style={{
                    marginBottom: "28px",
                    background: "#fff7ed",
                    borderRadius: "14px",
                    padding: "20px",
                    border: "1px solid #fed7aa",
                  }}
                >
                  {/* Header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "14px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "#c2410c",
                      }}
                    >
                      🔁 Reschedule History
                    </div>

                    <div
                      style={{
                        background: "#fdba74",
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#7c2d12",
                      }}
                    >
                      {previewEvent.rescheduleHistory.length}{" "}
                      {previewEvent.rescheduleHistory.length === 1
                        ? "Reschedule"
                        : "Reschedules"}
                    </div>
                  </div>

                  {/* History List */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {previewEvent.rescheduleHistory
                      .slice()
                      .reverse()
                      .map((entry, index) => (
                        <div
                          key={index}
                          style={{
                            background: "#fff",
                            borderRadius: "10px",
                            padding: "14px",
                            border: "1px solid #fed7aa",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                          }}
                        >
                          {/* Date Change */}
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: 600,
                              color: "#1e293b",
                              marginBottom: "6px",
                            }}
                          >
                            {entry.previousDate?.toDate
                              ? entry.previousDate.toDate().toLocaleString("en-IN")
                              : new Date(entry.previousDate).toLocaleString("en-IN")}{" "}
                            →{" "}
                            {entry.newDate?.toDate
                              ? entry.newDate.toDate().toLocaleString("en-IN")
                              : new Date(entry.newDate).toLocaleString("en-IN")}
                          </div>

                          {/* Reason */}
                          <div
                            style={{
                              fontSize: "14px",
                              color: "#475569",
                              marginBottom: "4px",
                            }}
                          >
                            <strong>Reason:</strong> {entry.reason}
                          </div>

                          {/* By + When */}
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#64748b",
                            }}
                          >
                            Rescheduled by {entry.rescheduledBy} on{" "}
                            {entry.rescheduledAt?.toDate
                              ? entry.rescheduledAt.toDate().toLocaleString("en-IN")
                              : new Date(entry.rescheduledAt).toLocaleString("en-IN")}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

            {/* Message - Collapsible */}
            <div style={{ marginBottom: "24px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <div style={{ color: "#64748b", fontSize: "14px" }}>Invitation Message</div>
                {previewEvent.message && previewEvent.message.length > 200 && (
                  <button
                    onClick={() => setShowFullMessage(!showFullMessage)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#FFAB49",
                      fontSize: "14px",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    {showFullMessage ? "Show Less" : "Show Full Message"}
                  </button>
                )}
              </div>

              <div
                style={{
                  background: "#f8fafc",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  whiteSpace: "pre-wrap",
                  fontSize: "15px",
                  lineHeight: "1.6",
                  color: "#1e293b",
                  maxHeight: showFullMessage ? "none" : "150px",
                  overflow: "auto",
                  position: "relative",
                }}
              >
                {previewEvent.message ? (
                  previewEvent.message
                ) : (
                  <span style={{ color: "#94a3b8" }}>No custom message</span>
                )}

                {!showFullMessage && previewEvent.message?.length > 200 && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: "60px",
                      background: "linear-gradient(to bottom, transparent, #f8fafc)",
                      pointerEvents: "none",
                    }}
                  />
                )}
              </div>
            </div>

            {/* Resume Link */}
            {previewEvent.resumeUrl && (
              <div>
                <div style={{ color: "#64748b", fontSize: "14px", marginBottom: "8px" }}>
                  Resume
                </div>
                <button
                  onClick={() => setShowResumePreview(true)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "12px 24px",
                    background: "linear-gradient(135deg, #FFAB49, #ff8800)",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "15px",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(255, 171, 73, 0.3)",
                    transition: "all 0.25s ease",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(255, 171, 73, 0.4)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(255, 171, 73, 0.3)";
                  }}
                >
                  <HiOutlineExternalLink size={18} />
                  View Full Resume
                </button>
              </div>
            )}
          </>
        ) : previewEvent.category === "Meetings" ? (
          // ── NEW MEETING PREVIEW (parallel structure) ──
          <>
            {/* Participants */}
            <div
              style={{
                background: "#f8fafc",
                borderRadius: "12px",
                padding: "20px",
                border: "1px solid #e2e8f0",
                marginBottom: "32px",
              }}
            >
              <div style={{ fontSize: "14px", color: "#64748b", marginBottom: "8px" }}>
                PARTICIPANTS
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {previewEvent.members?.map((email, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: "#e2e8f0",
                      padding: "6px 14px",
                      borderRadius: "20px",
                      fontSize: "14px",
                      color: "#334155",
                    }}
                  >
                    {email}
                  </span>
                )) || <span style={{ color: "#94a3b8" }}>No participants</span>}
              </div>
            </div>

            {/* Meeting Link */}
            {previewEvent.meetingLink && (
              <div style={{ marginBottom: "32px" }}>
                <div style={{ color: "#64748b", fontSize: "14px", marginBottom: "8px" }}>
                  Meeting Link
                </div>
                <a
                  href={previewEvent.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "12px 24px",
                    background: "linear-gradient(135deg, #FFAB49, #ff8800)",
                    color: "white",
                    borderRadius: "12px",
                    textDecoration: "none",
                    fontSize: "15px",
                    fontWeight: 600,
                    boxShadow: "0 4px 12px rgba(255, 171, 73, 0.3)",
                    transition: "all 0.25s ease",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(255, 171, 73, 0.4)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(255, 171, 73, 0.3)";
                  }}
                >
                  <HiOutlineExternalLink size={18} />
                  Join Meeting
                </a>
              </div>
            )}

            {/* Duration & Status */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
                <div>
                  <div style={{ color: "#64748b", fontSize: "14px" }}>Duration</div>
                  <div style={{ fontWeight: 600, fontSize: "18px" }}>
                    {previewEvent.durationMinutes || previewEvent.duration || 30} minutes
                  </div>
                </div>
                <div>
                  <div style={{ color: "#64748b", fontSize: "14px" }}>Status</div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "18px",
                      color: "#10b981",
                    }}
                  >
                    {previewEvent.status || "Scheduled"}
                  </div>
                </div>
              </div>
            </div>

            {/* Message */}
            <div style={{ marginBottom: "24px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <div style={{ color: "#64748b", fontSize: "14px" }}>Message</div>
                {previewEvent.message && previewEvent.message.length > 200 && (
                  <button
                    onClick={() => setShowFullMessage(!showFullMessage)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#FFAB49",
                      fontSize: "14px",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    {showFullMessage ? "Show Less" : "Show Full Message"}
                  </button>
                )}
              </div>

              <div
                style={{
                  background: "#f8fafc",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  whiteSpace: "pre-wrap",
                  fontSize: "15px",
                  lineHeight: "1.6",
                  color: "#1e293b",
                  maxHeight: showFullMessage ? "none" : "150px",
                  overflow: "auto",
                  position: "relative",
                }}
              >
                {previewEvent.message ? (
                  previewEvent.message
                ) : (
                  <span style={{ color: "#94a3b8" }}>No message</span>
                )}

                {!showFullMessage && previewEvent.message?.length > 200 && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: "60px",
                      background: "linear-gradient(to bottom, transparent, #f8fafc)",
                      pointerEvents: "none",
                    }}
                  />
                )}
              </div>
            </div>
          </>
        ) : null}

        {/* Resume Link - only for Interviews */}
        {/* {previewEvent.category === "Interviews" && previewEvent.resumeUrl && (
          <div>
            <div style={{ color: "#64748b", fontSize: "14px", marginBottom: "8px" }}>
              Resume
            </div>
            <button
              onClick={() => setShowResumePreview(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                background: "linear-gradient(135deg, #FFAB49, #ff8800)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(255, 171, 73, 0.3)",
                transition: "all 0.25s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(255, 171, 73, 0.4)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(255, 171, 73, 0.3)";
              }}
            >
              <HiOutlineExternalLink size={18} />
              View Full Resume
            </button>
          </div>
        )} */}
      </div>
    </div>
  </div>
)}



{/* Resume Preview Overlay */}
{showResumePreview && previewEvent?.resumeUrl && (
  <div
    onClick={() => setShowResumePreview(false)}
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.75)",
      zIndex: 3000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: "95vw",
        maxWidth: "1400px",
        height: "92vh",
        background: "#ffffff",
        borderRadius: "24px",
        boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
        overflow: "hidden",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 32px",
          background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 600, color: "#1e293b" }}>
          Resume Preview - {previewEvent.first_Name} {previewEvent.lastName}
        </h3>
        <button
          onClick={() => setShowResumePreview(false)}
          style={{
            background: "rgba(241,245,249,0.9)",
            border: "none",
            borderRadius: "12px",
            padding: "10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.2s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "rgba(226,232,240,0.9)")}
          onMouseOut={(e) => (e.currentTarget.style.background = "rgba(241,245,249,0.9)")}
        >
          <HiOutlineX size={28} color="#475569" />
        </button>
      </div>

      {/* PDF Viewer */}
      <div style={{ flex: 1, overflow: "hidden", background: "#f8fafc" }}>
        <iframe
          src={previewEvent.resumeUrl}
          title={`Resume - ${previewEvent.first_Name} ${previewEvent.lastName}`}
          width="100%"
          height="100%"
          style={{
            border: "none",
          }}
        />
      </div>
    </div>
  </div>
)}

<ScheduleMeetingModal
  visible={isScheduleModalOpen}
  onClose={() => setIsScheduleModalOpen(false)}
  companyId={companyId?.id} // ← pass your company ID from props/state
/>


<MeetingEditorModal
  open={editorMeetingOpen}
  event={activeMeeting}
  onClose={() => {
    // showToast("success", "Changes saved and history updated.", "Meeting Rescheduled");
    setEditorMeetingOpen(false);
    setActiveMeeting(null);
  }}
  onSave={() => {
    // TODO: Refresh meetings list
  }}
  setTriggerFetchInterviews={setTriggerFetchInterviews}
/>







      </div>
    </div>
  );
};

export default RecruitmentCalendarModal;