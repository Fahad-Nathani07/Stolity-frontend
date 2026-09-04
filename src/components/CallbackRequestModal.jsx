import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { FiX, FiEdit2, FiPhone, FiCheck, FiArrowRight, FiArrowLeft } from "react-icons/fi";
import {
  setUserProfile,
  normalizeAvatarUrl,
} from "../store/userProfileSlice";
import AvatarDefault from "../images/AvatarDefault.jpg";
import "./CallbackRequestModal.css";

const PREFERRED_TIME_OPTIONS = [
  { id: "morning", label: "Morning", hint: "9 AM – 12 PM" },
  { id: "afternoon", label: "Afternoon", hint: "12 PM – 4 PM" },
  { id: "evening", label: "Evening", hint: "4 PM – 6 PM" },
];

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 10);
}

export default function CallbackRequestModal({ isOpen, onClose, onSuccess }) {
  const dispatch = useDispatch();
  const userProfile = useSelector((state) => state.userProfile);
  const apiUrl = process.env.REACT_APP_API_ENDPOINT;
  const token = sessionStorage.getItem("number");

  const [step, setStep] = useState(1); // 1 = details, 2 = preferred time
  const [mode, setMode] = useState("review"); // review | edit (only on step 1)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setMode("review");
    setFirstName(userProfile.firstName || "");
    setLastName(userProfile.lastName || "");
    setMobile(digitsOnly(userProfile.mobile));
    setPreferredTime("");
    setErrors({});
    setStatus(null);
    setSubmitting(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const email = userProfile.email || "";
  const displayMobile = digitsOnly(userProfile.mobile);
  const hasMobile = displayMobile.length === 10;
  const canGoNext = hasMobile && !submitting;
  const canConfirm = hasMobile && Boolean(preferredTime) && !submitting;
  const displayName =
    [userProfile.firstName, userProfile.lastName].filter(Boolean).join(" ") ||
    userProfile.name ||
    "—";

  const title =
    step === 2
      ? "Preferred call time"
      : mode === "edit"
        ? "Update your details"
        : "Confirm your details";

  const subtitle =
    step === 2
      ? "Choose when you’d like us to call you."
      : mode === "edit"
        ? "Keep your contact info current so we can reach you."
        : "Check your details first, then continue.";

  const validateEdit = () => {
    const next = {};
    if (!firstName.trim()) next.firstName = "First name is required";
    if (!lastName.trim()) next.lastName = "Last name is required";
    const cleaned = digitsOnly(mobile);
    if (!cleaned) next.mobile = "Mobile number is required";
    else if (cleaned.length !== 10) next.mobile = "Mobile number should be 10 digits";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSaveDetails = async () => {
    if (!validateEdit()) return;
    if (saving) return;

    setSaving(true);
    setStatus(null);

    const fullName = `${firstName} ${lastName}`.trim();
    const cleanedMobile = digitsOnly(mobile);
    const existingAvatar = normalizeAvatarUrl(userProfile.avatar);

    try {
      const payload = {
        email,
        name: fullName,
        contact: cleanedMobile,
      };
      if (existingAvatar) {
        payload.userAvatar = existingAvatar;
      }

      await axios.post(`${apiUrl}edit-user`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      dispatch(
        setUserProfile({
          name: fullName,
          email,
          mobile: cleanedMobile,
          avatar: existingAvatar,
        })
      );

      setStatus({ type: "success", message: "Details updated successfully." });
      setMode("review");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        (error.response?.status === 401
          ? "Session expired. Please log in again."
          : "Failed to update details. Please try again.");
      setStatus({ type: "error", message });
    } finally {
      setSaving(false);
    }
  };

  const handleContinue = () => {
    if (!hasMobile) {
      setStatus({
        type: "error",
        message: "Add a mobile number before continuing.",
      });
      return;
    }
    setStatus(null);
    setStep(2);
  };

  const handleConfirm = async () => {
    if (!hasMobile) {
      setStatus({
        type: "error",
        message: "Add a mobile number before confirming your callback request.",
      });
      return;
    }
    if (!preferredTime) {
      setStatus({
        type: "error",
        message: "Please select a preferred call time.",
      });
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    setStatus(null);

    try {
      const res = await axios.post(
        `${apiUrl}request-callback`,
        {
          firstName: userProfile.firstName || "",
          lastName: userProfile.lastName || "",
          email,
          mobile: displayMobile,
          preferredTime,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setStatus({
        type: "success",
        message: "Callback request submitted. We’ll call you soon.",
      });
      setTimeout(() => {
        onSuccess?.(res.data?.result || { status: "pending", preferredTime });
        onClose?.();
      }, 900);
    } catch (error) {
      if (error.response?.status === 409 || error.response?.data?.hasActiveRequest) {
        setStatus({
          type: "error",
          message:
            error.response?.data?.message ||
            "You already have an active callback request.",
        });
        onSuccess?.(error.response?.data?.result || { status: "pending" });
        return;
      }
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to submit callback request. Please try again.";
      setStatus({ type: "error", message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="crm-overlay" onClick={onClose} role="presentation">
      <div
        className="crm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="crm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="crm-header">
          <div>
            <p className="crm-eyebrow">Callback request</p>
            <h2 id="crm-title" className="crm-title">
              {title}
            </h2>
            <p className="crm-subtitle">{subtitle}</p>
          </div>
          <button
            type="button"
            className="crm-close"
            onClick={onClose}
            aria-label="Close"
          >
            <FiX />
          </button>
        </header>

        <div className="crm-steps" aria-label="Progress">
          <div className={`crm-step${step === 1 ? " is-active" : ""}${step > 1 ? " is-done" : ""}`}>
            <span className="crm-step-num">1</span>
            <span className="crm-step-label">Details</span>
          </div>
          <div className="crm-step-line" aria-hidden="true" />
          <div className={`crm-step${step === 2 ? " is-active" : ""}`}>
            <span className="crm-step-num">2</span>
            <span className="crm-step-label">Preferred time</span>
          </div>
        </div>

        {status && (
          <div className={`crm-status crm-status--${status.type}`} role="status">
            {status.message}
          </div>
        )}

        {step === 1 && mode === "review" && (
          <>
            <div className="crm-profile">
              <img
                className="crm-avatar"
                src={normalizeAvatarUrl(userProfile.avatar) || AvatarDefault}
                alt=""
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = AvatarDefault;
                }}
              />
              <div className="crm-profile-text">
                <strong>{displayName}</strong>
                <span>{email || "—"}</span>
              </div>
            </div>

            <div className="crm-details">
              <div className="crm-detail">
                <span className="crm-detail-label">First name</span>
                <span className="crm-detail-value">
                  {userProfile.firstName || "—"}
                </span>
              </div>
              <div className="crm-detail">
                <span className="crm-detail-label">Last name</span>
                <span className="crm-detail-value">
                  {userProfile.lastName || "—"}
                </span>
              </div>
              <div className="crm-detail">
                <span className="crm-detail-label">Email</span>
                <span className="crm-detail-value">{email || "—"}</span>
              </div>
              <div className="crm-detail">
                <span className="crm-detail-label">Mobile</span>
                <span className="crm-detail-value">
                  {hasMobile ? displayMobile : "Not added"}
                </span>
              </div>
            </div>

            {!hasMobile && (
              <p className="crm-warning">
                Add a mobile number before continuing to choose a call time.
              </p>
            )}

            <footer className="crm-footer">
              <button
                type="button"
                className="crm-btn crm-btn--ghost"
                onClick={() => {
                  setFirstName(userProfile.firstName || "");
                  setLastName(userProfile.lastName || "");
                  setMobile(digitsOnly(userProfile.mobile));
                  setErrors({});
                  setStatus(null);
                  setMode("edit");
                }}
              >
                <FiEdit2 aria-hidden="true" />
                Update details
              </button>
              <button
                type="button"
                className="crm-btn crm-btn--primary"
                onClick={handleContinue}
                disabled={!canGoNext}
                title={
                  hasMobile
                    ? "Continue to preferred time"
                    : "Mobile number is required"
                }
              >
                Continue
                <FiArrowRight aria-hidden="true" />
              </button>
            </footer>
          </>
        )}

        {step === 1 && mode === "edit" && (
          <>
            <div className="crm-edit">
              <div className="crm-field-grid">
                <label className="crm-field">
                  <span>First name</span>
                  <input
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      if (errors.firstName) {
                        setErrors((prev) => ({ ...prev, firstName: "" }));
                      }
                    }}
                    placeholder="First name"
                  />
                  {errors.firstName && (
                    <em className="crm-error">{errors.firstName}</em>
                  )}
                </label>

                <label className="crm-field">
                  <span>Last name</span>
                  <input
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      if (errors.lastName) {
                        setErrors((prev) => ({ ...prev, lastName: "" }));
                      }
                    }}
                    placeholder="Last name"
                  />
                  {errors.lastName && (
                    <em className="crm-error">{errors.lastName}</em>
                  )}
                </label>

                <label className="crm-field crm-field--full">
                  <span>Email</span>
                  <input value={email} disabled readOnly />
                  <em className="crm-hint">Email cannot be changed</em>
                </label>

                <label className="crm-field crm-field--full">
                  <span>Mobile</span>
                  <input
                    value={mobile}
                    onChange={(e) => {
                      setMobile(digitsOnly(e.target.value));
                      if (errors.mobile) {
                        setErrors((prev) => ({ ...prev, mobile: "" }));
                      }
                    }}
                    placeholder="10-digit mobile number"
                    inputMode="numeric"
                    maxLength={10}
                  />
                  {errors.mobile && (
                    <em className="crm-error">{errors.mobile}</em>
                  )}
                </label>
              </div>
            </div>

            <footer className="crm-footer">
              <button
                type="button"
                className="crm-btn crm-btn--ghost"
                onClick={() => {
                  setFirstName(userProfile.firstName || "");
                  setLastName(userProfile.lastName || "");
                  setMobile(digitsOnly(userProfile.mobile));
                  setErrors({});
                  setMode("review");
                }}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="crm-btn crm-btn--primary"
                onClick={handleSaveDetails}
                disabled={saving}
              >
                <FiPhone aria-hidden="true" />
                {saving ? "Saving…" : "Save details"}
              </button>
            </footer>
          </>
        )}

        {step === 2 && (
          <>
            <div className="crm-summary-chip">
              Calling <strong>{displayName}</strong> on{" "}
              <strong>{displayMobile}</strong>
            </div>

            <div className="crm-preferred crm-preferred--page">
              <span className="crm-preferred-label">When should we call?</span>
              <div className="crm-slot-grid crm-slot-grid--stack" role="group" aria-label="Preferred call time">
                {PREFERRED_TIME_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`crm-slot crm-slot--lg${
                      preferredTime === opt.id ? " is-active" : ""
                    }`}
                    onClick={() => setPreferredTime(opt.id)}
                  >
                    <strong>{opt.label}</strong>
                    <span>{opt.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            <footer className="crm-footer">
              <button
                type="button"
                className="crm-btn crm-btn--ghost"
                onClick={() => {
                  setStatus(null);
                  setStep(1);
                  setMode("review");
                }}
                disabled={submitting}
              >
                <FiArrowLeft aria-hidden="true" />
                Back
              </button>
              <button
                type="button"
                className="crm-btn crm-btn--primary"
                onClick={handleConfirm}
                disabled={!canConfirm}
                title={
                  preferredTime
                    ? "Confirm callback request"
                    : "Select a preferred call time"
                }
              >
                <FiCheck aria-hidden="true" />
                {submitting ? "Submitting…" : "Confirm request"}
              </button>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
