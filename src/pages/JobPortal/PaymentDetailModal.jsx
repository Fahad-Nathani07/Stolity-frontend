// src/pages/JobPortal/PaymentDetailModal.jsx
import { useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase"; // adjust path
import { showToast } from "../../components/ToastProvider"; // adjust path

const PaymentDetailModal = ({ payment, userName, onClose, onRefresh }) => {
  const [processing, setProcessing] = useState(false);
  const [banLoading, setBanLoading] = useState(false);
  const apiUrl = process.env.REACT_APP_API_ENDPOINT;

  // Confirmation states
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [confirmBan, setConfirmBan] = useState(false);

  if (!payment) return null;

  const handleApprove = async () => {
    if (!confirmApprove) {
      setConfirmApprove(true);
      return;
    }

    // Confirmed → proceed
    setProcessing(true);

    try {
      const token = sessionStorage.getItem("token");

      const response = await fetch(
        `${apiUrl}payment-status/${payment.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({
            status: "Success",
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API error: ${response.status} - ${errText}`);
      }

      const json = await response.json();

      if (!json.success) {
        throw new Error(json.message || "Failed to update payment status");
      }

      showToast("success", "Payment approved successfully!", "Success");
      onRefresh(); // refetch list
      onClose();
    } catch (err) {
      console.error("Approve failed:", err);
      showToast("error", err.message || "Failed to approve payment", "Error");
    } finally {
      setProcessing(false);
      setConfirmApprove(false);
    }
  };

  const handleSoftBanToggle = async () => {
    if (!confirmBan) {
      setConfirmBan(true);
      return;
    }

    setBanLoading(true);

    try {
      const userRef = doc(db, "users", payment.userId);
      const newBanStatus = !payment.isSoftBan;

      await updateDoc(userRef, {
        isSoftBan: newBanStatus,
        softBanAt: serverTimestamp(),
        softBanBy: sessionStorage.getItem("email") || "admin",
      });

      showToast(
        "success",
        newBanStatus ? "User has been soft-banned" : "Soft ban removed",
        "Success"
      );

      onRefresh();
      onClose();
    } catch (err) {
      console.error("Soft ban toggle failed:", err);
      showToast("error", "Failed to update ban status", "Error");
    } finally {
      setBanLoading(false);
      setConfirmBan(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        backdropFilter: "blur(6px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          width: "90%",
          maxWidth: "800px",
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 20px 70px rgba(0,0,0,0.35)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "28px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
              borderBottom: "1px solid #eee",
              paddingBottom: "16px",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "26px", fontWeight: 700 }}>
              Payment Proof Review
            </h2>
            <button
              onClick={onClose}
              style={{
                padding: "10px 20px",
                border: "1px solid #d1d5db",
                borderRadius: "999px",
                background: "white",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Close
            </button>
          </div>

          {/* Info Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              marginBottom: "32px",
            }}
          >
            <div><strong>User:</strong> {userName || "Loading..."}</div>
            <div><strong>User ID:</strong> {payment.userId}</div>
            <div><strong>Amount:</strong> ₹{payment.amount.toLocaleString("en-IN")}</div>
            <div><strong>Transaction ID:</strong> {payment.transactionId || "—"}</div>
            <div>
              <strong>Submitted:</strong>{" "}
              {payment.submittedAt?.toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              }) || "—"}
            </div>
            <div>
              <strong>Status:</strong>{" "}
              <span
                style={{
                  padding: "6px 14px",
                  borderRadius: "999px",
                  background:
                    payment.status === "Success" || payment.status === "APPROVED"
                      ? "#E6F4EA"
                      : payment.status === "Rejected" || payment.status === "REJECTED"
                      ? "#FEE2E2"
                      : "#FEF3C7",
                  color:
                    payment.status === "Success" || payment.status === "APPROVED"
                      ? "#166534"
                      : payment.status === "Rejected" || payment.status === "REJECTED"
                      ? "#991B1B"
                      : "#92400E",
                  fontWeight: 500,
                }}
              >
                {payment.status || "Pending"}
              </span>
            </div>
          </div>

          {/* Screenshot */}
          {payment.paymentScreenshot ? (
            <div style={{ margin: "32px 0" }}>
              <h3 style={{ margin: "0 0 12px", fontSize: "18px" }}>Payment Screenshot</h3>
              <img
                src={payment.paymentScreenshot}
                alt="Proof of payment"
                style={{
                  maxWidth: "100%",
                  maxHeight: "500px",
                  borderRadius: "12px",
                  border: "1px solid #eee",
                  objectFit: "contain",
                  display: "block",
                  margin: "0 auto",
                }}
                onError={(e) => (e.target.style.display = "none")}
              />
            </div>
          ) : (
            <p style={{ color: "#666", textAlign: "center", margin: "32px 0" }}>
              No screenshot uploaded
            </p>
          )}

          {/* Confirmation for Approve */}
          {confirmApprove && (
            <div
              style={{
                margin: "24px 0",
                padding: "16px",
                background: "#FEF3C7",
                borderRadius: "12px",
                border: "1px solid #FBBF24",
                textAlign: "center",
              }}
            >
              <p style={{ margin: "0 0 12px", fontWeight: 500, color: "#92400E" }}>
                Are you sure you want to approve this payment?
              </p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <button
                  onClick={() => setConfirmApprove(false)}
                  style={{
                    padding: "8px 20px",
                    background: "white",
                    border: "1px solid #d1d5db",
                    borderRadius: "999px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={processing}
                  style={{
                    padding: "8px 20px",
                    background: "#4CAF50",
                    color: "white",
                    border: "none",
                    borderRadius: "999px",
                    cursor: processing ? "not-allowed" : "pointer",
                  }}
                >
                  {processing ? "Processing..." : "Yes, Approve"}
                </button>
              </div>
            </div>
          )}

          {/* Confirmation for Soft Ban */}
          {confirmBan && (
            <div
              style={{
                margin: "24px 0",
                padding: "16px",
                background: "#FEF3C7",
                borderRadius: "12px",
                border: "1px solid #FBBF24",
                textAlign: "center",
              }}
            >
              <p style={{ margin: "0 0 12px", fontWeight: 500, color: "#92400E" }}>
                Are you sure you want to{" "}
                {payment.isSoftBan ? "REMOVE the soft ban from" : "SOFT-BAN"}{" "}
                this user ({userName || payment.userId})?
              </p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <button
                  onClick={() => setConfirmBan(false)}
                  style={{
                    padding: "8px 20px",
                    background: "white",
                    border: "1px solid #d1d5db",
                    borderRadius: "999px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSoftBanToggle}
                  disabled={banLoading}
                  style={{
                    padding: "8px 20px",
                    background: payment.isSoftBan ? "#16a34a" : "#dc2626",
                    color: "white",
                    border: "none",
                    borderRadius: "999px",
                    cursor: banLoading ? "not-allowed" : "pointer",
                  }}
                >
                  {banLoading ? "Processing..." : payment.isSoftBan ? "Yes, Remove Ban" : "Yes, Ban User"}
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div
            style={{
              marginTop: confirmApprove || confirmBan ? "16px" : "40px",
              display: "flex",
              gap: "16px",
              justifyContent: "flex-end",
              flexWrap: "wrap",
            }}
          >
            {/* Soft Ban Button - hidden when confirming */}
            {!confirmBan && (
              <button
                onClick={handleSoftBanToggle}
                disabled={banLoading}
                style={{
                  padding: "12px 28px",
                  background: payment.isSoftBan ? "#16a34a" : "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "999px",
                  cursor: banLoading ? "not-allowed" : "pointer",
                  opacity: banLoading ? 0.7 : 1,
                  fontWeight: 500,
                }}
              >
                {banLoading
                  ? "Processing..."
                  : payment.isSoftBan
                  ? "Remove Soft Ban"
                  : "Soft Ban User"}
              </button>
            )}

            {/* Approve Button - hidden when confirming */}
            {!confirmApprove &&
              payment.status?.toUpperCase() !== "SUCCESS" &&
              payment.status?.toUpperCase() !== "APPROVED" && (
                <button
                  onClick={handleApprove}
                  disabled={processing}
                  style={{
                    padding: "12px 32px",
                    background: "#4CAF50",
                    color: "white",
                    border: "none",
                    borderRadius: "999px",
                    cursor: processing ? "not-allowed" : "pointer",
                    opacity: processing ? 0.7 : 1,
                    fontWeight: 600,
                  }}
                >
                  {processing ? "Approving..." : "Approve Payment"}
                </button>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailModal;