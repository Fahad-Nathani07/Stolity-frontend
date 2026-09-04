// src/pages/JobPortal/SubscriptionPaymentsTab.jsx
import { useEffect, useMemo, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase"; // ← adjust path to your Firebase config file
import PaymentRow from "./PaymentRow";
import PaymentDetailModal from "./PaymentDetailModal";
import { showToast } from "../../components/ToastProvider"; // adjust path if needed

const PAGE_SIZES = [5, 10, 20, 50, 100];

const inputStyle = {
  padding: "12px 16px",
  borderRadius: "999px",
  border: "1px solid #E8DCCB",
  outline: "none",
  fontSize: "14px",
  color: "#2F2F2F",
  background: "#FFFFFF",
  width: "100%",
};

const selectStyle = {
  padding: "12px 44px 12px 16px",
  borderRadius: "999px",
  border: "1px solid #E8DCCB",
  backgroundColor: "#FFFFFF",
  color: "#2F2F2F",
  cursor: "pointer",
  appearance: "none",
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path fill='%23999999' d='M6 8L0 0h12z'/></svg>\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 16px center",
  width: "100%",
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

const SubscriptionPaymentsTab = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cache: userId → name
  const [userNames, setUserNames] = useState({});

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [sort, setSort] = useState("DATE_DESC");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [triggerUpdate, setTriggerUpdate] = useState(0);
  const apiUrl = process.env.REACT_APP_API_ENDPOINT;


  // Fetch all payment proofs
  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = sessionStorage.getItem("token");

        const res = await fetch(`${apiUrl}payment-proofs-all`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });

        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }

        const json = await res.json();

        if (!json.success) {
          throw new Error("API returned success: false");
        }

        const normalized = json.data.map((item) => ({
          ...item,
          id: item.id || item.proofId,
          amount: Number(item.amount) || 0,
          status: item.status || "Pending",
          submittedAt: item.submittedAt
            ? new Date(item.submittedAt._seconds * 1000 + Math.round(item.submittedAt._nanoseconds / 1000000))
            : null,
        }));

        setPayments(normalized);
      } catch (err) {
        console.error("Fetch payment proofs failed:", err);
        setError(err.message || "Failed to load payment records");
        showToast("error", "Could not load subscription payments");
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [triggerUpdate]);

  // Load user name from Firestore if not cached
  const loadUserName = async (userId) => {
    if (userNames[userId] !== undefined) return; // already loaded

    try {
      const userRef = doc(db, "users", userId);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data();
        const name = data.name || "—";
        setUserNames((prev) => ({ ...prev, [userId]: name }));
      } else {
        setUserNames((prev) => ({ ...prev, [userId]: "User not found" }));
      }
    } catch (err) {
      console.error("Failed to load user name:", err);
      setUserNames((prev) => ({ ...prev, [userId]: "Error" }));
    }
  };



  const processedPayments = useMemo(() => {
    let data = [...payments];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      data = data.filter(
        (p) =>
          p.transactionId?.toLowerCase().includes(q) ||
          p.userId?.toLowerCase().includes(q) ||
          (userNames[p.userId] || "").toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "ALL") {
      data = data.filter((p) => p.status.toUpperCase() === statusFilter.toUpperCase());
    }

    if (sort === "DATE_DESC") {
      data.sort((a, b) => (b.submittedAt?.getTime() || 0) - (a.submittedAt?.getTime() || 0));
    } else if (sort === "DATE_ASC") {
      data.sort((a, b) => (a.submittedAt?.getTime() || 0) - (b.submittedAt?.getTime() || 0));
    } else if (sort === "AMOUNT_DESC") {
      data.sort((a, b) => b.amount - a.amount);
    }

    return data;
  }, [payments, search, statusFilter, sort, userNames]);

    const totalPages = Math.ceil(processedPayments.length / pageSize) || 1;
  const paginatedPayments = processedPayments.slice((page - 1) * pageSize, page * pageSize);

  // Auto-load names for visible rows
  useEffect(() => {
    paginatedPayments.forEach((p) => {
      if (p.userId && userNames[p.userId] === undefined) {
        loadUserName(p.userId);
      }
    });
  }, [paginatedPayments, userNames]);

  if (loading) {
    return <div style={{ padding: "80px", textAlign: "center", color: "#666" }}>Loading payments...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: "60px", textAlign: "center", color: "#991B1B" }}>
        <h3>Error</h3>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: "20px",
            padding: "10px 24px",
            background: "#FFAB49",
            color: "white",
            border: "none",
            borderRadius: "999px",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: "18px",
        padding: "20px 28px",
        boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
      }}
    >
      {/* Filters */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "14px",
          marginBottom: "24px",
        }}
      >
        <input
          placeholder="Search by Txn ID, User ID, Name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={inputStyle}
        />

        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={selectStyle}>
          <option value="ALL">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="SUCCESS">Success</option>
          {/* <option value="REJECTED">Rejected</option> */}
        </select>

        <select value={sort} onChange={(e) => setSort(e.target.value)} style={selectStyle}>
          <option value="DATE_DESC">Newest first</option>
          <option value="DATE_ASC">Oldest first</option>
          <option value="AMOUNT_DESC">Amount (High → Low)</option>
        </select>

        <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} style={selectStyle}>
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>
              {s} per page
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#FFF7EE" }}>
              {["User", "Transaction ID", "Amount", "Submitted At", "Status", "Proof", "Actions"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "16px 18px",
                    textAlign: ["Status", "Proof", "Actions", "Amount"].includes(h) ? "center" : "left",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#8A7A66",
                    textTransform: "uppercase",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedPayments.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "60px", textAlign: "center", color: "#999" }}>
                  No payment records found
                </td>
              </tr>
            ) : (
              paginatedPayments.map((p) => (
                <PaymentRow
                  key={p.id}
                  payment={p}
                  userName={userNames[p.userId] ?? "Loading..."}
                  onView={() => setSelectedPayment(p)}
                  setTriggerUpdate={setTriggerUpdate}
                />
              ))
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
          marginTop: "24px",
        }}
      >
        <span style={{ color: "#494949" }}>
          Page <strong>{page}</strong> of {totalPages}
        </span>

        <div style={{ display: "flex", gap: "10px" }}>
          <button disabled={page === 1} onClick={() => setPage(page - 1)} style={outlineButton(page === 1)}>
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

    {selectedPayment && (
        <PaymentDetailModal
            payment={selectedPayment}
            userName={userNames[selectedPayment.userId] ?? "Loading..."}
            onClose={() => setSelectedPayment(null)}
            onRefresh={() => {
            setTriggerUpdate(x=> x+1)
            }}
        />
        )}
    </div>
  );
};

export default SubscriptionPaymentsTab;