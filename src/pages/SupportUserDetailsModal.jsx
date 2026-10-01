import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { FiX, FiMail, FiPhone, FiClock, FiHardDrive } from "react-icons/fi";
import { showToast } from "../components/ToastProvider";

function formatWhen(iso, withTime = true) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      ...(withTime
        ? { hour: "2-digit", minute: "2-digit" }
        : {}),
    });
  } catch {
    return iso;
  }
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

function sanitizeSharedFolderInput(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\s+/g, "");
}

function isValidSharedFolderName(name) {
  if (!name) return false;
  if (name.includes("/")) return false;
  return (
    /^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(name) || /^[a-z0-9]$/.test(name)
  );
}

function shortDay(dateKey) {
  try {
    const d = new Date(`${dateKey}T12:00:00`);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  } catch {
    return dateKey;
  }
}

function initialsFrom(user) {
  const name = String(user?.name || "").trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  const local = String(user?.email || "").split("@")[0];
  return (local.slice(0, 2) || "?").toUpperCase();
}

/** SVG donut — segments: [{ value, color, label }] */
function DonutChart({
  segments,
  size = 112,
  thickness = 16,
  centerTitle,
  centerSub,
}) {
  const total = segments.reduce((s, x) => s + Math.max(0, Number(x.value) || 0), 0);
  const safeTotal = total > 0 ? total : 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  const rings =
    total <= 0
      ? [
          <circle
            key="empty"
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#efe6db"
            strokeWidth={thickness}
          />,
        ]
      : segments.map((seg, i) => {
          const v = Math.max(0, Number(seg.value) || 0);
          if (v <= 0) return null;
          const len = (v / safeTotal) * c;
          const el = (
            <circle
              key={`${seg.label}-${i}`}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
          offset += len;
          return el;
        });

  return (
    <div className="sud-donut" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#f4ebe1"
          strokeWidth={thickness}
        />
        {rings}
      </svg>
      <div className="sud-donut-center">
        <strong>{centerTitle}</strong>
        {centerSub ? <span>{centerSub}</span> : null}
      </div>
    </div>
  );
}

function Legend({ items }) {
  return (
    <ul className="sud-legend">
      {items.map((it) => (
        <li key={it.label}>
          <i style={{ background: it.color }} aria-hidden />
          <div>
            <span>{it.label}</span>
            <strong>{it.value}</strong>
          </div>
        </li>
      ))}
    </ul>
  );
}

function TrendBars({ days, totals }) {
  const max = Math.max(
    1,
    ...days.map(
      (d) =>
        (Number(d.uploadedBytes) || 0) + (Number(d.downloadedBytes) || 0)
    )
  );
  const hasData = days.some(
    (d) =>
      (Number(d.uploadedBytes) || 0) + (Number(d.downloadedBytes) || 0) > 0
  );
  const upTotal = Number(totals?.uploadedBytes) || 0;
  const downTotal = Number(totals?.downloadedBytes) || 0;
  const all = upTotal + downTotal;
  const upShare = all > 0 ? Math.round((upTotal / all) * 100) : 0;
  const downShare = all > 0 ? 100 - upShare : 0;

  return (
    <div className="sud-trend">
      <div className="sud-trend-head">
        <div>
          <h4>Daily transfer</h4>
          <p className="sud-trend-sub">
            Upload vs download volume across the selected range
          </p>
        </div>
        <div className="sud-trend-keys">
          <span>
            <i className="sud-key-up" /> Upload
          </span>
          <span>
            <i className="sud-key-down" /> Download
          </span>
        </div>
      </div>

      <div className="sud-trend-stats">
        <div className="sud-trend-stat">
          <span>Uploaded</span>
          <strong>{formatBytes(upTotal)}</strong>
          <em>{Number(totals?.uploadCount) || 0} files</em>
        </div>
        <div className="sud-trend-stat">
          <span>Downloaded</span>
          <strong>{formatBytes(downTotal)}</strong>
          <em>{Number(totals?.downloadCount) || 0} files</em>
        </div>
        <div className="sud-trend-stat sud-trend-stat--split">
          <span>Mix</span>
          <div className="sud-trend-split" aria-hidden>
            <div style={{ width: `${upShare}%` }} className="sud-trend-split-up" />
            <div
              style={{ width: `${downShare}%` }}
              className="sud-trend-split-down"
            />
          </div>
          <em>
            {upShare}% up · {downShare}% down
          </em>
        </div>
      </div>

      {!hasData ? (
        <p className="sud-trend-empty">No transfer activity in this range</p>
      ) : (
        <div
          className={`sud-trend-bars${
            days.length <= 2 ? " sud-trend-bars--sparse" : ""
          }`}
        >
          {days.map((d) => {
            const up = Number(d.uploadedBytes) || 0;
            const down = Number(d.downloadedBytes) || 0;
            const upH = Math.max(up > 0 ? 10 : 0, Math.round((up / max) * 120));
            const downH = Math.max(
              down > 0 ? 10 : 0,
              Math.round((down / max) * 120)
            );
            return (
              <div key={d.date} className="sud-trend-col">
                <div className="sud-trend-values">
                  <span className="sud-trend-val sud-trend-val--up">
                    {up > 0 ? formatBytes(up) : ""}
                  </span>
                  <span className="sud-trend-val sud-trend-val--down">
                    {down > 0 ? formatBytes(down) : ""}
                  </span>
                </div>
                <div className="sud-trend-stack">
                  <div
                    className="sud-trend-bar sud-trend-bar--up"
                    style={{ height: `${upH}px` }}
                    title={`Upload ${formatBytes(up)}`}
                  />
                  <div
                    className="sud-trend-bar sud-trend-bar--down"
                    style={{ height: `${downH}px` }}
                    title={`Download ${formatBytes(down)}`}
                  />
                </div>
                <span className="sud-trend-day">{shortDay(d.date)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SupportUserDetailsModal({
  userId,
  apiUrl,
  authHeaders,
  fromDate,
  toDate,
  agentEmail,
  onClose,
}) {
  const canManageSharedFolders =
    String(agentEmail || "").trim().toLowerCase() === "fahad@infomanav.in";
  const [user, setUser] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [planId, setPlanId] = useState("");
  const [storageGb, setStorageGb] = useState("5");
  const [savingPlan, setSavingPlan] = useState(false);
  const [endingPremium, setEndingPremium] = useState(false);
  const [togglingBan, setTogglingBan] = useState(false);
  const [sharedFolders, setSharedFolders] = useState([]);
  const [newSharedFolder, setNewSharedFolder] = useState("");
  const [savingFolders, setSavingFolders] = useState(false);

  const syncPlanForm = (u) => {
    const ids = Array.isArray(u?.entitlementIds) ? u.entitlementIds : [];
    setPlanId(ids[0] || "");
    const limit = String(u?.storageLimit || "5 GB").replace(/[^\d.]/g, "");
    setStorageGb(limit || "5");
  };

  const syncSharedFolders = (u) => {
    setSharedFolders(
      Array.isArray(u?.sharedFolders) ? [...u.sharedFolders] : []
    );
    setNewSharedFolder("");
  };

  useEffect(() => {
    if (!userId || !apiUrl || !authHeaders?.Authorization) return undefined;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const params = { from: fromDate, to: toDate };
        const [detailRes, usageRes] = await Promise.all([
          axios.get(`${apiUrl}support/users/${userId}`, {
            headers: authHeaders,
            params: { includeStorage: 1 },
          }),
          axios.get(`${apiUrl}support/users/${userId}/usage`, {
            headers: authHeaders,
            params,
          }),
        ]);
        if (!cancelled) {
          const nextUser = detailRes.data?.user || null;
          setUser(nextUser);
          if (nextUser) {
            syncPlanForm(nextUser);
            syncSharedFolders(nextUser);
          }
          setUsage(usageRes.data || null);
        }
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load user details";
        if (!cancelled) {
          setError(msg);
          showToast("error", msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [userId, apiUrl, authHeaders, fromDate, toDate]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isActivePremium = user?.accountType === "Premium";

  const onPlanSelect = (nextPlan) => {
    setPlanId(nextPlan);
    if (nextPlan) setStorageGb("50");
  };

  const savePlan = async () => {
    if (!userId || savingPlan) return;
    setSavingPlan(true);
    try {
      const res = await axios.post(
        `${apiUrl}support/users/${userId}/plan`,
        { planId, storageGb },
        { headers: authHeaders }
      );
      const next = res.data?.user;
      if (next) {
        setUser((prev) => ({
          ...prev,
          ...next,
          storageUsed: next.storageUsed ?? prev?.storageUsed,
          storageUsedBytes: next.storageUsedBytes ?? prev?.storageUsedBytes,
          usagePercent: next.usagePercent ?? prev?.usagePercent,
        }));
        syncPlanForm(next);
      }
      showToast("success", res.data?.message || "Plan updated");
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to update plan";
      showToast("error", msg);
    } finally {
      setSavingPlan(false);
    }
  };

  const endPremium = async () => {
    if (!userId || endingPremium || !isActivePremium) return;
    if (
      !window.confirm(
        `End premium for ${user?.email || "this user"}?\n\nExpiry will be set to yesterday and storage reset to 5 GB.`
      )
    ) {
      return;
    }
    setEndingPremium(true);
    try {
      const res = await axios.post(
        `${apiUrl}support/users/${userId}/plan/end`,
        {},
        { headers: authHeaders }
      );
      const next = res.data?.user;
      if (next) {
        setUser((prev) => ({
          ...prev,
          ...next,
          storageUsed: next.storageUsed ?? prev?.storageUsed,
          storageUsedBytes: next.storageUsedBytes ?? prev?.storageUsedBytes,
          usagePercent: next.usagePercent ?? prev?.usagePercent,
        }));
        syncPlanForm(next);
      }
      showToast("success", res.data?.message || "Premium ended");
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to end premium";
      showToast("error", msg);
    } finally {
      setEndingPremium(false);
    }
  };

  const toggleSoftBan = async () => {
    if (!userId || togglingBan) return;
    const nextBanned = !user?.isSoftBan;
    if (
      !window.confirm(
        nextBanned
          ? `Soft-ban ${user?.email || "this user"}?`
          : `Lift soft ban for ${user?.email || "this user"}?`
      )
    ) {
      return;
    }
    setTogglingBan(true);
    try {
      const res = await axios.post(
        `${apiUrl}support/users/${userId}/soft-ban`,
        { banned: nextBanned },
        { headers: authHeaders }
      );
      const next = res.data?.user;
      if (next) {
        setUser((prev) => ({
          ...prev,
          ...next,
          storageUsed: next.storageUsed ?? prev?.storageUsed,
          storageUsedBytes: next.storageUsedBytes ?? prev?.storageUsedBytes,
          usagePercent: next.usagePercent ?? prev?.usagePercent,
        }));
      }
      showToast("success", res.data?.message || "Status updated");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update soft ban";
      showToast("error", msg);
    } finally {
      setTogglingBan(false);
    }
  };

  const emailDomain = String(user?.email || "")
    .split("@")[1]
    ?.trim()
    .toLowerCase();

  const originalFolders = useMemo(
    () =>
      Array.isArray(user?.sharedFolders) ? [...user.sharedFolders].sort() : [],
    [user?.sharedFolders]
  );
  const hasFolderChanges =
    JSON.stringify([...sharedFolders].sort()) !==
    JSON.stringify(originalFolders);

  const addSharedFolder = (raw) => {
    const next = sanitizeSharedFolderInput(raw);
    if (!isValidSharedFolderName(next)) {
      showToast(
        "error",
        "Use a valid folder name (e.g. infomanav.in). No spaces or slashes."
      );
      return;
    }
    if (sharedFolders.includes(next)) {
      showToast("warning", "That shared folder is already assigned.");
      return;
    }
    setSharedFolders((prev) => [...prev, next]);
    setNewSharedFolder("");
  };

  const saveSharedFolders = async () => {
    if (!userId || savingFolders || !hasFolderChanges) return;
    setSavingFolders(true);
    try {
      const res = await axios.put(
        `${apiUrl}support/users/${userId}/shared-folders`,
        { folders: sharedFolders },
        { headers: authHeaders }
      );
      const next = res.data?.user;
      if (next) {
        setUser((prev) => ({
          ...prev,
          ...next,
          storageUsed: next.storageUsed ?? prev?.storageUsed,
          storageUsedBytes: next.storageUsedBytes ?? prev?.storageUsedBytes,
          usagePercent: next.usagePercent ?? prev?.usagePercent,
        }));
        syncSharedFolders(next);
      }
      showToast("success", res.data?.message || "Shared folders updated");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update shared folders";
      showToast("error", msg);
    } finally {
      setSavingFolders(false);
    }
  };

  const days = useMemo(
    () => (Array.isArray(usage?.days) ? usage.days : []),
    [usage]
  );
  const totals = usage?.totals || {};

  const usedBytes = Number(user?.storageUsedBytes) || 0;
  const limitBytes = Number(user?.storageLimitBytes) || 5e9;
  const freeBytes = Math.max(0, limitBytes - usedBytes);
  const usagePct =
    user?.usagePercent != null
      ? Number(user.usagePercent)
      : limitBytes > 0
        ? Math.round((usedBytes / limitBytes) * 1000) / 10
        : 0;
  const overQuota = usedBytes > limitBytes;

  const storageSegments = overQuota
    ? [
        { label: "Used", value: usedBytes, color: "#dc2626" },
        { label: "Over limit", value: 0.0001, color: "#fecaca" },
      ]
    : [
        { label: "Used", value: usedBytes || 0.0001, color: "#e5660f" },
        { label: "Free", value: freeBytes || 0.0001, color: "#e8dccb" },
      ];

  const upBytes = Number(totals.uploadedBytes) || 0;
  const downBytes = Number(totals.downloadedBytes) || 0;
  const transferTotal = upBytes + downBytes;
  const transferSegments = [
    { label: "Upload", value: upBytes, color: "#e5660f" },
    { label: "Download", value: downBytes, color: "#0f766e" },
  ];

  const eventSegments = [
    { label: "Uploads", value: Number(totals.uploadCount) || 0, color: "#e5660f" },
    {
      label: "Downloads",
      value: Number(totals.downloadCount) || 0,
      color: "#0f766e",
    },
    { label: "Zip", value: Number(totals.zipCount) || 0, color: "#b45309" },
    { label: "Unzip", value: Number(totals.unzipCount) || 0, color: "#0369a1" },
    {
      label: "Other",
      value: Math.max(
        0,
        (Number(totals.eventCount) || 0) -
          (Number(totals.uploadCount) || 0) -
          (Number(totals.downloadCount) || 0) -
          (Number(totals.zipCount) || 0) -
          (Number(totals.unzipCount) || 0)
      ),
      color: "#a8a29e",
    },
  ].filter((s) => s.value > 0);

  return createPortal(
    <div className="sud-overlay" role="presentation" onClick={onClose}>
      <div
        className="sud-modal"
        role="dialog"
        aria-modal="true"
        aria-label="User details"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="sud-loading">
            <button
              type="button"
              className="sud-close"
              onClick={onClose}
              aria-label="Close"
              style={{ position: "absolute", top: 14, right: 14 }}
            >
              <FiX />
            </button>
            <span className="ssd-users-empty-spin" aria-hidden />
            <p>Loading profile…</p>
          </div>
        ) : error ? (
          <div className="sud-loading">
            <button
              type="button"
              className="sud-close"
              onClick={onClose}
              aria-label="Close"
              style={{ position: "absolute", top: 14, right: 14 }}
            >
              <FiX />
            </button>
            <p className="ssd-banner ssd-banner-error">{error}</p>
          </div>
        ) : !user ? (
          <div className="sud-loading">
            <button
              type="button"
              className="sud-close"
              onClick={onClose}
              aria-label="Close"
              style={{ position: "absolute", top: 14, right: 14 }}
            >
              <FiX />
            </button>
            <p>User not found.</p>
          </div>
        ) : (
          <>
            <header className="sud-hero">
              <div className="sud-hero-top">
                <p className="sud-hero-top-label">User details</p>
                <button
                  type="button"
                  className="sud-close"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <FiX />
                </button>
              </div>
              <div className="sud-avatar">{initialsFrom(user)}</div>
              <div className="sud-hero-main">
                <div className="sud-hero-badges">
                  <span
                    className={`sud-badge ${
                      user.accountType === "Premium"
                        ? "sud-badge--premium"
                        : "sud-badge--free"
                    }`}
                  >
                    {user.accountType || "Free"}
                  </span>
                  <span
                    className={`sud-badge ${
                      user.isSoftBan ? "sud-badge--ban" : "sud-badge--ok"
                    }`}
                  >
                    {user.status}
                  </span>
                  <span className="sud-badge sud-badge--plan">
                    {user.plan || "Free"}
                  </span>
                </div>
                <h2>{user.name || user.email?.split("@")[0] || "User"}</h2>
                <div className="sud-hero-meta">
                  <span>
                    <FiMail /> {user.email || "—"}
                  </span>
                  <span>
                    <FiPhone /> {user.mobile || "N/A"}
                  </span>
                  <span>
                    <FiClock /> Joined {formatWhen(user.registeredAt, false)}
                  </span>
                </div>
              </div>
              <div className="sud-hero-aside">
                <div className="sud-kpi">
                  <FiHardDrive aria-hidden />
                  <div>
                    <span>Storage</span>
                    <strong>
                      {user.storageUsed || "0 B"}
                      <em> / {user.storageLimit || "5 GB"}</em>
                    </strong>
                  </div>
                </div>
                <p className="sud-range">
                  Activity · {fromDate} → {toDate}
                </p>
              </div>
            </header>

            <div className="sud-body">
              <section className="sud-panel sud-panel--charts">
                <div className="sud-chart-card">
                  <h3>Storage</h3>
                  <div className="sud-chart-row">
                    <DonutChart
                      segments={storageSegments}
                      centerTitle={`${Math.min(usagePct, 999)}%`}
                      centerSub={overQuota ? "Over" : "Used"}
                    />
                    <Legend
                      items={[
                        {
                          label: "Used",
                          value: user.storageUsed || formatBytes(usedBytes),
                          color: overQuota ? "#dc2626" : "#e5660f",
                        },
                        {
                          label: overQuota ? "Limit" : "Available",
                          value: overQuota
                            ? user.storageLimit || formatBytes(limitBytes)
                            : formatBytes(freeBytes),
                          color: "#e8dccb",
                        },
                      ]}
                    />
                  </div>
                </div>

                <div className="sud-chart-card">
                  <h3>Transfer mix</h3>
                  <div className="sud-chart-row">
                    <DonutChart
                      segments={
                        transferTotal > 0
                          ? transferSegments
                          : [{ label: "None", value: 1, color: "#efe6db" }]
                      }
                      centerTitle={formatBytes(transferTotal)}
                      centerSub="Total"
                    />
                    <Legend
                      items={[
                        {
                          label: "Upload",
                          value: `${formatBytes(upBytes)} · ${Number(totals.uploadCount) || 0}`,
                          color: "#e5660f",
                        },
                        {
                          label: "Download",
                          value: `${formatBytes(downBytes)} · ${Number(totals.downloadCount) || 0}`,
                          color: "#0f766e",
                        },
                      ]}
                    />
                  </div>
                </div>

                <div className="sud-chart-card">
                  <h3>Events</h3>
                  <div className="sud-chart-row">
                    <DonutChart
                      segments={
                        eventSegments.length
                          ? eventSegments
                          : [{ label: "None", value: 1, color: "#efe6db" }]
                      }
                      size={112}
                      thickness={16}
                      centerTitle={String(Number(totals.eventCount) || 0)}
                      centerSub="Events"
                    />
                    <Legend
                      items={(eventSegments.length
                        ? eventSegments
                        : [{ label: "No events", value: 0, color: "#efe6db" }]
                      ).map((s) => ({
                        label: s.label,
                        value: String(s.value),
                        color: s.color,
                      }))}
                    />
                  </div>
                </div>
              </section>

              <section className="sud-panel">
                <TrendBars days={days} totals={totals} />
              </section>

              <section className="sud-panel sud-panel--plan">
                <div className="sud-info-card sud-plan-card">
                  <div className="sud-plan-head">
                    <h3>Upgrade plan</h3>
                    {isActivePremium && (
                      <button
                        type="button"
                        className="ssd-btn ssd-btn-ghost ssd-btn-xs"
                        onClick={endPremium}
                        disabled={endingPremium || savingPlan}
                      >
                        {endingPremium ? "Ending…" : "End premium"}
                      </button>
                    )}
                  </div>
                  <div className="sud-plan-form">
                    <label>
                      Plan
                      <select
                        value={planId}
                        onChange={(e) => onPlanSelect(e.target.value)}
                        disabled={savingPlan || endingPremium}
                      >
                        <option value="">No Plan (Free)</option>
                        <option value="stolity_lite_trial">
                          Stolity Trial — 1 week
                        </option>
                        <option value="stolity_lite_monthly">
                          Stolity Lite Monthly
                        </option>
                        <option value="stolity_lite_yearly">
                          Stolity Lite Yearly
                        </option>
                      </select>
                    </label>
                    <label>
                      Storage (GB)
                      <input
                        type="number"
                        min="1"
                        max="10000"
                        list="sud-storage-options"
                        value={storageGb}
                        onChange={(e) => setStorageGb(e.target.value)}
                        disabled={savingPlan || endingPremium}
                      />
                      <datalist id="sud-storage-options">
                        <option value="5" />
                        <option value="50" />
                        <option value="75" />
                        <option value="100" />
                        <option value="200" />
                        <option value="500" />
                        <option value="1000" />
                      </datalist>
                    </label>
                    <button
                      type="button"
                      className="sud-plan-save"
                      onClick={savePlan}
                      disabled={savingPlan || endingPremium}
                    >
                      {savingPlan ? "Updating…" : "Update plan"}
                    </button>
                  </div>
                  <p className="sud-plan-hint">
                    Selecting a paid plan auto-sets storage to 50 GB. Expiry is
                    applied server-side (trial 7d / monthly ~30d / yearly ~365d).
                  </p>
                </div>

                <div
                  className={`sud-info-card sud-ban-card${
                    user.isSoftBan ? " sud-ban-card--on" : ""
                  }`}
                >
                  <div className="sud-ban-row">
                    <div>
                      <h3>Soft ban</h3>
                      <p>
                        {user.isSoftBan
                          ? `Banned${user.softBanBy ? ` by ${user.softBanBy}` : ""}${
                              user.softBanAt
                                ? ` · ${formatWhen(user.softBanAt)}`
                                : ""
                            }`
                          : "Account is active. Soft ban limits in-app access on the client."}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={`sud-ban-btn${
                        user.isSoftBan ? " sud-ban-btn--lift" : ""
                      }`}
                      onClick={toggleSoftBan}
                      disabled={togglingBan}
                    >
                      {togglingBan
                        ? "Updating…"
                        : user.isSoftBan
                          ? "Lift ban"
                          : "Soft ban"}
                    </button>
                  </div>
                </div>

                {canManageSharedFolders && (
                <div className="sud-info-card sud-folders-card">
                  <div className="sud-plan-head">
                    <h3>Shared folders</h3>
                    {emailDomain && !sharedFolders.includes(emailDomain) && (
                      <button
                        type="button"
                        className="ssd-btn ssd-btn-ghost ssd-btn-xs"
                        onClick={() => addSharedFolder(emailDomain)}
                        disabled={savingFolders}
                      >
                        Add {emailDomain}
                      </button>
                    )}
                  </div>
                  <p className="sud-plan-hint" style={{ marginTop: 0 }}>
                    Names map to folders in the default bucket (e.g.{" "}
                    <code>{emailDomain || "domain.in"}/</code>).
                  </p>
                  {sharedFolders.length === 0 ? (
                    <p className="sud-folders-empty">
                      No shared folders assigned.
                    </p>
                  ) : (
                    <ul className="sud-folder-chips">
                      {sharedFolders.map((name) => (
                        <li key={name}>
                          <span>{name}</span>
                          <button
                            type="button"
                            aria-label={`Remove ${name}`}
                            onClick={() =>
                              setSharedFolders((prev) =>
                                prev.filter((f) => f !== name)
                              )
                            }
                            disabled={savingFolders}
                          >
                            <FiX />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="sud-folder-add">
                    <input
                      type="text"
                      placeholder="e.g. king.in"
                      value={newSharedFolder}
                      onChange={(e) => setNewSharedFolder(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSharedFolder(newSharedFolder);
                        }
                      }}
                      disabled={savingFolders}
                    />
                    <button
                      type="button"
                      className="ssd-btn ssd-btn-ghost ssd-btn-xs"
                      onClick={() => addSharedFolder(newSharedFolder)}
                      disabled={savingFolders || !newSharedFolder.trim()}
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      className="sud-plan-save"
                      onClick={saveSharedFolders}
                      disabled={savingFolders || !hasFolderChanges}
                    >
                      {savingFolders ? "Saving…" : "Save folders"}
                    </button>
                  </div>
                </div>
                )}
              </section>

              <section className="sud-panel sud-panel--info">
                <div className="sud-info-card">
                  <h3>Profile</h3>
                  <dl className="sud-dl">
                    <div>
                      <dt>User ID</dt>
                      <dd title={user.id}>{user.id}</dd>
                    </div>
                    <div>
                      <dt>Last login</dt>
                      <dd>{formatWhen(user.lastLoginAt)}</dd>
                    </div>
                    <div>
                      <dt>Permission</dt>
                      <dd>{user.permission || "—"}</dd>
                    </div>
                    <div>
                      <dt>Folder</dt>
                      <dd title={user.folderName || ""}>
                        {user.folderName || "—"}
                      </dd>
                    </div>
                  </dl>
                </div>
                <div className="sud-info-card">
                  <h3>Plan & access</h3>
                  <dl className="sud-dl">
                    <div>
                      <dt>Expires</dt>
                      <dd>{formatWhen(user.expirationAt)}</dd>
                    </div>
                    <div>
                      <dt>Entitlements</dt>
                      <dd>
                        {user.entitlementIds?.length
                          ? user.entitlementIds.join(", ")
                          : "—"}
                      </dd>
                    </div>
                    {canManageSharedFolders && (
                      <div>
                        <dt>Shared folders</dt>
                        <dd>
                          {user.sharedFolderCount
                            ? user.sharedFolders.join(", ")
                            : "None"}
                        </dd>
                      </div>
                    )}
                    {user.isSoftBan && (
                      <>
                        <div>
                          <dt>Soft-banned at</dt>
                          <dd>{formatWhen(user.softBanAt)}</dd>
                        </div>
                        <div>
                          <dt>Soft-banned by</dt>
                          <dd>{user.softBanBy || "—"}</dd>
                        </div>
                      </>
                    )}
                  </dl>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
