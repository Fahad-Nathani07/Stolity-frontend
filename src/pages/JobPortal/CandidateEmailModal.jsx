// src/components/CandidateEmailModal.jsx
import React, { useEffect, useState } from "react";
import Select from "react-select";
import ComposeEmail from "../../images/ComposeEmail.svg";
import ProfileIcon2 from "../../images/ProfileIcon2.svg";
import { sendEmail } from '../../services/emailService'; // ← this fixes the sendEmail error
import { showToast } from "../../components/ToastProvider";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase"; // adjust path if needed
import SmtpConfigModal from '../../components/SmtpConfigModal'; // adjust path






const CandidateEmailModal = ({ open, onClose, candidate }) => {
  const [activeEmailTab, setActiveEmailTab] = useState("Compose");
  const [fromEmail, setFromEmail] = useState("hr@infomanav.com");
  const [selectedTemplate, setSelectedTemplate] = useState({ value: "custom", label: "Custom Email (no template)" });
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [showSmtpWarning, setShowSmtpWarning] = useState(false);
const [showSmtpConfig, setShowSmtpConfig] = useState(false);

const [activeCompanyId, setActiveCompanyId] = useState(
    sessionStorage.getItem("activeCompanyId") || ""
  );


  useEffect(()=>{
    console.log("CandidateEmailModal useEffect - candidate data:", candidate);

  },[candidate])

  // Dynamic values for placeholders
  const candidateFullName = `${candidate?.first_Name} ${candidate?.lastName}`;
  const companyName = candidate?.companyName || "Infomanav";
  const jobTitle = candidate?.jobTitle || "the position";

  // Templates (removed Interview Invitation)
const templates = [
  {
    value: "custom",
    label: "Custom Email (no template)",
    subject: "",
    message: "",
  },

  {
    value: "welcome",
    label: "Application Received – Thank You",
    subject: `Thank You for Applying – ${jobTitle} at ${companyName}`,
    message: `Dear <strong>${candidateFullName}</strong>,

Thank you for applying to the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>.

We have received your application and our team is reviewing it carefully.

We will contact you within the next <strong>7–10 days</strong> if your profile matches our needs.

Best wishes,  
Talent Acquisition Team  
<strong>${companyName}</strong>`,
  },

  {
  value: "rejection",
  label: "Application Update (Rejection)",
  subject: `Update on Your Application for ${jobTitle} at ${companyName}`,
  message: `Dear <strong>${candidateFullName}</strong>,

Thank you for applying to the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>.

After a thorough review of all applications, <strong>we have decided not to move forward with your candidacy</strong> at this time.

We truly <strong>appreciate the time and effort</strong> you invested in applying and preparing your materials. Your interest in joining our team means a lot to us.

We wish you <strong>every success</strong> in your job search and future career endeavors.

Warm regards,  
Talent Acquisition Team  
<strong>${companyName}</strong>`,
},

  {
    value: "offer",
    label: "Job Offer",
    subject: `Job Offer – ${jobTitle} Position at ${companyName}`,
    message: `Dear <strong>${candidateFullName}</strong>,

We are pleased to offer you the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>!

<strong>Key details:</strong>
• <strong>Start Date:</strong> [Proposed start date]
• <strong>Compensation:</strong> [Salary / CTC]
• <strong>Benefits:</strong> Health insurance, paid leaves, etc.
• <strong>Reporting to:</strong> [Manager name]

Full offer letter will follow shortly.

Please review and confirm acceptance by <strong>[deadline date]</strong>. We are excited to welcome you!

Best regards,  
<strong>[Your Name]</strong>  
Talent Acquisition  
<strong>${companyName}</strong>`,
  },

  {
    value: "offer-acceptance-followup",
    label: "Offer Acceptance Follow-up",
    subject: `Follow-up on Your Job Offer – ${jobTitle} at ${companyName}`,
    message: `Dear <strong>${candidateFullName}</strong>,

I hope you're doing well.

Just following up on the job offer for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>.

We are very excited about the possibility of having you join us and wanted to check if you’ve had a chance to review the details.

Please let us know your decision by <strong>[deadline date]</strong> or if you need any clarification.

Thank you and looking forward to hearing from you!

Best regards,  
<strong>[Your Name]</strong>  
Talent Acquisition  
<strong>${companyName}</strong>`,
  },
];

  const handleTemplateChange = (selected) => {
    setSelectedTemplate(selected);

    if (selected.value !== "custom") {
      const template = templates.find((t) => t.value === selected.value);

      const replacedSubject = template.subject
        .replace("{jobTitle}", jobTitle)
        .replace("{companyName}", companyName);

      const replacedMessage = template.message
        .replace("{candidateFullName}", candidateFullName)
        .replace("{jobTitle}", jobTitle)
        .replace("{companyName}", companyName);

      setSubject(replacedSubject);
      setMessage(replacedMessage);
    } else {
      setSubject("");
      setMessage("");
    }
  };

  // const handlePreview = () => {
  //   if (!subject.trim() || !message.trim()) {
  //     alert("Please fill subject and message before preview.");
  //     return;
  //   }
  //   setShowPreview(true);
  // };



const handlePreview = async () => {
  if (!subject.trim() || !message.trim()) {
    showToast("warning", "Please fill subject and message before preview.", "Missing Fields");
    return;
  }

  // NEW: Check useCustomSesConfig before preview
  if (!candidate?.companyId || !activeCompanyId) {
    showToast("error", "Company information missing.", "Error");
    setShowPreview(true); // fallback to preview
    return;
  }

  try {
    const companyRef = doc(db, "companyMaster", activeCompanyId);
    const companySnap = await getDoc(companyRef);

    if (!companySnap.exists()) {
      showToast("error", "Company not found.", "Error");
      setShowPreview(true); // fallback
      return;
    }

    const useCustomSesConfig = companySnap.data()?.useCustomSesConfig || false;
    console.log("SES config check:", { useCustomSesConfig, companyId: activeCompanyId });

    if (useCustomSesConfig) {
      setShowPreview(true); // custom SES active → allow preview
    } else {
      setShowSmtpWarning(true); // show warning (you can rename this state to setShowSesWarning if desired)
    }
  } catch (err) {
    console.error("SES config check error:", err);
    showToast("error", "Failed to check email configuration. Using default preview.", "Partial Error");
    setShowPreview(true); // fallback to preview anyway
  }
};


  const handleSend = async () => {
  setSending(true);

  try {
    const payload = {
      companyId: candidate.companyId || "default-company-id",
      title: subject.trim(),
      message: message.trim(),
      members: [candidate.userEmail],
      createdBy: fromEmail,
    };

    await sendEmail(payload);

    showToast(
      "success",
      "Email sent successfully!",
      "Email Sent"
    );

    onClose();

  } catch (err) {
    console.error("Send error:", err);

    showToast(
      "error",
      "Failed to send email. Please try again.",
      "Error"
    );

  } finally {
    setSending(false);
  }
};

const resetModalState = () => {
  setActiveEmailTab("Compose");
  setFromEmail("hr@infomanav.com");
  setSelectedTemplate({ value: "custom", label: "Custom Email (no template)" });
  setSubject("");
  setMessage("");
  setShowPreview(false);
  setSending(false);
  setShowSmtpWarning(false);
  setShowSmtpConfig(false);
};

useEffect(() => {
  if (!open) {
    resetModalState();
  }
}, [open]);

  if (!open || !candidate) return null;

  return (
    <>
      {/* Main Modal */}
      <div
        className="email-modal-overlay"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "24px",
            width: "100%",
            maxWidth: "730px",
            maxHeight: "90vh",
            overflow: "hidden",
            boxShadow: "0 50px 100px rgba(0,0,0,0.25)",
            display: "flex",
            flexDirection: "column",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: "24px 32px",
              borderBottom: "1px solid #F1F5F9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <img src={ComposeEmail} alt="" />
              <div>
                <p style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#111827" }}>
                  Compose Email
                </p>
                <p style={{ marginTop: "4px", color: "#6B7280" }}>
                  Sending to <b>{candidate.first_Name} {candidate.lastName}</b> ({candidate.userEmail})
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                padding: "8px 12px",
                border: "none",
                background: "transparent",
                fontSize: "28px",
                color: "#9CA3AF",
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>


          {/* Tab Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "32px" }}>
            {activeEmailTab === "Compose" && (
              <>
                <div style={{ padding: "0px" }}>
                  {/* From / To */}
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      marginBottom: "24px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <label
                        style={{
                          fontSize: "13px",
                          color: "#6B7280",
                          marginBottom: "8px",
                          display: "block",
                          fontWeight: 500,
                        }}
                      >
                        From
                      </label>
                      <input
                        type="email"
                        value={fromEmail}
                        onChange={(e) => setFromEmail(e.target.value)}
                        placeholder="hr@infomanav.com"
                        style={{
                          width: "100%",
                          padding: "14px 16px",
                          border: "1px solid #D1D5DB",
                          borderRadius: "112px",
                          fontSize: "15px",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <label
                        style={{
                          fontSize: "13px",
                          color: "#6B7280",
                          marginBottom: "8px",
                          display: "block",
                          fontWeight: 500,
                        }}
                      >
                        To
                      </label>
                      <input
                        type="email"
                        value={candidate.userEmail}
                        readOnly
                        style={{
                          width: "100%",
                          padding: "14px 16px",
                          border: "2px solid #D1D5DB",
                          borderRadius: "112px",
                          fontSize: "15px",
                          outline: "none",
                          boxSizing: "border-box",
                          background: "#FFFFFF",
                        }}
                      />
                    </div>
                  </div>

                  {/* Template Selector */}
                  <div style={{ marginBottom: "24px" }}>
                    <label
                      style={{
                        fontSize: "13px",
                        color: "#6B7280",
                        marginBottom: "8px",
                        display: "block",
                        fontWeight: 500,
                      }}
                    >
                      Template
                    </label>
                    <Select
                      value={selectedTemplate}
                      onChange={handleTemplateChange}
                      options={templates}
                      isSearchable={false}
                      styles={{
                        control: (base) => ({
                          ...base,
                          minHeight: "48px",
                          borderRadius: "112px",
                          borderColor: "#D1D5DB",
                          boxShadow: "none",
                          backgroundColor: "#F9FAFB",
                        }),
                      }}
                    />
                  </div>

                  {/* Subject */}
                  <div style={{ marginBottom: "24px" }}>
                    <label
                      style={{
                        fontSize: "13px",
                        color: "#6B7280",
                        marginBottom: "8px",
                        display: "block",
                        fontWeight: 500,
                      }}
                    >
                      Subject
                    </label>
                    <input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Enter email subject"
                      style={{
                        width: "100%",
                        padding: "14px 16px",
                        border: "1px solid #D1D5DB",
                        borderRadius: "12px",
                        fontSize: "15px",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  {/* Message */}
                  <div style={{ }}>
                    <label
                      style={{
                        fontSize: "13px",
                        color: "#6B7280",
                        marginBottom: "8px",
                        display: "block",
                        fontWeight: 500,
                      }}
                    >
                      Message
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Write your message here..."
                      rows={9}
                      style={{
                        width: "100%",
                        padding: "16px",
                        border: "1px solid #D1D5DB",
                        borderRadius: "16px",
                        fontSize: "15px",
                        fontFamily: '"SF Pro", "SFProText", -apple-system, BlinkMacSystemFont, sans-serif',
                        outline: "none",
                        resize: "vertical",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>
              </>
            )}

          </div>

          {/* Footer */}
          <div
            style={{
              padding: "20px 32px",
              borderTop: "1px solid #F1F5F9",
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
            }}
          >
            <button
              onClick={onClose}
              style={{
                padding: "12px 24px",
                border: "1px solid #D1D5DB",
                background: "#FFFFFF",
                borderRadius: "12px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handlePreview}
              disabled={!subject.trim() || !message.trim() || sending}
              style={{
                padding: "12px 24px",
                background: subject.trim() && message.trim() && !sending ? "#FFAB49" : "#e5e7eb",
                color: subject.trim() && message.trim() && !sending ? "#FFFFFF" : "#6B7280",
                border: "none",
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: 600,
                cursor: subject.trim() && message.trim() && !sending ? "pointer" : "not-allowed",
              }}
            >
              {sending ? "Sending..." : "Preview"}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 11000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setShowPreview(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "680px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Preview Header */}
            <div
              style={{
                padding: "20px 28px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "20px", color: "#1e293b" }}>Email Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "28px",
                  color: "#9ca3af",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            {/* Preview Content */}
            <div style={{ padding: "28px" }}>
              <div style={{ marginBottom: "20px" }}>
                <strong>From:</strong> {fromEmail}
              </div>
              <div style={{ marginBottom: "20px" }}>
                <strong>To:</strong> {candidate.userEmail}
              </div>
              <div style={{ marginBottom: "20px" }}>
                <strong>Subject:</strong> {subject}
              </div>
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "20px",
                  background: "#f9fafb",
                  minHeight: "200px",
                  whiteSpace: "pre-wrap",
                  lineHeight: "1.6",
                }}
                dangerouslySetInnerHTML={{ __html: message.replace(/\n/g, "<br>") }}
              />
            </div>

            {/* Preview Footer */}
            <div
              style={{
                padding: "20px 28px",
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
              }}
            >
              <button
                onClick={() => setShowPreview(false)}
                style={{
                  padding: "12px 24px",
                  border: "1px solid #d1d5db",
                  background: "#ffffff",
                  borderRadius: "12px",
                  cursor: "pointer",
                }}
              >
                Edit
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                style={{
                  padding: "12px 24px",
                  background: sending ? "#e5e7eb" : "#FFAB49",
                  color: sending ? "#6b7280" : "#ffffff",
                  border: "none",
                  borderRadius: "12px",
                  fontWeight: 600,
                  cursor: sending ? "not-allowed" : "pointer",
                }}
              >
                {sending ? "Sending..." : "Confirm & Send"}
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
    zIndex: 10000,
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
            setShowPreview(true); // continue to preview with default
          }}
          style={{ padding: '10px 20px', border: '1px solid #d1d5db', background: '#fff', borderRadius: '8px' }}
        >
          Continue with Stolity Email
        </button>
        <button
          onClick={() => {
            console.log("Register button clicked → setting showSmtpConfig to true");
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
  companyId={candidate.companyId}
  onSuccess={() => {
    setShowPreview(true); // after SMTP setup → open preview
  }}
/>



    </>
  );
};

export default CandidateEmailModal;