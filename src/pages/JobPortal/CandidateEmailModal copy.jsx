// src/components/CandidateEmailModal.jsx
import React, { useState } from "react";
import Select from "react-select";
import ComposeEmail from "../../images/ComposeEmail.svg";
import ProfileIcon2 from "../../images/ProfileIcon2.svg"

const CandidateEmailModal = ({ open, onClose, candidate }) => {
  const [activeEmailTab, setActiveEmailTab] = useState("Compose");
  const [fromEmail, setFromEmail] = useState("hr@infomanav.com");
  const [selectedTemplate, setSelectedTemplate] = useState({ value: "custom", label: "Custom Email (no template)" });
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  // Dynamic values for placeholders
  const candidateFullName = `${candidate?.first_Name} ${candidate?.lastName}`;
  const companyName = candidate?.companyName || "Infomanav";
  const jobTitle = candidate?.jobTitle || "the position";

  // Templates with dynamic placeholders
  const templates = [
    {
      value: "custom",
      label: "Custom Email (no template)",
      subject: "",
      message: "",
    },
    {
      value: "interview",
      label: "Interview Invitation",
      subject: `Interview Invitation for ${jobTitle} at ${companyName}`,
      message: `Hi ${candidateFullName},

We are pleased to invite you for an interview for the ${jobTitle} position at ${companyName}.

Date & Time: [Please fill in]
Duration: [Please fill in] minutes
Interviewer: [Interviewer Name] ([Interviewer Email])
Location: Google Meet

Please confirm your availability.

Best regards,
[Your Name]
${companyName}`,
    },
    {
      value: "followup",
      label: "Follow-up / Next Round",
      subject: `Next Steps for Your ${jobTitle} Application at ${companyName}`,
      message: `Hi ${candidateFullName},

Thank you for your interest in the ${jobTitle} position at ${companyName}.

We would like to schedule the next round of interviews.

Proposed Date & Time: [Please fill in]
Duration: [Please fill in] minutes

Please let us know your availability.

Best regards,
[Your Name]
${companyName}`,
    },
    {
      value: "rejection",
      label: "Application Update (Rejection)",
      subject: `Update on Your Application for ${jobTitle} at ${companyName}`,
      message: `Hi ${candidateFullName},

Thank you for applying to the ${jobTitle} position at ${companyName}.

After careful review, we have decided to move forward with other candidates whose qualifications more closely match our current needs.

We truly appreciate the time and effort you invested in your application and wish you the best in your job search.

Best regards,
[Your Name]
${companyName}`,
    },
    {
      value: "welcome",
      label: "Application Received (Welcome)",
      subject: `Thank You for Applying - ${jobTitle} at ${companyName}`,
      message: `Hi ${candidateFullName},

Thank you for applying to the ${jobTitle} position at ${companyName}.

We have received your application and our team will review it carefully.

We will be in touch if your profile matches our requirements.

Best regards,
[Your Name]
${companyName}`,
    },
    {
      value: "offer",
      label: "Job Offer",
      subject: `Job Offer - ${jobTitle} Position at ${companyName}`,
      message: `Hi ${candidateFullName},

We are delighted to offer you the ${jobTitle} position at ${companyName}.

[Offer details: salary, start date, benefits, etc.]

Please review and let us know if you accept.

Best regards,
[Your Name]
${companyName}`,
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

  if (!open || !candidate) return null;

  return (
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
          minHeight: "88vh",
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
              <p
                style={{
                  margin: 0,
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                Compose Email
              </p>
              <p
                style={{
                  marginTop: "0",
                  maxWidth: "94%",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
              >
                Sending to <b>{candidate.first_Name} {candidate.lastName}</b> (
                {candidate.userEmail})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: "8px 12px",
              border: "none",
              background: "transparent",
              fontSize: "24px",
              color: "#9CA3AF",
              cursor: "pointer",
              borderRadius: "8px",
              width: 44,
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            padding: "0 32px",
            borderBottom: "1px solid #F1F5F9",
            background: "#ffffffff",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 0,
              borderRadius: "100px",
              overflow: "hidden",
              background: "#F1F5F9",
            }}
          >
            <button
              onClick={() => setActiveEmailTab("Compose")}
              style={{
                flex: 1,
                padding: "10px 24px",
                border: "none",
                background: activeEmailTab === "Compose" ? "#FFFFFF" : "transparent",
                color: activeEmailTab === "Compose" ? "#E94545" : "#6B7280",
                fontSize: "15px",
                fontWeight: activeEmailTab === "Compose" ? 600 : 500,
                cursor: "pointer",
                transition: "all 0.2s",
                margin: "5px",
                borderRadius: "100px",
              }}
            >
              Compose
            </button>
            <button
              onClick={() => setActiveEmailTab("Template")}
              style={{
                flex: 1,
                padding: "10px 24px",
                border: "none",
                background: activeEmailTab === "Template" ? "#FFFFFF" : "transparent",
                color: activeEmailTab === "Template" ? "#111827" : "#6B7280",
                fontSize: "15px",
                fontWeight: activeEmailTab === "Template" ? 600 : 500,
                cursor: "pointer",
                transition: "all 0.2s",
                margin: "5px",
                borderRadius: "100px",
              }}
            >
              Template
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "32px" }}>
          {activeEmailTab === "Compose" && (
            <>
              {/* Custom react-select styles */}
              <style jsx>{`
                .email-from-select .react-select__control,
                .email-to-select .react-select__control,
                .email-template-select .react-select__control {
                  min-height: 48px !important;
                  border: 1px solid #D1D5DB !important;
                  border-radius: 112px !important;
                  font-size: 15px !important;
                  background-color: #F9FAFB !important;
                  box-shadow: "none" !important;
                  padding: 2px 10px;
                }
                .email-to-select .react-select__control {
                  border: 2px solid #D1D5DB !important;
                  background-color: #FFFFFF !important;
                }
              `}</style>

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

                {/* Template */}
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
                <div style={{ marginBottom: "32px" }}>
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
                    rows={6}
                    style={{
                      width: "100%",
                      padding: "16px",
                      border: "1px solid #D1D5DB",
                      borderRadius: "16px",
                      fontSize: "15px",
                      fontFamily: "Inter, sans-serif",
                      outline: "none",
                      resize: "vertical",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Footer */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: "24px",
                    borderTop: "1px solid #F1F5F9",
                    gap: "24px",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div>
                      <img src={ProfileIcon2} alt="" />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <div>Candidate</div>
                      <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: "#111827",
                            fontSize: "20px",
                            lineHeight: "20px",
                          }}
                        >
                          {candidate.first_Name} {candidate.lastName}
                        </div>
                        <div style={{ color: "#6B7280" }}>
                          <p
                            style={{
                              padding: "4px 16px",
                              backgroundColor: "#F3F3F3",
                              color: "#FFAB49",
                              fontSize: "14px",
                              maxWidth: "220px",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              margin: 0,
                              borderRadius: "100px",
                            }}
                          >
                            {candidate.jobTitle}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "12px" }}>
                    <button
                      onClick={onClose}
                      style={{
                        padding: "11px 20px",
                        borderRadius: "112px",
                        border: "1px solid #D1D5DB",
                        background: "#FFFFFF",
                        color: "#374151",
                        fontWeight: 500,
                        fontSize: "15px",
                        cursor: "pointer",
                        boxSizing: "border-box",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      style={{
                        padding: "11px 20px",
                        borderRadius: "112px",
                        background: "#FFAB49",
                        color: "#FFFFFF",
                        fontWeight: 600,
                        fontSize: "15px",
                        border: "none",
                        cursor: "pointer",
                        boxSizing: "border-box",
                      }}
                      onClick={() => {
                        alert("Email send functionality coming soon!");
                        onClose();
                      }}
                    >
                      Send
                    </button>
                  </div>
                </div>
            {/* )} */}
          </div>
              </>
        )}

        {activeEmailTab === "Template" && (
          <div style={{ padding: "40px", textAlign: "center", color: "#6B7280" }}>
            Template content coming soon...
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default CandidateEmailModal;