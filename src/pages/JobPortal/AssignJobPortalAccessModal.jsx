// src/components/AssignJobPortalAccessModal.jsx
import React, { useState } from "react";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase"; // adjust path
import { toaster, Notification } from "rsuite";
import "rsuite/dist/rsuite.min.css";
import { showToast } from "../../components/ToastProvider";

const AssignJobPortalAccessModal = ({ activeCompanyId, onClose, activeCompanyName    }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

    const handleAssign = async () => {
    setError("");
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
        setError("Please enter an email");
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        setError("Please enter a valid email address");
        return;
    }

    setLoading(true);

    try {
        // 1. Find user by exact email
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", trimmedEmail));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
        setError("User not found");
        return;
        }

        const userDoc = snapshot.docs[0];
        const userId = userDoc.id;
        const userData = userDoc.data();

        // 2. Get current jobPortal data (or initialize empty)
        const currentJobPortal = userData?.jobPortal || { role: null, companies: [] };

        // 3. Check current role
        const currentRole = currentJobPortal.role;

        if (currentRole && currentRole !== "JOB_PORTAL_MANAGER") {
        setError(`User already has a different role: ${currentRole}`);
        return;
        }

        // 4. Prepare updated jobPortal
        const jobPortalUpdate = {
        role: "JOB_PORTAL_MANAGER",  // set or keep it
        companies: currentJobPortal.companies.includes(activeCompanyId)
            ? currentJobPortal.companies  // already has this company → no duplicate
            : [...currentJobPortal.companies, activeCompanyId],
        };

        // 5. Update Firestore
        await updateDoc(doc(db, "users", userId), {
        jobPortal: jobPortalUpdate,
        });

        // 6. Success toast
        // toaster.push(
        // <Notification type="success" header="Success" closable>
        //     Access granted to {trimmedEmail} for company {activeCompanyName || activeCompanyId}
        // </Notification>,
        // { placement: "bottomEnd", duration: 4000 }
        // );
        showToast(
          "success",
          `Access granted to ${trimmedEmail} for company ${activeCompanyName || activeCompanyId}`,
          "Success"
        );

        onClose();
    } catch (err) {
        console.error("Assign error:", err);
        setError("Failed to assign access. Please try again.");
    } finally {
        setLoading(false);
    }
    };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(30,41,59,0.7)",
        backdropFilter: "blur(8px)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: "20px",
          width: "460px",
          maxWidth: "90vw",
          padding: "32px 36px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          border: "1px solid #ffe8cc",
        }}
      >
        <h2 style={{ margin: "0 0 8px", fontSize: "22px", fontWeight: 700, color: "#1e293b" }}>
          Assign Job Portal Access
        </h2>
        <p style={{ margin: "0 0 24px", color: "#64748b", fontSize: "14px" }}>
          Grant MANAGER role to a user for the current company.
        </p>

        {/* Company (disabled) */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500, color: "#475569" }}>
            Company ID
          </label>
          <input
            type="text"
            // value={activeCompanyId}
            value={activeCompanyName || activeCompanyId}  // Show name if available, fallback to ID
            disabled
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
              color: "#64748b",
              fontSize: "14px",
            }}
          />
        </div>

        {/* Email */}
        <div style={{ marginBottom: "32px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500, color: "#475569" }}>
            User Email <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            placeholder="user@example.com"
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: "12px",
              border: error ? "1px solid #ef4444" : "1px solid #e2e8f0",
              fontSize: "14px",
              outline: "none",
            }}
          />
          {error && (
            <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "6px", display: "block" }}>
              {error}
            </span>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: "10px 24px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              background: "white",
              color: "#475569",
              fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleAssign}
            disabled={loading || !email.trim()}
            style={{
              padding: "10px 24px",
              borderRadius: "12px",
              background: loading ? "#ffd6a8" : "#FFAB49",
              border: "none",
              color: "white",
              fontWeight: 600,
              cursor: loading || !email.trim() ? "not-allowed" : "pointer",
              opacity: loading || !email.trim() ? 0.7 : 1,
            }}
          >
            {loading ? "Assigning..." : "Assign Access"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignJobPortalAccessModal;