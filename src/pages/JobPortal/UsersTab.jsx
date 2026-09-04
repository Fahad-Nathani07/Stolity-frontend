import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllUsers } from "../../store/usersAdminSlice";
import UserRow from "./UserRow";
import ManageUserModal from "./ManageUserModal";

const PAGE_SIZES = [5, 10, 20, 50, 100];

const ordinalDay = (day) => {
  const j = day % 10;
  const k = day % 100;
  if (j === 1 && k !== 11) return `${day}st`;
  if (j === 2 && k !== 12) return `${day}nd`;
  if (j === 3 && k !== 13) return `${day}rd`;
  return `${day}th`;
};

const formatAccountCreatedOn = (ms) => {
  if (!ms) return "—";
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "—";
  const month = d.toLocaleString("en-GB", { month: "long" });
  return `${ordinalDay(d.getDate())} ${month} ${d.getFullYear()}`;
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const getCreatedAtRange = (filter) => {
  const now = Date.now();
  const todayStart = startOfToday();

  switch (filter) {
    case "TODAY":
      return { from: todayStart, to: now };
    case "LAST_7_DAYS":
      return { from: todayStart - 6 * 24 * 60 * 60 * 1000, to: now };
    case "LAST_30_DAYS":
      return { from: todayStart - 29 * 24 * 60 * 60 * 1000, to: now };
    case "LAST_3_MONTHS": {
      const d = new Date();
      d.setMonth(d.getMonth() - 3);
      d.setHours(0, 0, 0, 0);
      return { from: d.getTime(), to: now };
    }
    case "THIS_YEAR": {
      const d = new Date(new Date().getFullYear(), 0, 1);
      return { from: d.getTime(), to: now };
    }
    default:
      return null;
  }
};

const UsersTab = () => {
  const dispatch = useDispatch();
  const { users, loading } = useSelector((state) => state.usersAdmin);

  const loggedInEmail = sessionStorage.getItem("email");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [createdFilter, setCreatedFilter] = useState("ALL");
  const [sort, setSort] = useState("NAME_ASC");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    dispatch(fetchAllUsers());
  }, [dispatch]);

  useEffect(() => {
    console.log("Fetched users:", users);
  }, [users]);

  const processedUsers = useMemo(() => {
    let data = [...users];

    // ❌ Hide logged-in SUPER_ADMIN
    data = data.filter((u) => u.email !== loggedInEmail);

    // 🔍 Search
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q)
      );
    }

    // 🎯 Role filter
    if (roleFilter !== "ALL") {
      data = data.filter((u) => u.jobPortal?.role === roleFilter);
    }

    // 📅 Account created filter
    const range = getCreatedAtRange(createdFilter);
    if (range) {
      data = data.filter((u) => {
        const created = u.createdAt;
        if (!created) return false;
        return created >= range.from && created <= range.to;
      });
    }

    // 🔃 Sorting
    if (sort === "NAME_ASC")
      data.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    if (sort === "NAME_DESC")
      data.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
    if (sort === "EMAIL_ASC")
      data.sort((a, b) => (a.email || "").localeCompare(b.email || ""));
    if (sort === "CREATED_NEWEST")
      data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    if (sort === "CREATED_OLDEST")
      data.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    return data;
  }, [users, search, roleFilter, createdFilter, sort, loggedInEmail]);

  // 📄 Pagination
  const totalPages = Math.ceil(processedUsers.length / pageSize) || 1;
  const paginatedUsers = processedUsers.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#494949" }}>
        Loading users…
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: "18px",
        padding: "15px 28px",
        boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
      }}
    >
      {/* Filters */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr 1.1fr 1fr 0.8fr",
          gap: "14px",
          marginBottom: "16px",
        }}
      >
        <input
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={inputStyle}
        />

        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          style={selectStyle}
        >
          <option value="ALL">All roles</option>
          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
          <option value="ADMIN">ADMIN</option>
          <option value="JOB_PORTAL_MANAGER">JOB_PORTAL_MANAGER</option>
        </select>

        <select
          value={createdFilter}
          onChange={(e) => {
            setCreatedFilter(e.target.value);
            setPage(1);
          }}
          style={selectStyle}
        >
          <option value="ALL">Created: All time</option>
          <option value="TODAY">Created: Today</option>
          <option value="LAST_7_DAYS">Created: Last 7 days</option>
          <option value="LAST_30_DAYS">Created: Last 1 month</option>
          <option value="LAST_3_MONTHS">Created: Last 3 months</option>
          <option value="THIS_YEAR">Created: This year</option>
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={selectStyle}
        >
          <option value="NAME_ASC">Name (A–Z)</option>
          <option value="NAME_DESC">Name (Z–A)</option>
          <option value="EMAIL_ASC">Email (A–Z)</option>
          <option value="CREATED_NEWEST">Created (Newest)</option>
          <option value="CREATED_OLDEST">Created (Oldest)</option>
        </select>

        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(+e.target.value);
            setPage(1);
          }}
          style={selectStyle}
        >
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>
              {s} / page
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          marginBottom: "18px",
          color: "#6B7280",
          fontSize: "13px",
          fontWeight: 500,
        }}
      >
        Showing <strong style={{ color: "#2F2F2F" }}>{processedUsers.length}</strong>{" "}
        user{processedUsers.length === 1 ? "" : "s"}
        {createdFilter !== "ALL" ? " for selected period" : ""}
      </div>

      {/* Table */}
      <div
        style={{
          background: "white",
          borderRadius: "14px",
          overflow: "hidden",
        }}
      >
        <table width="100%" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#FFF7EE" }}>
              {[
                "Name",
                "Email",
                "Role",
                "Companies",
                "Subscription",
                "Account created on",
                "Status",
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "16px 18px",
                    textAlign: h === "Status" ? "center" : "left",
                    fontSize: "11px",
                    letterSpacing: "0.08em",
                    color: "#8A7A66",
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {paginatedUsers.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: "40px",
                    textAlign: "center",
                    color: "#999",
                  }}
                >
                  No users found
                </td>
              </tr>
            ) : (
              paginatedUsers.map((u) => {
                let subscriptionDisplay = "Free user";

                if (u.subscription && u.subscription.expiration_at) {
                  const now = Date.now();
                  const expirationTime = u.subscription.expiration_at;

                  if (expirationTime > now) {
                    subscriptionDisplay = `Premium user (${u.subscription.storage || "50 GB"})`;
                  } else {
                    subscriptionDisplay = "Free user (Expired)";
                  }
                }

                return (
                  <UserRow
                    key={u.id}
                    name={u.name}
                    email={u.email}
                    role={u.jobPortal?.role}
                    onManage={() => setSelectedUser(u)}
                    companies={u.jobPortal?.companies?.length || 0}
                    subscription={subscriptionDisplay}
                    accountCreatedOn={formatAccountCreatedOn(u.createdAt)}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "20px",
        }}
      >
        <span style={{ color: "#494949" }}>
          Page <strong>{page}</strong> of {totalPages}
        </span>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            style={outlineButton(page === 1)}
          >
            Prev
          </button>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            style={primaryButton(page === totalPages)}
          >
            Next
          </button>
        </div>
      </div>

      {selectedUser && (
        <ManageUserModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
};

export default UsersTab;

/* ===========================
   Styles (Theme-aligned)
=========================== */

const inputStyle = {
  padding: "12px 16px",
  borderRadius: "999px",
  border: "1px solid #E8DCCB",
  minWidth: "220px",
  outline: "none",
  fontSize: "14px",
  color: "#2F2F2F",
  background: "#FFFFFF",
};

const selectStyle = {
  padding: "12px 44px 12px 16px",
  borderRadius: "999px",
  border: "1px solid #E8DCCB",
  backgroundColor: "#FFFFFF",
  color: "#2F2F2F",
  cursor: "pointer",
  appearance: "none",
  WebkitAppearance: "none",
  MozAppearance: "none",
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path fill='%23999999' d='M6 8L0 0h12z'/></svg>\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 16px center",
};

const primaryButton = (disabled) => ({
  padding: "8px 16px",
  borderRadius: "999px",
  border: "none",
  background: disabled ? "#FFD7A8" : "#FFAB49",
  color: "white",
  cursor: disabled ? "not-allowed" : "pointer",
});

const outlineButton = (disabled) => ({
  padding: "8px 16px",
  borderRadius: "999px",
  border: "1px solid #FFAB49",
  background: "white",
  color: "#494949",
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.6 : 1,
});
