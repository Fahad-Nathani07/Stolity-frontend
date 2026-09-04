import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "../../firebase"; // ← adjust import path to your Firebase config
import { useToaster, Notification } from 'rsuite';   // ← import both
import { showToast } from '../../components/ToastProvider';


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
  const toaster = useToaster();

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

    const defaultMsg = `Hi ${candidateFullName},

Your interview for the ${candidate.jobTitle} position at ${companyName} is scheduled.

📅 Date & Time: ${formattedDateTime}
⏱ Duration: ${duration} minutes
👤 Interviewer: ${interviewerName || '[Your Name]'} (${interviewerEmail || '[Your Email]'})

Job Location: ${candidate.jobLocation || 'N/A'}
Please join on time via the Google Meet link in this calendar invite.

Looking forward to speaking with you!
Best regards,
${interviewerName}
${companyName}`;

    setMessage(defaultMsg);
  }, [date, time, duration, interviewerName, interviewerEmail, candidate, companyName]);

  const resetToDefaultMessage = () => {
    // Clear and let useEffect rebuild it
    setMessage('');
  };

  const handleScheduleClick = () => {
    if (!date || !time || !interviewerName.trim() || !interviewerEmail.trim()) {
      alert('Please fill all required fields');
      return;
    }
    setShowModal(true);
  };

const handleConfirm = async () => {
    const startDateObj = new Date(`${date}T${time}:00`);
    if (startDateObj <= new Date()) {
      alert('Please select a future date and time');
      return;
    }

    // 1. Show success toast (using useToaster)
      showToast(
        "success",
        "Setting up Google Calendar...",
        "Interview Scheduled"
      );

    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    handleUpdateCandidateStatus(candidate.id, 'Interview Scheduled');
    setTriggerFetchInterviews(prev => prev + 1); // trigger re-fetch of interviews in dashboard

    // 2. Save to Firebase (your existing logic)
    const interviewData = {
      applicationId: candidate.id || candidate.applicationId || '',
      companyId: candidate.companyId || '',
      jobId: candidate.jobId || '',
      appliedDate: candidate.appliedDate || '',
      companyName: companyName,
      companyEmail: candidate.companyEmail || '',
      jobLocation: candidate.jobLocation || '',
      jobTitle: candidate.jobTitle || '',
      first_Name: candidate.first_Name || '',
      lastName: candidate.lastName || '',
      resumeUrl: candidate.resumeUrl || '',
      userEmail: candidate.userEmail || '',
      category: "Interviews",

      interviewerName: interviewerName.trim(),
      interviewerEmail: interviewerEmail.trim(),
      interviewDate: Timestamp.fromDate(startDateObj),
      durationMinutes: Number(duration),
      additionalInvites: additionalInvites
        .split(',')
        .map(e => e.trim())
        .filter(Boolean),
      message: message.trim(),

      status: "scheduled-pending",
      createdAt: serverTimestamp(),
      scheduledBy: interviewerEmail.trim() || 'unknown',
    };

    try {
      const docRef = await addDoc(collection(db, "interviewMaster"), interviewData);
      console.log("Interview saved with ID:", docRef.id);
    } catch (error) {
      console.error("Firebase error:", error);
     showToast(
        "error",
        "Failed to save interview in database.",
        "Error"
      );
      // Optionally return here if you don't want to open calendar on DB failure
    }

    // 3. Open Google Calendar
    const endDateObj = new Date(startDateObj.getTime() + Number(duration) * 60000);

    const formatGoogleDate = (d) => {
      const pad = (n) => String(n).padStart(2, '0');
      return (
        d.getUTCFullYear() +
        pad(d.getUTCMonth() + 1) +
        pad(d.getUTCDate()) +
        'T' +
        pad(d.getUTCHours()) +
        pad(d.getUTCMinutes()) +
        '00Z'
      );
    };

    const start = formatGoogleDate(startDateObj);
    const end = formatGoogleDate(endDateObj);

    const attendees = [candidate.userEmail.trim(), interviewerEmail.trim()];
    if (additionalInvites.trim()) {
      attendees.push(...additionalInvites.split(',').map(e => e.trim()));
    }
    const addParam = attendees.join(',');

    const title = `${candidate.first_Name} ${candidate.lastName} | ${candidate.jobTitle} Interview - ${companyName}`;

    const calendarUrl =
      `https://calendar.google.com/calendar/render?action=TEMPLATE` +
      `&text=${encodeURIComponent(title)}` +
      `&dates=${start}/${end}` +
      `&add=${encodeURIComponent(addParam)}` +
      `&details=${encodeURIComponent(message)}`;

    window.open(calendarUrl, '_blank');

    // Close everything
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
        {/* Close (×) */}
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

        {/* Candidate */}
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

        {/* Interviewer */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
            Interviewer Name <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="text"
            value={interviewerName}
            onChange={e => setInterviewerName(e.target.value)}
            style={inputStyle}
            required
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
            Interviewer Email <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="email"
            value={interviewerEmail}
            onChange={e => setInterviewerEmail(e.target.value)}
            style={inputStyle}
            required
          />
        </div>

        {/* Date + Time */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
              Date <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              style={inputStyle}
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
              style={inputStyle}
              required
            />
          </div>
        </div>

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

        {/* Additional invites */}
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
          disabled={!date || !time || !interviewerName.trim() || !interviewerEmail.trim()}
          style={{
            ...scheduleButtonStyle,
            opacity: (!date || !time || !interviewerName.trim() || !interviewerEmail.trim()) ? 0.6 : 1,
          }}
        >
          Schedule Interview
        </button>
      </div>

      {/* Confirmation Modal with reminder instructions */}
      {showModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3 style={{ margin: '0 0 20px 0', color: '#1e293b' }}>Confirm Scheduling</h3>

            <div style={{ margin: '16px 0', lineHeight: '1.6' }}>
              <strong>Candidate:</strong> {candidateFullName} ({candidate.userEmail})<br />
              <strong>Interviewer:</strong> {interviewerName} ({interviewerEmail})<br />
              <strong>Date & Time:</strong> {date && time ? new Date(`${date}T${time}`).toLocaleString('en-IN') : '—'}<br />
              <strong>Duration:</strong> {duration} minutes<br />
              {additionalInvites.trim() && (
                <>
                  <strong>Additional invites:</strong> {additionalInvites}<br />
                </>
              )}
            </div>

            <p style={{ color: '#4b5563', margin: '20px 0' }}>
              Clicking <strong>Yes</strong> will open Google Calendar in a new tab.<br /><br />
              Please review and <strong>Save</strong> the event to:<br />
              • Add it to your calendar<br />
              • Send invite email to candidate immediately<br />
              • Auto-add Google Meet link<br /><br />
             
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={cancelButtonStyle}>
                Cancel
              </button>
              <button onClick={handleConfirm} style={confirmButtonStyle}>
                Yes, Open Calendar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles (same as before)
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