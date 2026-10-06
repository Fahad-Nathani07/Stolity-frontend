import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  FiRefreshCw,
  FiUsers,
  FiUserCheck,
  FiUserPlus,
  FiAward,
  FiActivity,
  FiInbox,
} from "react-icons/fi";
import { showToast } from "../components/ToastProvider";
import { markPaneScrolling } from "../components/SupportFilterSelect";
import FilesPaginationFooter from "../components/FilesPaginationFooter";
import SupportUserDetailsModal from "./SupportUserDetailsModal";

const DEFAULT_PAGE_SIZE = 25;

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shiftDateKey(daysBack) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysBack);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateKeyPretty(key) {
  if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return key || "—";
  const [y, m, d] = key.split("-").map(Number);
  try {
    return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return key;
  }
}

/** Single day → "Today · 01 Oct 2026" or just the date; range → "a → b". */
function formatActivityRange(from, to, today = todayKey()) {
  if (!from && !to) return "—";
  if (from && to && from === to) {
    const pretty = formatDateKeyPretty(from);
    return from === today ? `Today · ${pretty}` : pretty;
  }
  if (from && to) {
    return `${formatDateKeyPretty(from)} → ${formatDateKeyPretty(to)}`;
  }
  return formatDateKeyPretty(from || to);
}

