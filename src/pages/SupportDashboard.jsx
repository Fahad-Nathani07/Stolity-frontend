import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiPhone,
  FiRefreshCw,
  FiClock,
  FiUser,
  FiMail,
  FiMessageSquare,
  FiCheck,
  FiLock,
  FiUnlock,
  FiUserPlus,
} from "react-icons/fi";
import SideNav from "../components/SideNav";
import { showToast } from "../components/ToastProvider";
import SupportQuestionsPane from "./SupportQuestionsPane";
import "../css/SupportDashboard.css";

const TABS = [
  { id: "callbacks", label: "Callbacks", enabled: true },
  { id: "questions", label: "Questions", enabled: true },
];

const STATUS_OPTIONS = [
  { id: "all", label: "All statuses" },
  { id: "pending", label: "Pending" },
  { id: "assigned", label: "Assigned" },
  { id: "no_answer", label: "No answer" },
  { id: "call_later", label: "Call later" },
  { id: "rescheduled", label: "Rescheduled" },
  { id: "completed", label: "Completed" },
];

const TIME_OPTIONS = [
  { id: "all", label: "All times" },
  { id: "morning", label: "Morning" },
  { id: "afternoon", label: "Afternoon" },
  { id: "evening", label: "Evening" },
];

const QUICK_NOTES = [
  "Didn't pick up",
  "Asked to call later",
  "Wrong / unreachable number",
  "Spoke — issue resolved",
  "Needs follow-up",
  "Rescheduled preferred time",
];

const STATUS_ACTIONS = [
  { id: "no_answer", label: "No answer" },
  { id: "call_later", label: "Call later" },
  { id: "rescheduled", label: "Rescheduled" },
  { id: "completed", label: "Completed" },
  { id: "assigned", label: "In progress" },
];

const SOFT_REFRESH_MS = 60_000;

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

