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

import SmtpConfigModal from '../../components/SmtpConfigModal'; // adjust path if needed

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
  const [showPreview, setShowPreview] = useState(false);
  const [previousData, setPreviousData] = useState(null);
  const [showSmtpWarning, setShowSmtpWarning] = useState(false);
  const [showSmtpConfig, setShowSmtpConfig] = useState(false);

  const isFormInvalid =
    !form.title?.trim() ||
    !form.date ||
    !form.time ||
    !form.durationMinutes ||
    !form.rescheduleReason?.trim();

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

//   const handleSave = async () => {
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

//     setTriggerFetchInterviews((x) => x + 1);

//     showToast("success", "Changes saved and history updated.", "Meeting Rescheduled");

//     // ────────────────────────────────────────────────
//     // NEW: Send reschedule notification email
//     // ────────────────────────────────────────────────
//     const emailPayload = {
//       companyId: event.companyId || "default-company-id",
//       title: `Meeting Rescheduled: ${form.title.trim()}`,
//       message: `Dear Team,\n\n` +
//                `The following meeting has been rescheduled:\n\n` +
//                `Title: ${form.title.trim()}\n` +
//                `New Date & Time: ${startDateObj.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}\n` +
//                `Duration: ${form.durationMinutes} minutes\n` +
//                `Reason for reschedule:\n${form.rescheduleReason.trim()}\n\n` +
//                `${event.meetingLink ? `Please join via the existing Google Meet link: ${event.meetingLink}\n\n` : ''}` +
//                `We look forward to your participation!\n\nBest regards,\n${email || 'Admin'}\n${event.companyName || 'Infomanav'}`,
//       members: form.members
//         .split(",")
//         .map((e) => e.trim())
//         .filter(Boolean),
//       ...(event.meetingLink ? { meetingLink: event.meetingLink } : {}),
//       date: startDateObj.toString(),
//       time: startDateObj.toTimeString().slice(0, 5),
//       duration: Number(form.durationMinutes),
//       category: "Meetings",
//       createdBy: email || "unknown",
//     };

//     try {
//       await sendEmail(emailPayload);
//       showToast("success", "Reschedule notification sent to all members", "Email Sent");
//     } catch (emailErr) {
//       console.error("Email failed:", emailErr);
//       showToast("warning", "Meeting updated, but notification email failed", "Partial Success");
//     }

//     onSave?.();
//     onClose();

//   } catch (err) {
//     console.error("Meeting reschedule failed:", err);
//     showToast("error", "Failed to reschedule meeting.", "Error");
//   } finally {
//     setIsSaving(false);
//   }
// };

const handleSave = async () => {
  setIsSaving(true);

  // Move reason check FIRST — before any heavy logic
  if (!form.rescheduleReason?.trim()) {
    showToast("warning", "Please provide a reason for rescheduling.", "Reason Required");
    setIsSaving(false);
    return;
  }

  try {
    console.log("handleSave called — form values:", {
      rescheduleReason: form.rescheduleReason,
      date: form.date,
      time: form.time,
    });
    const startDateObj = new Date(`${form.date}T${form.time}:00`);

    if (isNaN(startDateObj.getTime())) {
      showToast("error", "Please select valid date and time.", "Invalid Date/Time");
      return;
    }

    // Fetch current data...
    const meetingRef = doc(db, "meetingMaster", event.id);
    const snap = await getDoc(meetingRef);

    if (!snap.exists()) {
      showToast("error", "Meeting not found.", "Error");
      return;
    }

    const existing = snap.data();
    setPreviousData(existing);

    // SES check (updated naming)
    if (!event?.companyId) {
      showToast("error", "Company ID missing.", "Error");
      return;
    }

    const companyRef = doc(db, "companyMaster", event.companyId);
    const companySnap = await getDoc(companyRef);

    if (!companySnap.exists()) {
      showToast("error", "Company not found.", "Error");
      return;
    }

    const useCustomSesConfig = companySnap.data()?.useCustomSesConfig || false;
    console.log("SES config check:", { useCustomSesConfig });

    if (useCustomSesConfig) {
      setShowPreview(true);
    } else {
      setShowSmtpWarning(true);
    }
  } catch (err) {
    console.error("Preview preparation failed:", err);
    showToast("error", "Failed to prepare preview. Check console for details.", "Error");
  } finally {
    setIsSaving(false);
  }
};

