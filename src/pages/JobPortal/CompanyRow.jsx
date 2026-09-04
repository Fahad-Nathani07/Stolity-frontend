const CompanyRow = ({ name, slug, email, mobile, website, isConfigured, softBanStatus, onManage }) => {
  // console.log("CompanyRow rendered:", name);
  // console.log("softBanStatus rendered:", softBanStatus);
  // console.log("website rendered:", website);


  const getFullUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `https://${url}`;
  };


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
        <div style={{ fontWeight: 500 }}>{name || (
            <span style={{ 
              color: '#999', 
              fontStyle: 'italic', 
              opacity: 0.7,
              fontWeight: 400 
            }}>
              N/A
            </span>
          )}</div>
      </td>

      {/* Slug */}
      {/* <td style={{ ...cellStyle, ...colStyles.slug }}>
        <div style={{ color: "#494949", fontSize: "14px" }}>{slug || "—"}</div>
      </td> */}

      {/* Email */}
      <td style={{ ...cellStyle, ...colStyles.email }}>
        <div style={{ color: "#494949", fontSize: "14px" }}>{email || (
            <span style={{ 
              color: '#999', 
              fontStyle: 'italic', 
              opacity: 0.7,
              fontWeight: 400 
            }}>
              N/A
            </span>
          )}</div>
      </td>

      {/* Mobile */}
      <td style={{ ...cellStyle, ...colStyles.mobile }}>
        <div style={{ color: "#494949", fontSize: "14px" }}>{mobile || (
            <span style={{ 
              color: '#999', 
              fontStyle: 'italic', 
              opacity: 0.7,
              fontWeight: 400 
            }}>
              N/A
            </span>
          )}</div>
      </td>

      {/* Website */}
      <td style={{ ...cellStyle, ...colStyles.website }}>
        <div style={{ color: "#494949", fontSize: "14px" }}>
         {website ? (
  <a
    href={getFullUrl(website)}
    target="_blank"
    rel="noopener noreferrer"
    style={{ color: "#FFAB49" }}
  >
    Visit
  </a>
) : (
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

      {/* Status (isConfigured) */}
      <td style={{ ...cellStyle, ...colStyles.status, textAlign: "center" }}>
        <span
          style={{
            padding: "6px 14px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: 500,
            background: isConfigured ? "#E6F4EA" : "#FEE2E2",
            color: isConfigured ? "#166534" : "#991B1B",
            border: isConfigured ? "1px solid #86efac" : "1px solid #fca5a5",
            whiteSpace: "nowrap",
          }}
        >
          {isConfigured ? "Configured" : "Not Configured"}
        </span>
      </td>

      <td style={{ ...cellStyle, ...colStyles.status, textAlign: "center" }}>
        <span
          style={{
            padding: "6px 14px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: 500,
            background: softBanStatus ? "#FEE2E2" : "#E6F4EA",
            color: softBanStatus ?  "#991B1B" : "#166534",
            border: softBanStatus ? "1px solid #fca5a5" : "1px solid #86efac",
            whiteSpace: "nowrap",
          }}
        >
          {/* {softBanStatus ? "Active" : "Soft-Banned"} */}
          {softBanStatus ? "Soft-Banned" : "Active"}
        </span>
      </td>

      {/* Action */}
      <td style={{ ...cellStyle, ...colStyles.action, textAlign: "center" }}>
        <button onClick={onManage} style={manageButtonStyle}>
          Manage
        </button>
      </td>
    </tr>
  );
};

export default CompanyRow;

/* Styles – same as UserRow */
const cellStyle = {
  padding: "6px 18px",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
  fontSize: "12px",
  color: "#2F2F2F",
};

const colStyles = {
  name: { minWidth: "180px" },
  slug: { minWidth: "160px" },
  email: { minWidth: "240px" },
  mobile: { minWidth: "160px" },
  website: { minWidth: "140px" },
  status: { minWidth: "160px" },
  action: { minWidth: "120px" },
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