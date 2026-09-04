import RoleBadge from "./RoleBadge";

const UserRow = ({
  name,
  email,
  role,
  companies,
  onManage,
  subscription,
  accountCreatedOn,
}) => {
  const isPremium = subscription !== "Free user";

  return (
    <tr
      style={{
        borderBottom: "1px solid #F0E6D8",
        transition: "background 0.2s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#FFFDF9")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {/* Name */}
      <td style={{ ...cellStyle, ...colStyles.name }}>
        <div style={{ fontWeight: 500 }}>
          {name || (
            <span
              style={{
                color: "#999",
                fontStyle: "italic",
                opacity: 0.7,
                fontWeight: 400,
              }}
            >
              N/A
            </span>
          )}
        </div>
      </td>

      {/* Email */}
      <td style={{ ...cellStyle, ...colStyles.email }}>
        <div style={{ color: "#494949", fontSize: "14px" }}>{email}</div>
      </td>

      {/* Role */}
      <td style={{ ...cellStyle, ...colStyles.role }}>
        <RoleBadge role={role} />
      </td>

      {/* Companies */}
      <td style={{ ...cellStyle, ...colStyles.companies }}>
        <span
          style={{
            background: "#FDF8F4",
            padding: "4px 10px",
            borderRadius: "999px",
            fontSize: "13px",
            color: "#494949",
          }}
        >
          {companies}
        </span>
      </td>

      {/* Subscription */}
      <td style={{ ...cellStyle, ...colStyles.subscription }}>
        <span
          style={{
            padding: "6px 14px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: 500,
            background: isPremium ? "#FFE7C6" : "#F4F4F4",
            color: isPremium ? "#7A4A00" : "#8A8A8A",
            border: "1px solid #E8DCCB",
            whiteSpace: "nowrap",
          }}
        >
          {subscription}
        </span>
      </td>

      {/* Account created on */}
      <td style={{ ...cellStyle, ...colStyles.created }}>
        <div style={{ color: "#494949", fontSize: "13px" }}>
          {accountCreatedOn || "—"}
        </div>
      </td>

      {/* Action */}
      <td style={{ ...cellStyle, ...colStyles.action }}>
        <button
          onClick={onManage}
          style={manageButtonStyle}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#ff9c2f")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#FFAB49")}
        >
          Manage
        </button>
      </td>
    </tr>
  );
};

export default UserRow;

const cellStyle = {
  padding: "6px 18px",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
  fontSize: "12px",
  color: "#2F2F2F",
};

const colStyles = {
  name: { minWidth: "180px" },
  email: { minWidth: "240px" },
  role: { minWidth: "160px" },
  companies: { minWidth: "120px", textAlign: "center" },
  subscription: { minWidth: "220px" },
  created: { minWidth: "170px" },
  action: { minWidth: "120px", textAlign: "center" },
};

const manageButtonStyle = {
  padding: "8px 18px",
  background: "#FFAB49",
  color: "#FFFFFF",
  border: "none",
  borderRadius: "999px",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: 600,
  letterSpacing: "0.02em",
  boxShadow: "0 4px 10px rgba(255,171,73,0.35)",
  transition: "all 0.2s ease",
};
