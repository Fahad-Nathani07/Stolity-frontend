// src/components/MeetingEditorModal.jsx
import { useState, useEffect } from "react";
import "../../css/EventEditorModal.css"; // reuse same CSS
import Calender1 from "../../images/Calender1.svg";
import DeleteBin2 from "../../images/DeleteBin2.svg";
import SaveChanges from "../../images/SaveChanges.svg";
import { db } from "../../firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { showToast } from "../../components/ToastProvider"; // adjust path if needed
import { sendEmail } from '../../services/emailService'; // adjust path

const MeetingEditorModal = ({ open, onClose, event, onSave, setTriggerFetchInterviews }) => {
  const [form, setForm] = useState({
    title: "",
    date: "",
    time: "",
    durationMinutes: "30",
    message: "",
    members: "",
    rescheduleReason: "",
  });

  const [isSaving, setIsSaving] = useState(false);

  const email = sessionStorage.getItem("email");

  useEffect(() => {
    if (event) {
      const dateObj = event.date?.toDate?.() || new Date(event.date);
      const dateStr = dateObj ? dateObj.toISOString().split("T")[0] : "";
      const timeStr = dateObj ? dateObj.toTimeString().slice(0, 5) : "";

      setForm({
        title: event.title || "",
        date: dateStr,
        time: timeStr,
        durationMinutes: event.durationMinutes?.toString() || "30",
        message: event.message || "",
        members: event.members?.join(", ") || "",
      });
    }
  }, [event]);

  if (!open || !event) return null;

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  // const handleSave = async () => {
  //   setIsSaving(true);
  //   try {
  //     const startDateObj = new Date(`${form.date}T${form.time}:00`);

  //     if (isNaN(startDateObj.getTime())) {
  //       showToast("error", "Please select valid date and time.", "Invalid Date/Time");
  //       return;
  //     }

  //     // Require reason
  //     if (!form.rescheduleReason.trim()) {
  //       showToast("warning", "Please provide a reason for rescheduling.", "Reason Required");
  //       return;
  //     }

  //   //   showToast("info", "Saving changes...", "Updating Meeting");

  //     await new Promise((r) => setTimeout(r, 1200));

  //     const meetingRef = doc(db, "meetingMaster", event.id);

  //     // Get existing data for history
  //     const snap = await getDoc(meetingRef);
  //     const existing = snap.exists() ? snap.data() : {};

  //     const previousDate = existing.date?.toDate?.() || new Date(existing.date);
  //     const existingHistory = existing.rescheduleHistory || [];

  //     const newHistoryEntry = {
  //       rescheduledAt: new Date(),
  //       rescheduledBy: email || "unknown",
  //       previousDate,
  //       newDate: startDateObj,
  //       reason: form.rescheduleReason.trim(),
  //       status: "scheduled",
  //     };

  //     const updates = {
  //       title: form.title.trim(),
  //       date: startDateObj,
  //       time: startDateObj.toTimeString().slice(0, 5),
  //       durationMinutes: Number(form.durationMinutes),
  //       message: form.message.trim(),
  //       members: form.members
  //         .split(",")
  //         .map((e) => e.trim())
  //         .filter(Boolean),
  //       updatedAt: new Date(),
  //       rescheduleHistory: [...existingHistory, newHistoryEntry],
  //     };

  //     await updateDoc(meetingRef, updates);

  //     showToast("success", "Changes saved and history updated.", "Meeting Rescheduled");

  //     setTriggerFetchInterviews((x) => x + 1);
  //     onSave?.();
  //     onClose();

  //   } catch (err) {
  //     console.error("Meeting reschedule failed:", err);
  //     showToast("error", "Failed to reschedule meeting.", "Error");
  //   } finally {
  //   setIsSaving(false); // ← Always stop loading (success or error)
  // }
  // };

  const handleSave = async () => {
  setIsSaving(true);

  try {
    const startDateObj = new Date(`${form.date}T${form.time}:00`);

    if (isNaN(startDateObj.getTime())) {
      showToast("error", "Please select valid date and time.", "Invalid Date/Time");
      return;
    }

    // Require reason
    if (!form.rescheduleReason.trim()) {
      showToast("warning", "Please provide a reason for rescheduling.", "Reason Required");
      return;
    }

    await new Promise((r) => setTimeout(r, 1200));

    const meetingRef = doc(db, "meetingMaster", event.id);

    // Get existing data for history
    const snap = await getDoc(meetingRef);
    const existing = snap.exists() ? snap.data() : {};

    const previousDate = existing.date?.toDate?.() || new Date(existing.date);
    const existingHistory = existing.rescheduleHistory || [];

    const newHistoryEntry = {
      rescheduledAt: new Date(),
      rescheduledBy: email || "unknown",
      previousDate,
      newDate: startDateObj,
      reason: form.rescheduleReason.trim(),
      status: "scheduled",
    };

    const updates = {
      title: form.title.trim(),
      date: startDateObj,
      time: startDateObj.toTimeString().slice(0, 5),
      durationMinutes: Number(form.durationMinutes),
      message: form.message.trim(),
      members: form.members
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean),
      updatedAt: new Date(),
      rescheduleHistory: [...existingHistory, newHistoryEntry],
    };

    await updateDoc(meetingRef, updates);

    setTriggerFetchInterviews((x) => x + 1);

    showToast("success", "Changes saved and history updated.", "Meeting Rescheduled");

    // ────────────────────────────────────────────────
    // NEW: Send reschedule notification email
    // ────────────────────────────────────────────────
    const emailPayload = {
      companyId: event.companyId || "default-company-id",
      title: `Meeting Rescheduled: ${form.title.trim()}`,
      message: `Dear Team,\n\n` +
               `The following meeting has been rescheduled:\n\n` +
               `Title: ${form.title.trim()}\n` +
               `New Date & Time: ${startDateObj.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}\n` +
               `Duration: ${form.durationMinutes} minutes\n` +
               `Reason for reschedule:\n${form.rescheduleReason.trim()}\n\n` +
               `${event.meetingLink ? `Please join via the existing Google Meet link: ${event.meetingLink}\n\n` : ''}` +
               `We look forward to your participation!\n\nBest regards,\n${email || 'Admin'}\n${event.companyName || 'Infomanav'}`,
      members: form.members
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean),
      ...(event.meetingLink ? { meetingLink: event.meetingLink } : {}),
      date: startDateObj.toString(),
      time: startDateObj.toTimeString().slice(0, 5),
      duration: Number(form.durationMinutes),
      category: "Meetings",
      createdBy: email || "unknown",
    };

    try {
      await sendEmail(emailPayload);
      showToast("success", "Reschedule notification sent to all members", "Email Sent");
    } catch (emailErr) {
      console.error("Email failed:", emailErr);
      showToast("warning", "Meeting updated, but notification email failed", "Partial Success");
    }

    onSave?.();
    onClose();

  } catch (err) {
    console.error("Meeting reschedule failed:", err);
    showToast("error", "Failed to reschedule meeting.", "Error");
  } finally {
    setIsSaving(false);
  }
};




  return (
    <div className="event-editor-overlay" onClick={onClose}>
      <div className="event-editor-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="event-editor-header">
          <div className="event-editor-title-wrap">
            <span className="event-editor-icon">
              <img src={Calender1} alt="" />
            </span>
            <h2>Reschedule Meeting</h2>
          </div>
          <button className="event-editor-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Read-only Info */}
        <div style={{ padding: "16px 24px", background: "#f8fafc", borderRadius: "12px", marginBottom: "24px" }}>
          <div style={{ marginBottom: "12px" }}>
            <strong>Title:</strong> {event.title}
          </div>
          <div style={{ marginBottom: "12px" }}>
            <strong>Participants:</strong> {event.members?.join(", ") || "None"}
          </div>
          <div>
            <strong>Created By:</strong> {event.createdBy || "Unknown"}
          </div>
        </div>

        {/* Form */}
        <div className="event-editor-body">
          <div className="field-group">
            <label>Title *</label>
            <input type="text" value={form.title} onChange={handleChange("title")} />
          </div>

          <div className="field-row">
            <div className="field-group">
              <label>Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={handleChange("date")}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="field-group">
              <label>Time *</label>
              <input
                type="time"
                value={form.time}
                onChange={handleChange("time")}
                step="900"
              />
            </div>
          </div>

          <div className="field-group">
            <label>Duration (minutes) *</label>
            <select
              value={form.durationMinutes}
              onChange={handleChange("durationMinutes")}
              style={{ padding: "10px", borderRadius: "100px", border: "1px solid #e8e8e8" }}
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
            </select>
          </div>

          <div className="field-group">
            <label>Participants (comma separated)</label>
            <textarea
              rows={2}
              value={form.members}
              onChange={handleChange("members")}
              placeholder="abc@example.com, xyz@example.com"
            />
          </div>

          {/* <div className="field-group">
            <label>Message ()</label>
            <textarea rows={3} value={form.message} onChange={handleChange("message")} />
          </div> */}

          <div className="field-group">
            <label>Reschedule Reason *</label>
            <textarea
              rows={2}
              value={form.rescheduleReason}
              onChange={handleChange("rescheduleReason")}
              placeholder="e.g., Time conflict, Participant unavailable, etc."
            />
          </div>
        </div>

        {/* Warning */}
        <p style={{ color: "#f59e0b", fontSize: "14px", margin: "16px 24px", textAlign: "center" }}>
          After saving, please manually update the event in Google Calendar if needed.
        </p>

        {/* Footer */}
        <div className="event-editor-footer">
          <button className="btn-secondary1" onClick={onClose}>
            Cancel
          </button>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
           <button
            className="btn-primary1"
            onClick={handleSave}
            disabled={isSaving} // ← disable when saving
            style={{
                opacity: isSaving ? 0.7 : 1, // optional: visual feedback
                cursor: isSaving ? "not-allowed" : "pointer",
            }}
            >
            <img src={SaveChanges} alt="" />
            <span>{isSaving ? "Saving changes..." : "Save Changes"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingEditorModal;