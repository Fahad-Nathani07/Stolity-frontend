// src/components/CandidateRemarksModal.jsx
import React, { useState, useEffect } from "react";
import { db } from "../../firebase"; // adjust path
import { doc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { Notification, useToaster } from "rsuite"; // or useToaster if you prefer
import { useDispatch } from "react-redux"; // if you need dispatch elsewhere

const CandidateRemarksModal = ({
  open,
  onClose,
  candidate,
  triggerFetchResumes, // function from parent: setTriggerFetchResumes(x => x + 1)
}) => {
  const [remarkText, setRemarkText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("General");
  const [remarks, setRemarks] = useState([]); // local copy for instant UI update
  const [loading, setLoading] = useState(false);

  const toaster = useToaster();

  // Load existing remarks when modal opens
  useEffect(() => {
    if (open && candidate?.Notes) {
      // Sort newest first
      const sorted = [...candidate.Notes].sort(
        (a, b) => (b.addedTime?.seconds || 0) - (a.addedTime?.seconds || 0)
      );
      setRemarks(sorted);
    } else {
      setRemarks([]);
    }
  }, [open, candidate]);

  if (!open || !candidate) return null;

  // Categories (you can reorder/add/remove)
  const categories = [
    "Technical",
    "Communication",
    "Positive",
    "Concern",
    "Availability",
    "General",
    "Other",
  ];

  const handleAddRemark = async () => {
  if (!remarkText.trim()) return;

  const adminName =
    JSON.parse(sessionStorage.getItem("userData") || "{}")?.name ||
    sessionStorage.getItem("name") ||
    "Unknown Admin";

  const adminEmail = sessionStorage.getItem("email") || "unknown@email.com";

  const newRemark = {
    note: remarkText.trim(),
    remarkByName: adminName,
    remarkByEmail: adminEmail,
    addedTime: new Date(),          // ← fixed: client-side Date
    category: selectedCategory,
  };

  try {
    setLoading(true);

    const candidateRef = doc(db, "resumeMaster", candidate.id);
    await updateDoc(candidateRef, {
      Notes: arrayUnion(newRemark),
    });

    // Instantly show new remark on top (with client-side date for display)
    setRemarks((prev) => [{ ...newRemark, addedTime: new Date() }, ...prev]);

    // Clear input
    setRemarkText("");
    setSelectedCategory("General");

    // Success toast
    toaster.push(
      <Notification type="success" header="Remark Added" closable>
        Your note has been saved and shared.
      </Notification>,
      { placement: 'topCenter', duration: 4000 }
    );

    // Trigger re-fetch
    triggerFetchResumes((x) => x + 1);
  } catch (err) {
    console.error("Add remark error:", err);
    toaster.push(
      <Notification type="error" header="Error" closable>
        Failed to add remark. Try again.
      </Notification>,
      { placement: 'topCenter', duration: 5000 }
    );
  } finally {
    setLoading(false);
  }
};



  return (
  <div
    onClick={onClose}
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.65)",
      backdropFilter: "blur(8px)",           // premium glass-like feel
      WebkitBackdropFilter: "blur(8px)",
      zIndex: 2000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: "#ffffff",
        borderRadius: "24px",
        width: "92%",
        maxWidth: "780px",
        maxHeight: "92vh",
        overflow: "hidden",
        boxShadow: "0 40px 100px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,171,73,0.08)",
        border: "1px solid rgba(255,171,73,0.10)",
        display: "flex",
        flexDirection: "column",
        fontFamily: '"SF Pro", "SFProText", -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "32px 40px 24px",
          borderBottom: "1px solid rgba(229,231,235,0.6)",
          background: "linear-gradient(135deg, #fffdf9 0%, #ffffff 50%)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "28px",
                fontWeight: 700,
                color: "#111827",
                letterSpacing: "-0.5px",
                lineHeight: 1.2,
              }}
            >
              Candidate Remarks
            </h2>
            <p
              style={{
                margin: "12px 0 0",
                fontSize: "16px",
                fontWeight: 500,
                color: "#374151",
              }}
            >
              {candidate.first_Name} {candidate.lastName}
              <span style={{ color: "#9ca3af", margin: "0 10px", fontWeight: 400 }}>•</span>
              {candidate.jobTitle}
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "rgba(255,171,73,0.08)",
              border: "none",
              borderRadius: "50%",
              width: "48px",
              height: "48px",
              fontSize: "32px",
              color: "#FFAB49",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.25s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,171,73,0.20)";
              e.currentTarget.style.transform = "rotate(90deg) scale(1.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,171,73,0.08)";
              e.currentTarget.style.transform = "rotate(0deg) scale(1)";
            }}
          >
            ×
          </button>
        </div>

        <p style={{ margin: "16px 0 0", fontSize: "14.5px", color: "#6b7280", fontWeight: 400 }}>
          Internal notes & observations • Chronological order (newest first)
        </p>
      </div>

      {/* Remarks List */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "32px 40px",
          background: "#fdfdfd",
        }}
      >
        {remarks.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "#9ca3af",
              padding: "100px 20px",
              fontSize: "16px",
              lineHeight: 1.6,
            }}
          >
            <div style={{ fontSize: "48px", opacity: 0.25, marginBottom: "16px" }}>📝</div>
            No remarks added yet.
            <div style={{ fontSize: "15px", marginTop: "12px", color: "#6b7280" }}>
              Start documenting observations, strengths, concerns or follow-ups.
            </div>
          </div>
        ) : (
          remarks.map((remark, idx) => (
          <div
  key={idx}
  style={{
    background: 
      remark.category === "Technical"     ? "rgba(254, 243, 199, 0.18)" :
      remark.category === "Communication" ? "rgba(219, 234, 254, 0.18)" :
      remark.category === "Positive"      ? "rgba(220, 252, 231, 0.18)" :
      remark.category === "Concern"       ? "rgba(254, 226, 226, 0.18)" :
      remark.category === "Availability"  ? "rgba(224, 242, 254, 0.18)" :
      "rgba(249, 250, 251, 0.6)",
    borderRadius: "16px",
    padding: "24px 28px",
    marginBottom: "24px",
    border: "1px solid rgba(229,231,235,0.7)",
    boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
    transition: "all 0.22s ease",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.boxShadow = "0 12px 28px rgba(0,0,0,0.07)";
    e.currentTarget.style.borderColor = "rgba(255,171,73,0.25)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.04)";
    e.currentTarget.style.borderColor = "rgba(229,231,235,0.7)";
  }}
>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  {/* Optional: small avatar/initials */}
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "50%",
                      background: "#fef3c7",
                      color: "#92400e",
                      fontWeight: 600,
                      fontSize: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {remark.remarkByName?.[0]?.toUpperCase() || "?"}
                  </div>

                  <div>
                    <div style={{ fontWeight: 600, color: "#111827", fontSize: "15.5px" }}>
                      {remark.remarkByName}
                    </div>
                    <div style={{ color: "#6b7280", fontSize: "13.5px", marginTop: "2px" }}>
                      {remark.remarkByEmail}
                    </div>
                  </div>

                  <span
                    style={{
                      marginLeft: "16px",
                      background:
                        remark.category === "Technical"     ? "#fef3c7" :
                        remark.category === "Communication" ? "#dbeafe" :
                        remark.category === "Positive"      ? "#dcfce7" :
                        remark.category === "Concern"       ? "#fee2e2" :
                        remark.category === "Availability"  ? "#e0f2fe" :
                        "#f3f4f6",
                      color:
                        remark.category === "Technical"     ? "#92400e" :
                        remark.category === "Communication" ? "#1e40af" :
                        remark.category === "Positive"      ? "#166534" :
                        remark.category === "Concern"       ? "#991b1b" :
                        remark.category === "Availability"  ? "#0c4a6e" :
                        "#4b5563",
                      padding: "6px 16px",
                      borderRadius: "999px",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    {remark.category}
                  </span>
                </div>

                <span style={{ color: "#6b7280", fontSize: "13.5px", fontWeight: 400 }}>
                  {remark.addedTime?.toDate?.()
                    ? remark.addedTime.toDate().toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "Just now"}
                </span>
              </div>

              <p
                style={{
                  margin: 0,
                  color: "#1f2937",
                  lineHeight: 1.75,
                  fontSize: "15.5px",
                  whiteSpace: "pre-wrap",
                }}
              >
                {remark.note}
              </p>
            </div>
          ))
        )}
      </div>

     {/* Input Area - Compact version */}
<div
  style={{
    padding: "20px 36px",                    // reduced vertical & horizontal padding
    borderTop: "1px solid rgba(229,231,235,0.6)",
    background: "linear-gradient(135deg, #fdfdfd, #ffffff)",
  }}
>
  <div style={{ display: "flex", gap: "20px", marginBottom: "16px", flexWrap: "wrap" }}>

    {/* Category - narrower + more compact */}
    <div style={{ flex: "0 0 190px" }}>
      <label
        style={{
          fontSize: "14px",
          color: "#374151",
          marginBottom: "8px",
          display: "block",
          fontWeight: 600,
        }}
      >
        Category
      </label>
      <select
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
        style={{
          width: "100%",
          padding: "11px 16px",              // smaller padding
          border: "1px solid #cbd5e1",
          borderRadius: "12px",
          fontSize: "14.5px",
          background: "#ffffff",
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.03)",
          transition: "all 0.2s ease",
          outline: "none",
          height: "44px",                    // fixed height for consistency
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "#FFAB49";
          e.target.style.boxShadow = "0 0 0 3px rgba(255,171,73,0.14)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#cbd5e1";
          e.target.style.boxShadow = "inset 0 1px 2px rgba(0,0,0,0.03)";
        }}
      >
        {categories.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
    </div>

    {/* Remark - shorter default height */}
    <div style={{ flex: 1, minWidth: "280px" }}>
      <label
        style={{
          fontSize: "14px",
          color: "#374151",
          marginBottom: "8px",
          display: "block",
          fontWeight: 600,
        }}
      >
        Your Observation
      </label>
      <textarea
        value={remarkText}
        onChange={(e) => setRemarkText(e.target.value)}
        placeholder="Notes, strengths, concerns, red flags, follow-ups..."
        rows={2}                                 // ← key change: much shorter default
        style={{
          width: "100%",
          padding: "12px 16px",
          border: "1px solid #cbd5e1",
          borderRadius: "12px",
          fontSize: "15px",
          lineHeight: 1.55,
          outline: "none",
          resize: "vertical",
          minHeight: "68px",                     // controls collapsed size
          background: "#ffffff",
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.03)",
          transition: "all 0.2s ease",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "#FFAB49";
          e.target.style.boxShadow = "0 0 0 3px rgba(255,171,73,0.14)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#cbd5e1";
          e.target.style.boxShadow = "inset 0 1px 2px rgba(0,0,0,0.03)";
        }}
      />
    </div>
  </div>

  <div style={{ textAlign: "right" }}>
    <button
      onClick={handleAddRemark}
      disabled={loading || !remarkText.trim()}
      style={{
        padding: "11px 36px",                  // smaller button
        background: loading || !remarkText.trim()
          ? "#e5e7eb"
          : "linear-gradient(135deg, #FFAB49 0%, #f97316 100%)",
        color: "white",
        border: "none",
        borderRadius: "12px",
        fontSize: "15px",
        fontWeight: 600,
        cursor: loading || !remarkText.trim() ? "not-allowed" : "pointer",
        opacity: loading || !remarkText.trim() ? 0.7 : 1,
        boxShadow: "0 4px 16px rgba(255,171,73,0.25)",
        transition: "all 0.25s ease",
      }}
      onMouseEnter={(e) => {
        if (!loading && remarkText.trim()) {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 8px 24px rgba(255,171,73,0.35)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(255,171,73,0.25)";
      }}
    >
      {loading ? "Saving..." : "Add Remark"}
    </button>
  </div>
</div>
    </div>
  </div>
);
};

export default CandidateRemarksModal;


