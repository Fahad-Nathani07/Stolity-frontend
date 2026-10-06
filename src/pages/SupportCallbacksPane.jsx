import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  FiRefreshCw,
  FiPhone,
  FiMail,
  FiMessageSquare,
  FiCheck,
  FiLock,
  FiUnlock,
  FiUserPlus,
  FiSearch,
  FiX,
} from "react-icons/fi";
import { showToast } from "../components/ToastProvider";
import SupportFilterSelect from "../components/SupportFilterSelect";
import "../css/SupportTicketsAdmin.css";

const STATUS_ACTIONS = [
  { id: "no_answer", label: "No answer" },
  { id: "call_later", label: "Call later" },
  { id: "rescheduled", label: "Rescheduled" },
  { id: "completed", label: "Completed" },
  { id: "assigned", label: "In progress" },
];

const QUICK_NOTES = [
  "Didn't pick up",
  "Asked to call later",
  "Wrong / unreachable number",
  "Spoke — issue resolved",
  "Needs follow-up",
  "Rescheduled preferred time",
];

const TIME_WINDOWS = {
  morning: { label: "Morning", range: "9:00 AM – 12:00 PM" },
  afternoon: { label: "Afternoon", range: "12:00 PM – 4:00 PM" },
  evening: { label: "Evening", range: "4:00 PM – 6:00 PM" },
};

