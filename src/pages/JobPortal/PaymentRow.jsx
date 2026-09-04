// src/pages/JobPortal/PaymentRow.jsx

const PaymentRow = ({ payment, userName, onView , setTriggerUpdate}) => {
  const { transactionId, amount, status, submittedAt, paymentScreenshot } = payment;

  const statusStyles = {
    PENDING: {
      background: "#FEF3C7",
      color: "#92400E",
      border: "1px solid #FBBF24",
    },
    APPROVED: {
      background: "#E6F4EA",
      color: "#166534",
      border: "1px solid #86efac",
    },
    REJECTED: {
      background: "#FEE2E2",
      color: "#991B1B",
      border: "1px solid #fca5a5",
    },
  };

  const st = statusStyles[status?.toUpperCase()] || statusStyles.PENDING;

  return (
    <tr
      style={{
        borderBottom: "1px solid #F0E6D8",
        transition: "background 0.2s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#FFFDF9")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <td style={{ padding: "12px 18px" }}>
        <div style={{ fontWeight: 500 }}>{userName}</div>
        <div style={{ fontSize: "11px", color: "#777" }}>
          ID: {payment.userId.substring(0, 8)}...
        </div>
      </td>

      <td style={{ padding: "12px 18px" }}>{transactionId || (<span style={{ 
              color: '#999', 
              fontStyle: 'italic', 
              opacity: 0.7,
              fontWeight: 400 
            }}>
              N/A
            </span>)}</td>

      <td style={{ padding: "12px 18px", textAlign: "center", fontWeight: 500 }}>
        ₹{amount.toLocaleString("en-IN")}
      </td>

      <td style={{ padding: "12px 18px", color: "#666" }}>
        {submittedAt
          ? submittedAt.toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : (<span style={{ 
              color: '#999', 
              fontStyle: 'italic', 
              opacity: 0.7,
              fontWeight: 400 
            }}>
              N/A
            </span>)}
      </td>

     <td style={{ padding: "12px 18px", textAlign: "center" }}>
  <span
    style={{
      padding: "6px 14px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: 500,
      whiteSpace: "nowrap",
      // Dynamic styles based on status
      backgroundColor:
        status?.toUpperCase() === "SUCCESS"
          ? "#E6F4EA"          // light green
          : status?.toUpperCase() === "PENDING"
          ? "#FEF3C7"          // light yellow/orange
          : status?.toUpperCase() === "REJECTED"
          ? "#FEE2E2"          // light red
          : "#F3F4F6",         // neutral gray for unknown
      color:
        status?.toUpperCase() === "SUCCESS"
          ? "#166534"          // dark green
          : status?.toUpperCase() === "PENDING"
          ? "#92400E"          // dark amber
          : status?.toUpperCase() === "REJECTED"
          ? "#991B1B"          // dark red
          : "#4B5563",         // gray text
      border:
        status?.toUpperCase() === "SUCCESS"
          ? "1px solid #86EFAC"
          : status?.toUpperCase() === "PENDING"
          ? "1px solid #FBBF24"
          : status?.toUpperCase() === "REJECTED"
          ? "1px solid #FCA5A5"
          : "1px solid #D1D5DB",
    }}
  >
    {status || (<span style={{ 
              color: '#999', 
              fontStyle: 'italic', 
              opacity: 0.7,
              fontWeight: 400 
            }}>
              N/A
            </span>)}
  </span>
</td>

      <td style={{ padding: "12px 18px", textAlign: "center" }}>
        {paymentScreenshot ? (
          <a
            href={paymentScreenshot}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#FFAB49", textDecoration: "none" }}
          >
            View
          </a>
        ) : (
          <span style={{ 
              color: '#999', 
              fontStyle: 'italic', 
              opacity: 0.7,
              fontWeight: 400 
            }}>
              N/A
            </span>
        )}
      </td>

      <td style={{ padding: "12px 18px", textAlign: "center" }}>
        <button
          onClick={onView}
          style={{
            padding: "8px 18px",
            background: "#FFAB49",
            color: "white",
            border: "none",
            borderRadius: "999px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Details
        </button>
      </td>
    </tr>
  );
};

export default PaymentRow;