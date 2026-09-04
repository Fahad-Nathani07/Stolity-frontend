import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCompanies } from "../../store/companyMasterSlice"; // Assuming you have this thunk
import CompanyRow from "./CompanyRow"; // New component we'll create below
import ManageCompanyModal from "./ManageCompanyModal"; // Skeleton modal

const PAGE_SIZES = [5, 10, 20, 50, 100];


// ────────────────────────────────────────────────
// Styles (copied directly from UsersTab – no imports needed)
// ────────────────────────────────────────────────
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


const CompaniesTab = () => {
  const dispatch = useDispatch();
  const { companies, loading } = useSelector((state) => state.companyMaster); // Adjust slice name if different

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // isConfigured: true/false/ALL
  const [sort, setSort] = useState("NAME_ASC");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [selectedCompany, setSelectedCompany] = useState(null);

  // Fetch all companies on mount
  useEffect(() => {
    dispatch(fetchCompanies());
  }, [dispatch]);
  
  
  
  useEffect(() => {
    // dispatch(fetchCompanies());
    console.log("Selected Company:", selectedCompany);
  }, [selectedCompany]);


  

  const processedCompanies = useMemo(() => {
    let data = [...companies];

    // Search by name or slug
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.slug?.toLowerCase().includes(q)
      );
    }

    // Filter by isConfigured status
    if (statusFilter !== "ALL") {
      const isConfigured = statusFilter === "CONFIGURED";
      data = data.filter((c) => !!c.isConfigured === isConfigured);
    }

    // Sorting
    if (sort === "NAME_ASC")
      data.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    if (sort === "NAME_DESC")
      data.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
    if (sort === "SLUG_ASC")
      data.sort((a, b) => (a.slug || "").localeCompare(b.slug || ""));

    return data;
  }, [companies, search, statusFilter, sort]);

  // Pagination
  const totalPages = Math.ceil(processedCompanies.length / pageSize) || 1;
  const paginatedCompanies = processedCompanies.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#494949" }}>
        Loading companies…
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
          gridTemplateColumns: "2fr 1fr 1fr 0.8fr",
          gap: "14px",
          marginBottom: "24px",
        }}
      >
        <input
          placeholder="Search by name or slug"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={inputStyle}
        />

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          style={selectStyle}
        >
          <option value="ALL">All Status</option>
          <option value="CONFIGURED">Configured</option>
          <option value="NOT_CONFIGURED">Not Configured</option>
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={selectStyle}
        >
          <option value="NAME_ASC">Name (A–Z)</option>
          <option value="NAME_DESC">Name (Z–A)</option>
          <option value="SLUG_ASC">Slug (A–Z)</option>
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
              {["Name",  "Email", "Mobile", "Website", "isConfigured", "Soft Ban Status", "Actions"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "16px 18px",
                    textAlign: h === "Actions" || h === "Soft Ban Status" || h === "isConfigured" ? "center" : "left",
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
            {paginatedCompanies.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: "40px",
                    textAlign: "center",
                    color: "#999",
                  }}
                >
                  No companies found
                </td>
              </tr>
            ) : (
              paginatedCompanies.map((c) => (
                <CompanyRow
                  key={c.id}
                  name={c.name}
                  slug={c.slug}
                  email={c.email}
                  mobile={c.mobile}
                  website={c.website}
                  isConfigured={c.isConfigured}
                  softBanStatus={c.companySoftBan}
                  onManage={() => setSelectedCompany(c)}
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

      {selectedCompany && (
        <ManageCompanyModal
          company={selectedCompany}
          onClose={() => setSelectedCompany(null)}
        />
      )}





    </div>
  );
};

export default CompaniesTab;