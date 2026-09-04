import { useEffect, useMemo, useState } from "react";
import UsersTab from "./UsersTab";
import SideNav from "../../components/SideNav";
import { fetchCompanies } from "../../store/companyMasterSlice";
import { useDispatch, useSelector } from "react-redux";
import { fetchJobPortalByEmail } from "../../store/jobPortalSlice";
import CompaniesTab from "./CompaniesTab";
import PaymentRow from "./PaymentRow";           // ← new component
import PaymentDetailModal from "./PaymentDetailModal"; // ← new modal
import SubscriptionPaymentsTab from "./SubscriptionPaymentsTab"; // ← new modal

const PAGE_SIZES = [5, 10, 20, 50, 100];

// Reusable styles (same as CompaniesTab)
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

const JobPortalAdmin = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("users");

  useEffect(() => {
    dispatch(fetchCompanies());
  }, [dispatch]);

  const email = sessionStorage.getItem("email");
  const { role, companies: assignedCompanyIds } = useSelector(
    (state) => state.jobPortal
  );

  useEffect(() => {
    if (email) {
      dispatch(fetchJobPortalByEmail({ email, role }));
    }
  }, [dispatch, email, role]);

  return (
    <div>
      <SideNav />

      <div
        style={{
          display: "flex",
          width: "100%",
          justifyContent: "end",
        }}
      >
        <div
          style={{
            background: "#fff",
            minHeight: "100vh",
            maxWidth: "95vw",
            width: "100%",
          }}
        >
          {/* Header */}
          <div className="dashboard-header bgwhite">
            <div className="breadcrumb SFProTextClass font20">
              <span>Jobs</span>
              <span className="separator fontW500" style={{ color: "#E94545" }}>
                ›
              </span>
              <span
                className="current fontW500"
                style={{ fontFamily: '"SF Pro", "SFProText", -apple-system, BlinkMacSystemFont, sans-serif', color: "#E94545" }}
              >
                Admin Dashboard
              </span>
            </div>
          </div>

          <div style={{ padding: "24px" }}>
            <h2 style={{ fontWeight: 600 }}>Job Portal Administration</h2>
            <p style={{ color: "#777", marginBottom: "24px" }}>
              Manage job portal access, roles, and companies
            </p>

            {/* Tabs */}
            <div
              style={{
                display: "flex",
                gap: "24px",
                borderBottom: "1px solid #eee",
              }}
            >
              <TabButton
                label="Users"
                active={activeTab === "users"}
                onClick={() => setActiveTab("users")}
              />
              <TabButton
                label="Companies"
                active={activeTab === "companies"}
                onClick={() => setActiveTab("companies")}
              />
              <TabButton
                label="Subscription Payments"
                active={activeTab === "subscription-payments"}
                onClick={() => setActiveTab("subscription-payments")}
              />
            </div>

            {/* Tab Content */}
            <div style={{ paddingTop: "24px" }}>
              {activeTab === "users" && <UsersTab />}
              {activeTab === "companies" && <CompaniesTab />}
              {activeTab === "subscription-payments" && <SubscriptionPaymentsTab />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: "10px 16px",
      border: "none",
      background: "transparent",
      borderBottom: active ? "3px solid #FFAB49" : "3px solid transparent",
      color: active ? "#000" : "#777",
      fontWeight: 500,
      cursor: "pointer",
    }}
  >
    {label}
  </button>
);

// ────────────────────────────────────────────────
// Subscription Payments Tab – full table implementation
// ────────────────────────────────────────────────


export default JobPortalAdmin;