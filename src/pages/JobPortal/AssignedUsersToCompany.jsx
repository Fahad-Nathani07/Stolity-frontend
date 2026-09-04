import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const AssignedUsersToCompany = ({ companyId }) => {
  const users = useSelector((state) => state.usersAdmin.users || []);
  const [loading, setLoading] = useState(true);
  const [filteredUsers, setFilteredUsers] = useState([]);

  // Filter users who have this company in their jobPortal.companies array
  useEffect(() => {
    setLoading(true);

    const assigned = users.filter((user) => {
      // Skip if no jobPortal field
      if (!user.jobPortal) return false;

      // Check if companyId is in jobPortal.companies (array)
      return Array.isArray(user.jobPortal.companies) &&
             user.jobPortal.companies.includes(companyId);
    });

    // Sort by name (optional — can remove or change)
    assigned.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    setFilteredUsers(assigned);
    setLoading(false);
  }, [users, companyId]);

  // Pagination states
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const PAGE_SIZES = [5, 10, 20, 50, 100];

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = filteredUsers.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
        Loading assigned users...
      </div>
    );
  }

  return (
    <div style={{
      background: "#ffffff",
      borderRadius: "16px",
      padding: "24px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
    }}>
      {/* Header with count */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "24px",
      }}>
        <h3 style={{
          margin: 0,
          fontSize: "22px",
          fontWeight: 700,
          color: "#1a1a1a",
        }}>
          Assigned Users
          <span style={{
            fontSize: "16px",
            fontWeight: 500,
            color: "#666",
            marginLeft: "12px",
          }}>
            ({filteredUsers.length})
          </span>
        </h3>

        {/* Page size selector */}
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(+e.target.value);
            setPage(1);
          }}
          style={{
            padding: "10px 16px",
            borderRadius: "12px",
            border: "1px solid #d1d5db",
            background: "#fff",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size} per page
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={{
        borderRadius: "12px",
        overflow: "hidden",
        border: "1px solid #eee",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9f9f9" }}>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Contact</th>
              <th style={thStyle}>Soft Ban</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "#999",
                  fontSize: "16px",
                }}>
                  No users assigned to this company
                </td>
              </tr>
            ) : (
              paginatedUsers.map((user) => (
                <tr key={user.id} style={{
                  borderBottom: "1px solid #f0f0f0",
                  transition: "background 0.2s",
                }}>
                  <td style={tdStyle}>{user.name || (<span style={{ 
              color: '#999', 
              fontStyle: 'italic', 
              opacity: 0.7,
              fontWeight: 400 
            }}>
              N/A
            </span>)}</td>
                  <td style={tdStyle}>{user.email || (<span style={{ 
              color: '#999', 
              fontStyle: 'italic', 
              opacity: 0.7,
              fontWeight: 400 
            }}>
              N/A
            </span>)}</td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: "6px 14px",
                      borderRadius: "999px",
                      fontSize: "13px",
                      background: "#e6f4ea",
                      color: "#166534",
                      border: "1px solid #86efac",
                    }}>
                      {user.jobPortal?.role || (<span style={{ 
              color: '#999', 
              fontStyle: 'italic', 
              opacity: 0.7,
              fontWeight: 400 
            }}>
              N/A
            </span>)}
                    </span>
                  </td>
                  <td style={tdStyle}>{user.contact || user.mobile || (<span style={{ 
              color: '#999', 
              fontStyle: 'italic', 
              opacity: 0.7,
              fontWeight: 400 
            }}>
              N/A
            </span>)}</td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: "6px 14px",
                      borderRadius: "999px",
                      fontSize: "13px",
                      background: user.jobPortal?.isSoftBan ? "#fee2e2" : "#e6f4ea",
                      color: user.jobPortal?.isSoftBan ? "#991b1b" : "#166534",
                      border: user.jobPortal?.isSoftBan ? "1px solid #fca5a5" : "1px solid #86efac",
                    }}>
                      {user.jobPortal?.isSoftBan ? "Banned" : "Active"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredUsers.length > 0 && (
        <div style={{
          marginTop: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <span style={{ color: "#666" }}>
            Page <strong>{page}</strong> of {totalPages}
          </span>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              style={{
                padding: "10px 20px",
                border: "1px solid #FFAB49",
                borderRadius: "999px",
                background: "white",
                color: "#FFAB49",
                cursor: page === 1 ? "not-allowed" : "pointer",
                opacity: page === 1 ? 0.5 : 1,
              }}
            >
              Prev
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              style={{
                padding: "10px 20px",
                border: "none",
                borderRadius: "999px",
                background: page === totalPages ? "#ffd699" : "#FFAB49",
                color: "white",
                cursor: page === totalPages ? "not-allowed" : "pointer",
                opacity: page === totalPages ? 0.6 : 1,
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable styles
const thStyle = {
  padding: "16px 20px",
  textAlign: "left",
  fontSize: "13px",
  fontWeight: 600,
  color: "#666",
  background: "#f9f9f9",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const tdStyle = {
  padding: "16px 20px",
  fontSize: "14px",
  color: "#333",
};



export default AssignedUsersToCompany;