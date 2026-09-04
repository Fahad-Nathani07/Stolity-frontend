// src/components/EventEditorModal.jsx
import { useState, useEffect } from "react";
import "../../css/EventEditorModal.css";
import Calender1 from "../../images/Calender1.svg";
import DeleteBin2 from "../../images/DeleteBin2.svg";
import SaveChanges from "../../images/SaveChanges.svg";
import { db } from "../../firebase";
import { doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { showToast } from "../../components/ToastProvider"; // adjust path if needed
// Add these imports at the top (merge with existing ones)
import { collection, addDoc, serverTimestamp, Timestamp,  } from "firebase/firestore";
import { sendEmail } from '../../services/emailService'; // ← this fixes the sendEmail error
import SmtpConfigModal from '../../components/SmtpConfigModal'; // adjust path if needed




const EventEditorModal = ({ open, onClose, event, setTriggerFetchInterviews }) => {
  const [form, setForm] = useState({
    interviewDate: "",
    interviewTime: "",
    durationMinutes: "45",
    interviewerName: "",
    interviewerEmail: "",
    additionalInvites: "",
    rescheduleReason: "",
  });

  const [isSaving, setIsSaving] = useState(false); // ← NEW: loading state
  const [showSmtpWarning, setShowSmtpWarning] = useState(false);
const [showSmtpConfig, setShowSmtpConfig] = useState(false);
const [showPreview, setShowPreview] = useState(false);
const [previousData, setPreviousData] = useState(null); // to show old values in preview

const isFormInvalid =
  !form.interviewDate ||
  !form.interviewTime ||
  !form.durationMinutes ||
  !form.interviewerName?.trim() ||
  !form.interviewerEmail?.trim() ||
  !form.rescheduleReason?.trim();

  useEffect(() => {
    if (event) {
      const dateObj = event.interviewDate;
      const dateStr = dateObj ? dateObj.toISOString().split("T")[0] : "";
      const timeStr = dateObj ? dateObj.toTimeString().slice(0, 5) : "";

      setForm({
        interviewDate: dateStr,
        interviewTime: timeStr,
        durationMinutes: event.durationMinutes?.toString() || "45",
        interviewerName: event.interviewerName || "",
        interviewerEmail: event.interviewerEmail || "",
        additionalInvites: event.additionalInvites?.join(", ") || "",
      });
    }
  }, [event]);

  if (!open || !event) return null;

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };


// const handleSave = async () => {
//   setIsSaving(true); // Start loading

//   try {
//     const startDateObj = new Date(`${form.interviewDate}T${form.interviewTime}:00`);

//     if (isNaN(startDateObj.getTime())) {
//       showToast("error", "Please select a valid date and time.", "Invalid Date/Time");
//       return;
//     }

//     // Require reason
//     if (!form.rescheduleReason || !form.rescheduleReason.trim()) {
//       showToast("warning", "Please provide a reason for rescheduling.", "Reason Required");
//       return;
//     }

//     await new Promise((resolve) => setTimeout(resolve, 1200));

//     const interviewRef = doc(db, "interviewMaster", event.id);

//     const snap = await getDoc(interviewRef);
//     const existingData = snap.exists() ? snap.data() : {};

//     const previousDate = existingData?.interviewDate
//       ? existingData.interviewDate.toDate
//         ? existingData.interviewDate.toDate()
//         : new Date(existingData.interviewDate)
//       : null;

//     const existingHistory = existingData?.rescheduleHistory || [];

//     const newHistoryEntry = {
//       rescheduledAt: new Date(),
//       rescheduledBy: form.interviewerEmail.trim(),
//       previousDate,
//       newDate: startDateObj,
//       reason: form.rescheduleReason.trim(),
//       status: "scheduled-pending",
//     };

//     const updates = {
//       interviewDate: startDateObj,
//       durationMinutes: Number(form.durationMinutes),
//       interviewerName: form.interviewerName.trim(),
//       interviewerEmail: form.interviewerEmail.trim(),
//       additionalInvites: form.additionalInvites
//         .split(",")
//         .map((e) => e.trim())
//         .filter(Boolean),
//       updatedAt: new Date(),
//       rescheduleHistory: [...existingHistory, newHistoryEntry],
//     };

//     await updateDoc(interviewRef, updates);

//     setTriggerFetchInterviews((prev) => prev + 1);

//     showToast("success", "Interview updated and history recorded.", "Interview Rescheduled Successfully");

//     // NEW: Send reschedule notification email (no calendar redirection)
//     const candidateFullName = `${event.first_Name} ${event.lastName}`;
//     const emailPayload = {
//       companyId: event.companyId || "default-company-id",
//       title: `Interview Rescheduled: ${event.jobTitle} - ${candidateFullName}`,
//       message: `Dear ${candidateFullName},\n\n` +
//             `Your interview has been rescheduled.\n\n` +
//             `New Date & Time: ${startDateObj.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}\n` +
//             `Duration: ${form.durationMinutes} minutes\n` +
//             `Interviewer: ${form.interviewerName} (${form.interviewerEmail})\n\n` +
//             `Job Location: ${event.jobLocation || 'N/A'}\n\n` +
//             `We look forward to seeing you!\n\n` +
//             `Best regards,\n${form.interviewerName}\n${event.companyName || 'Infomanav'}`,
//       members: [
//         event.userEmail.trim(),
//         form.interviewerEmail.trim(),
//         ...(form.additionalInvites.trim() ? form.additionalInvites.split(',').map(e => e.trim()) : []),
//       ].filter(Boolean),
//       ...(event.interviewMode === 'online' && event.meetLink ? { meetingLink: event.meetLink } : {}),
//       date: startDateObj.toString(),
//       time: form.interviewTime,
//       createdBy: form.interviewerEmail.trim() || 'system',
//     };

//     try {
//       await sendEmail(emailPayload);
//       showToast("success", "Reschedule notification sent to all participants", "Email Sent");
//     } catch (emailErr) {
//       console.error("Email sending failed:", emailErr);
//       showToast("warning", "Interview updated, but email notification failed", "Partial Success");
//     }

//     onClose();

//   } catch (err) {
//     console.error("Update error:", err);
//     showToast("error", "Failed to reschedule interview. Try again.", "Error");
//   } finally {
//     setIsSaving(false);
//   }
// };

const handleSave = async () => {
  setIsSaving(true);

  // 1. Early validation — stop here if anything critical is missing
  if (!form.interviewDate || !form.interviewTime) {
    showToast("error", "Please select both date and time.", "Missing Date/Time");
    setIsSaving(false);
    return;
  }

  if (!form.rescheduleReason?.trim()) {
    showToast("warning", "Please provide a reason for rescheduling.", "Reason Required");
    setIsSaving(false);
    return;
  }

  try {
    const startDateObj = new Date(`${form.interviewDate}T${form.interviewTime}:00`);

    if (isNaN(startDateObj.getTime())) {
      showToast("error", "Invalid date or time format. Please select again.", "Invalid Date/Time");
      return;
    }

    // SES config check (updated naming)
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
    console.log("SES config check in EventEditorModal:", { useCustomSesConfig, companyId: event.companyId });

    if (useCustomSesConfig) {
      // Custom SES active → show preview directly
      await showPreviewWithData();
    } else {
      // Show warning first
      setShowSmtpWarning(true);
    }
  } catch (err) {
    console.error("Preview preparation failed:", err);
    showToast("error", "Failed to prepare preview. Check console for details.", "Error");
  } finally {
    setIsSaving(false);
  }
};

// Helper to fetch old data and show preview (called from multiple places)
const showPreviewWithData = async () => {
  try {
    const interviewRef = doc(db, "interviewMaster", event.id);
    const snap = await getDoc(interviewRef);

    if (!snap.exists()) {
      showToast("error", "Interview not found.", "Error");
      return;
    }

    const existingData = snap.data();
    setPreviousData(existingData);
    setShowPreview(true);
  } catch (err) {
    console.error("Preview data fetch error:", err);
    showToast("error", "Failed to load preview data.", "Error");
  }
};

// Helper function - actual save logic (extracted so we can call it from multiple places)
const performSave = async (startDateObj) => {
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const interviewRef = doc(db, "interviewMaster", event.id);

  const snap = await getDoc(interviewRef);
  const existingData = snap.exists() ? snap.data() : {};

  const previousDate = existingData?.interviewDate
    ? existingData.interviewDate.toDate
      ? existingData.interviewDate.toDate()
      : new Date(existingData.interviewDate)
    : null;

  const existingHistory = existingData?.rescheduleHistory || [];

  const newHistoryEntry = {
    rescheduledAt: new Date(),
    rescheduledBy: form.interviewerEmail.trim(),
    previousDate,
    newDate: startDateObj,
    reason: form.rescheduleReason.trim(),
    status: "scheduled-pending",
  };

  const updates = {
    interviewDate: startDateObj,
    durationMinutes: Number(form.durationMinutes),
    interviewerName: form.interviewerName.trim(),
    interviewerEmail: form.interviewerEmail.trim(),
    additionalInvites: form.additionalInvites
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean),
    updatedAt: new Date(),
    rescheduleHistory: [...existingHistory, newHistoryEntry],
  };

  await updateDoc(interviewRef, updates);

  setTriggerFetchInterviews((prev) => prev + 1);

  // Send reschedule email
  const candidateFullName = `${event.first_Name} ${event.lastName}`;
  const emailPayload = {
    companyId: event.companyId || "default-company-id",
    title: `Interview Rescheduled: ${event.jobTitle} - ${candidateFullName}`,
    message: `
Dear ${candidateFullName},

Your interview has been <strong>rescheduled</strong>.

<strong>New Date & Time:</strong> ${startDateObj.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
<strong>Duration:</strong> ${form.durationMinutes} minutes
<strong>Interviewer:</strong> ${form.interviewerName.trim()} (${form.interviewerEmail.trim()})

<strong>Job Location:</strong> ${event.jobLocation || 'N/A'}

${event.interviewMode === 'online' && event.meetLink ? `
<strong>Meeting Link:</strong>
${event.meetLink}
` : ''}

We look forward to seeing you!

Best regards,  
<strong>${form.interviewerName.trim()}</strong>  
${event.companyName || 'Infomanav'}
    `.trim(),
    members: [
      event.userEmail.trim(),
      form.interviewerEmail.trim(),
      ...(form.additionalInvites.trim() 
        ? form.additionalInvites.split(',').map(e => e.trim()) 
        : []),
    ].filter(Boolean),
    ...(event.interviewMode === 'online' && event.meetLink 
      ? { meetingLink: event.meetLink } 
      : {}),
    date: startDateObj.toString(),
    time: form.interviewTime,
    createdBy: form.interviewerEmail.trim() || 'system',
  };

  let emailSuccess = true;
  try {
    await sendEmail(emailPayload);
  } catch (emailErr) {
    console.error("Email sending failed:", emailErr);
    emailSuccess = false;
  }

  // ONLY ONE TOAST at the end
  if (emailSuccess) {
    showToast("success", "Interview rescheduled successfully.", "Success");
  } else {
    showToast("warning", "Interview rescheduled, but email notification failed.", "Partial Success");
  }

  onClose();
};


  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this interview?")) return;

    try {
      const interviewRef = doc(db, "interviewMaster", event.id);
      await deleteDoc(interviewRef);

      showToast("success", "Event removed from database. Please manually remove it from Google Calendar if it exists.", "Interview Deleted");

      setTriggerFetchInterviews((prev) => prev + 1);
      onClose();

    } catch (err) {
      console.error("Delete error:", err);
      showToast("error", "Failed to delete interview.", "Error");
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
            <h2>Edit Interview</h2>
          </div>
          <button className="event-editor-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Read-only Info - Top Section */}
        <div style={{ padding: "16px 24px", background: "#f8fafc", borderRadius: "12px", marginBottom: "24px" }}>
          <div style={{ marginBottom: "12px" }}>
            <strong>Candidate:</strong> {event.first_Name} {event.lastName} ({event.userEmail})
          </div>
          <div style={{ marginBottom: "12px" }}>
            <strong>Job:</strong> {event.jobTitle} • {event.jobLocation || "N/A"}
          </div>
          <div>
            <strong>Scheduled By:</strong> {event.scheduledBy || "Unknown"}
          </div>
        </div>

        {/* Editable Form */}
        <div className="event-editor-body" style={{marginBottom:"25px"}}>

  {/* Date & Time */}
  <div className="field-row">
    <div className="field-group">
      <label>Date <span style={{ color: 'red' }}>*</span></label>

      <input
        type="date"
        value={form.interviewDate}
        onChange={handleChange("interviewDate")}
        min={new Date().toISOString().split("T")[0]}
        disabled={isSaving}
        style={{
          border: !form.interviewDate ? "1px solid #dc2626" : "1px solid #e8e8e8"
        }}
      />
    </div>

    <div className="field-group">
      <label>Time <span style={{ color: 'red' }}>*</span></label>

      <input
        type="time"
        value={form.interviewTime}
        onChange={handleChange("interviewTime")}
        step="900"
        disabled={isSaving}
        style={{
          border: !form.interviewTime ? "1px solid #dc2626" : "1px solid #e8e8e8"
        }}
      />
    </div>
  </div>

  {(!form.interviewDate || !form.interviewTime) && (
    <p style={{
      color: "#dc2626",
      fontSize: "13px",
      margin: "4px 0 14px 2px",
      fontWeight: 500
    }}>
      Please select both the interview date and time.
    </p>
  )}

  {/* Duration */}
  <div className="field-group">
    <label>Duration <span style={{ color: 'red' }}>*</span></label>

    <select
      style={{
        padding: "10px",
        borderRadius: "100px",
        border: !form.durationMinutes ? "1px solid #dc2626" : "1px solid #e8e8e8"
      }}
      value={form.durationMinutes}
      onChange={handleChange("durationMinutes")}
      disabled={isSaving}
    >
      <option value="15">15 minutes</option>
      <option value="30">30 minutes</option>
      <option value="45">45 minutes</option>
      <option value="60">60 minutes</option>
    </select>
  </div>

  {/* Interviewer Name */}
  <div className="field-group">
    <label>Interviewer Name <span style={{ color: 'red' }}>*</span></label>

    <input
      type="text"
      value={form.interviewerName}
      onChange={handleChange("interviewerName")}
      disabled={isSaving}
      style={{
        border: !form.interviewerName ? "1px solid #dc2626" : "1px solid #e8e8e8"
      }}
    />

    {!form.interviewerName && (
      <p style={{
        color: "#dc2626",
        fontSize: "13px",
        margin: "4px 0 10px 2px",
        fontWeight: 500
      }}>
        Please enter the interviewer's name.
      </p>
    )}
  </div>

  {/* Interviewer Email */}
  <div className="field-group">
    <label>Interviewer Email <span style={{ color: 'red' }}>*</span></label>

    <input
      type="email"
      value={form.interviewerEmail}
      onChange={handleChange("interviewerEmail")}
      disabled={isSaving}
      style={{
        border: !form.interviewerEmail ? "1px solid #dc2626" : "1px solid #e8e8e8"
      }}
    />

    {!form.interviewerEmail && (
      <p style={{
        color: "#dc2626",
        fontSize: "13px",
        margin: "4px 0 10px 2px",
        fontWeight: 500
      }}>
        Please enter the interviewer's email.
      </p>
    )}
  </div>

  {/* Additional Invites */}
  <div className="field-group">
    <label>Additional Invites (comma separated)</label>

    <textarea
      rows={1}
      value={form.additionalInvites}
      onChange={handleChange("additionalInvites")}
      placeholder="hr@infomanav.com, manager@infomanav.com"
      disabled={isSaving}
      style={{
        height:"90px"
      }}
    />
  </div>

  {/* Reschedule Reason */}
  <div className="field-group"
  
  >
    <label>Reschedule Reason <span style={{ color: 'red' }}>*</span></label>

    <textarea
      rows={2}
      value={form.rescheduleReason || ""}
      onChange={handleChange("rescheduleReason")}
      placeholder="Reason for rescheduling (e.g., Candidate unavailable, Interviewer conflict, etc.)"
      disabled={isSaving}
      style={{
        border: !form.rescheduleReason ? "1px solid #dc2626" : "1px solid #e8e8e8",
        height:"90px"        
      }}
    />

    {!form.rescheduleReason && (
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

        {/* Warning */}
       

        {/* Footer */}
        <div className="event-editor-footer">
          <button
            className="btn-secondary1"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              className="btn-danger1"
              onClick={handleDelete}
              disabled={isSaving}
            >
              <img src={DeleteBin2} alt="" />
              <span style={{marginLeft:"10px"}}>Delete</span>
            </button>

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
            <span>{isSaving ? "Saving changes..." : "Save Changes"}</span>
          </button>
          </div>
        </div>

              {/* SMTP Warning Modal */}
{showSmtpWarning && (
  <div style={{
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    zIndex: 1002, // higher than main modal
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
            showPreviewWithData(); // now shows preview instead of direct save
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
  onSuccess={async () => {
    showPreviewWithData(); // show preview after SMTP success
  }}
/>

{/* Preview / Review Modal */}
{showPreview && (
  <div style={{
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    zIndex: 1003,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  }}>
    <div style={{
      background: '#fff',
      padding: '32px',
      borderRadius: '12px',
      maxWidth: '600px',
      width: '100%',
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
    }}>
      <h2 style={{ margin: '0 0 24px', color: '#1e293b' }}>Review Reschedule Changes</h2>

      <div style={{ marginBottom: '20px' }}>
        <strong>Candidate:</strong> {event.first_Name} {event.lastName} ({event.userEmail})
      </div>

      <div style={{ marginBottom: '20px' }}>
        <strong>Old Date/Time:</strong> {previousData?.interviewDate ? new Date(previousData.interviewDate.toDate()).toLocaleString('en-IN') : 'N/A'}<br />
        <strong>New Date/Time:</strong> {new Date(`${form.interviewDate}T${form.interviewTime}:00`).toLocaleString('en-IN')}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <strong>Old Duration:</strong> {previousData?.durationMinutes || 'N/A'} minutes<br />
        <strong>New Duration:</strong> {form.durationMinutes} minutes
      </div>

      <div style={{ marginBottom: '20px' }}>
        <strong>Old Interviewer:</strong> {previousData?.interviewerName || 'N/A'} ({previousData?.interviewerEmail || 'N/A'})<br />
        <strong>New Interviewer:</strong> {form.interviewerName} ({form.interviewerEmail})
      </div>

      <div style={{ marginBottom: '20px' }}>
        <strong>Additional Invites (old):</strong> {previousData?.additionalInvites?.join(', ') || 'None'}<br />
        <strong>Additional Invites (new):</strong> {form.additionalInvites.trim() || 'None'}
      </div>

      <div style={{ marginBottom: '24px' }}>
        <strong>Reschedule Reason:</strong> {form.rescheduleReason.trim()}
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '32px' }}>
        <button
          onClick={() => setShowPreview(false)}
          style={{ padding: '10px 20px', border: '1px solid #d1d5db', background: '#fff', borderRadius: '8px' }}
        >
          Back to Edit
        </button>
        <button
          onClick={async () => {
            setShowPreview(false);
            const startDateObj = new Date(`${form.interviewDate}T${form.interviewTime}:00`);
            await performSave(startDateObj);
          }}
          disabled={isSaving}
          style={{ padding: '10px 20px', background: '#FFAB49', color: 'white', border: 'none', borderRadius: '8px' }}
        >
          {isSaving ? "Rescheduling..." : "Confirm & Reschedule"}
        </button>
      </div>
    </div>
  </div>
)}


      </div>


    </div>
  );
};

export default EventEditorModal;