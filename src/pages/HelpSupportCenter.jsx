import React, { useCallback, useEffect, useState } from "react";
import { FiMail, FiPhone, FiClock, FiSend, FiCheckCircle } from "react-icons/fi";
import axios from "axios";
import "../css/HelpSupportCenter.css";
import SideNav from "../components/SideNav";
import SupportPageIcon from "../images/SupportPageIcon.svg";
import CallbackRequestModal from "../components/CallbackRequestModal";

const GMAIL_TO = "fahad@infomanav.in";

const CHANNELS = [
  {
    key: "email",
    label: "Email us",
    description: "Send a detailed message — we usually reply within one business day.",
    icon: FiMail,
  },
  {
    key: "call",
    label: "Call us",
    description: "Request a callback and our team will reach out during support hours.",
    icon: FiPhone,
  },
];

const HelpSupportCenter = () => {
  const apiUrl = process.env.REACT_APP_API_ENDPOINT;
  const token = sessionStorage.getItem("number");

  const [activeTab, setActiveTab] = useState("email");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [showCallbackModal, setShowCallbackModal] = useState(false);
  const [hasActiveCallback, setHasActiveCallback] = useState(false);
  const [activeCallback, setActiveCallback] = useState(null);
  const [callbackCheckLoading, setCallbackCheckLoading] = useState(true);

  const refreshActiveCallback = useCallback(async () => {
    if (!token) {
      setHasActiveCallback(false);
      setActiveCallback(null);
      setCallbackCheckLoading(false);
      return;
    }

    setCallbackCheckLoading(true);
    try {
      const res = await axios.get(`${apiUrl}my-callback-request`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const active = Boolean(res.data?.hasActiveRequest);
      setHasActiveCallback(active);
      setActiveCallback(active ? res.data?.result || null : null);
    } catch (error) {
      console.error("Failed to check callback request:", error);
    } finally {
      setCallbackCheckLoading(false);
    }
  }, [apiUrl, token]);

  useEffect(() => {
    refreshActiveCallback();
  }, [refreshActiveCallback]);

  const handleGmailCompose = (e) => {
    e.preventDefault();
    const userEmail = sessionStorage.getItem("email") || "";
    const username = sessionStorage.getItem("name") || "";
    const body = [
      message,
      "",
      "--",
      "Sent via Stolity Help & Support Center",
      `From: ${username || userEmail}`,
    ].join("\n");

    const gmailLink = `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(
      GMAIL_TO
    )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailLink, "_blank");
  };

  const canSend = subject.trim().length > 0 && message.trim().length > 0;
  const preferredLabel = activeCallback?.preferredTime
    ? String(activeCallback.preferredTime).charAt(0).toUpperCase() +
      String(activeCallback.preferredTime).slice(1)
    : "";

  return (
    <div className="hsc-page-shell">
      <SideNav />
      <div className="help-support-center">
        <div className="hsc-breadcrumb">
          <span>Settings</span>
          <span className="hsc-breadcrumb-sep" aria-hidden="true">
            /
          </span>
          <span className="hsc-breadcrumb-current">Help & Support</span>
        </div>

        <div className="hsc-shell">
          <header className="hsc-hero">
            <div className="hsc-hero-copy">
              <p className="hsc-eyebrow">Support</p>
              <h1 className="hsc-title">How can we help?</h1>
              <p className="hsc-subtitle">
                Reach our team by email or phone. Pick a channel below and we’ll
                take it from there.
              </p>
            </div>
            <div className="hsc-hero-visual" aria-hidden="true">
              <img src={SupportPageIcon} alt="" />
            </div>
          </header>

          <div className="hsc-channels" role="tablist" aria-label="Support channels">
            {CHANNELS.map(({ key, label, description, icon: Icon }) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`hsc-channel${isActive ? " is-active" : ""}`}
                  onClick={() => setActiveTab(key)}
                >
                  <span className="hsc-channel-icon" aria-hidden="true">
                    <Icon />
                  </span>
                  <span className="hsc-channel-text">
                    <span className="hsc-channel-label">{label}</span>
                    <span className="hsc-channel-desc">{description}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="hsc-panel" role="tabpanel">
            {activeTab === "email" ? (
              <form className="hsc-form" onSubmit={handleGmailCompose}>
                <div className="hsc-panel-head">
                  <h2>Email assistance</h2>
                  <p>Tell us what’s going on and we’ll get back to you.</p>
                </div>

                <label className="hsc-field" htmlFor="hsc-subject">
                  <span>Subject</span>
                  <input
                    id="hsc-subject"
                    type="text"
                    placeholder="Brief summary of your issue"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </label>

                <label className="hsc-field" htmlFor="hsc-message">
                  <span>Message</span>
                  <textarea
                    id="hsc-message"
                    placeholder="Share details that will help us assist you…"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={6}
                  />
                </label>

                <div className="hsc-form-footer">
                  <p className="hsc-form-hint">Opens Gmail with your message ready to send.</p>
                  <button
                    type="submit"
                    className="hsc-btn hsc-btn-primary"
                    disabled={!canSend}
                  >
                    <FiSend aria-hidden="true" />
                    Send via Gmail
                  </button>
                </div>
              </form>
            ) : (
              <div className="hsc-call">
                <div className="hsc-panel-head">
                  <h2>Request a callback</h2>
                  <p>
                    Confirm your contact details and request a call during
                    support hours.
                  </p>
                </div>

                <div className="hsc-hours">
                  <FiClock aria-hidden="true" />
                  <div>
                    <strong>Support hours</strong>
                    <span>Monday to Friday · 9:00 AM – 6:00 PM</span>
                  </div>
                </div>

                {hasActiveCallback ? (
                  <div className="hsc-active-request">
                    <FiCheckCircle aria-hidden="true" />
                    <div>
                      <strong>Callback already requested</strong>
                      <span>
                        Your request is{" "}
                        <em>{activeCallback?.status || "pending"}</em>
                        {preferredLabel ? ` · Preferred: ${preferredLabel}` : ""}.
                        We’ll call you soon — you can’t submit another while this
                        one is active.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="hsc-call-actions">
                    <button
                      type="button"
                      className="hsc-btn hsc-btn-primary"
                      onClick={() => setShowCallbackModal(true)}
                      disabled={callbackCheckLoading}
                    >
                      <FiPhone aria-hidden="true" />
                      {callbackCheckLoading ? "Checking…" : "Request callback"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <CallbackRequestModal
        isOpen={showCallbackModal}
        onClose={() => setShowCallbackModal(false)}
        onSuccess={(result) => {
          setHasActiveCallback(true);
          setActiveCallback(result || { status: "pending" });
          setShowCallbackModal(false);
        }}
      />
    </div>
  );
};

export default HelpSupportCenter;