const performSave = async () => {
  setIsSaving(true);
  try {
    const startDateObj = new Date(`${form.date}T${form.time}:00`);

    const meetingRef = doc(db, "meetingMaster", event.id);

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

    // Send email
const emailPayload = {
  companyId: event.companyId || "default-company-id",
  title: `Meeting Rescheduled: ${form.title.trim()}`,
  message: `
Dear Team,

The following meeting has been <strong>rescheduled</strong>:

<strong>Title:</strong> ${form.title.trim()}
<strong>New Date & Time:</strong> ${startDateObj.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
<strong>Duration:</strong> ${form.durationMinutes} minutes
<strong>Reason for reschedule:</strong> ${form.rescheduleReason.trim() || 'Not specified'}

${event.meetingLink ? `
<strong>Please join via the existing Google Meet link:</strong>
${event.meetingLink}
` : ''}

We look forward to your participation!

Best regards,  
<strong>${email || 'Admin'}</strong>  
${event.companyName || 'Infomanav'}
  `.trim(),
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
    } catch (emailErr) {
      console.error("Email failed:", emailErr);
      showToast("warning", "Meeting updated, but notification email failed", "Partial Success");
      onClose();
      return;
    }

    showToast("success", "Meeting rescheduled successfully.", "Success");

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

  {/* Title */}
  <div className="field-group">
    <label>Title <span style={{ color: 'red' }}>*</span></label>

    <input
      type="text"
      value={form.title}
      onChange={handleChange("title")}
      style={{
        border: !form.title?.trim() ? "1px solid #dc2626" : "1px solid #e8e8e8"
      }}
    />

    {!form.title?.trim() && (
      <p style={{
        color: "#dc2626",
        fontSize: "13px",
        margin: "4px 0 10px 2px",
        fontWeight: 500
      }}>
        Please enter the event title.
      </p>
    )}
  </div>

  {/* Date & Time */}
  <div className="field-row">
    <div className="field-group">
      <label>Date <span style={{ color: 'red' }}>*</span></label>

      <input
        type="date"
        value={form.date}
        onChange={handleChange("date")}
        min={new Date().toISOString().split("T")[0]}
        style={{
          border: !form.date ? "1px solid #dc2626" : "1px solid #e8e8e8"
        }}
      />
    </div>

    <div className="field-group">
      <label>Time <span style={{ color: 'red' }}>*</span></label>

      <input
        type="time"
        value={form.time}
        onChange={handleChange("time")}
        step="900"
        style={{
          border: !form.time ? "1px solid #dc2626" : "1px solid #e8e8e8"
        }}
      />
    </div>
  </div>

  {(!form.date || !form.time) && (
    <p style={{
      color: "#dc2626",
      fontSize: "13px",
      margin: "4px 0 14px 2px",
      fontWeight: 500
    }}>
      Please select both the event date and time.
    </p>
  )}

  {/* Duration */}
  <div className="field-group">
    <label>Duration (minutes) <span style={{ color: 'red' }}>*</span></label>

    <select
      value={form.durationMinutes}
      onChange={handleChange("durationMinutes")}
      style={{
        padding: "10px",
        borderRadius: "100px",
        border: !form.durationMinutes ? "1px solid #dc2626" : "1px solid #e8e8e8"
      }}
    >
      <option value="15">15 minutes</option>
      <option value="30">30 minutes</option>
      <option value="45">45 minutes</option>
      <option value="60">60 minutes</option>
    </select>
  </div>

  {/* Participants (optional) */}
  <div className="field-group">
    <label>Participants (comma separated)</label>

    <textarea
      rows={2}
      value={form.members}
      onChange={handleChange("members")}
      placeholder="abc@example.com, xyz@example.com"
    />
  </div>

  {/* Reschedule Reason */}
  <div className="field-group">
    <label>Reschedule Reason <span style={{ color: 'red' }}>*</span></label>

    <textarea
      rows={2}
      value={form.rescheduleReason}
      onChange={handleChange("rescheduleReason")}
      placeholder="e.g., Time conflict, Participant unavailable, etc."
      style={{
        border: !form.rescheduleReason?.trim()
          ? "1px solid #dc2626"
          : "1px solid #e8e8e8"
      }}
    />

    {!form.rescheduleReason?.trim() && (
      <p style={{
        color: "#dc2626",
        fontSize: "13px",
        margin: "4px 0 10px 2px",
        fontWeight: 500
      }}>
        Please provide a reason for rescheduling.
      </p>
    )}
  </div>

</div>

        

        {/* Footer */}
        <div className="event-editor-footer">
          <button className="btn-secondary1" onClick={onClose}>
            Cancel
          </button>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            className="btn-primary1"
            onClick={handleSave}
            disabled={isSaving || isFormInvalid}
            style={{
              opacity: (isSaving || isFormInvalid) ? 0.6 : 1,
              cursor: (isSaving || isFormInvalid) ? "not-allowed" : "pointer",
            }}
          >
            <img src={SaveChanges} alt="" />
            <span>{isSaving ? "Loading..." : "Preview"}</span>
          </button>
          </div>
        </div>
        {/* Preview / Review Modal */}
{/* Preview / Review Modal */}
{showPreview && (
  <div style={{
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.55)',
    zIndex: 1003,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  }}>
    <div style={{
      background: '#fff',
      padding: '32px',
      borderRadius: '14px',
      maxWidth: '640px',
      width: '100%',
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
    }}>

      <h2 style={{ margin: '0 0 26px', color: '#1e293b' }}>
        Review Reschedule Changes
      </h2>

      {/* Title */}
      <div style={{ marginBottom: '18px' }}>
        <div style={{ fontWeight: 600, marginBottom: "6px", color: "#374151" }}>
          Title
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{
            flex: 1,
            background: "#f1f5f9",
            padding: "10px 12px",
            borderRadius: "8px",
            color: "#64748b"
          }}>
            {previousData?.title || "N/A"}
          </div>

          <span style={{ fontSize: "18px", color: "#9ca3af" }}>→</span>

          <div style={{
            flex: 1,
            background: "#FFF7ED",
            padding: "10px 12px",
            borderRadius: "8px",
            fontWeight: 500,
            color: "#1e293b"
          }}>
            {form.title.trim()}
          </div>
        </div>
      </div>

      {/* Date / Time */}
      <div style={{ marginBottom: '18px' }}>
        <div style={{ fontWeight: 600, marginBottom: "6px", color: "#374151" }}>
          Date & Time
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{
            flex: 1,
            background: "#f1f5f9",
            padding: "10px 12px",
            borderRadius: "8px",
            color: "#64748b"
          }}>
            {previousData?.date
              ? new Date(previousData.date.toDate()).toLocaleString('en-IN')
              : "N/A"}
          </div>

          <span style={{ fontSize: "18px", color: "#9ca3af" }}>→</span>

          <div style={{
            flex: 1,
            background: "#FFF7ED",
            padding: "10px 12px",
            borderRadius: "8px",
            fontWeight: 500,
          }}>
            {new Date(`${form.date}T${form.time}:00`).toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Duration */}
      <div style={{ marginBottom: '18px' }}>
        <div style={{ fontWeight: 600, marginBottom: "6px", color: "#374151" }}>
          Duration
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{
            flex: 1,
            background: "#f1f5f9",
            padding: "10px 12px",
            borderRadius: "8px",
            color: "#64748b"
          }}>
            {previousData?.durationMinutes || "N/A"} minutes
          </div>

          <span style={{ fontSize: "18px", color: "#9ca3af" }}>→</span>

          <div style={{
            flex: 1,
            background: "#FFF7ED",
            padding: "10px 12px",
            borderRadius: "8px",
            fontWeight: 500
          }}>
            {form.durationMinutes} minutes
          </div>
        </div>
      </div>

      {/* Participants */}
      <div style={{ marginBottom: '18px' }}>
        <div style={{ fontWeight: 600, marginBottom: "6px", color: "#374151" }}>
          Participants
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{
            flex: 1,
            background: "#f1f5f9",
            padding: "10px 12px",
            borderRadius: "8px",
            color: "#64748b"
          }}>
            {previousData?.members?.join(', ') || "None"}
          </div>

          <span style={{ fontSize: "18px", color: "#9ca3af" }}>→</span>

          <div style={{
            flex: 1,
            background: "#FFF7ED",
            padding: "10px 12px",
            borderRadius: "8px",
            fontWeight: 500
          }}>
            {form.members.trim() || "None"}
          </div>
        </div>
      </div>

      {/* Reason */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontWeight: 600, marginBottom: "6px", color: "#374151" }}>
          Reschedule Reason
        </div>

        <div style={{
          background: "#FFF7ED",
          padding: "12px",
          borderRadius: "8px",
          lineHeight: "1.5"
        }}>
          {form?.rescheduleReason?.trim()}
        </div>
      </div>

      {/* Buttons */}
      <div style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end',
        marginTop: '32px'
      }}>
        <button
          onClick={() => setShowPreview(false)}
          style={{
            padding: '10px 22px',
            border: '1px solid #d1d5db',
            background: '#fff',
            borderRadius: '8px',
            cursor: "pointer"
          }}
        >
          Back to Edit
        </button>

        <button
          onClick={performSave}
          disabled={isSaving}
          style={{
            padding: '10px 22px',
            background: '#FFAB49',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isSaving ? "not-allowed" : "pointer",
            opacity: isSaving ? 0.7 : 1
          }}
        >
          {isSaving ? "Rescheduling..." : "Confirm & Reschedule"}
        </button>
      </div>

    </div>
  </div>
)}

