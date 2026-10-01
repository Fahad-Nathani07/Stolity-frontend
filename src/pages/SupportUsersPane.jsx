import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  FiRefreshCw,
  FiUsers,
  FiUserCheck,
  FiUserPlus,
  FiAward,
  FiActivity,
  FiChevronLeft,
  FiChevronRight,
  FiInbox,
  FiMousePointer,
} from "react-icons/fi";
import { showToast } from "../components/ToastProvider";
import { markPaneScrolling } from "../components/SupportFilterSelect";
import SupportUserDetailsModal from "./SupportUserDetailsModal";

const PAGE_SIZE = 25;

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
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [cursor, setCursor] = useState(null);
  const [cursorStack, setCursorStack] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [detailsUserId, setDetailsUserId] = useState(null);

  const activeListDate = summary?.activeTodayDate || todayKey();

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
              limit: PAGE_SIZE,
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
              limit: PAGE_SIZE,
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
    ]
  );

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
  const fromRow =
    users.length === 0 ? 0 : (activePage - 1) * PAGE_SIZE + 1;
  const toRow = (activePage - 1) * PAGE_SIZE + users.length;

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

      <div className="ssd-users-stats">
        <button
          type="button"
          className={`ssd-users-card ssd-users-card--action${
            listMode === "registered" ? " is-selected" : ""
          }`}
          onClick={showRegistrations}
          disabled={busy}
        >
          <div className="ssd-users-card__top">
            <span className="ssd-users-card__icon ssd-users-card__icon--accent">
              <FiUserPlus aria-hidden />
            </span>
            <span className="ssd-users-card__hint">
              <FiMousePointer aria-hidden /> Click to filter
            </span>
          </div>
          <span className="ssd-users-card__label">Registered in period</span>
          <strong className="ssd-users-card__value">
            {datesReady ? Number(summary?.registeredInPeriod) || 0 : "—"}
          </strong>
          <span className="ssd-users-card__sub">
            {datesReady
              ? `${fromDate} → ${toDate}`
              : preset === "custom"
                ? "Pick From and To"
                : `${fromDate} → ${toDate}`}
          </span>
        </button>

        <button
          type="button"
          className={`ssd-users-card ssd-users-card--action${
            listMode === "active" ? " is-selected" : ""
          }`}
          onClick={showActiveLogins}
          disabled={busy}
        >
          <div className="ssd-users-card__top">
            <span className="ssd-users-card__icon ssd-users-card__icon--accent">
              <FiActivity aria-hidden />
            </span>
            <span className="ssd-users-card__hint">
              <FiMousePointer aria-hidden /> Click to filter
            </span>
          </div>
          <span className="ssd-users-card__label">Active today</span>
          <strong className="ssd-users-card__value">
            {Number(summary?.activeToday) || 0}
          </strong>
          <span className="ssd-users-card__sub">
            {summary?.activeTodayDate || todayKey()} · logins
          </span>
        </button>

        <div
          className="ssd-users-card ssd-users-card--static ssd-users-card--merged"
          aria-label="User totals overview"
        >
          <div className="ssd-users-card__top">
            <span className="ssd-users-card__icon">
              <FiUsers aria-hidden />
            </span>
            <span className="ssd-users-card__badge">Overview</span>
          </div>
          <span className="ssd-users-card__label">All users</span>
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
        {busy && !users.length ? (
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
        ) : users.length === 0 ? (
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
                  ? activeListDate
                  : !datesReady
                    ? "Select From and To to load registrations"
                    : `${fromDate} → ${toDate}`}
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
                <th>Storage</th>
                <th>
                  {listMode === "active" ? "Last login" : "Registered"}
                </th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const overQuota =
                  u.usagePercent != null &&
                  !Number.isNaN(Number(u.usagePercent)) &&
                  Number(u.usagePercent) > 100;
                return (
                <tr
                  key={u.id}
                  className={overQuota ? "ssd-users-row--over" : undefined}
                >
                  <td title={u.email}>{u.email || "—"}</td>
                  <td>{u.mobile || "N/A"}</td>
                  <td>
                    <span
                      className={`ssd-pill ${
                        u.accountType === "Premium"
                          ? "ssd-pill-warn"
                          : "ssd-pill-muted"
                      }`}
                    >
                      {u.accountType || "Free"}
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
                  <td>
                    <button
                      type="button"
                      className="ssd-btn ssd-btn-ghost ssd-btn-xs"
                      onClick={() => setDetailsUserId(u.id)}
                    >
                      Details
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="ssd-users-pager">
        <span className="ssd-muted">
          {users.length ? `Showing ${fromRow}–${toRow}` : "No rows"}
          {listMode === "active" ? ` · ${activeListDate}` : ""}
          {listLoading ? " · Loading…" : ""}
        </span>
        <div className="ssd-users-pager-btns">
          <button
            type="button"
            className="ssd-btn ssd-btn-ghost ssd-btn-xs"
            onClick={goPrev}
            disabled={busy || activePage <= 1 || !cursorStack.length}
          >
            <FiChevronLeft /> Prev
          </button>
          <span className="ssd-muted">Page {activePage}</span>
          <button
            type="button"
            className="ssd-btn ssd-btn-ghost ssd-btn-xs"
            onClick={goNext}
            disabled={busy || !hasMore || !nextCursor}
          >
            Next <FiChevronRight />
          </button>
        </div>
      </div>

      {detailsUserId && (
        <SupportUserDetailsModal
          userId={detailsUserId}
          apiUrl={apiUrl}
          authHeaders={authHeaders}
          fromDate={fromDate}
          toDate={toDate}
          agentEmail={agentEmail}
          onClose={() => setDetailsUserId(null)}
        />
      )}
    </div>
  );
}