const LIST_FILTERS = [
  { id: "all", label: "All" },
  { id: "unassigned", label: "Unassigned" },
  { id: "in_progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
];

const SOFT_REFRESH_MS = 30_000;

function formatLabel(value) {
  if (!value) return "—";
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
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

function ticketCode(id, prefix = "CB") {
  if (!id) return "————";
  return `${prefix}-${String(id).replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase() || "XXXX"}`;
}

function isAssignedToAgent(item, myEmail, myId) {
  if (!item?.assignedTo) return false;
  return (
    (myId && item.assignedTo.userId === myId) ||
    String(item.assignedTo.email || "").toLowerCase() === myEmail
  );
}

function ownershipState(item, myEmail, myId) {
  if (!item?.assignedTo) return "open";
  if (isAssignedToAgent(item, myEmail, myId)) return "mine";
  return "taken";
}

function statusTone(status) {
  const s = String(status || "").toLowerCase();
  if (s === "pending") return "open";
  if (
    s === "assigned" ||
    s === "contacted" ||
    s === "no_answer" ||
    s === "call_later" ||
    s === "rescheduled"
  ) {
    return "progress";
  }
  if (s === "completed") return "done";
  return "neutral";
}

/** Admin buckets: unassigned / in_progress / completed */
function adminCallbackBucket(item) {
  const s = String(item?.status || "").toLowerCase();
  if (s === "completed") return "completed";
  if (!item?.assignedTo) return "unassigned";
  return "in_progress";
}

function adminBucketRank(bucket) {
  if (bucket === "unassigned") return 0;
  if (bucket === "in_progress") return 1;
  if (bucket === "completed") return 2;
  return 3;
}

function callbackUpdatedMs(item) {
  const iso = item?.updatedAt || item?.createdAt || "";
  const ms = iso ? Date.parse(iso) : 0;
  return Number.isFinite(ms) ? ms : 0;
}

function displayName(item) {
  const name = [item?.firstName, item?.lastName].filter(Boolean).join(" ").trim();
  return name || item?.email || "User";
}

export default function SupportCallbacksPane({
  apiUrl,
  authHeaders,
  email,
  myId,
  token,
  onItemCountChange,
  onUnassignedCountChange,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [listFilter, setListFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [reassigning, setReassigning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [reassignEmail, setReassignEmail] = useState("");
  const [showReassign, setShowReassign] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);
  const [refreshIn, setRefreshIn] = useState(SOFT_REFRESH_MS / 1000);

  const noteDraftRef = useRef("");
  const savingRef = useRef(false);
  const claimingRef = useRef(false);
  const selectedIdRef = useRef(null);

  useEffect(() => {
    noteDraftRef.current = noteDraft;
  }, [noteDraft]);
  useEffect(() => {
    savingRef.current = saving;
  }, [saving]);
  useEffect(() => {
    claimingRef.current = claiming;
  }, [claiming]);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const unassignedCount = useMemo(
    () => items.filter((item) => adminCallbackBucket(item) === "unassigned").length,
    [items]
  );

  useEffect(() => {
    onItemCountChange?.(items.length);
  }, [items.length, onItemCountChange]);

  useEffect(() => {
    onUnassignedCountChange?.(unassignedCount);
  }, [unassignedCount, onUnassignedCountChange]);

  const syncSelectedFromList = useCallback((list) => {
    const id = selectedIdRef.current;
    if (!id) return;
    const still = list.find((item) => item.id === id);
    if (!still) {
      setSelected(null);
      setSelectedId(null);
      setDrawerOpen(false);
      setActionMsg({
        type: "error",
        text: "This callback is no longer in the list.",
      });
      return;
    }
    setSelected(still);
  }, []);

  const fetchList = useCallback(
    async ({ soft = false, force = false } = {}) => {
      if (!token) return;
      if (
        soft &&
        !force &&
        (noteDraftRef.current.trim() ||
          savingRef.current ||
          claimingRef.current)
      ) {
        return;
      }

      if (!soft) {
        setLoading(true);
        setError("");
      }

      try {
        const res = await axios.get(`${apiUrl}support/callback-requests`, {
          headers: authHeaders,
        });
        const list = res.data?.result || [];
        setItems(list);
        syncSelectedFromList(list);
      } catch (err) {
        if (!soft) {
          setError(
            err.response?.data?.message ||
              err.response?.data?.error ||
              "Failed to load callback requests."
          );
        }
      } finally {
        if (!soft) setLoading(false);
      }
    },
    [apiUrl, authHeaders, token, syncSelectedFromList]
  );

  useEffect(() => {
    fetchList({ soft: false });
  }, [fetchList]);

  useEffect(() => {
    const tick = setInterval(() => {
      setRefreshIn((s) => {
        if (s <= 1) {
          fetchList({ soft: true });
          return SOFT_REFRESH_MS / 1000;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [fetchList]);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") closeDrawer();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const matchesSearch = useCallback(
    (item) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      const hay = [
        item.firstName,
        item.lastName,
        item.email,
        item.mobile,
        item.status,
        item.preferredTime,
        ticketCode(item.id),
        item.assignedTo?.email,
        item.assignedTo?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    },
    [searchQuery]
  );

  const filterCounts = useMemo(() => {
    const counts = {
      all: items.length,
      unassigned: 0,
      in_progress: 0,
      completed: 0,
    };
    for (const item of items) {
      counts[adminCallbackBucket(item)] += 1;
    }
    return counts;
  }, [items]);

  const filteredRows = useMemo(() => {
    let list = items.filter(matchesSearch);
    if (listFilter !== "all") {
      list = list.filter((item) => adminCallbackBucket(item) === listFilter);
    }
    list = [...list].sort((a, b) => {
      const rankDiff =
        adminBucketRank(adminCallbackBucket(a)) -
        adminBucketRank(adminCallbackBucket(b));
      if (rankDiff !== 0) return rankDiff;
      return callbackUpdatedMs(b) - callbackUpdatedMs(a);
    });
    return list;
  }, [items, matchesSearch, listFilter]);

  const counts = useMemo(() => {
    let available = 0;
    let mine = 0;
    let taken = 0;
    for (const item of items) {
      const state = ownershipState(item, email, myId);
      if (state === "open") available += 1;
      else if (state === "mine") mine += 1;
      else taken += 1;
    }
    return { available, mine, taken };
  }, [items, email, myId]);

  const teammateOptions = useMemo(() => {
    const set = new Set();
    items.forEach((item) => {
      const e = String(item.assignedTo?.email || "").toLowerCase();
      if (e.includes("infomanav") && e !== email) set.add(e);
    });
    return Array.from(set)
      .sort()
      .map((e) => ({ id: e, label: e }));
  }, [items, email]);

  const selectedOwnership = useMemo(() => {
    const state = ownershipState(selected, email, myId);
    return {
      isMine: state === "mine",
      isLockedToOther: state === "taken",
      isOpen: state === "open",
    };
  }, [selected, email, myId]);

  const activityNotes = useMemo(() => {
    if (!selected?.notes) return [];
    return [...selected.notes].reverse();
  }, [selected]);

  const canEdit =
    selectedOwnership.isMine && !claiming && !releasing && !reassigning;
  const editsDisabled = !canEdit;

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedId(null);
    setSelected(null);
    setNoteDraft("");
    setActionMsg(null);
    setShowReassign(false);
    setReassignEmail("");
  };

  const openTicket = (item) => {
    setSelectedId(item.id);
    setSelected(item);
    setDrawerOpen(true);
    setNoteDraft("");
    setActionMsg(null);
    setShowReassign(false);
    setReassignEmail("");
    const state = ownershipState(item, email, myId);
    if (state === "taken") {
      setActionMsg({
        type: "error",
        text: `Under ${
          item.assignedTo?.email || item.assignedTo?.name || "another agent"
        }. View only.`,
      });
    } else if (state === "mine") {
      setActionMsg({
        type: "success",
        text: "Assigned to you.",
      });
    }
  };

  const claimTicket = async () => {
    const ticket = selected;
    if (!ticket?.id || claiming) return;
    setClaiming(true);
    setActionMsg(null);
    try {
      const res = await axios.post(
        `${apiUrl}support/callback-requests/${ticket.id}/claim`,
        {},
        { headers: authHeaders }
      );
      setSelected(res.data?.result || ticket);
      if (res.data?.claimed) {
        showToast("success", "Callback assigned to you.", "Claimed");
        setActionMsg({ type: "success", text: "You are assigned." });
      }
      await fetchList({ soft: true });
    } catch (err) {
      if (err.response?.status === 409) {
        const result = err.response?.data?.result || ticket;
        setSelected(result);
        const ownerEmail =
          result?.assignedTo?.email ||
          result?.assignedTo?.name ||
          "another agent";
        showToast("warning", `Already under ${ownerEmail}.`, "Taken");
        setActionMsg({ type: "error", text: `Under ${ownerEmail}.` });
        await fetchList({ soft: true });
      } else {
        const msg =
          err.response?.data?.message || "Could not claim this callback.";
        setActionMsg({ type: "error", text: msg });
        showToast("error", msg, "Claim failed");
      }
    } finally {
      setClaiming(false);
    }
  };

  const releaseTicket = async () => {
    if (!selected?.id || releasing || !selectedOwnership.isMine) return;
    if (!window.confirm("Release this callback for other agents?")) return;
    setReleasing(true);
    try {
      const res = await axios.post(
        `${apiUrl}support/callback-requests/${selected.id}/release`,
        {},
        { headers: authHeaders }
      );
      setSelected(res.data?.result || selected);
      setNoteDraft("");
      showToast("success", "Callback is available again.", "Released");
      setActionMsg({ type: "success", text: "Released." });
      await fetchList({ soft: true });
    } catch (err) {
      const msg =
        err.response?.data?.message || "Could not release this callback.";
      setActionMsg({ type: "error", text: msg });
      showToast("error", msg, "Release failed");
    } finally {
      setReleasing(false);
    }
  };

  const reassignTicket = async () => {
    if (!selected?.id || reassigning || !selectedOwnership.isMine) return;
    const target = String(reassignEmail || "").trim().toLowerCase();
    if (!target) {
      showToast("warning", "Enter a teammate email.", "Reassign");
      return;
    }
    if (!target.includes("infomanav")) {
      showToast(
        "warning",
        "Only Infomanav emails can receive callbacks.",
        "Reassign"
      );
      return;
    }

    setReassigning(true);
    setActionMsg(null);
    try {
      const res = await axios.post(
        `${apiUrl}support/callback-requests/${selected.id}/reassign`,
        { email: target },
        { headers: authHeaders }
      );
      setSelected(res.data?.result || selected);
      setNoteDraft("");
      setShowReassign(false);
      setReassignEmail("");
      showToast("success", `Now under ${target}.`, "Reassigned");
      setActionMsg({
        type: "error",
        text: `Under ${target}. View only.`,
      });
      await fetchList({ soft: true });
    } catch (err) {
      const msg =
        err.response?.data?.message || "Could not reassign this callback.";
      setActionMsg({ type: "error", text: msg });
      showToast("error", msg, "Reassign failed");
    } finally {
      setReassigning(false);
    }
  };

  const updateTicket = async (payload) => {
    if (!selected?.id || saving || !selectedOwnership.isMine) return;
    setSaving(true);
    setActionMsg(null);
    try {
      const res = await axios.patch(
        `${apiUrl}support/callback-requests/${selected.id}`,
        payload,
        { headers: authHeaders }
      );
      const result = res.data?.result || { ...selected, ...payload };
      setSelected(result);
      setItems((prev) =>
        prev.map((item) =>
          item.id === result.id ? { ...item, ...result } : item
        )
      );
      setNoteDraft("");
      setActionMsg({ type: "success", text: "Updated." });
      await fetchList({ soft: true, force: true });
    } catch (err) {
      setActionMsg({
        type: "error",
        text:
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Update failed.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sta-root">
      <div className="sta-toolbar">
        <div className="sta-toolbar-left">
          <div className="sta-filters" role="tablist" aria-label="Callback filters">
            {LIST_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={listFilter === f.id}
                className={`sta-filter-chip${
                  listFilter === f.id ? " is-active" : ""
                }`}
                onClick={() => setListFilter(f.id)}
              >
                {f.label}
                <em>{filterCounts[f.id] ?? 0}</em>
              </button>
            ))}
          </div>
          <label className="sta-field sta-field--search">
            <span>Search</span>
            <span className="sta-search">
              <FiSearch aria-hidden="true" />
              <input
                type="search"
                placeholder="Name, phone, email, ID…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </span>
          </label>
        </div>
        <div className="sta-toolbar-right">
          <div className="sta-stats">
            <span>
              Available <strong>{counts.available}</strong>
            </span>
            <span>
              Mine <strong>{counts.mine}</strong>
            </span>
            <span>
              Taken <strong>{counts.taken}</strong>
            </span>
          </div>
          <button
            type="button"
            className="sta-btn sta-btn--ghost"
            onClick={() => {
              fetchList({ soft: false });
              setRefreshIn(SOFT_REFRESH_MS / 1000);
            }}
            disabled={loading}
          >
            <FiRefreshCw /> Refresh {refreshIn}s
          </button>
        </div>
      </div>

      {error ? <div className="sta-alert sta-alert--error">{error}</div> : null}

      <div className="sta-table-shell">
        {loading ? (
          <p className="sta-empty">Loading callbacks…</p>
        ) : filteredRows.length === 0 ? (
          <p className="sta-empty">No callbacks match your filters.</p>
        ) : (
          <table className="sta-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Phone</th>
                <th>Preferred time</th>
                <th>Status</th>
                <th>Assigned to</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((item) => {
                const code = ticketCode(item.id);
                const state = ownershipState(item, email, myId);
                const windowMeta = TIME_WINDOWS[item.preferredTime];
                return (
                  <tr
                    key={item.id}
                    className={`sta-row${
                      selectedId === item.id ? " is-active" : ""
                    } sta-row--${state}`}
                    onClick={() => openTicket(item)}
                  >
                    <td className="sta-mono">{code}</td>
                    <td>
                      <div className="sta-user">
                        <strong>{displayName(item)}</strong>
                        <span>{item.email || "—"}</span>
                      </div>
                    </td>
                    <td>{item.mobile || "—"}</td>
                    <td>
                      {windowMeta
                        ? `${windowMeta.label}`
                        : formatLabel(item.preferredTime)}
                    </td>
                    <td>
                      <span
                        className={`sta-status sta-status--${statusTone(
                          item.status
                        )}`}
                      >
                        {formatLabel(item.status)}
                      </span>
                    </td>
                    <td>
                      {item.assignedTo?.email ||
                        item.assignedTo?.name ||
                        "Unassigned"}
                    </td>
                    <td className="sta-when">
                      {formatWhen(item.updatedAt || item.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {drawerOpen && selected ? (
        <div className="sta-drawer-root" role="presentation">
          <button
            type="button"
            className="sta-drawer-backdrop"
            aria-label="Close callback details"
            onClick={closeDrawer}
          />
          <aside
            className="sta-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Callback details"
          >
            <header className="sta-drawer-head">
              <div>
                <p className="sta-drawer-kicker">
                  Callback request · {ticketCode(selected.id)}
                </p>
                <h2>
                  {displayName(selected)}
                  <span className="sta-drawer-sub">
                    {selectedOwnership.isOpen
                      ? " · Unassigned"
                      : selectedOwnership.isMine
                        ? " · Assigned to you"
                        : ` · ${
                            selected.assignedTo?.email ||
                            selected.assignedTo?.name ||
                            "another agent"
                          }`}
                  </span>
                </h2>
              </div>
              <div className="sta-drawer-head-actions">
                <span
                  className={`sta-status sta-status--${statusTone(
                    selected.status
                  )}`}
                >
                  {formatLabel(selected.status)}
                </span>
                <a
                  className="sta-btn sta-btn--ghost sta-btn--sm"
                  href={`mailto:${selected.email}`}
                >
                  <FiMail /> Email
                </a>
                <a
                  className="sta-btn sta-btn--ghost sta-btn--sm"
                  href={`tel:${selected.mobile}`}
                >
                  <FiPhone /> Call
                </a>
                {selectedOwnership.isMine ? (
                  <>
                    <button
                      type="button"
                      className="sta-btn sta-btn--ghost sta-btn--sm"
                      disabled={releasing || claiming || reassigning}
                      onClick={releaseTicket}
                    >
                      <FiUnlock /> Release
                    </button>
                    <button
                      type="button"
                      className="sta-btn sta-btn--ghost sta-btn--sm"
                      disabled={releasing || claiming || reassigning}
                      onClick={() => setShowReassign((v) => !v)}
                    >
                      <FiUserPlus /> Reassign
                    </button>
                  </>
                ) : null}
                <button
                  type="button"
                  className="sta-icon-btn"
                  onClick={closeDrawer}
                  aria-label="Close"
                >
                  <FiX />
                </button>
              </div>
            </header>

            <div className="sta-drawer-body">
              {selectedOwnership.isOpen ? (
                <div className="sta-claim">
                  <div>
                    <strong>Claim this callback?</strong>
                    <span>Assign it to yourself to call and update status.</span>
                  </div>
                  <button
                    type="button"
                    className="sta-btn sta-btn--primary"
                    disabled={claiming}
                    onClick={claimTicket}
                  >
                    {claiming ? "Claiming…" : "Claim"}
                  </button>
                </div>
              ) : null}

              {selectedOwnership.isLockedToOther ? (
                <div className="sta-banner sta-banner--warn">
                  <FiLock /> Only the assigned agent can edit this callback.
                </div>
              ) : null}

              {selectedOwnership.isMine && showReassign ? (
                <section className="sta-panel">
                  <h3>Reassign callback</h3>
                  <p className="sta-muted">
                    Pick a teammate or type an Infomanav email.
                  </p>
                  <div className="sta-grid-2" style={{ marginTop: 12 }}>
                    <label className="sta-label">
                      Teammate
                      <SupportFilterSelect
                        label=""
                        value={
                          teammateOptions.some((opt) => opt.id === reassignEmail)
                            ? reassignEmail
                            : ""
                        }
                        options={teammateOptions}
                        placeholder="Select teammate…"
                        ariaLabel="Reassign to teammate"
                        onChange={(id) => setReassignEmail(id)}
                      />
                    </label>
                    <label className="sta-label">
                      Or enter email
                      <input
                        type="email"
                        placeholder="name@infomanav.in"
                        value={reassignEmail}
                        onChange={(e) => setReassignEmail(e.target.value)}
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    className="sta-btn sta-btn--primary"
                    style={{ marginTop: 12 }}
                    disabled={reassigning || !reassignEmail.trim()}
                    onClick={reassignTicket}
                  >
                    {reassigning ? "Reassigning…" : "Confirm reassign"}
                  </button>
                </section>
              ) : null}

              {actionMsg ? (
                <div className={`sta-banner sta-banner--${actionMsg.type}`}>
                  {actionMsg.text}
                </div>
              ) : null}

              <dl className="sta-meta">
                <div>
                  <dt>Phone</dt>
                  <dd>
                    <a href={`tel:${selected.mobile}`}>
                      {selected.mobile || "—"}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>
                    <a href={`mailto:${selected.email}`}>
                      {selected.email || "—"}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt>Preferred time</dt>
                  <dd>
                    {TIME_WINDOWS[selected.preferredTime]
                      ? `${TIME_WINDOWS[selected.preferredTime].label} (${TIME_WINDOWS[selected.preferredTime].range})`
                      : formatLabel(selected.preferredTime)}
                  </dd>
                </div>
                <div>
                  <dt>Assigned</dt>
                  <dd>
                    {selected.assignedTo?.email ||
                      selected.assignedTo?.name ||
                      "Unassigned"}
                  </dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd>{formatWhen(selected.createdAt)}</dd>
                </div>
                {selected.source ? (
                  <div>
                    <dt>Source</dt>
                    <dd>{formatLabel(selected.source)}</dd>
                  </div>
                ) : null}
              </dl>

              <div className="sta-grid-2">
                <section
                  className={`sta-panel${editsDisabled ? " is-locked" : ""}`}
                >
                  <h3>Update status</h3>
                  <div className="sta-chips">
                    {STATUS_ACTIONS.map((action) => (
                      <button
                        key={action.id}
                        type="button"
                        className={`sta-chip${
                          selected.status === action.id ? " is-active" : ""
                        }`}
                        disabled={editsDisabled || saving}
                        onClick={() => updateTicket({ status: action.id })}
                      >
                        {selected.status === action.id ? <FiCheck /> : null}
                        {action.label}
                      </button>
                    ))}
                  </div>
                </section>

                <section
                  className={`sta-panel${editsDisabled ? " is-locked" : ""}`}
                >
                  <h3>Preferred time window</h3>
                  <div className="sta-chips">
                    {["morning", "afternoon", "evening"].map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        className={`sta-chip${
                          selected.preferredTime === slot ? " is-active" : ""
                        }`}
                        disabled={editsDisabled || saving}
                        onClick={() =>
                          updateTicket({
                            preferredTime: slot,
                            status: "rescheduled",
                            note: `Preferred time changed to ${slot}`,
                          })
                        }
                      >
                        {selected.preferredTime === slot ? <FiCheck /> : null}
                        {TIME_WINDOWS[slot].label}
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              <section
                className={`sta-panel${editsDisabled ? " is-locked" : ""}`}
              >
                <h3>
                  <FiMessageSquare /> Notes
                </h3>
                <div className="sta-chips">
                  {QUICK_NOTES.map((text) => (
                    <button
                      key={text}
                      type="button"
                      className={`sta-chip${
                        noteDraft.trim() === text ? " is-active" : ""
                      }`}
                      disabled={editsDisabled || saving}
                      onClick={() => setNoteDraft(text)}
                    >
                      {text}
                    </button>
                  ))}
                </div>
                <label className="sta-label">
                  Your note
                  <textarea
                    rows={3}
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    disabled={editsDisabled}
                    placeholder={
                      editsDisabled
                        ? "Claim to add notes…"
                        : "Internal note for the team…"
                    }
                  />
                </label>
                <button
                  type="button"
                  className="sta-btn sta-btn--primary"
                  disabled={editsDisabled || saving || !noteDraft.trim()}
                  onClick={() => updateTicket({ note: noteDraft })}
                >
                  <FiCheck /> Add note
                </button>
              </section>

              <section className="sta-panel">
                <div className="sta-panel-head">
                  <h3>Activity</h3>
                  <span>{activityNotes.length} events</span>
                </div>
                {activityNotes.length === 0 ? (
                  <p className="sta-muted">No notes yet.</p>
                ) : (
                  <ul className="sta-activity">
                    {activityNotes.map((note, idx) => (
                      <li key={note.id || `${note.createdAt}-${idx}`}>
                        <div className="sta-activity-top">
                          <strong>
                            {note.addedByName || note.addedByEmail || "Agent"}
                          </strong>
                          <time>{formatWhen(note.createdAt)}</time>
                        </div>
                        <span className="sta-activity-kind">Note</span>
                        <p>{note.text}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