{/* SMTP Warning Modal */}
{showSmtpWarning && (
  <div style={{
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    zIndex: 1002,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  }}>
    <div style={{
      background: '#fff',
      padding: '32px',
      borderRadius: '12px',
      maxWidth: '480px',
      width: '100%',
      boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
    }}>
      <h3 style={{ margin: '0 0 16px', color: '#1e293b' }}>Company Email Not Configured</h3>
      <p style={{ margin: '0 0 24px', color: '#4b5563' }}>
        Emails will be sent from Stolity's default address (no-reply@stolity.com). To send from your own company email, register your SMTP credentials first.
      </p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          onClick={() => {
            setShowSmtpWarning(false);
            setShowPreview(true); // continue to preview with default SMTP
          }}
          style={{ padding: '10px 20px', border: '1px solid #d1d5db', background: '#fff', borderRadius: '8px' }}
        >
          Continue with Stolity Email
        </button>
        <button
          onClick={() => {
            setShowSmtpWarning(false);
            setShowSmtpConfig(true);
          }}
          style={{ padding: '10px 20px', background: '#FFAB49', color: 'white', border: 'none', borderRadius: '8px' }}
        >
          Register My SMTP Credentials
        </button>
      </div>
    </div>
  </div>
)}

{/* SMTP Config Modal */}
<SmtpConfigModal
  open={showSmtpConfig}
  onClose={() => setShowSmtpConfig(false)}
  companyId={event.companyId}
  onSuccess={() => {
    setShowPreview(true); // after SMTP success → show preview
  }}
/>
      </div>
    </div>
  );
};

export default MeetingEditorModal;