export default function SupportDashboard() {
  const navigate = useNavigate();
  const userProfile = useSelector((state) => state.userProfile);
  const apiUrl = process.env.REACT_APP_API_ENDPOINT;
  const token = sessionStorage.getItem("number");
  const email = (
    userProfile.email ||
    sessionStorage.getItem("email") ||
    ""
  ).toLowerCase();
  const myId = userProfile.userId || "";

  const isInfomanav = email.includes("infomanav");

  const [activeTab, setActiveTab] = useState("callbacks");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [reassigning, setReassigning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [actionMsg, setActionMsg] = useState(null);
  const [reassignEmail, setReassignEmail] = useState("");
  const [showReassign, setShowReassign] = useState(false);

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

  useEffect(() => {
    if (!isInfomanav) {
      navigate("/Files", { replace: true });
    }
  }, [isInfomanav, navigate]);

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  const applyOwnershipFromTicket = useCallback(
    (ticket) => {
      const state = ownershipState(ticket, email, myId);
      return {
        isMine: state === "mine",
        isLockedToOther: state === "taken",
        isOpen: state === "open",
      };
    },
    [email, myId]
  );

  const syncSelectedFromList = useCallback(
    (list, { preserveDraft = true } = {}) => {
      const id = selectedIdRef.current;
      if (!id) return;
      const still = list.find((item) => item.id === id);
      if (!still) {
        setSelected(null);
        setSelectedId(null);
        setActionMsg({
          type: "error",
          text: "This ticket is no longer in the list.",
        });
        return;
      }

      // Never wipe an in-progress note while soft-refreshing
      if (preserveDraft && noteDraftRef.current.trim()) {
        setSelected((prev) => {
          if (!prev || prev.id !== still.id) return still;
          return {
            ...still,
            // keep local note-unrelated UX stable
          };
        });
      } else {
        setSelected(still);
      }
    },
    []
  );

  const fetchList = useCallback(
    async ({ soft = false } = {}) => {
      if (!token) return;

      // Soft refresh must not interrupt editing
      if (
        soft &&
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
        const params = {};
        if (statusFilter !== "all") params.status = statusFilter;
        if (timeFilter !== "all") params.preferredTime = timeFilter;

        const res = await axios.get(`${apiUrl}support/callback-requests`, {
          headers: authHeaders,
          params,
        });
        const list = res.data?.result || [];
        setItems(list);
        syncSelectedFromList(list, { preserveDraft: soft });
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
    [apiUrl, authHeaders, statusFilter, timeFilter, token, syncSelectedFromList]
  );

  useEffect(() => {
    if (isInfomanav) fetchList({ soft: false });
  }, [isInfomanav, fetchList]);

  // Soft auto-refresh every 60s — skips when typing notes / saving / claiming
  useEffect(() => {
    if (!isInfomanav) return undefined;
    const timer = setInterval(() => {
      if (document.hidden) return;
      fetchList({ soft: true });
    }, SOFT_REFRESH_MS);
    return () => clearInterval(timer);
  }, [isInfomanav, fetchList]);

  const mine = useMemo(
    () => items.filter((item) => isAssignedToAgent(item, email, myId)),
    [items, email, myId]
  );

  const available = useMemo(
    () => items.filter((item) => !item.assignedTo),
    [items]
  );

  const taken = useMemo(
    () =>
      items.filter(
        (item) =>
          item.assignedTo && !isAssignedToAgent(item, email, myId)
      ),
    [items, email, myId]
  );

  const teammateEmails = useMemo(() => {
    const set = new Set();
    if (email) set.add(email);
    items.forEach((item) => {
      const e = String(item.assignedTo?.email || "").toLowerCase();
      if (e.includes("infomanav")) set.add(e);
    });
    return Array.from(set).sort();
  }, [items, email]);

  const selectedOwnership = useMemo(
    () => applyOwnershipFromTicket(selected),
    [selected, applyOwnershipFromTicket]
  );

  const openTicket = (item) => {
    setSelectedId(item.id);
    setSelected(item);
    setNoteDraft("");
    setActionMsg(null);
    setShowReassign(false);
    setReassignEmail("");

    const state = ownershipState(item, email, myId);
    if (state === "taken") {
      setActionMsg({
        type: "error",
        text: `This ticket is under ${
          item.assignedTo?.email || item.assignedTo?.name || "another agent"
        }. View only.`,
      });
    } else if (state === "mine") {
      setActionMsg({
        type: "success",
        text: "This ticket is assigned to you.",
      });
    } else {
      setActionMsg(null);
    }
  };

  const claimTicket = async () => {
    if (!selected?.id || claiming) return;
    setClaiming(true);
    setActionMsg(null);
    try {
      const res = await axios.post(
        `${apiUrl}support/callback-requests/${selected.id}/claim`,
        {},
        { headers: authHeaders }
      );
      const result = res.data?.result || selected;
      setSelected(result);
      setShowReassign(false);

      if (res.data?.claimed) {
        showToast(
          "success",
          "You can call the user and update this request.",
          "Ticket assigned to you"
        );
        setActionMsg({
          type: "success",
          text: "You are assigned to this ticket.",
        });
      } else if (res.data?.alreadyMine) {
        setActionMsg({
          type: "success",
          text: "This ticket is already assigned to you.",
        });
      }
      await fetchList({ soft: true });
    } catch (err) {
      if (err.response?.status === 409) {
        const result = err.response?.data?.result || selected;
        const ownerEmail =
          result?.assignedTo?.email ||
          result?.assignedTo?.name ||
          "another agent";
        setSelected(result);
        showToast(
          "warning",
          `This ticket is under ${ownerEmail}.`,
          "Already assigned"
        );
        setActionMsg({
          type: "error",
          text: `This ticket is under ${ownerEmail}. You can view it, but only they can update it.`,
        });
        await fetchList({ soft: true });
      } else {
        const msg =
          err.response?.data?.message ||
          "Could not assign this ticket. Please try again.";
        setActionMsg({ type: "error", text: msg });
        showToast("error", msg, "Claim failed");
      }
    } finally {
      setClaiming(false);
    }
  };

  const releaseTicket = async () => {
    if (!selected?.id || releasing || !selectedOwnership.isMine) return;
    const ok = window.confirm(
      "Release this ticket so another agent can claim it?"
    );
    if (!ok) return;

    setReleasing(true);
    setActionMsg(null);
    try {
      const res = await axios.post(
        `${apiUrl}support/callback-requests/${selected.id}/release`,
        {},
        { headers: authHeaders }
      );
      setSelected(res.data?.result || selected);
      setNoteDraft("");
      showToast("success", "Ticket is available for other agents.", "Released");
      setActionMsg({
        type: "success",
        text: "Ticket released. Claim again if you want to continue.",
      });
      await fetchList({ soft: true });
    } catch (err) {
      const msg =
        err.response?.data?.message || "Could not release this ticket.";
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
        "Only Infomanav emails can receive tickets.",
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
      showToast(
        "success",
        `Ticket is now under ${target}.`,
        "Reassigned"
      );
      setActionMsg({
        type: "error",
        text: `This ticket is under ${target}. View only.`,
      });
      await fetchList({ soft: true });
    } catch (err) {
      const msg =
        err.response?.data?.message || "Could not reassign this ticket.";
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
      setSelected(res.data?.result || selected);
      setNoteDraft("");
      setActionMsg({ type: "success", text: "Updated successfully." });
      await fetchList({ soft: true });
    } catch (err) {
      if (err.response?.status === 409) {
        const result = err.response?.data?.result || selected;
        const ownerEmail =
          result?.assignedTo?.email ||
          result?.assignedTo?.name ||
          "another agent";
        setSelected(result);
        setActionMsg({
          type: "error",
          text: `This ticket is under ${ownerEmail}.`,
        });
      } else {
        setActionMsg({
          type: "error",
          text:
            err.response?.data?.message ||
            err.response?.data?.error ||
            "Update failed.",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const renderTicketCard = (item, keyPrefix = "") => {
    const state = ownershipState(item, email, myId);
    const ownerLabel =
      state === "open"
        ? "Available"
        : state === "mine"
          ? "Assigned to you"
          : item.assignedTo?.email || item.assignedTo?.name || "Taken";

    return (
      <button
        key={`${keyPrefix}${item.id}`}
        type="button"
        className={`ssd-card ssd-card--${state}${
          selectedId === item.id ? " is-selected" : ""
        }`}
        onClick={() => openTicket(item)}
      >
        <div className="ssd-card-top">
          <strong>
            {item.firstName} {item.lastName}
          </strong>
          <span className={`ssd-pill ssd-pill-${item.status}`}>
            {formatLabel(item.status)}
          </span>
        </div>
        <div className="ssd-card-meta">
          <span>
            <FiPhone /> {item.mobile}
          </span>
          <span>
            <FiClock /> {formatLabel(item.preferredTime)}
          </span>
        </div>
        <div className={`ssd-card-owner ssd-card-owner--${state}`}>
          {state === "taken" ? <FiLock /> : state === "mine" ? <FiUser /> : <FiUnlock />}
          <span>{ownerLabel}</span>
        </div>
        <div className="ssd-card-foot">{formatWhen(item.createdAt)}</div>
      </button>
    );
  };

  const canEdit =
    selectedOwnership.isMine && !claiming && !releasing && !reassigning;
  const editsDisabled = !canEdit;

  if (!isInfomanav) return null;

  return (
    <div className="ssd-shell">
      <SideNav />
      <div className="ssd-page">
        <header className="ssd-header">
          <div>
            <p className="ssd-eyebrow">Team tools</p>
            <h1>Support dashboard</h1>
            <p className="ssd-sub">
              {activeTab === "questions"
                ? "Manage FAQ questions from Stolity users."
                : "Manage callbacks assigned to Infomanav agents."}
            </p>
          </div>
          {activeTab === "callbacks" && (
          <button
            type="button"
            className="ssd-btn ssd-btn-ghost"
            onClick={() => fetchList({ soft: false })}
            disabled={loading}
          >
            <FiRefreshCw />
            Refresh
          </button>
          )}
        </header>

        <div className="ssd-tabs" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              disabled={!tab.enabled}
              className={`ssd-tab${activeTab === tab.id ? " is-active" : ""}`}
              onClick={() => {
                if (!tab.enabled) return;
                setActiveTab(tab.id);
                setSelectedId(null);
                setSelected(null);
                setNoteDraft("");
                setActionMsg(null);
                setShowReassign(false);
              }}
              title={tab.enabled ? tab.label : "Coming soon"}
            >
              {tab.label}
              {!tab.enabled && <span className="ssd-soon">Soon</span>}
            </button>
          ))}
        </div>

        {activeTab === "questions" && (
          <SupportQuestionsPane
            apiUrl={apiUrl}
            authHeaders={authHeaders}
            email={email}
            myId={myId}
            token={token}
          />
        )}

        {activeTab === "callbacks" && (
          <div className="ssd-callbacks">
            <div className="ssd-toolbar">
              <div className="ssd-filters">
                <label>
                  Preferred time
                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                  >
                    {TIME_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Status
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="ssd-counts">
                <span className="ssd-count ssd-count--open">
                  Available <strong>{available.length}</strong>
                </span>
                <span className="ssd-count ssd-count--mine">
                  Mine <strong>{mine.length}</strong>
                </span>
                <span className="ssd-count ssd-count--taken">
                  Taken <strong>{taken.length}</strong>
                </span>
              </div>
            </div>

            {error && <div className="ssd-banner ssd-banner-error">{error}</div>}

            <div className="ssd-layout">
              <section className="ssd-list-pane">
                {loading ? (
                  <p className="ssd-empty">Loading callbacks…</p>
                ) : items.length === 0 ? (
                  <p className="ssd-empty">No callback requests found.</p>
                ) : (
                  <>
                    <div className="ssd-group">
                      <h3>
                        Available
                        <span className="ssd-group-count">{available.length}</span>
                      </h3>
                      {available.length === 0 ? (
                        <p className="ssd-group-empty">No open tickets.</p>
                      ) : (
                        available.map((item) =>
                          renderTicketCard(item, "open-")
                        )
                      )}
                    </div>

                    <div className="ssd-group">
                      <h3>
                        Assigned to me
                        <span className="ssd-group-count">{mine.length}</span>
                      </h3>
                      {mine.length === 0 ? (
                        <p className="ssd-group-empty">Nothing assigned to you.</p>
                      ) : (
                        mine.map((item) => renderTicketCard(item, "mine-"))
                      )}
                    </div>

                    <div className="ssd-group">
                      <h3>
                        Taken by others
                        <span className="ssd-group-count">{taken.length}</span>
                      </h3>
                      {taken.length === 0 ? (
                        <p className="ssd-group-empty">No tickets taken by teammates.</p>
                      ) : (
                        taken.map((item) => renderTicketCard(item, "taken-"))
                      )}
                    </div>
                  </>
                )}
              </section>

              <section className="ssd-detail-pane">
                {!selected ? (
                  <div className="ssd-empty-detail">
                    <div className="ssd-empty-icon" aria-hidden="true">
                      <FiPhone />
                    </div>
                    <h3>No ticket selected</h3>
                    <p>Select a callback to view details. Claim only when you want it.</p>
                  </div>
                ) : (
                  <div className="ssd-detail">
                    <div className="ssd-detail-hero">
                      <div className="ssd-detail-hero-main">
                        <div className="ssd-avatar" aria-hidden="true">
                          {(selected.firstName || "?").charAt(0).toUpperCase()}
                          {(selected.lastName || "").charAt(0).toUpperCase()}
                        </div>
                        <div className="ssd-detail-hero-text">
                          <p className="ssd-detail-eyebrow">Callback ticket</p>
                          <h2>
                            {selected.firstName} {selected.lastName}
                          </h2>
                          <p className="ssd-detail-claim">
                            {selectedOwnership.isOpen
                              ? "Unassigned — claim it to start working."
                              : selectedOwnership.isMine
                                ? "This ticket is assigned to you."
                                : `Assigned to ${
                                    selected.assignedTo?.email ||
                                    selected.assignedTo?.name ||
                                    "another agent"
                                  }`}
                          </p>
                        </div>
                      </div>
                      <div className="ssd-detail-hero-side">
                        <span
                          className={`ssd-pill ssd-pill-lg ssd-pill-${selected.status}`}
                        >
                          {formatLabel(selected.status)}
                        </span>
                        <a
                          className="ssd-btn ssd-btn-call"
                          href={`tel:${selected.mobile}`}
                        >
                          <FiPhone /> Call now
                        </a>
                      </div>
                    </div>

                    {selectedOwnership.isOpen && (
                      <div className="ssd-claim-prompt">
                        <div>
                          <strong>Claim this ticket?</strong>
                          <span>
                            Opening does not assign it. Confirm to assign it to you
                            so teammates cannot take it.
                          </span>
                        </div>
                        <button
                          type="button"
                          className="ssd-btn ssd-btn-primary"
                          disabled={claiming}
                          onClick={claimTicket}
                        >
                          {claiming ? "Claiming…" : "Yes, assign to me"}
                        </button>
                      </div>
                    )}

                    {selectedOwnership.isLockedToOther && (
                      <div className="ssd-ownership-banner">
                        <FiLock aria-hidden="true" />
                        <div>
                          <strong>Ticket already assigned</strong>
                          <span>
                            This ticket is under{" "}
                            <em>
                              {selected.assignedTo?.email ||
                                selected.assignedTo?.name ||
                                "another agent"}
                            </em>
                            . You can view details, but only they can update it.
                          </span>
                        </div>
                      </div>
                    )}

                    {selectedOwnership.isMine && (
                      <div className="ssd-owner-actions">
                        <button
                          type="button"
                          className="ssd-btn ssd-btn-ghost"
                          disabled={releasing || claiming || reassigning}
                          onClick={releaseTicket}
                        >
                          <FiUnlock /> Release
                        </button>
                        <button
                          type="button"
                          className="ssd-btn ssd-btn-ghost"
                          disabled={releasing || claiming || reassigning}
                          onClick={() => setShowReassign((v) => !v)}
                        >
                          <FiUserPlus /> Reassign
                        </button>
                      </div>
                    )}

                    {selectedOwnership.isMine && showReassign && (
                      <div className="ssd-reassign-box">
                        <label>
                          Reassign to teammate
                          <select
                            value={
                              teammateEmails.includes(reassignEmail)
                                ? reassignEmail
                                : ""
                            }
                            onChange={(e) => setReassignEmail(e.target.value)}
                          >
                            <option value="">Select teammate…</option>
                            {teammateEmails
                              .filter((e) => e !== email)
                              .map((e) => (
                                <option key={e} value={e}>
                                  {e}
                                </option>
                              ))}
                          </select>
                        </label>
                        <label>
                          Or enter email
                          <input
                            type="email"
                            placeholder="name@infomanav.in"
                            value={reassignEmail}
                            onChange={(e) => setReassignEmail(e.target.value)}
                          />
                        </label>
                        <button
                          type="button"
                          className="ssd-btn ssd-btn-primary"
                          disabled={reassigning || !reassignEmail.trim()}
                          onClick={reassignTicket}
                        >
                          {reassigning ? "Reassigning…" : "Confirm reassign"}
                        </button>
                      </div>
                    )}

                    {actionMsg && !selectedOwnership.isLockedToOther && (
                      <div
                        className={`ssd-banner ssd-banner-${actionMsg.type}`}
                      >
                        {actionMsg.text}
                      </div>
                    )}

                    <div className="ssd-info-grid">
                      <div className="ssd-info-card">
                        <span className="ssd-info-icon" aria-hidden="true">
                          <FiPhone />
                        </span>
                        <div>
                          <span>Mobile</span>
                          <a href={`tel:${selected.mobile}`}>{selected.mobile}</a>
                        </div>
                      </div>
                      <div className="ssd-info-card">
                        <span className="ssd-info-icon" aria-hidden="true">
                          <FiMail />
                        </span>
                        <div>
                          <span>Email</span>
                          <a href={`mailto:${selected.email}`}>
                            {selected.email}
                          </a>
                        </div>
                      </div>
                      <div className="ssd-info-card">
                        <span className="ssd-info-icon" aria-hidden="true">
                          <FiClock />
                        </span>
                        <div>
                          <span>Preferred time</span>
                          <strong>{formatLabel(selected.preferredTime)}</strong>
                        </div>
                      </div>
                      <div className="ssd-info-card">
                        <span className="ssd-info-icon" aria-hidden="true">
                          <FiUser />
                        </span>
                        <div>
                          <span>Assigned to</span>
                          <strong>
                            {selected.assignedTo?.email ||
                              selected.assignedTo?.name ||
                              "Unassigned"}
                          </strong>
                        </div>
                      </div>
                      <div className="ssd-info-card ssd-info-card--wide">
                        <span className="ssd-info-icon" aria-hidden="true">
                          <FiClock />
                        </span>
                        <div>
                          <span>Created</span>
                          <strong>{formatWhen(selected.createdAt)}</strong>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`ssd-block ssd-panel-card${
                        editsDisabled ? " is-disabled" : ""
                      }`}
                    >
                      <div className="ssd-block-head">
                        <h3>Update status</h3>
                        <p>
                          {selectedOwnership.isOpen
                            ? "Claim the ticket to update status"
                            : selectedOwnership.isLockedToOther
                              ? "Read-only — assigned to another agent"
                              : "Mark how the call went"}
                        </p>
                      </div>
                      <div className="ssd-action-row">
                        {STATUS_ACTIONS.map((action) => (
                          <button
                            key={action.id}
                            type="button"
                            className={`ssd-chip${
                              selected.status === action.id ? " is-active" : ""
                            }`}
                            disabled={editsDisabled || saving}
                            onClick={() => updateTicket({ status: action.id })}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div
                      className={`ssd-block ssd-panel-card${
                        editsDisabled ? " is-disabled" : ""
                      }`}
                    >
                      <div className="ssd-block-head">
                        <h3>Preferred time</h3>
                        <p>
                          {editsDisabled
                            ? "Claim or wait for release to edit"
                            : "Reschedule if needed"}
                        </p>
                      </div>
                      <div className="ssd-slot-row">
                        {["morning", "afternoon", "evening"].map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            className={`ssd-slot-chip${
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
                            <strong>{formatLabel(slot)}</strong>
                            <span>
                              {slot === "morning"
                                ? "9 AM – 12 PM"
                                : slot === "afternoon"
                                  ? "12 PM – 4 PM"
                                  : "4 PM – 6 PM"}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div
                      className={`ssd-block ssd-panel-card${
                        editsDisabled ? " is-disabled" : ""
                      }`}
                    >
                      <div className="ssd-block-head">
                        <h3>
                          <FiMessageSquare /> Notes
                        </h3>
                        <p>
                          {editsDisabled
                            ? "Notes are view-only until you claim this ticket"
                            : "Quick suggestions or custom notes"}
                        </p>
                      </div>
                      <div className="ssd-quick-notes">
                        {QUICK_NOTES.map((text) => (
                          <button
                            key={text}
                            type="button"
                            className="ssd-chip ssd-chip-soft"
                            disabled={editsDisabled || saving}
                            onClick={() => updateTicket({ note: text })}
                          >
                            {text}
                          </button>
                        ))}
                      </div>
                      <div className="ssd-note-compose">
                        <textarea
                          rows={3}
                          placeholder={
                            editsDisabled
                              ? "Claim this ticket to add notes…"
                              : "Add a custom note…"
                          }
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                          disabled={editsDisabled}
                        />
                        <button
                          type="button"
                          className="ssd-btn ssd-btn-primary"
                          disabled={
                            editsDisabled || saving || !noteDraft.trim()
                          }
                          onClick={() => updateTicket({ note: noteDraft })}
                        >
                          <FiCheck /> Add note
                        </button>
                      </div>
                      <div className="ssd-notes-list">
                        {(selected.notes || []).length === 0 ? (
                          <p className="ssd-muted">No notes yet.</p>
                        ) : (
                          [...(selected.notes || [])]
                            .reverse()
                            .map((note) => (
                              <div
                                key={note.id || note.createdAt}
                                className="ssd-note"
                              >
                                <div
                                  className="ssd-note-avatar"
                                  aria-hidden="true"
                                >
                                  {(
                                    note.addedByName ||
                                    note.addedByEmail ||
                                    "A"
                                  )
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                                <div className="ssd-note-body">
                                  <div className="ssd-note-top">
                                    <strong>
                                      {note.addedByName ||
                                        note.addedByEmail ||
                                        "Agent"}
                                    </strong>
                                    <span>{formatWhen(note.createdAt)}</span>
                                  </div>
                                  <p>{note.text}</p>
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
