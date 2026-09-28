import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FiRefreshCw,
  FiDownload,
  FiUpload,
  FiUser,
  FiFilter,
  FiActivity,
  FiArchive,
  FiPackage,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { showToast } from "../components/ToastProvider";
import {
  SupportMultiFilterSelect,
  markPaneScrolling,
} from "../components/SupportFilterSelect";

const ACTION_OPTIONS = [
  { id: "UPLOAD", label: "Upload" },
  { id: "DOWNLOAD", label: "Download" },
  { id: "ZIP", label: "Zip" },
  { id: "UNZIP", label: "Unzip" },
  { id: "COPY", label: "Copy" },
  { id: "MOVE", label: "Move" },
  { id: "RENAME", label: "Rename" },
  { id: "DELETE", label: "Delete" },
  { id: "DELETE_FOLDER", label: "Delete folder" },
  { id: "RESTORE", label: "Restore" },
  { id: "EMPTY_TRASH", label: "Empty trash" },
  { id: "CREATE_FOLDER", label: "Create folder" },
  { id: "PREVIEW", label: "Preview" },
  { id: "LOGIN", label: "Login" },
  { id: "LOGOUT", label: "Logout" },
];

const LOGS_PAGE_SIZE = 100;

const STATUS_OPTIONS = [
  { id: "REQUESTED", label: "Requested" },
  { id: "STARTED", label: "Started" },
  { id: "COMPLETED", label: "Completed" },
  { id: "SUCCESS", label: "Success" },
  { id: "FAILED", label: "Failed" },
  { id: "CANCELLED", label: "Cancelled" },
];

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatBytes(bytes) {
  const n = Number(bytes) || 0;
  if (n <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v < 10 && i > 0 ? v.toFixed(2) : v < 100 && i > 0 ? v.toFixed(1) : Math.round(v)} ${units[i]}`;
}

function formatWhen(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatLabel(value) {
  if (!value) return "—";
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusPillClass(status) {
  const s = String(status || "").toUpperCase();
  if (s === "COMPLETED" || s === "SUCCESS") return "ssd-pill-success";
  if (s === "FAILED") return "ssd-pill-danger";
  if (s === "CANCELLED") return "ssd-pill-muted";
  if (s === "REQUESTED" || s === "STARTED") return "ssd-pill-warn";
  return "ssd-pill-muted";
}

function buildEventBreakdown(totals) {
  const parts = [
    ["Upload", totals.totalUploadCount],
    ["Download", totals.totalDownloadCount],
    ["Login", totals.totalLoginCount],
    ["Logout", totals.totalLogoutCount],
    ["Zip", totals.totalZipCount],
    ["Unzip", totals.totalUnzipCount],
    ["Copy", totals.totalCopyCount],
    ["Move", totals.totalMoveCount],
    ["Rename", totals.totalRenameCount],
    ["Delete", totals.totalDeleteCount],
    ["Restore", totals.totalRestoreCount],
    ["Create folder", totals.totalCreateFolderCount],
    ["Preview", totals.totalPreviewCount],
    ["Other", totals.totalOtherCount],
  ]
    .map(([label, raw]) => ({ label, n: Number(raw) || 0 }))
    .filter((p) => p.n > 0);

  if (!parts.length) return "No events in this range";
  return parts.map((p) => `${p.label} ${p.n}`).join(" · ");
}

function personInitials(email, fallback = "?") {
  const local = String(email || "")
    .split("@")[0]
    .trim();
  if (!local) return fallback;
  const parts = local.split(/[._\-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}

export default function SupportActivityPane({
  apiUrl,
  authHeaders,
  onItemCountChange,
}) {
  const [fromDate, setFromDate] = useState(todayKey);
  const [toDate, setToDate] = useState(todayKey);
  const [actionFilter, setActionFilter] = useState([]);
  const [statusFilter, setStatusFilter] = useState([]);
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [cursor, setCursor] = useState(null);
  const [cursorStack, setCursorStack] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const filterKey = useMemo(
    () =>
      [
        fromDate,
        toDate,
        selectedUserId || "",
        actionFilter.join(","),
        statusFilter.join(","),
      ].join("|"),
    [fromDate, toDate, selectedUserId, actionFilter, statusFilter]
  );
  const filterKeyRef = React.useRef(filterKey);
  const filterChanged = filterKeyRef.current !== filterKey;
  const activeCursor = filterChanged ? null : cursor;
  const activePage = filterChanged ? 1 : page;

  const selectedUser = useMemo(
    () => users.find((u) => u.userId === selectedUserId) || null,
    [users, selectedUserId]
  );

  const fetchSummaryAndUsers = useCallback(
    async ({ soft = false } = {}) => {
      if (!apiUrl || !authHeaders?.Authorization) return;
      if (!soft) setLoading(true);
      setError("");
      try {
        const params = { from: fromDate, to: toDate };
        const [sumRes, usersRes] = await Promise.all([
          axios.get(`${apiUrl}support/activity/summary`, {
            headers: authHeaders,
            params,
          }),
          axios.get(`${apiUrl}support/activity/users`, {
            headers: authHeaders,
            params,
          }),
        ]);
        setSummary(sumRes.data || null);
        setUsers(Array.isArray(usersRes.data?.users) ? usersRes.data.users : []);
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load activity";
        setError(msg);
        if (!soft) showToast(msg, "error");
      } finally {
        if (!soft) setLoading(false);
      }
    },
    [apiUrl, authHeaders, fromDate, toDate]
  );

  const fetchLogs = useCallback(
    async ({ soft = false, cursorOverride } = {}) => {
      if (!apiUrl || !authHeaders?.Authorization) return;
      if (!soft) setLogsLoading(true);
      setError("");
      const requestCursor =
        cursorOverride !== undefined ? cursorOverride : activeCursor;
      try {
        const params = {
          from: fromDate,
          to: toDate,
          limit: LOGS_PAGE_SIZE,
          ...(requestCursor ? { cursor: requestCursor } : {}),
          ...(selectedUserId ? { userId: selectedUserId } : {}),
          ...(actionFilter.length ? { action: actionFilter.join(",") } : {}),
          ...(statusFilter.length ? { status: statusFilter.join(",") } : {}),
        };
        const logsRes = await axios.get(`${apiUrl}support/activity/logs`, {
          headers: authHeaders,
          params,
        });
        const data = logsRes.data || {};
        setEvents(Array.isArray(data.events) ? data.events : []);
        setHasMore(Boolean(data.hasMore && data.nextCursor));
        setNextCursor(data.nextCursor || null);
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load activity logs";
        setError(msg);
        if (!soft) showToast(msg, "error");
      } finally {
        if (!soft) setLogsLoading(false);
      }
    },
    [
      apiUrl,
      authHeaders,
      fromDate,
      toDate,
      activeCursor,
      selectedUserId,
      actionFilter,
      statusFilter,
    ]
  );

  // Keep pagination in sync when filters / dates / user change
  useEffect(() => {
    if (filterKeyRef.current === filterKey) return;
    filterKeyRef.current = filterKey;
    setPage(1);
    setCursor(null);
    setCursorStack([]);
    setNextCursor(null);
    setHasMore(false);
  }, [filterKey]);

  useEffect(() => {
    fetchSummaryAndUsers({ soft: false });
  }, [fetchSummaryAndUsers]);

  useEffect(() => {
    fetchLogs({ soft: false });
  }, [fetchLogs]);

  useEffect(() => {
    if (typeof onItemCountChange === "function") {
      onItemCountChange(users.length);
    }
  }, [users.length, onItemCountChange]);

  const totals = summary?.totals || {};
  const eventBreakdown = buildEventBreakdown(totals);
  const displayPage = activePage;
  const fromRow =
    events.length === 0 ? 0 : (displayPage - 1) * LOGS_PAGE_SIZE + 1;
  const toRow = (displayPage - 1) * LOGS_PAGE_SIZE + events.length;
  const busy = loading || logsLoading;

  const goPrev = () => {
    if (displayPage <= 1 || !cursorStack.length) return;
    const prev = cursorStack[cursorStack.length - 1];
    setCursorStack((s) => s.slice(0, -1));
    setCursor(prev);
    setPage((p) => Math.max(1, p - 1));
  };

  const goNext = () => {
    if (!hasMore || !nextCursor) return;
    setCursorStack((s) => [...s, activeCursor]);
    setCursor(nextCursor);
    setPage((p) => p + 1);
  };

  const refreshAll = () => {
    filterKeyRef.current = filterKey;
    setPage(1);
    setCursor(null);
    setCursorStack([]);
    setNextCursor(null);
    setHasMore(false);
    fetchSummaryAndUsers({ soft: false });
    fetchLogs({ soft: false, cursorOverride: null });
  };

  return (
    <div className="ssd-callbacks ssd-activity">
      {error && <div className="ssd-banner ssd-banner-error">{error}</div>}

      <div className="ssd-activity-stats">
        <div className="ssd-stat-card">
          <FiUpload aria-hidden />
          <div>
            <span className="ssd-stat-label">Uploaded</span>
            <strong>{formatBytes(totals.totalUploadedBytes)}</strong>
            <span className="ssd-stat-sub">
              {Number(totals.totalUploadCount) || 0} uploads
            </span>
          </div>
        </div>
        <div className="ssd-stat-card">
          <FiDownload aria-hidden />
          <div>
            <span className="ssd-stat-label">Downloaded</span>
            <strong>{formatBytes(totals.totalDownloadedBytes)}</strong>
            <span className="ssd-stat-sub">
              {Number(totals.totalDownloadCount) || 0} downloads
              {Number(totals.totalDownloadedRequestedBytes) > 0 && (
                <> · incl. requested</>
              )}
            </span>
          </div>
        </div>
        <div className="ssd-stat-card">
          <FiArchive aria-hidden />
          <div>
            <span className="ssd-stat-label">Zip</span>
            <strong>{Number(totals.totalZipCount) || 0}</strong>
            <span className="ssd-stat-sub">zip operations</span>
          </div>
        </div>
        <div className="ssd-stat-card">
          <FiPackage aria-hidden />
          <div>
            <span className="ssd-stat-label">Unzip</span>
            <strong>{Number(totals.totalUnzipCount) || 0}</strong>
            <span className="ssd-stat-sub">unzip operations</span>
          </div>
        </div>
        <div className="ssd-stat-card ssd-stat-card--events">
          <FiActivity aria-hidden />
          <div>
            <span className="ssd-stat-label">Total events</span>
            <strong>{Number(totals.totalEventCount) || 0}</strong>
            <span className="ssd-stat-sub ssd-stat-sub--wrap" title={eventBreakdown}>
              {eventBreakdown}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="ssd-btn ssd-btn-ghost ssd-btn-refresh ssd-activity-refresh"
          onClick={refreshAll}
          disabled={busy}
          title="Refresh activity"
        >
          <FiRefreshCw />
          Refresh
        </button>
      </div>

      <div className="ssd-layout ssd-activity-layout">
        <aside className="ssd-list-pane ssd-activity-users">
          <div className="ssd-pane-head">
            <FiUser />
            <span>Users</span>
            <span className="ssd-muted">{users.length}</span>
            {selectedUserId && (
              <button
                type="button"
                className="ssd-btn ssd-btn-ghost ssd-btn-xs"
                onClick={() => setSelectedUserId(null)}
              >
                Clear
              </button>
            )}
          </div>
          <div
            className="ssd-pane-scroll ssd-activity-users-scroll"
            onScroll={markPaneScrolling}
          >
            {loading && !users.length ? (
              <p className="ssd-empty">Loading…</p>
            ) : !users.length ? (
              <p className="ssd-empty">No activity for this date range.</p>
            ) : (
              <ul className="ssd-activity-user-list">
                {users.map((u) => {
                  const selected = selectedUserId === u.userId;
                  return (
                    <li key={u.userId}>
                      <button
                        type="button"
                        className={`ssd-activity-user${
                          selected ? " is-selected" : ""
                        }`}
                        onClick={() =>
                          setSelectedUserId(selected ? null : u.userId)
                        }
                      >
                        <span className="ssd-activity-user-avatar" aria-hidden>
                          {personInitials(u.email || u.userId)}
                        </span>
                        <span className="ssd-activity-user-body">
                          <span className="ssd-activity-user-email">
                            {u.email || u.userId}
                          </span>
                          <span className="ssd-activity-user-metrics">
                            <span className="ssd-activity-metric ssd-activity-metric--up">
                              <FiUpload />
                              {formatBytes(u.uploadedBytes)}
                            </span>
                            <span className="ssd-activity-metric ssd-activity-metric--down">
                              <FiDownload />
                              {formatBytes(u.downloadedBytes)}
                            </span>
                          </span>
                        </span>
                        <span className="ssd-activity-user-count">
                          {Number(u.eventCount) || 0}
                          <small>events</small>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        <section className="ssd-detail-pane ssd-activity-detail">
          <div className="ssd-pane-head">
            <FiFilter />
            <span>
              {selectedUser
                ? `Activity — ${selectedUser.email || selectedUser.userId}`
                : "Detailed activity"}
            </span>
            <span className="ssd-muted">
              {events.length
                ? `${fromRow}–${toRow}`
                : "0"}
            </span>
          </div>

          <div className="ssd-activity-detail-filters">
            <div className="ssd-activity-filter-row">
              <label className="ssd-activity-filter-item">
                <span className="ssd-activity-filter-label">From</span>
                <span className="ssd-activity-filter-control">
                  <input
                    type="date"
                    className="ssd-activity-filter-input"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </span>
              </label>
              <label className="ssd-activity-filter-item">
                <span className="ssd-activity-filter-label">To</span>
                <span className="ssd-activity-filter-control">
                  <input
                    type="date"
                    className="ssd-activity-filter-input"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </span>
              </label>
              <SupportMultiFilterSelect
                className="ssd-activity-filter-item ssd-activity-filter-select"
                label="Action"
                values={actionFilter}
                options={ACTION_OPTIONS}
                onChange={setActionFilter}
                allLabel="All actions"
              />
              <SupportMultiFilterSelect
                className="ssd-activity-filter-item ssd-activity-filter-select"
                label="Status"
                values={statusFilter}
                options={STATUS_OPTIONS}
                onChange={setStatusFilter}
                allLabel="All statuses"
              />
            </div>
          </div>

          <div className="ssd-activity-table-panel">
            {logsLoading && !events.length ? (
              <div className="ssd-activity-table-placeholder" aria-busy="true">
                <div className="ssd-activity-table-placeholder-bar" />
                <div className="ssd-activity-table-placeholder-bar" />
                <div className="ssd-activity-table-placeholder-bar" />
                <div className="ssd-activity-table-placeholder-bar" />
                <div className="ssd-activity-table-placeholder-bar" />
                <p className="ssd-empty">Loading events…</p>
              </div>
            ) : !events.length ? (
              <p className="ssd-empty">No events match the current filters.</p>
            ) : (
              <div
                className={`ssd-activity-table-shell${
                  logsLoading ? " is-loading" : ""
                }`}
                onScroll={markPaneScrolling}
              >
                {logsLoading && (
                  <div className="ssd-activity-table-loading" aria-live="polite">
                    <span className="ssd-activity-table-loading-pill">
                      <span className="ssd-activity-table-spinner" aria-hidden />
                      Updating…
                    </span>
                  </div>
                )}
                <table className="ssd-activity-table">
                  <colgroup>
                    <col className="ssd-activity-col-when" />
                    <col className="ssd-activity-col-user" />
                    <col className="ssd-activity-col-action" />
                    <col className="ssd-activity-col-path" />
                    <col className="ssd-activity-col-size" />
                    <col className="ssd-activity-col-status" />
                    <col className="ssd-activity-col-source" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th scope="col">When</th>
                      <th scope="col">User</th>
                      <th scope="col">Action</th>
                      <th scope="col">File / path</th>
                      <th scope="col">Size</th>
                      <th scope="col">Status</th>
                      <th scope="col">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((ev) => (
                      <tr key={ev.id}>
                        <td>{formatWhen(ev.timestamp)}</td>
                        <td className="ssd-mono">{ev.email || ev.userId}</td>
                        <td>{formatLabel(ev.action)}</td>
                        <td title={ev.path || ""}>
                          {ev.fileName || ev.path || "—"}
                          {ev.sourcePath && ev.destinationPath && (
                            <div className="ssd-muted ssd-tiny">
                              {ev.sourcePath} → {ev.destinationPath}
                            </div>
                          )}
                        </td>
                        <td>{formatBytes(ev.sizeBytes)}</td>
                        <td>
                          <span
                            className={`ssd-pill ${statusPillClass(ev.status)}`}
                          >
                            {formatLabel(ev.status)}
                          </span>
                        </td>
                        <td>{formatLabel(ev.source)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="ssd-activity-pager">
              <span className="ssd-activity-pager-range">
                {events.length
                  ? `Showing ${fromRow}–${toRow} · ${LOGS_PAGE_SIZE}/page`
                  : "No rows"}
              </span>
              <div className="ssd-activity-pager-nav">
                <button
                  type="button"
                  className="ssd-btn ssd-btn-ghost ssd-btn-xs"
                  disabled={busy || displayPage <= 1}
                  onClick={goPrev}
                  aria-label="Previous page"
                >
                  <FiChevronLeft />
                  Prev
                </button>
                <span className="ssd-activity-pager-page">
                  Page {displayPage}
                </span>
                <button
                  type="button"
                  className="ssd-btn ssd-btn-ghost ssd-btn-xs"
                  disabled={busy || !hasMore || !nextCursor}
                  onClick={goNext}
                  aria-label="Next page"
                >
                  Next
                  <FiChevronRight />
                </button>
              </div>
            </div>

            <p className="ssd-activity-note" title="Native browser downloads stay Requested — the app cannot confirm the browser finished saving.">
              Native downloads stay <strong>Requested</strong>; stream downloads update to Completed / Failed.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