function formatWhen(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatPremiumExpiry(user) {
  if (!user || user.accountType !== "Premium") return "—";

  let days = user.expiresInDays;
  if (days == null && user.expirationAt) {
    const expMs = Date.parse(user.expirationAt);
    if (!Number.isNaN(expMs) && expMs > Date.now()) {
      days = Math.max(
        0,
        Math.ceil((expMs - Date.now()) / (24 * 60 * 60 * 1000))
      );
    }
  }
  if (days == null || Number.isNaN(Number(days))) return "—";

  const n = Number(days);
  if (n <= 0) return "Expires today";
  if (n === 1) return "Expires in 1 day";
  return `Expires in ${n} days`;
}

function premiumExpiryTone(user) {
  if (!user || user.accountType !== "Premium") return "muted";
  const days =
    user.expiresInDays != null
      ? Number(user.expiresInDays)
      : user.expirationAt
        ? Math.ceil(
            (Date.parse(user.expirationAt) - Date.now()) /
              (24 * 60 * 60 * 1000)
          )
        : null;
  if (days == null || Number.isNaN(days)) return "muted";
  if (days <= 3) return "danger";
  if (days <= 14) return "warn";
  return "ok";
}

function StorageUsageBar({ usedLabel, limitLabel, percent }) {
  const pct =
    percent == null || Number.isNaN(Number(percent))
      ? null
      : Math.max(0, Number(percent));
  const width = pct == null ? 0 : Math.min(100, pct);
  const over = pct != null && pct > 100;
  const tone =
    pct == null ? "muted" : over ? "danger" : pct >= 85 ? "warn" : "ok";

  return (
    <div
      className={`ssd-usage-bar ssd-usage-bar--${tone}`}
      title={
        pct == null
          ? "Storage unavailable"
          : `${usedLabel || "—"} / ${limitLabel || "5 GB"} (${pct}%)`
      }
    >
      <div className="ssd-usage-bar__meta">
        <span className="ssd-usage-bar__used">{usedLabel || "—"}</span>
        <span className="ssd-usage-bar__sep">/</span>
        <span className="ssd-usage-bar__limit">{limitLabel || "5 GB"}</span>
        <span className="ssd-usage-bar__pct">
          {pct == null ? "—" : `${Math.round(pct)}%`}
          {over ? " over" : ""}
        </span>
      </div>
      <div className="ssd-usage-bar__track" aria-hidden>
        <div
          className="ssd-usage-bar__fill"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export default function SupportUsersPane({
  apiUrl,
  authHeaders,
  agentEmail,
  onItemCountChange,
}) {
  const [preset, setPreset] = useState("day");
  const [fromDate, setFromDate] = useState(todayKey);
  const [toDate, setToDate] = useState(todayKey);
  const [listMode, setListMode] = useState("registered");
  /** none | asc | desc — client-side sort of current list by premium expiry */
  const [expirySort, setExpirySort] = useState("none");
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [cursor, setCursor] = useState(null);
  const [cursorStack, setCursorStack] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [detailsUserId, setDetailsUserId] = useState(null);

  const activeListDate = summary?.activeTodayDate || todayKey();
  const rangeLabel = formatActivityRange(fromDate, toDate);
  const activeDayLabel = formatActivityRange(activeListDate, activeListDate);

  const filterKey = useMemo(
    () => `${preset}|${fromDate}|${toDate}|${listMode}|${activeListDate}`,
    [preset, fromDate, toDate, listMode, activeListDate]
  );
  const filterKeyRef = useRef(filterKey);
  const filterChanged = filterKeyRef.current !== filterKey;
  const activeCursor = filterChanged ? null : cursor;
  const activePage = filterChanged ? 1 : page;

  const applyPreset = (id) => {
    setPreset(id);
    if (id === "custom") {
      setFromDate("");
      setToDate("");
      return;
    }
    const to = todayKey();
    if (id === "day") {
      setFromDate(to);
      setToDate(to);
      return;
    }
    if (id === "week") {
      setFromDate(shiftDateKey(6));
      setToDate(to);
      return;
    }
    if (id === "month") {
      setFromDate(shiftDateKey(29));
      setToDate(to);
    }
  };

  const datesReady = Boolean(fromDate && toDate && fromDate <= toDate);
  const summaryFrom = datesReady ? fromDate : todayKey();
  const summaryTo = datesReady ? toDate : todayKey();

  const fetchSummary = useCallback(
    async ({ soft = false } = {}) => {
      if (!apiUrl || !authHeaders?.Authorization) return;
      if (!soft) setLoading(true);
      setError("");
      try {
        const sumRes = await axios.get(`${apiUrl}support/users/summary`, {
          headers: authHeaders,
          params: { from: summaryFrom, to: summaryTo },
        });
        setSummary(sumRes.data || null);
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load user summary";
        setError(msg);
        if (!soft) showToast("error", msg);
      } finally {
        if (!soft) setLoading(false);
      }
    },
    [apiUrl, authHeaders, summaryFrom, summaryTo]
  );

  const fetchUsers = useCallback(
    async ({ soft = false, cursorOverride } = {}) => {
      if (!apiUrl || !authHeaders?.Authorization) return;
      if (listMode === "registered" && !datesReady) {
        setUsers([]);
        setHasMore(false);
        setNextCursor(null);
        setListLoading(false);
        return;
      }
      if (!soft) setListLoading(true);
      setError("");
      const requestCursor =
        cursorOverride !== undefined ? cursorOverride : activeCursor;
      try {
        let listRes;
        if (listMode === "active") {
          listRes = await axios.get(`${apiUrl}support/users/active`, {
            headers: authHeaders,
            params: {
              date: activeListDate,
              limit: pageSize,
              includeStorage: 1,
              ...(requestCursor ? { cursor: requestCursor } : {}),
            },
          });
        } else {
          listRes = await axios.get(`${apiUrl}support/users`, {
            headers: authHeaders,
            params: {
              from: fromDate,
              to: toDate,
              limit: pageSize,
              includeStorage: 1,
              ...(requestCursor ? { cursor: requestCursor } : {}),
            },
          });
        }
        const data = listRes.data || {};
        setUsers(Array.isArray(data.users) ? data.users : []);
        setHasMore(Boolean(data.hasMore && data.nextCursor));
        setNextCursor(data.nextCursor || null);
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load users";
        setError(msg);
        if (!soft) showToast("error", msg);
      } finally {
        if (!soft) setListLoading(false);
      }
    },
    [
      apiUrl,
      authHeaders,
      fromDate,
      toDate,
      activeCursor,
      listMode,
      activeListDate,
      datesReady,
      pageSize,
    ]
  );

  const displayedUsers = useMemo(() => {
    if (expirySort !== "asc" && expirySort !== "desc") return users;
    const dir = expirySort === "asc" ? 1 : -1;
    const rank = (u) => {
      if (u?.accountType === "Premium") {
        if (u.expiresInDays != null && !Number.isNaN(Number(u.expiresInDays))) {
          return Number(u.expiresInDays);
        }
        if (u.expirationAt) {
          const ms = Date.parse(u.expirationAt);
          if (!Number.isNaN(ms)) {
            return Math.max(
              0,
              Math.ceil((ms - Date.now()) / (24 * 60 * 60 * 1000))
            );
          }
        }
      }
      // Free / unknown go last for both directions
      return Number.POSITIVE_INFINITY;
    };
    return [...users].sort((a, b) => {
      const ra = rank(a);
      const rb = rank(b);
      if (ra === rb) {
        return String(a.email || "").localeCompare(String(b.email || ""));
      }
      // Keep non-premium at the end even for desc
      if (!Number.isFinite(ra) && Number.isFinite(rb)) return 1;
      if (Number.isFinite(ra) && !Number.isFinite(rb)) return -1;
      if (!Number.isFinite(ra) && !Number.isFinite(rb)) {
        return String(a.email || "").localeCompare(String(b.email || ""));
      }
      return (ra - rb) * dir;
    });
  }, [users, expirySort]);

  useEffect(() => {
    if (filterKeyRef.current === filterKey) return;
    filterKeyRef.current = filterKey;
    setPage(1);
    setCursor(null);
    setCursorStack([]);
    setNextCursor(null);
    setHasMore(false);
    setUsers([]);
  }, [filterKey]);

  useEffect(() => {
    fetchSummary({ soft: false });
  }, [fetchSummary]);

  useEffect(() => {
    fetchUsers({ soft: false });
  }, [fetchUsers]);

  useEffect(() => {
    if (typeof onItemCountChange !== "function") return;
    if (listMode === "active") {
      onItemCountChange(Number(summary?.activeToday) || users.length);
    } else {
      onItemCountChange(Number(summary?.registeredInPeriod) || users.length);
    }
  }, [
    listMode,
    summary?.registeredInPeriod,
    summary?.activeToday,
    users.length,
    onItemCountChange,
  ]);

  const resetPager = () => {
    setPage(1);
    setCursor(null);
    setCursorStack([]);
    setNextCursor(null);
    setHasMore(false);
  };

  const goPrev = () => {
    if (activePage <= 1 || !cursorStack.length) return;
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

  const jumpToPage = async (target) => {
    if (!apiUrl || !authHeaders?.Authorization || busy) return;
    const goal = Math.max(1, Number(target) || 1);
    if (goal === activePage) return;

    if (goal === 1) {
      setPage(1);
      setCursor(null);
      setCursorStack([]);
      return;
    }

    setListLoading(true);
    setError("");
    try {
      let cur = null;
      const stack = [];
      let pageNum = 1;
      let usersPage = [];
      let more = false;
      let nxt = null;

      while (pageNum <= goal) {
        let listRes;
        if (listMode === "active") {
          listRes = await axios.get(`${apiUrl}support/users/active`, {
            headers: authHeaders,
            params: {
              date: activeListDate,
              limit: pageSize,
              includeStorage: 1,
              ...(cur ? { cursor: cur } : {}),
            },
          });
        } else {
          if (!datesReady) break;
          listRes = await axios.get(`${apiUrl}support/users`, {
            headers: authHeaders,
            params: {
              from: fromDate,
              to: toDate,
              limit: pageSize,
              includeStorage: 1,
              ...(cur ? { cursor: cur } : {}),
            },
          });
        }
        const data = listRes.data || {};
        usersPage = Array.isArray(data.users) ? data.users : [];
        more = Boolean(data.hasMore && data.nextCursor);
        nxt = data.nextCursor || null;

        if (pageNum === goal || !more || !nxt) {
          setUsers(usersPage);
          setPage(pageNum);
          setCursor(cur);
          setCursorStack(stack);
          setHasMore(more);
          setNextCursor(nxt);
          break;
        }
        stack.push(cur);
        cur = nxt;
        pageNum += 1;
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load users";
      setError(msg);
      showToast("error", msg);
    } finally {
      setListLoading(false);
    }
  };

  const handlePageChange = (nextPage) => {
    if (busy) return;
    if (nextPage === activePage) return;
    if (nextPage === activePage + 1) {
      goNext();
      return;
    }
    if (nextPage === activePage - 1) {
      goPrev();
      return;
    }
    void jumpToPage(nextPage);
  };

  const handlePageSizeChange = (size) => {
    const next = Number(size) || DEFAULT_PAGE_SIZE;
    if (next === pageSize) return;
    setPageSize(next);
    setPage(1);
    setCursor(null);
    setCursorStack([]);
    setNextCursor(null);
    setHasMore(false);
  };

  const refreshAll = () => {
    filterKeyRef.current = filterKey;
    resetPager();
    fetchSummary({ soft: false });
    fetchUsers({ soft: false, cursorOverride: null });
  };

  const showActiveLogins = () => {
    setListMode("active");
    resetPager();
  };

  const showRegistrations = () => {
    setListMode("registered");
    resetPager();
  };

  const busy = loading || listLoading;
  const summaryTotal =
    listMode === "active"
      ? Number(summary?.activeToday) || 0
      : Number(summary?.registeredInPeriod) || 0;
  const loadedThrough = (activePage - 1) * pageSize + displayedUsers.length;
  const totalEntries = Math.max(
    summaryTotal,
    hasMore ? loadedThrough + 1 : loadedThrough
  );

  return (
    <div className="ssd-callbacks ssd-users">
      {error && <div className="ssd-banner ssd-banner-error">{error}</div>}

      <div className="ssd-users-toolbar">
        <div className="ssd-users-toolbar__left">
          <div className="ssd-users-presets" role="group" aria-label="Date range">
            {[
              { id: "day", label: "1 Day" },
              { id: "week", label: "1 Week" },
              { id: "month", label: "1 Month" },
              { id: "custom", label: "Custom" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                className={`ssd-btn ssd-btn-ghost ssd-btn-xs${
                  preset === p.id ? " is-active" : ""
                }`}
                onClick={() => applyPreset(p.id)}
                disabled={busy}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="ssd-users-dates">
            {preset === "custom" && (
              <>
                <div className="ssd-users-date-field">
                  <span className="ssd-users-date-label">From</span>
                  <input
                    type="date"
                    value={fromDate}
                    max={toDate || todayKey()}
                    disabled={busy || listMode === "active"}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div className="ssd-users-date-field">
                  <span className="ssd-users-date-label">To</span>
                  <input
                    type="date"
                    value={toDate}
                    min={fromDate || undefined}
                    max={todayKey()}
                    disabled={busy || listMode === "active"}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="ssd-users-toolbar__right">
          <label className="ssd-users-sort">
            <span>Premium expiry</span>
            <select
              value={expirySort}
              disabled={busy}
              onChange={(e) => setExpirySort(e.target.value)}
              aria-label="Sort by premium expiry"
            >
              <option value="none">Default</option>
              <option value="asc">Soonest first ↑</option>
              <option value="desc">Latest first ↓</option>
            </select>
          </label>
          <button
            type="button"
            className="ssd-btn ssd-btn-ghost ssd-btn-refresh"
            onClick={refreshAll}
            disabled={busy}
            title="Refresh users"
          >
            <FiRefreshCw />
            Refresh
          </button>
        </div>
      </div>

      <div className="ssd-users-stats">
        <button
          type="button"
          className={`ssd-users-card ssd-users-card--action${
            listMode === "registered" ? " is-selected" : ""
          }`}
          onClick={showRegistrations}
          disabled={busy}
        >
          <span className="ssd-users-card__icon ssd-users-card__icon--accent">
            <FiUserPlus aria-hidden />
          </span>
          <div className="ssd-users-card__body">
            <span className="ssd-users-card__label">Registered</span>
            <strong className="ssd-users-card__value">
              {datesReady ? Number(summary?.registeredInPeriod) || 0 : "—"}
            </strong>
            <span className="ssd-users-card__sub">
              {datesReady
                ? rangeLabel
                : preset === "custom"
                  ? "Pick From and To"
                  : rangeLabel}
            </span>
          </div>
        </button>

        <button
          type="button"
          className={`ssd-users-card ssd-users-card--action${
            listMode === "active" ? " is-selected" : ""
          }`}
          onClick={showActiveLogins}
          disabled={busy}
        >
          <span className="ssd-users-card__icon ssd-users-card__icon--accent">
            <FiActivity aria-hidden />
          </span>
          <div className="ssd-users-card__body">
            <span className="ssd-users-card__label">Active today</span>
            <strong className="ssd-users-card__value">
              {Number(summary?.activeToday) || 0}
            </strong>
            <span className="ssd-users-card__sub">{activeDayLabel}</span>
          </div>
        </button>

        <div
          className="ssd-users-card ssd-users-card--static ssd-users-card--merged"
          aria-label="User totals overview"
        >
          <div className="ssd-users-merged">
            <div className="ssd-users-merged__item">
              <FiUsers aria-hidden />
              <div>
                <span>Total</span>
                <strong>{Number(summary?.totalUsers) || 0}</strong>
              </div>
            </div>
            <div className="ssd-users-merged__item">
              <FiUserCheck aria-hidden />
              <div>
                <span>Free</span>
                <strong>{Number(summary?.freeUsers) || 0}</strong>
              </div>
            </div>
            <div className="ssd-users-merged__item">
              <FiAward aria-hidden />
              <div>
                <span>Premium</span>
                <strong>{Number(summary?.premiumUsers) || 0}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="ssd-users-table-wrap" onScroll={markPaneScrolling}>
        {busy && !displayedUsers.length ? (
          <div className="ssd-users-empty">
            <div className="ssd-users-empty-card">
              <span className="ssd-users-empty-spin" aria-hidden />
              <p>
                {listMode === "active"
                  ? "Loading active logins…"
                  : "Loading users…"}
              </p>
            </div>
          </div>
        ) : displayedUsers.length === 0 ? (
          <div className="ssd-users-empty">
            <div className="ssd-users-empty-card">
              <div className="ssd-users-empty-icon" aria-hidden>
                <FiInbox />
              </div>
              <h3>
                {listMode === "active"
                  ? "No logins recorded for this day"
                  : !datesReady
                    ? "Choose a date range"
                    : "No registrations in this range"}
              </h3>
              <p>
                {listMode === "active"
                  ? activeDayLabel
                  : !datesReady
                    ? "Select From and To to load registrations"
                    : rangeLabel}
              </p>
            </div>
          </div>
        ) : (
          <table className="ssd-users-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Mobile</th>
                <th>Account</th>
                <th>Premium expiry</th>
                <th>Storage</th>
                <th>
                  {listMode === "active" ? "Last login" : "Registered"}
                </th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {displayedUsers.map((u) => {
                const overQuota =
                  u.usagePercent != null &&
                  !Number.isNaN(Number(u.usagePercent)) &&
                  Number(u.usagePercent) > 100;
                const expiryTone = premiumExpiryTone(u);
                return (
                  <tr
                    key={u.id}
                    className={`ssd-users-row${
                      overQuota ? " ssd-users-row--over" : ""
                    }`}
                    onClick={() => setDetailsUserId(u.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setDetailsUserId(u.id);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Open details for ${u.email || u.id}`}
                  >
                    <td title={u.email}>{u.email || "—"}</td>
                    <td>{u.mobile || "N/A"}</td>
                    <td>
                      <span
                        className={`ssd-pill ${
                          u.accountType === "Premium"
                            ? "ssd-pill-premium"
                            : "ssd-pill-muted"
                        }`}
                      >
                        {u.accountType || "Free"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`ssd-expiry ssd-expiry--${expiryTone}`}
                        title={
                          u.expirationAt
                            ? formatWhen(u.expirationAt)
                            : undefined
                        }
                      >
                        {formatPremiumExpiry(u)}
                      </span>
                    </td>
                    <td className="ssd-users-table__storage">
                      <StorageUsageBar
                        usedLabel={u.storageUsed}
                        limitLabel={u.storageLimit}
                        percent={u.usagePercent}
                      />
                    </td>
                    <td>
                      {listMode === "active"
                        ? formatWhen(u.lastLoginAt)
                        : formatWhen(u.registeredAt)}
                    </td>
                    <td>
                      <span
                        className={`ssd-pill ${
                          u.isSoftBan
                            ? "ssd-pill-danger"
                            : overQuota
                              ? "ssd-pill-danger"
                              : "ssd-pill-success"
                        }`}
                      >
                        {u.isSoftBan
                          ? u.status || "Soft-Banned"
                          : overQuota
                            ? "Over quota"
                            : u.status || "Active"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <FilesPaginationFooter
        totalEntries={totalEntries}
        currentPage={activePage}
        itemsPerPage={pageSize}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handlePageSizeChange}
      />

      {detailsUserId && (
        <SupportUserDetailsModal
          userId={detailsUserId}
          apiUrl={apiUrl}
          authHeaders={authHeaders}
          fromDate={datesReady ? fromDate : todayKey()}
          toDate={datesReady ? toDate : todayKey()}
          agentEmail={agentEmail}
          onClose={() => setDetailsUserId(null)}
        />
      )}
    </div>
  );
}
