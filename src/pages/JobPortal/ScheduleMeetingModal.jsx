// src/components/RecruitmentCalenderModal/ScheduleMeetingModal.jsx
import React, { useState, useEffect } from "react";
import { Modal, Button, Input, InputNumber, DatePicker, TimePicker, Select, message } from "antd";
import { toaster, Notification } from "rsuite";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase"; // adjust path
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import axios from "axios";
import { fetchUpcomingInterviews, fetchMeetingsForCompany } from "../../store/interviewMasterSlice";
import { showToast } from "../../components/ToastProvider";
import { sendEmail } from '../../services/emailService'; // adjust path

import { doc, getDoc } from "firebase/firestore";
import SmtpConfigModal from '../../components/SmtpConfigModal'; // adjust path

const { Option } = Select;

const ScheduleMeetingModal = ({ visible, onClose, companyId }) => {
  const currentAdmin = useSelector((state) => state.usersAdmin?.currentUser);

  const [step, setStep] = useState(1); // 1 = form, 2 = review
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const API_BASE = process.env.REACT_APP_JOB_PORTAL_API_BASE_URL;


  // Form state
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [duration, setDuration] = useState(30);
  const [message, setMessage] = useState("");
  const [members, setMembers] = useState([]);
  const [meetingLink, setMeetingLink] = useState("");
  const [apiError, setApiError] = useState(false);

  const [showSmtpWarning, setShowSmtpWarning] = useState(false);
const [showSmtpConfig, setShowSmtpConfig] = useState(false);

  // Auto-generate message when date/time/title change
useEffect(() => {
  if (title && date && time) {
    const formattedDate = dayjs(date).format("MMMM D, YYYY");
    const formattedTime = dayjs(time).format("h:mm A");

    const autoMsg = `Hi team,

We will connect at <strong>${formattedTime}</strong> on <strong>${formattedDate}</strong> to discuss

<strong>"${title}"</strong>

Please come prepared with your thoughts, updates, and any questions.

Best regards,`;

    setMessage(autoMsg);
  }
}, [title, date, time]);

  // Handle "Next" – call API to get meeting link
  // const handleNext = async () => {
  //   // Validation
  //   if (!title.trim()) return message.error("Meeting title is required");
  //   if (!date) return message.error("Date is required");
  //   if (!time) return message.error("Time is required");
  //   if (!duration || duration < 15 || duration > 240) return message.error("Duration must be between 15 and 240 minutes");
  //   if (members.length === 0) return message.error("At least one participant email is required");

  //   // Optional: block past dates (allow today)
  //   if (dayjs(date).isBefore(dayjs().startOf("day"))) {
  //     return message.error("Date cannot be in the past");
  //   }

  //   setLoading(true);
  //   setApiError(false);
  //   setMeetingLink("");

  //   try {
  //     const response = await axios.post("http://rt.infomanav.in:8007/create_meet", {}, {
  //       headers: { "Content-Type": "application/json" },
  //     });

  //     const link = response.data.meet_link;
  //     if (link) {
  //       setMeetingLink(link);
  //     } else {
  //       setApiError(true);
  //     }
  //   } catch (err) {
  //     console.error("Meeting API failed:", err);
  //     setApiError(true);
  //   } finally {
  //     setLoading(false);
  //     setStep(2);
  //   }
  // };

  const handleNext = async () => {
  // Validation (unchanged)
  if (!title.trim()) return message.error("Meeting title is required");
  if (!date) return message.error("Date is required");
  if (!time) return message.error("Time is required");
  if (!duration || duration < 15 || duration > 240) return message.error("Duration must be between 15 and 240 minutes");
  if (members.length === 0) return message.error("At least one participant email is required");

  if (dayjs(date).isBefore(dayjs().startOf("day"))) {
    return message.error("Date cannot be in the past");
  }

  // NEW: Check isSMTPActivated before going to preview (step 2)
  if (!companyId) {
    message.error("Company ID missing.");
    return;
  }

  try {
    const companyRef = doc(db, "companyMaster", companyId);
    const companySnap = await getDoc(companyRef);

    if (!companySnap.exists()) {
      message.error("Company not found.");
      return;
    }

    const isSMTPActivated = companySnap.data()?.isSMTPActivated || false;
    console.log("SMTP check in ScheduleMeetingModal:", { isSMTPActivated });

    if (isSMTPActivated) {
      // Custom SMTP active → proceed normally
      proceedToNextStep();
    } else {
      // Show warning
      setShowSmtpWarning(true);
    }
  } catch (err) {
    console.error("SMTP check error:", err);
    showToast("error", "Failed to check email settings. Using default.", "Partial Error");
    proceedToNextStep(); // fallback
  }
};

// Helper function to avoid code duplication

const proceedToNextStep = async () => {
  setLoading(true);
  setApiError(false);
  setMeetingLink("");

  try {
    const response = await axios.post(
      `${API_BASE}/api/meet/create-meet`,
      {},
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    const link = response?.data?.meet_link;

    if (link) {
      setMeetingLink(link);
    } else {
      setApiError(true);
    }

  } catch (err) {
    console.error("Meeting API failed:", err);
    setApiError(true);

  } finally {
    setLoading(false);
    setStep(2);
  }
};




  // Final schedule – save to Firestore
  // const handleSchedule = async () => {
  //   if (!meetingLink && !apiError) {
  //     message.error("No meeting link available");
  //     return;
  //   }

  //   setLoading(true);

  //   // Combine date + time into one client-side Date object
  //   const startDateTime = dayjs(date)
  //     .hour(dayjs(time).hour())
  //     .minute(dayjs(time).minute())
  //     .second(0)
  //     .millisecond(0);

  //   const meetingData = {
  //     companyId,
  //     title: title.trim(),
  //     date: startDateTime.toDate(),        // ← FIXED: client-side exact Timestamp
  //     time: startDateTime.format("HH:mm"), // formatted for display (24h)
  //     duration,
  //     category: "Meetings",
  //     message: message.trim() || "No message provided",
  //     meetingLink: meetingLink || "MANUAL_LINK_NEEDED",
  //     members: members.map(m => m.trim()).filter(Boolean),
  //     status: "scheduled",
  //     createdBy: currentAdmin?.email || "unknown-admin",
  //     createdAt: serverTimestamp(),
  //   };

  //   try {
      
  //     await addDoc(collection(db, "meetingMaster"), meetingData);

  //    showToast(
  //       "success",
  //       "Meeting scheduled successfully!",
  //       "Success"
  //     );

  //     // TODO: sendEmail(meetingData); // future email trigger

  //     // TODO: Refresh calendar / meetings list here
  //   //   e.g. 
  //     dispatch(fetchMeetingsForCompany(companyId));

  //     onClose();
  //     setStep(1);
  //     // Reset form
  //     setTitle("");
  //     setDate(null);
  //     setTime(null);
  //     setDuration(30);
  //     setMessage("");
  //     setMembers([]);
  //     setMeetingLink("");
  //     setApiError(false);
  //   } catch (err) {
  //     console.error("Firestore save failed:", err);
  //       showToast(
  //         "error",
  //         "Failed to schedule meeting",
  //         "Error"
  //       );
  //   } finally {
  //     setLoading(false);
  //   }
  // };

//   const handleSchedule = async () => {
//   if (!meetingLink && !apiError) {
//     message.error("No meeting link available");
//     return;
//   }

//   setLoading(true);

//   // Combine date + time into one client-side Date object
//   const startDateTime = dayjs(date)
//     .hour(dayjs(time).hour())
//     .minute(dayjs(time).minute())
//     .second(0)
//     .millisecond(0);

//   const meetingData = {
//     companyId,
//     title: title.trim(),
//     date: startDateTime.toDate(),        // ← exact client-side Timestamp
//     time: startDateTime.format("HH:mm"), // formatted for display (24h)
//     duration,
//     category: "Meetings",
//     message: message.trim() || "No message provided",
//     meetingLink: meetingLink || "MANUAL_LINK_NEEDED",
//     members: members.map(m => m.trim()).filter(Boolean),
//     status: "scheduled",
//     createdBy: currentAdmin?.email || "unknown-admin",
//     createdAt: serverTimestamp(),
//   };

//   try {
//     // 🔍 Debug payload log
//     console.log("eeeee Payload Start =====================");
//     Object.entries(meetingData).forEach(([key, value]) => {
//       console.log(`eeeee ${key}:`, value);
//     });
//     console.log("eeeee Payload End =======================");

//     await addDoc(collection(db, "meetingMaster"), meetingData);

//     showToast(
//       "success",
//       "Meeting scheduled successfully!",
//       "Success"
//     );

//     dispatch(fetchMeetingsForCompany(companyId));

//     onClose();
//     setStep(1);

//     // Reset form
//     setTitle("");
//     setDate(null);
//     setTime(null);
//     setDuration(30);
//     setMessage("");
//     setMembers([]);
//     setMeetingLink("");
//     setApiError(false);

//   } catch (err) {
//     console.error("Firestore save failed:", err);
//     showToast(
//       "error",
//       "Failed to schedule meeting",
//       "Error"
//     );
//   } finally {
//     setLoading(false);
//   }
// };

const handleSchedule = async () => {
  if (!meetingLink && !apiError) {
    message.error("No meeting link available");
    return;
  }

  setLoading(true);

  // Combine date + time into one client-side Date object
  const startDateTime = dayjs(date)
    .hour(dayjs(time).hour())
    .minute(dayjs(time).minute())
    .second(0)
    .millisecond(0);

  const meetingData = {
    companyId,
    title: title.trim(),
    date: startDateTime.toDate(),        // exact client-side Timestamp
    time: startDateTime.format("HH:mm"), // formatted for display (24h)
    duration,
    category: "Meetings",
    message: message.trim() || "No message provided",
    meetingLink: meetingLink || "MANUAL_LINK_NEEDED",
    members: members.map(m => m.trim()).filter(Boolean),
    status: "scheduled",
    createdBy: currentAdmin?.email || "unknown-admin",
    createdAt: serverTimestamp(),
  };

  try {
    // Debug payload log (kept as-is)
    console.log("eeeee Payload Start =====================");
    Object.entries(meetingData).forEach(([key, value]) => {
      console.log(`eeeee ${key}:`, value);
    });
    console.log("eeeee Payload End =======================");

    // Save meeting to Firestore
    await addDoc(collection(db, "meetingMaster"), meetingData);

    showToast(
      "success",
      "Meeting scheduled successfully!",
      "Success"
    );

    dispatch(fetchMeetingsForCompany(companyId));

    // ────────────────────────────────────────────────
    // NEW: Send email notification after successful save
    // ────────────────────────────────────────────────
    const emailPayload = {
      companyId,
      title: `New Meeting Scheduled: ${title.trim()}`,
      message: message.trim() || "No message provided",
      members: members.map(m => m.trim()).filter(Boolean),
      meetingLink: meetingLink || "MANUAL_LINK_NEEDED",
      date: startDateTime.toString(),
      time: startDateTime.format("HH:mm"),
      duration,
      category: "Meetings",
      createdBy: currentAdmin?.email || "unknown-admin",
    };

    try {
      await sendEmail(emailPayload);
      showToast("success", "Meeting notification sent to all members", "Email Sent");
    } catch (emailErr) {
      console.error("Email sending failed:", emailErr);
      showToast("warning", "Meeting saved, but notification email failed", "Partial Success");
    }

    onClose();
    setStep(1);

    // Reset form
    setTitle("");
    setDate(null);
    setTime(null);
    setDuration(30);
    setMessage("");
    setMembers([]);
    setMeetingLink("");
    setApiError(false);

  } catch (err) {
    console.error("Firestore save failed:", err);
    showToast(
      "error",
      "Failed to schedule meeting",
      "Error"
    );
  } finally {
    setLoading(false);
  }
};
  

  const handleCancel = () => {
    setStep(1);
    onClose();
  };

  return (
   <>
  {visible && (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        padding: 20,
      }}
    >
      <div
        style={{
          width: step === 1 ? 640 : 720,
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          maxHeight: "90vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 28px",
            borderBottom: "1px solid #f0f0f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 600 }}>
            {step === 1
              ? "Schedule New Meeting"
              : "Review & Schedule Meeting"}
          </div>

          <div
            style={{ cursor: "pointer", fontSize: 18 }}
            onClick={handleCancel}
          >
            ✕
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "28px 32px", flex: 1 }}>

          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

              {/* Meeting Title */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                  Meeting Title *
                </div>
                <Input
                  size="large"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Follow-up Discussion with Candidate"
                />
              </div>

              {/* Date & Time */}
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                    Date *
                  </div>
                  <DatePicker
                    size="large"
                    style={{ width: "100%" }}
                    value={date}
                    onChange={setDate}
                    disabledDate={(current) =>
                      current && current < dayjs().startOf("day")
                    }
                    format="DD/MM/YYYY"
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                    Time *
                  </div>
                  <TimePicker
                    size="large"
                    style={{ width: "100%" }}
                    value={time}
                    onChange={setTime}
                    format="h:mm A"
                    use12Hours
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                  Duration (minutes) *
                </div>
                <InputNumber
                  size="large"
                  min={15}
                  max={240}
                  step={15}
                  value={duration}
                  onChange={setDuration}
                  style={{ width: "100%" }}
                />
              </div>

              {/* Participants */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                  Participants *
                </div>
                <Select
                  size="large"
                  mode="tags"
                  style={{ width: "100%" }}
                  placeholder="Enter email addresses"
                  value={members}
                  onChange={setMembers}
                  tokenSeparators={[",", " "]}
                />
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
                  Separate multiple emails using comma or space
                </div>
              </div>

              {/* Message */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                  Message (Editable)
                </div>
                <Input.TextArea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

            </div>
          )}

          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div
                style={{
                  background: "#fafafa",
                  padding: 22,
                  borderRadius: 14,
                  border: "1px solid #f0f0f0",
                }}
              >
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>Title</div>
                  <div style={{ fontWeight: 600 }}>{title}</div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>Date & Time</div>
                  <div>
                    {date && time
                      ? `${dayjs(date).format("DD/MM/YYYY")} at ${dayjs(time).format("h:mm A")}`
                      : "—"}
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>Duration</div>
                  <div>{duration} minutes</div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>Participants</div>
                  <div>{members.join(", ") || "None"}</div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>Message</div>
                  <div
                    style={{
                      background: "#fff",
                      padding: 14,
                      borderRadius: 10,
                      border: "1px solid #f0f0f0",
                      whiteSpace: "pre-wrap",
                      marginTop: 6,
                    }}
                  >
                    {message || "No message"}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>Meeting Link</div>

                  {apiError ? (
                    <Input
                      size="large"
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      placeholder="Paste Google Meet / Zoom link manually"
                      style={{ marginTop: 6 }}
                    />
                  ) : (
                    <a
                      href={meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-block",
                        marginTop: 6,
                        color: "#1677ff",
                        fontWeight: 500,
                      }}
                    >
                      {meetingLink || "Generating..."}
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div
          style={{
            padding: "18px 28px",
            borderTop: "1px solid #f0f0f0",
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
          }}
        >
          {step === 1 ? (
            <>
              <Button size="large" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                type="primary"
                size="large"
                loading={loading}
                onClick={handleNext}
                disabled={!title.trim() || !date || !time || !duration || members.length === 0}
              >
                Next
              </Button>
            </>
          ) : (
            <>
              <Button size="large" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                type="primary"
                size="large"
                loading={loading}
                onClick={handleSchedule}
              >
                Schedule Meeting
              </Button>
            </>
          )}
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
    zIndex: 1000,
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
            proceedToNextStep(); // continue to step 2 with default SMTP
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
  companyId={companyId}
  onSuccess={() => {
    proceedToNextStep(); // after SMTP setup → go to step 2
  }}
/>
</>

  );
};

export default ScheduleMeetingModal;