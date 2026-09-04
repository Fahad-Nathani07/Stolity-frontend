// SoftBanCompanyControls.jsx
import { useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase"; // adjust path if needed
import { useDispatch, useSelector } from "react-redux";
import { fetchCompanies } from "../../store/companyMasterSlice"; // your thunk to refresh list
import { toaster, Notification } from "rsuite";
import { showToast } from "../../components/ToastProvider";

const SoftBanCompanyControls = ({ company, onToggleSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const currentUser = useSelector((state) => state?.usersAdmin?.currentUser);

  const isBanned = !!company?.companySoftBan;

  const dispatch = useDispatch();

  const handleToggleBan = async () => {
    if (!company?.id) return;

    setLoading(true);

    try {
      const companyRef = doc(db, "companyMaster", company.id);

      const updateData = {
        companySoftBan: !isBanned,
        companySoftBanAt: serverTimestamp(),
        companySoftBanBy: currentUser?.id || currentUser?.email || "unknown-admin",
      };

      await updateDoc(companyRef, updateData);

      // Success toast with rsuite
        showToast(
            "success",
            isBanned
              ? "Company has been unbanned"
              : "Company has been soft-banned",
            "Success"
          );

      // Refresh company list in Redux
      dispatch(fetchCompanies());

      // Optional parent callback
      if (onToggleSuccess) {
        onToggleSuccess();
      }

      setConfirmOpen(false);
    } catch (err) {
      console.error("Failed to toggle soft ban:", err);

      // Error toast with rsuite
     showToast(
        "error",
        "Failed to update ban status. Please try again.",
        "Error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "16px",
        padding: "32px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        maxWidth: "620px",
        margin: "0 auto",
      }}
    >
      <h3
        style={{
          margin: "0 0 12px 0",
          fontSize: "22px",
          fontWeight: 700,
          color: isBanned ? "#991b1b" : "#111827",
        }}
      >
        Soft Ban Controls
      </h3>

      <p
        style={{
          margin: "0 0 28px 0",
          color: "#4b5563",
          fontSize: "15px",
          lineHeight: 1.6,
        }}
      >
        {isBanned ? (
          <>
            This company is currently <strong>soft-banned</strong>.
            <br />
            Access and operations are restricted until the ban is lifted.
          </>
        ) : (
          <>
            This company is currently <strong>active</strong>.
            <br />
            Soft ban will restrict company dashboard, job posting, and visibility.
          </>
        )}
      </p>

      {/* Current status box */}
      <div
        style={{
          padding: "16px 24px",
          background: isBanned ? "#fee2e2" : "#f0fdf4",
          borderRadius: "12px",
          marginBottom: "32px",
          border: `1px solid ${isBanned ? "#fca5a5" : "#86efac"}`,
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: "14px",
            height: "14px",
            borderRadius: "50%",
            background: isBanned ? "#dc2626" : "#16a34a",
          }}
        />
        <strong style={{ fontSize: "15px", color: isBanned ? "#991b1b" : "#166534" }}>
          {isBanned ? "SOFT-BANNED" : "ACTIVE"}
        </strong>

        {company?.companySoftBanAt && (
          <span style={{ marginLeft: "auto", color: "#6b7280", fontSize: "14px" }}>
            Since{" "}
            {company.companySoftBanAt?.toDate
              ? company.companySoftBanAt.toDate().toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })
              : "—"}
          </span>
        )}
      </div>

      {/* Main action button */}
      <button
        onClick={() => setConfirmOpen(true)}
        disabled={loading}
        style={{
          padding: "14px 48px",
          background: isBanned
            ? "linear-gradient(135deg, #10b981, #059669)"
            : "linear-gradient(135deg, #ef4444, #dc2626)",
          color: "white",
          border: "none",
          borderRadius: "12px",
          fontSize: "16px",
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
          boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          transition: "all 0.2s ease",
        }}
      >
        {loading
          ? "Processing..."
          : isBanned
          ? "Lift Soft Ban"
          : "Apply Soft Ban"}
      </button>

      {/* Confirmation overlay */}
      {confirmOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
          onClick={() => setConfirmOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "32px",
              width: "90%",
              maxWidth: "460px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
            }}
          >
            <h4 style={{ margin: "0 0 20px", fontSize: "20px", color: "#111827" }}>
              {isBanned ? "Remove soft ban?" : "Apply soft ban?"}
            </h4>

            <p style={{ margin: "0 0 32px", color: "#4b5563", lineHeight: 1.6 }}>
              {isBanned
                ? "This action will restore full access for the company and associated users."
                : "This action will restrict company dashboard access, job posting, and visibility until manually reversed."}
            </p>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setConfirmOpen(false)}
                style={{
                  padding: "12px 28px",
                  border: "1px solid #d1d5db",
                  borderRadius: "10px",
                  background: "white",
                  color: "#374151",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleToggleBan}
                disabled={loading}
                style={{
                  padding: "12px 32px",
                  background: isBanned ? "#10b981" : "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading
                  ? "Processing..."
                  : isBanned
                  ? "Confirm Unban"
                  : "Confirm Ban"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SoftBanCompanyControls;