import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, Timestamp, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { showToast } from '../../components/ToastProvider';
import { sendEmail } from '../../services/emailService';
import SmtpConfigModal from '../../components/SmtpConfigModal'; // Make sure path is correct

function InterviewScheduler({
  candidate,
  setShowInterviewScheduler,
  handleUpdateCandidateStatus,
  setTriggerFetchInterviews,
}) {
  const [interviewerName, setInterviewerName] = useState('');
  const [interviewerEmail, setInterviewerEmail] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('45');
  const [additionalInvites, setAdditionalInvites] = useState('');
  const [message, setMessage] = useState('');
  const [companyName] = useState(candidate?.companyName || '');
  const [showModal, setShowModal] = useState(false);
  const [interviewMode, setInterviewMode] = useState('online');
  const [meetLink, setMeetLink] = useState('');
  const [showManualLinkInput, setShowManualLinkInput] = useState(false);
  const [manualMeetLink, setManualMeetLink] = useState('');
  const [interviewLocation, setInterviewLocation] = useState('');
  const [loadingMeet, setLoadingMeet] = useState(false);
  const [smtpData, setSmtpData] = useState(null);           // to store SMTP details after test
const [showSmtpConfirm, setShowSmtpConfirm] = useState(false); // to control SMTP confirmation modal
const API_BASE = process.env.REACT_APP_JOB_PORTAL_API_BASE_URL;


  // NEW states for SMTP flow
  const [showSmtpWarning, setShowSmtpWarning] = useState(false);
  const [showSmtpConfig, setShowSmtpConfig] = useState(false);

  // Pre-fill interviewer from sessionStorage
  useEffect(() => {
    const email = sessionStorage.getItem('email') || '';
    let name = sessionStorage.getItem('name') || '';

    if (!name) {
      try {
        const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
        name = userData.name || '';
      } catch (e) {
        console.warn('Failed to parse userData', e);
      }
    }

    setInterviewerEmail(email);
    setInterviewerName(name);
  }, []);

  // Rebuild default message
useEffect(() => {
  if (!candidate) return;

  const candidateFullName = `${candidate.first_Name} ${candidate.lastName}`;
  const formattedDateTime = date && time
    ? new Date(`${date}T${time}`).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '[Date & Time]';

  let msg = `Hi <strong>${candidateFullName}</strong>,\n\n`;

  msg += `Your interview for the <strong>${candidate.jobTitle}</strong> position at <strong>${companyName}</strong> is <strong>scheduled</strong>.\n\n`;

  msg += `<strong>📅 Date & Time:</strong> ${formattedDateTime}\n`;
  msg += `<strong>⏱ Duration:</strong> ${duration} minutes\n`;
  msg += `<strong>👤 Interviewer:</strong> ${interviewerName || '[Your Name]'} (${interviewerEmail || '[Your Email]'})`;

  if (interviewMode === 'offline' && interviewLocation.trim()) {
    msg += `\n<strong>📍 Interview Location:</strong> ${interviewLocation.trim()}`;
  }

  msg += `\n\n<strong>Job Location:</strong> ${candidate.jobLocation || 'N/A'}\n`;

  msg += `${
    interviewMode === 'online'
      ? 'Please join on time via the <strong>Google Meet link</strong> in this notification.'
      : 'Please arrive at the specified location on time.'
  }\n\n`;

  msg += `Looking forward to speaking with you!\n\nBest regards,\n<strong>${interviewerName}</strong>\n${companyName}`;

  setMessage(msg);
}, [date, time, duration, interviewerName, interviewerEmail, candidate, companyName, interviewMode, interviewLocation]);

  const resetToDefaultMessage = () => setMessage('');

  // const createGoogleMeet = async () => {
  //   setLoadingMeet(true);
  //   try {
  //     // const response = await fetch('http://rt.infomanav.in:8007/create_meet', {
  //     const response = await fetch('https://rt.infomanav.in/8007/create_meet/', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({}),
  //     });

  //     if (!response.ok) throw new Error(`HTTP ${response.status}`);

  //     const data = await response.json();
  //     if (data.meet_link) {
  //       setMeetLink(data.meet_link);
  //       return data.meet_link;
  //     }
  //     throw new Error('No meet_link');
  //   } catch (err) {
  //     console.error('Meet API error:', err);
  //     showToast("error", "Failed to create Meet link", "API Error");
  //     setShowManualLinkInput(true);
  //     return null;
  //   } finally {
  //     setLoadingMeet(false);
  //   }
  // };




const createGoogleMeet = async () => {
  setLoadingMeet(true);

  try {
    const response = await fetch(
      `${API_BASE}/api/meet/create-meet`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (data?.meet_link) {
      setMeetLink(data.meet_link);

      showToast(
        "success",
        "Google Meet link created successfully",
        "Success"
      );

      return data.meet_link;
    }

    throw new Error("No meet_link received from API");

  } catch (err) {
    console.error("Meet API error:", err);

    showToast(
      "error",
      "Failed to create Google Meet link",
      "API Error"
    );

    setShowManualLinkInput(true);
    return null;

  } finally {
    setLoadingMeet(false);
  }
};

 const handleScheduleClick = async () => {
  if (!date || !time) {
    showToast("error", "Date and Time required", "Missing Fields");
    return;
  }

  if (interviewMode === 'online' && (!interviewerName.trim() || !interviewerEmail.trim())) {
    showToast("error", "Interviewer details required for online", "Missing Fields");
    return;
  }

  if (interviewMode === 'offline' && !interviewLocation.trim()) {
    showToast("error", "Interview location required for offline", "Missing Location");
    return;
  }

  // Check useCustomSesConfig
  if (!candidate?.companyId) {
    showToast("error", "Company ID missing. Cannot check email config status.", "Error");
    return;
  }

  try {
    const companyRef = doc(db, "companyMaster", candidate.companyId);
    const companySnap = await getDoc(companyRef);

    if (!companySnap.exists()) {
      showToast("error", "Company not found in database.", "Error");
      return;
    }

    const useCustomSesConfig = companySnap.data()?.useCustomSesConfig || false;

    if (!useCustomSesConfig) {
      setShowSmtpWarning(true); // You can rename this state to setShowSesWarning later if desired
      return; // wait for user choice
    }

    // If custom SES is activated → proceed
    if (interviewMode === 'online' && !meetLink) {
      await createGoogleMeet();
    }

    setShowModal(true);
  } catch (err) {
    console.error("SES config check error:", err);
    showToast("error", "Failed to check custom email configuration. Using default.", "Partial Error");
    // Fallback: proceed with default/global SES
    if (interviewMode === 'online' && !meetLink) {
      await createGoogleMeet();
    }
    setShowModal(true);
  }
};

  const handleConfirm = async () => {
    const startDateObj = new Date(`${date}T${time}:00`);
    if (startDateObj <= new Date()) {
      showToast("error", "Select future date/time", "Invalid Date");
      return;
    }

    if (interviewMode === 'offline' && !interviewLocation.trim()) {
      showToast("error", "Interview location required for offline mode", "Missing Location");
      return;
    }

    let finalMeetLink = null;

    if (interviewMode === 'online') {
      finalMeetLink = meetLink;
      if (!finalMeetLink && showManualLinkInput) {
        if (!manualMeetLink.trim()) {
          showToast("warning", "Enter manual Meet link", "Missing Link");
          return;
        }
        finalMeetLink = manualMeetLink.trim();
      }
    }

    showToast("success", "Saving interview...", "Processing");

    const interviewData = {
      applicationId: candidate.id || candidate.applicationId || '',
      companyId: candidate.companyId || '',
      jobId: candidate.jobId || '',
      appliedDate: candidate.appliedDate || '',
      companyName,
      companyEmail: candidate.companyEmail || '',
      jobLocation: candidate.jobLocation || '',
      jobTitle: candidate.jobTitle || '',
      first_Name: candidate.first_Name || '',
      lastName: candidate.lastName || '',
      resumeUrl: candidate.resumeUrl || '',
      userEmail: candidate.userEmail || '',
      category: "Interviews",

      interviewerName: interviewMode === 'online' ? interviewerName.trim() : null,
      interviewerEmail: interviewMode === 'online' ? interviewerEmail.trim() : null,
      interviewDate: Timestamp.fromDate(startDateObj),
      durationMinutes: Number(duration),
      additionalInvites: additionalInvites.trim()
        ? additionalInvites.split(',').map(e => e.trim()).filter(Boolean)
        : [],
      message: message.trim(),
      interviewMode,
      meetLink: finalMeetLink,
      interviewLocation: interviewMode === 'offline' ? interviewLocation.trim() : null,
      status: "scheduled-pending",
      createdAt: serverTimestamp(),
      scheduledBy: interviewerEmail.trim() || 'unknown',
    };

    try {
      const docRef = await addDoc(collection(db, "interviewMaster"), interviewData);
      console.log("Interview saved with ID:", docRef.id);
      showToast("success", "Interview saved successfully", "Success");
    } catch (err) {
      console.error("Firebase save error:", err);
      showToast("error", "Failed to save interview", "Database Error");
      return;
    }

    const emailPayload = {
      companyId: candidate.companyId || "default-company-id",
      title: `Interview Scheduled: ${candidate.jobTitle} - ${candidateFullName}`,
      message,
      members: [
        candidate.userEmail,
        ...(interviewMode === 'online' ? [interviewerEmail.trim()] : []),
        ...(additionalInvites.trim() ? additionalInvites.split(',').map(e => e.trim()) : []),
      ].filter(Boolean),
      ...(interviewMode === 'online' && finalMeetLink ? { meetingLink: finalMeetLink } : {}),
      date: startDateObj.toString(),
      time,
      createdBy: interviewerEmail.trim() || 'system',
      ...(interviewMode === 'online' ? { duration: Number(duration), category: "Interview" } : {}),
    };

    try {
      const emailResult = await sendEmail(emailPayload);
      console.log('Email queued successfully:', emailResult);
      showToast("success", "Notification email queued", "Email Sent");
    } catch (err) {
      console.error("Email error:", err);
      showToast("warning", "Interview saved, but email failed to queue", "Partial Success");
    }

    handleUpdateCandidateStatus(candidate.id, 'Interview Scheduled');
    setTriggerFetchInterviews(prev => prev + 1);

    setShowModal(false);
    setShowInterviewScheduler(false);
  };

  const candidateFullName = `${candidate.first_Name} ${candidate.lastName}`;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999,
      overflowY: 'auto',
      padding: '20px',
    }}>
      <div style={{
        position: 'relative',
        background: '#fff',
        padding: '32px 24px',
        borderRadius: '12px',
        maxWidth: '560px',
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
      }}>
        {/* Close button */}
        <button
          onClick={() => setShowInterviewScheduler(false)}
          style={{
            position: 'absolute',
            top: '12px',
            right: '16px',
            background: 'none',
            border: 'none',
            fontSize: '28px',
            color: '#6b7280',
            cursor: 'pointer',
            lineHeight: 1,
          }}
        >
          ×
        </button>

        <h2 style={{ margin: '0 0 24px 0', color: '#1e293b' }}>Schedule Interview</h2>

        {/* Candidate Info */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
            Candidate Name <span style={{ color: 'red' }}>*</span>
          </label>
          <input type="text" value={candidateFullName} readOnly style={inputStyleReadOnly} />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
            Candidate Email <span style={{ color: 'red' }}>*</span>
          </label>
          <input type="email" value={candidate.userEmail} readOnly style={inputStyleReadOnly} />
        </div>

        {/* Interview Mode */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            Interview Mode <span style={{ color: 'red' }}>*</span>
          </label>
          <div style={{ display: 'flex', gap: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="radio"
                checked={interviewMode === 'online'}
                onChange={() => setInterviewMode('online')}
              />
              Online (Google Meet)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="radio"
                checked={interviewMode === 'offline'}
                onChange={() => setInterviewMode('offline')}
              />
              Offline
            </label>
          </div>
        </div>

        {/* Online fields */}
       {interviewMode === 'online' && (
  <>
    {/* Interviewer Name */}
    <div style={{ marginBottom: '6px' }}>
      <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
        Interviewer Name <span style={{ color: 'red' }}>*</span>
      </label>

      <input
        type="text"
        value={interviewerName}
        onChange={e => setInterviewerName(e.target.value)}
        style={{
          ...inputStyle,
          border: !interviewerName ? "1px solid #dc2626" : inputStyle.border
        }}
        required
      />
    </div>

    {!interviewerName && (
      <p
        style={{
          color: "#dc2626",
          fontSize: "13px",
          margin: "4px 0 14px 2px",
          fontWeight: 500
        }}
      >
        Please enter the interviewer's name.
      </p>
    )}

    {/* Interviewer Email */}
    <div style={{ marginBottom: '6px' }}>
      <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
        Interviewer Email <span style={{ color: 'red' }}>*</span>
      </label>

      <input
        type="email"
        value={interviewerEmail}
        onChange={e => setInterviewerEmail(e.target.value)}
        style={{
          ...inputStyle,
          border: !interviewerEmail ? "1px solid #dc2626" : inputStyle.border
        }}
        required
      />
    </div>

    {!interviewerEmail && (
      <p
        style={{
          color: "#dc2626",
          fontSize: "13px",
          margin: "4px 0 14px 2px",
          fontWeight: 500
        }}
      >
        Please enter the interviewer's email.
      </p>
    )}

    {/* Additional Invites */}
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
        Additional Invites (optional)
      </label>

      <input
        type="text"
        value={additionalInvites}
        onChange={e => setAdditionalInvites(e.target.value)}
        placeholder="hr@infomanav.com, manager@infomanav.com"
        style={inputStyle}
      />
    </div>
  </>
)}

        {/* Offline location */}
        {interviewMode === 'offline' && (
  <>
    <div style={{ marginBottom: '6px' }}>
      <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
        Interview Location Address <span style={{ color: 'red' }}>*</span>
      </label>

      <input
        type="text"
        value={interviewLocation}
        onChange={e => setInterviewLocation(e.target.value)}
        placeholder="e.g. Infomanav Office, Andheri East, Mumbai - 400069"
        style={{
          ...inputStyle,
          border: !interviewLocation ? "1px solid #dc2626" : inputStyle.border
        }}
      />
    </div>

    {/* Warning */}
    {!interviewLocation && (
      <p
        style={{
          color: "#dc2626",
          fontSize: "13px",
          margin: "4px 0 14px 2px",
          fontWeight: 500
        }}
      >
        Please enter the interview location address.
      </p>
    )}
  </>
)}

       {/* Date + Time */}
<div style={{ display: 'flex', gap: '16px', marginBottom: '6px' }}>
  <div style={{ flex: 1 }}>
    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
      Date <span style={{ color: 'red' }}>*</span>
    </label>

    <input
      type="date"
      value={date}
      onChange={e => setDate(e.target.value)}
      min={new Date().toISOString().split('T')[0]}
      style={{
        ...inputStyle,
        border: !date ? "1px solid #dc2626" : inputStyle.border
      }}
      required
    />
  </div>

  <div style={{ flex: 1 }}>
    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
      Time <span style={{ color: 'red' }}>*</span>
    </label>

    <input
      type="time"
      value={time}
      onChange={e => setTime(e.target.value)}
      step="900"
      style={{
        ...inputStyle,
        border: !time ? "1px solid #dc2626" : inputStyle.border
      }}
      required
    />
  </div>
</div>

{/* Warning Message */}
{(!date || !time) && (
  <p
    style={{
      color: "#dc2626",
      fontSize: "13px",
      margin: "4px 0 14px 2px",
      fontWeight: 500
    }}
  >
    Please select both the interview date and time.
  </p>
)}

        {/* Duration */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
            Duration <span style={{ color: 'red' }}>*</span>
          </label>
          <select value={duration} onChange={e => setDuration(e.target.value)} style={selectStyle}>
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">60 minutes</option>
          </select>
        </div>

        {/* Message */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
            Message / Details <span style={{ color: 'red' }}>*</span>
          </label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={10}
            style={textareaStyle}
            required
          />
          <button
            type="button"
            onClick={resetToDefaultMessage}
            style={resetButtonStyle}
          >
            Reset to Default
          </button>
        </div>

        {/* Schedule Button */}
        <button
          onClick={handleScheduleClick}
          disabled={
            !date ||
            !time ||
            (interviewMode === 'offline' && !interviewLocation.trim()) ||
            (interviewMode === 'online' && (!interviewerName.trim() || !interviewerEmail.trim()))
          }
          style={{
            ...scheduleButtonStyle,
            opacity: (
              !date ||
              !time ||
              (interviewMode === 'offline' && !interviewLocation.trim()) ||
              (interviewMode === 'online' && (!interviewerName.trim() || !interviewerEmail.trim()))
            ) ? 0.6 : 1,
          }}
        >
          Schedule Interview
        </button>
      </div>

      {/* SMTP Warning Modal */}
      {showSmtpWarning && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3>Company Email Not Configured</h3>
            <p>Emails will be sent from Stolity's default address (no-reply@stolity.com). To send from your own company email, register your SMTP credentials first.</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={() => {
                  setShowSmtpWarning(false);
                  // Continue with Stolity SMTP
                  if (interviewMode === 'online' && !meetLink) {
                    createGoogleMeet();
                  }
                  setShowModal(true);
                }}
                style={cancelButtonStyle}
              >
                Continue with Stolity Email
              </button>
              <button
                onClick={() => {
                  setShowSmtpWarning(false);
                  setShowSmtpConfig(true);
                }}
                style={confirmButtonStyle}
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
      companyId={candidate.companyId}
      onSuccess={(smtpData) => {
        setSmtpData(smtpData);           // store for saving later
        setShowSmtpConfirm(true);        // open confirmation modal
      }}
    />

      {/* Confirmation Modal */} 
      {showModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3 style={{ margin: '0 0 20px 0', color: '#1e293b' }}>Confirm & Send Notification</h3>

            <div style={{ margin: '16px 0', lineHeight: '1.6' }}>
              <strong>Candidate:</strong> {candidateFullName} ({candidate.userEmail})<br />
              <strong>Mode:</strong> {interviewMode === 'online' ? 'Online (Google Meet)' : 'Offline'}<br />
              <strong>Date & Time:</strong> {date && time ? new Date(`${date}T${time}`).toLocaleString('en-IN') : '—'}<br />
              <strong>Duration:</strong> {duration} minutes<br />
              {interviewMode === 'online' && (
                <>
                  <strong>Interviewer:</strong> {interviewerName} ({interviewerEmail})<br />
                  {additionalInvites.trim() && <><strong>Additional invites:</strong> {additionalInvites}<br /></>}
                  {meetLink && <><strong>Meet Link:</strong> {meetLink}<br /></>}
                  {showManualLinkInput && (
                    <div style={{ marginTop: '16px' }}>
                      <label style={{ color: '#dc2626', fontWeight: 500 }}>
                        Enter Meet Link manually:
                      </label>
                      <input
                        type="url"
                        value={manualMeetLink}
                        onChange={e => setManualMeetLink(e.target.value)}
                        placeholder="https://meet.google.com/xxx-yyyy-zzz"
                        style={{ ...inputStyle, marginTop: '8px', width: '100%' }}
                      />
                    </div>
                  )}
                </>
              )}
              {interviewMode === 'offline' && interviewLocation.trim() && (
                <><strong>Location:</strong> {interviewLocation.trim()}<br /></>
              )}
            </div>

            <p style={{ color: '#4b5563', margin: '20px 0' }}>
              Clicking <strong>Yes, Send Notification</strong> will save interview details and send email to all participants.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={cancelButtonStyle}>
                Cancel
              </button>
              {/* <button onClick={handleConfirm} style={confirmButtonStyle}>
                Yes, Send Notification
              </button> */}
              <button
              onClick={handleConfirm}
              disabled={loadingMeet}
              style={{
                ...confirmButtonStyle,
                opacity: loadingMeet ? 0.6 : 1,
                cursor: loadingMeet ? "not-allowed" : "pointer",
              }}
            >
              {loadingMeet ? "Loading..." : "Yes, Send Notification"}
            </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles (unchanged)
const inputStyle = { width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '15px' };
const inputStyleReadOnly = { ...inputStyle, background: '#f3f4f6', cursor: 'not-allowed' };
const selectStyle = { ...inputStyle, appearance: 'auto' };
const textareaStyle = { ...inputStyle, resize: 'vertical', minHeight: '140px' };
const resetButtonStyle = { marginTop: '8px', padding: '8px 16px', background: '#e5e7eb', border: 'none', borderRadius: '6px', cursor: 'pointer' };
const scheduleButtonStyle = { width: '100%', padding: '14px', background: '#FFAB49', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' };
const modalOverlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalContentStyle = { background: 'white', padding: '24px', borderRadius: '12px', maxWidth: '480px', width: '90%', boxShadow: '0 10px 30px rgba(0,0,0,0.25)' };
const cancelButtonStyle = { padding: '10px 20px', background: '#e5e7eb', border: 'none', borderRadius: '6px', cursor: 'pointer' };
const confirmButtonStyle = { padding: '10px 20px', background: '#FFAB49', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' };

export default InterviewScheduler;