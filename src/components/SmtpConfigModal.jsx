// src/components/SmtpConfigModal.jsx
import React, { useState } from 'react';
import { addDoc, collection, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase"; // adjust path
import { showToast } from '../components/ToastProvider'; // adjust path

const SmtpConfigModal = ({ open, onClose, companyId, onSuccess }) => {
  const [accessKeyId, setAccessKeyId] = useState('');
  const [secretAccessKey, setSecretAccessKey] = useState('');
  const [region, setRegion] = useState('ap-south-1'); // default to your region
  const [sourceEmail, setSourceEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_JOB_PORTAL_API_BASE_URL || 'http://localhost:3001';

  const handleTest = async () => {
    if (!accessKeyId || !secretAccessKey || !region || !sourceEmail) {
      showToast("error", "All fields are required", "Missing Fields");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/email/test-ses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessKeyId: accessKeyId.trim(),
          secretAccessKey: secretAccessKey.trim(),
          region: region.trim(),
          sourceEmail: sourceEmail.trim(),
        }),
      });

      const data = await response.json();

      // Accept 200 or 202 as success
      if (response.ok || response.status === 202) {
        setShowConfirmation(true); // Show confirmation modal
        showToast("success", "Test email queued! Check your inbox.", "Success");
      } else {
        throw new Error(data.error || `Test failed with status ${response.status}`);
      }
    } catch (err) {
      console.error("SES test error:", err);
      showToast("error", err.message || "Test email failed. Check credentials.", "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmation = async (received) => {
    setShowConfirmation(false);

    if (received) {
      setLoading(true); // show loading while saving
      try {
        // Save to sesConfigMaster (auto-generated ID)
        await addDoc(collection(db, "sesConfigMaster"), {
          companyId,
          accessKeyId: accessKeyId.trim(),
          secretAccessKey: secretAccessKey.trim(),
          region: region.trim(),
          sourceEmail: sourceEmail.trim(),
        });

        // Activate in companyMaster
        await updateDoc(doc(db, "companyMaster", companyId), {
          useCustomSesConfig: true,
        });

        showToast("success", "SES configured successfully!", "Success");

        // Tell parent to proceed with scheduling
        onSuccess();
        onClose(); // close modal
      } catch (err) {
        console.error("SES config save error:", err);
        showToast("error", "Failed to save SES config.", "Error");
      } finally {
        setLoading(false);
      }
    } else {
      // No → stay in form for retry
      showToast("warning", "Test not received. Please try again.", "Retry");
    }
  };

  if (!open) return null;

  return (
    <>
      {/* SES Config Modal (kept name SmtpConfigModal as requested) */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10001,
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
          <h2 style={{ margin: '0 0 24px', color: '#1e293b' }}>Configure Your AWS SES Credentials</h2>

          <input
            placeholder="AWS Access Key ID (AKIA...)"
            value={accessKeyId}
            onChange={e => setAccessKeyId(e.target.value)}
            style={inputStyle}
          />
          <input
            placeholder="AWS Secret Access Key"
            type="password"
            value={secretAccessKey}
            onChange={e => setSecretAccessKey(e.target.value)}
            style={inputStyle}
          />
          <input
            placeholder="AWS Region (e.g., ap-south-1)"
            value={region}
            onChange={e => setRegion(e.target.value)}
            style={inputStyle}
          />
          <input
            placeholder="Source Email (must be verified in AWS SES)"
            value={sourceEmail}
            onChange={e => setSourceEmail(e.target.value)}
            style={inputStyle}
          />

          <p style={{ fontSize: '0.9em', color: '#6b7280', margin: '16px 0 24px' }}>
            Note: The source email must be verified in your AWS SES console before testing.
          </p>

          <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={cancelButtonStyle} disabled={loading}>Cancel</button>
            <button onClick={handleTest} disabled={loading} style={confirmButtonStyle}>
              {loading ? "Sending Test..." : "Send SES Test Email"}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10002,
          padding: '20px',
        }}>
          <div style={{
            background: '#fff',
            padding: '32px',
            borderRadius: '12px',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
            textAlign: 'center',
          }}>
            <h2 style={{ margin: '0 0 20px', color: '#1e293b' }}>Did You Receive the Test Email?</h2>
            <p style={{ margin: '0 0 24px', color: '#4b5563' }}>
              We sent a test email to your source email address. Please check your inbox (and spam/junk folder) and confirm if you received it.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => handleConfirmation(false)}
                style={cancelButtonStyle}
              >
                No, Try Again
              </button>
              <button
                onClick={() => handleConfirmation(true)}
                style={confirmButtonStyle}
              >
                Yes, I Received It
              </button>
              <button
                onClick={() => setShowConfirmation(false)}
                style={cancelButtonStyle}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Styles (unchanged)
const inputStyle = { 
  width: '100%', 
  padding: '12px', 
  marginBottom: '16px', 
  border: '1px solid #d1d5db', 
  borderRadius: '8px' 
};

const cancelButtonStyle = { 
  padding: '10px 20px', 
  border: '1px solid #d1d5db', 
  background: '#fff', 
  borderRadius: '8px' 
};

const confirmButtonStyle = { 
  padding: '10px 20px', 
  background: '#FFAB49', 
  color: 'white', 
  border: 'none', 
  borderRadius: '8px' 
};

export default SmtpConfigModal;