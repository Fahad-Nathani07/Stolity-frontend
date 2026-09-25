import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ScrollReveal from "../components/ScrollReveal";
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
  FiSearch,
} from "react-icons/fi";
import SideNav from "../components/SideNav";
import { showToast } from "../components/ToastProvider";
import SupportQuestionsPane from "./SupportQuestionsPane";
import SupportActivityPane from "./SupportActivityPane";
import SupportFilterSelect, {
  SupportMultiFilterSelect,
  markPaneScrolling,
} from "../components/SupportFilterSelect";
import { canViewFileActivity } from "../config/fileActivityAccess";
import "../css/SupportDashboard.css";

const ALL_TABS = [
  { id: "callbacks", label: "Callbacks", enabled: true },
  { id: "questions", label: "Questions", enabled: true },
  { id: "activity", label: "File Activity", enabled: true },
];

const STATUS_OPTIONS = [
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

const SOFT_REFRESH_MS = 30_000;

const TIME_WINDOWS = {
  morning: { label: "Morning", range: "9:00 AM – 12:00 PM" },
  afternoon: { label: "Afternoon", range: "12:00 PM – 4:00 PM" },
  evening: { label: "Evening", range: "4:00 PM – 6:00 PM" },
};

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
  const raw = String(id || "").replace(/[^a-zA-Z0-9]/g, "");
  const tail = (raw.slice(-4) || "----").toUpperCase();
  return `${prefix}-${tail}`;
}

function personInitials(first, last, fallback = "?") {
  const a = String(first || "").trim().charAt(0);
  const b = String(last || "").trim().charAt(0);
  const out = `${a}${b}`.toUpperCase();
  return out || String(fallback).charAt(0).toUpperCase();
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
  const showFileActivity = canViewFileActivity(email);
  const tabs = useMemo(
    () =>
      ALL_TABS.filter((tab) => tab.id !== "activity" || showFileActivity),
    [showFileActivity]
  );

  const [activeTab, setActiveTab] = useState("callbacks");
  const [questionsCount, setQuestionsCount] = useState(0);
  const [activityCount, setActivityCount] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState([]);
  const [timeFilter, setTimeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshIn, setRefreshIn] = useState(SOFT_REFRESH_MS / 1000);
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
    if (!showFileActivity && activeTab === "activity") {
      setActiveTab("callbacks");
    }
  }, [showFileActivity, activeTab]);

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
    async ({ soft = false, force = false } = {}) => {
      if (!token) return;

      // Soft refresh must not interrupt editing — unless caller forces sync
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
        const params = {};
        // API accepts one status; multi-select is applied client-side after fetch
        if (Array.isArray(statusFilter) && statusFilter.length === 1) {
          params.status = statusFilter[0];
        }
        if (timeFilter !== "all") params.preferredTime = timeFilter;

        const res = await axios.get(`${apiUrl}support/callback-requests`, {
          headers: authHeaders,
          params,
        });
        let list = res.data?.result || [];
        if (
          Array.isArray(statusFilter) &&
          statusFilter.length > 1 &&
          statusFilter.length < STATUS_OPTIONS.length
        ) {
          const allowed = new Set(statusFilter);
          list = list.filter((item) =>
            allowed.has(String(item.status || "").toLowerCase())
          );
        }
        setItems(list);
        syncSelectedFromList(list, { preserveDraft: soft && !force });
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

  // Soft auto-refresh every 30s — skips when typing notes / saving / claiming
  useEffect(() => {
    if (!isInfomanav || activeTab !== "callbacks") return undefined;
    setRefreshIn(SOFT_REFRESH_MS / 1000);
    const tick = setInterval(() => {
      setRefreshIn((s) => (s <= 1 ? SOFT_REFRESH_MS / 1000 : s - 1));
    }, 1000);
    const timer = setInterval(() => {
      if (document.hidden) return;
      fetchList({ soft: true });
      setRefreshIn(SOFT_REFRESH_MS / 1000);
    }, SOFT_REFRESH_MS);
    return () => {
      clearInterval(tick);
      clearInterval(timer);
    };
  }, [isInfomanav, fetchList, activeTab]);

  const dutyAgentName = useMemo(() => {
    const fromProfile =
      userProfile.name ||
      [userProfile.firstName, userProfile.lastName].filter(Boolean).join(" ");
    if (fromProfile) return fromProfile;
    const local = email.split("@")[0] || "Agent";
    return local
      .replace(/[._]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }, [userProfile, email]);

  const matchesSearch = useCallback(
    (item) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      const hay = [
        item.firstName,
        item.lastName,
        item.email,
        item.mobile,
        item.id,
        ticketCode(item.id),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    },
    [searchQuery]
  );

  const mine = useMemo(
    () =>
      items.filter(
        (item) => isAssignedToAgent(item, email, myId) && matchesSearch(item)
      ),
    [items, email, myId, matchesSearch]
  );

  const available = useMemo(
    () => items.filter((item) => !item.assignedTo && matchesSearch(item)),
    [items, matchesSearch]
  );

  const taken = useMemo(
    () =>
      items.filter(
        (item) =>
          item.assignedTo &&
          !isAssignedToAgent(item, email, myId) &&
          matchesSearch(item)
      ),
    [items, email, myId, matchesSearch]
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

  const teammateOptions = useMemo(
    () =>
      teammateEmails
        .filter((e) => e !== email)
        .map((e) => ({ id: e, label: e })),
    [teammateEmails, email]
  );

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

  const claimTicket = async (fromItem) => {
    const ticket = fromItem?.id ? fromItem : selected;
    if (!ticket?.id || claiming) return;
    if (fromItem?.id) {
      setSelectedId(fromItem.id);
      setSelected(fromItem);
      setNoteDraft("");
      setShowReassign(false);
    }
    setClaiming(true);
    setActionMsg(null);
    try {
      const res = await axios.post(
        `${apiUrl}support/callback-requests/${ticket.id}/claim`,
        {},
        { headers: authHeaders }
      );
      const result = res.data?.result || ticket;
      setSelected(result);
      setSelectedId(result.id || ticket.id);
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
        const result = err.response?.data?.result || ticket;
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
      const result = res.data?.result || { ...selected, ...payload };
      setSelected(result);
      setItems((prev) =>
        prev.map((item) =>
          item.id === result.id ? { ...item, ...result } : item
        )
      );
      setNoteDraft("");
      setActionMsg({ type: "success", text: "Updated successfully." });
      await fetchList({ soft: true, force: true });
    } catch (err) {
      if (err.response?.status === 409) {
        const result = err.response?.data?.result || selected;
        const ownerEmail =
          result?.assignedTo?.email ||
          result?.assignedTo?.name ||
          "another agent";
        setSelected(result);
        setItems((prev) =>
          prev.map((item) =>
            item.id === result.id ? { ...item, ...result } : item
          )
        );
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
    const windowMeta = TIME_WINDOWS[item.preferredTime];
    const timeLabel = windowMeta
      ? `${windowMeta.label} (${
          item.preferredTime === "morning"
            ? "09:00 - 12:00"
            : item.preferredTime === "afternoon"
              ? "12:00 - 16:00"
              : "16:00 - 18:00"
        })`
      : formatLabel(item.preferredTime);
    const isSelected = selectedId === item.id;

    return (
      <div
        key={`${keyPrefix}${item.id}`}
        role="button"
        tabIndex={0}
        className={`ssd-card ssd-card--${state}${
          isSelected ? " is-selected" : ""
        }`}
        onClick={() => openTicket(item)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openTicket(item);
          }
        }}
      >
        <div className="ssd-card-row ssd-card-row--head">
          <div className="ssd-card-avatar" aria-hidden="true">
            {personInitials(item.firstName, item.lastName)}
          </div>
          <div className="ssd-card-identity">
            <div className="ssd-card-name-line">
              <strong>
                {item.firstName} {item.lastName}
              </strong>
              <span
                className={`ssd-card-status-dot ssd-card-status-dot--${item.status || "pending"}`}
                aria-hidden="true"
              />
            </div>
            <div className="ssd-card-phone">
              <FiPhone aria-hidden="true" />
              <span>{item.mobile || "—"}</span>
            </div>
          </div>
          <span className={`ssd-pill ssd-pill-${item.status}`}>
            {formatLabel(item.status)}
          </span>
        </div>

        <div className="ssd-card-row ssd-card-row--meta">
          <div className="ssd-card-email">
            <FiUser aria-hidden="true" />
            <span title={item.email || ""}>{item.email || "—"}</span>
          </div>
          <span className="ssd-card-when">{formatWhen(item.createdAt)}</span>
        </div>

        <div className="ssd-card-row ssd-card-row--foot">
          <div className="ssd-card-slot">
            <FiClock aria-hidden="true" />
            <span>{timeLabel}</span>
          </div>
          {state === "open" ? (
            <button
              type="button"
              className="ssd-card-claim-sm"
              disabled={claiming}
              onClick={(e) => {
                e.stopPropagation();
                claimTicket(item);
              }}
            >
              {claiming && selectedId === item.id ? "…" : "Claim"}
            </button>
          ) : null}
        </div>
      </div>
    );
  };

  const canEdit =
    selectedOwnership.isMine && !claiming && !releasing && !reassigning;
  const editsDisabled = !canEdit;
  const listTotal = available.length + mine.length + taken.length;

  if (!isInfomanav) return null;

  return (
    <div className="ssd-shell">
      <SideNav />
      <div className={`ssd-page${activeTab === "activity" ? " ssd-page--activity" : ""}`}>
        <ScrollReveal as="header" className="ssd-header" variant="fadeSoft" delay={0.05} duration={0.75}>
          <div className="ssd-header-left">
            <p className="ssd-breadcrumb">
              Team tools <span aria-hidden="true">›</span> Outbound operations
            </p>
            <div className="ssd-title-row">
              <h1 className="ssd-title">Support dashboard</h1>
              <span className="ssd-live-pill">
                <span className="ssd-live-dot" aria-hidden="true" />
                Live queue synced
              </span>
            </div>
          </div>
          <div className="ssd-header-right">
            {activeTab === "callbacks" && (
              <button
                type="button"
                className="ssd-btn ssd-btn-ghost ssd-btn-refresh"
                onClick={() => {
                  fetchList({ soft: false });
                  setRefreshIn(SOFT_REFRESH_MS / 1000);
                }}
                disabled={loading}
              >
                <FiRefreshCw />
                Refresh {refreshIn}s
              </button>
            )}
            <div className="ssd-duty-agent">
              <span className="ssd-duty-label">Duty agent</span>
              <div className="ssd-duty-row">
                <strong>{dutyAgentName}</strong>
                <span className="ssd-duty-badge" title="Support level">
                  L2
                </span>
              </div>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal as="div" className="ssd-chrome" variant="fadeUp" delay={0.1} duration={0.85}>
          <div className="ssd-tabs" role="tablist">
            {tabs.map((tab) => (
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
                {tab.id === "callbacks" && (
                  <span className="ssd-tab-count">{items.length}</span>
                )}
                {tab.id === "questions" && (
                  <span className="ssd-tab-count">{questionsCount}</span>
                )}
                {tab.id === "activity" && (
                  <span className="ssd-tab-count">{activityCount}</span>
                )}
                {!tab.enabled && <span className="ssd-soon">Soon</span>}
              </button>
            ))}
          </div>

          {activeTab === "callbacks" && (
            <div className="ssd-toolbar">
              <div className="ssd-filters">
                <SupportFilterSelect
                  label="Preferred time"
                  value={timeFilter}
                  options={TIME_OPTIONS}
                  onChange={setTimeFilter}
                />
                <SupportMultiFilterSelect
                  label="Status"
                  values={statusFilter}
                  options={STATUS_OPTIONS}
                  onChange={setStatusFilter}
                  allLabel="All statuses"
                  ariaLabel="Filter by status"
                />
                <div className="ssd-search-field">
                  {/* Search */}
                  <span className="ssd-search-wrap">
                    <FiSearch aria-hidden="true" />
                    <input
                      type="search"
                      placeholder="Search name or ID…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </span>
                </div>
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
          )}
        </ScrollReveal>

        {activeTab === "questions" && (
          <ScrollReveal as="div" variant="fadeUp" delay={0.1} duration={0.85}>
            <SupportQuestionsPane
              apiUrl={apiUrl}
              authHeaders={authHeaders}
              email={email}
              myId={myId}
              token={token}
              onItemCountChange={setQuestionsCount}
            />
          </ScrollReveal>
        )}

        {activeTab === "activity" && showFileActivity && (
          <div className="ssd-activity-host">
            <SupportActivityPane
              apiUrl={apiUrl}
              authHeaders={authHeaders}
              onItemCountChange={setActivityCount}
            />
          </div>
        )}

        {activeTab === "callbacks" && (
          <ScrollReveal as="div" className="ssd-callbacks" variant="fadeUp" delay={0.1} duration={0.85}>
            {error && <div className="ssd-banner ssd-banner-error">{error}</div>}

            <div className="ssd-layout">
              <section className="ssd-list-pane">
                <div
                  className="ssd-pane-scroll"
                  onScroll={markPaneScrolling}
                >
                <div className="ssd-list-head">
                  <h2>
                    {listTotal} callback request{listTotal === 1 ? "" : "s"}
                  </h2>
                </div>
                {loading ? (
                  <p className="ssd-empty">Loading callbacks…</p>
                ) : items.length === 0 ? (
                  <p className="ssd-empty">No callback requests found.</p>
                ) : listTotal === 0 ? (
                  <p className="ssd-empty">No matches for your search.</p>
                ) : (
                  <>
                    <div className="ssd-group">
                      <h3>
                        <span className="ssd-group-dot ssd-group-dot--open" />
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
                        <span className="ssd-group-dot ssd-group-dot--mine" />
                        Assigned to me
                        <span className="ssd-group-count">{mine.length}</span>
                      </h3>
                      {mine.length === 0 ? (
                        <p className="ssd-group-empty">
                          No callbacks currently assigned to you.
                        </p>
                      ) : (
                        mine.map((item) => renderTicketCard(item, "mine-"))
                      )}
                    </div>

                    <div className="ssd-group">
                      <h3>
                        <span className="ssd-group-dot ssd-group-dot--taken" />
                        Taken by others
                        <span className="ssd-group-count">{taken.length}</span>
                      </h3>
                      {taken.length === 0 ? (
                        <p className="ssd-group-empty">
                          No tickets taken by teammates.
                        </p>
                      ) : (
                        taken.map((item) => renderTicketCard(item, "taken-"))
                      )}
                    </div>
                  </>
                )}
                </div>
              </section>

              <section className="ssd-detail-pane">
                <div
                  className="ssd-pane-scroll"
                  onScroll={markPaneScrolling}
                >
                {!selected ? (
                  <div className="ssd-empty-detail">
                    <div className="ssd-empty-icon" aria-hidden="true">
                      <FiPhone />
                    </div>
                    <h3>No ticket selected</h3>
                    <p>
                      Select a callback to view details. Claim only when you
                      want it.
                    </p>
                  </div>
                ) : (
                  <div className="ssd-detail">
                    <div className="ssd-detail-hero">
                      <div className="ssd-detail-hero-main">
                        <div className="ssd-avatar ssd-avatar--lg" aria-hidden="true">
                          {personInitials(
                            selected.firstName,
                            selected.lastName
                          )}
                        </div>
                        <div className="ssd-detail-hero-text">
                          <div className="ssd-detail-hero-topline">
                            <p className="ssd-ticket-id">
                              Callback ticket #{ticketCode(selected.id)}
                            </p>
                            <span
                              className={`ssd-status-inline ssd-pill-${selected.status}`}
                            >
                              {formatLabel(selected.status)}
                            </span>
                          </div>
                          <h2>
                            {selected.firstName} {selected.lastName}
                            <span className="ssd-detail-claim-inline">
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
                      </div>
                      <div className="ssd-detail-hero-actions">
                        <a
                          className="ssd-btn ssd-btn-ghost ssd-btn-sm"
                          href={`mailto:${selected.email}`}
                        >
                          <FiMail /> Email
                        </a>
                        <a
                          className="ssd-btn ssd-btn-call ssd-btn-sm"
                          href={`tel:${selected.mobile}`}
                          title={`Call ${selected.mobile}`}
                        >
                          <FiPhone /> Call now
                        </a>
                        {selectedOwnership.isMine && (
                          <>
                            <button
                              type="button"
                              className="ssd-btn ssd-btn-ghost ssd-btn-sm"
                              disabled={releasing || claiming || reassigning}
                              onClick={releaseTicket}
                            >
                              <FiUnlock /> Release
                            </button>
                            <button
                              type="button"
                              className="ssd-btn ssd-btn-ghost ssd-btn-sm"
                              disabled={releasing || claiming || reassigning}
                              onClick={() => setShowReassign((v) => !v)}
                            >
                              <FiUserPlus /> Reassign
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {selectedOwnership.isOpen && (
                      <div className="ssd-claim-prompt">
                        <div>
                          <strong>Claim this ticket?</strong>
                          <span>
                            Opening does not assign it. Confirm to assign it to
                            you so teammates cannot take it.
                          </span>
                        </div>
                        <button
                          type="button"
                          className="ssd-btn ssd-btn-primary"
                          disabled={claiming}
                          onClick={() => claimTicket()}
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
                        <button
                          type="button"
                          className="ssd-link-btn"
                          onClick={() =>
                            showToast(
                              "info",
                              "Ask the assigned agent to use Reassign on this ticket.",
                              "Request reassignment"
                            )
                          }
                        >
                          Request reassignment
                        </button>
                      </div>
                    )}

                    {selectedOwnership.isMine && showReassign && (
                      <div className="ssd-reassign-box">
                        <div className="ssd-reassign-head">
                          <strong>Reassign ticket</strong>
                          <span>Pick a teammate or type an Infomanav email.</span>
                        </div>
                        <div className="ssd-reassign-fields">
                          <div className="ssd-reassign-field">
                            <SupportFilterSelect
                              label="Teammate"
                              value={
                                teammateOptions.some(
                                  (opt) => opt.id === reassignEmail
                                )
                                  ? reassignEmail
                                  : ""
                              }
                              options={teammateOptions}
                              placeholder="Select teammate…"
                              ariaLabel="Reassign to teammate"
                              className="ssd-reassign-select"
                              onChange={(id) => setReassignEmail(id)}
                            />
                          </div>
                          <div className="ssd-reassign-field">
                            <label
                              className="ssd-reassign-label"
                              htmlFor="ssd-reassign-email"
                            >
                              Or enter email
                            </label>
                            <input
                              id="ssd-reassign-email"
                              type="email"
                              className="ssd-reassign-input"
                              placeholder="name@infomanav.in"
                              value={reassignEmail}
                              onChange={(e) => setReassignEmail(e.target.value)}
                            />
                          </div>
                          <div className="ssd-reassign-field ssd-reassign-field--action">
                            <span className="ssd-reassign-label" aria-hidden="true">
                              &nbsp;
                            </span>
                            <button
                              type="button"
                              className="ssd-btn ssd-btn-primary ssd-reassign-confirm"
                              disabled={reassigning || !reassignEmail.trim()}
                              onClick={reassignTicket}
                            >
                              {reassigning ? "Reassigning…" : "Confirm reassign"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {actionMsg && !selectedOwnership.isLockedToOther && (
                      <div
                        className={`ssd-banner ssd-banner-${actionMsg.type}`}
                      >
                        {actionMsg.text}
                      </div>
                    )}

                    <dl className="ssd-facts">
                      <div className="ssd-fact ssd-fact--contact">
                        <dt>Contact</dt>
                        <dd>
                          <a
                            className="ssd-fact-link"
                            href={`tel:${selected.mobile}`}
                          >
                            {selected.mobile}
                          </a>
                          <a
                            className="ssd-fact-link"
                            href={`mailto:${selected.email}`}
                          >
                            {selected.email}
                          </a>
                        </dd>
                      </div>
                      <div className="ssd-fact">
                        <dt>Preferred time</dt>
                        <dd>
                          {TIME_WINDOWS[selected.preferredTime] ? (
                            <>
                              <span className="ssd-fact-primary">
                                {TIME_WINDOWS[selected.preferredTime].label}
                              </span>
                              <span className="ssd-fact-secondary">
                                {TIME_WINDOWS[selected.preferredTime].range}
                              </span>
                            </>
                          ) : (
                            <span className="ssd-fact-primary">
                              {formatLabel(selected.preferredTime)}
                            </span>
                          )}
                        </dd>
                      </div>
                      <div className="ssd-fact">
                        <dt>Assigned to</dt>
                        <dd>
                          <span className="ssd-fact-primary">
                            {selected.assignedTo?.email ||
                              selected.assignedTo?.name ||
                              "Unassigned"}
                          </span>
                        </dd>
                      </div>
                      <div className="ssd-fact">
                        <dt>Created</dt>
                        <dd>
                          <span className="ssd-fact-primary">
                            {formatWhen(selected.createdAt)}
                          </span>
                          {selected.source && (
                            <span className="ssd-fact-secondary">
                              {formatLabel(selected.source)}
                            </span>
                          )}
                        </dd>
                      </div>
                    </dl>

                    <div className="ssd-panels-row">
                      <div
                        className={`ssd-block ssd-panel-card${
                          editsDisabled ? " is-disabled" : ""
                        }`}
                      >
                        <div className="ssd-block-head">
                          <h3>
                            Update status
                          </h3>
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
                              onClick={() =>
                                updateTicket({ status: action.id })
                              }
                            >
                              {selected.status === action.id && (
                                <FiCheck aria-hidden="true" />
                              )}
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
                          <h3>Preferred time window</h3>
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
                                selected.preferredTime === slot
                                  ? " is-active"
                                  : ""
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
                              {selected.preferredTime === slot && (
                                <FiCheck
                                  className="ssd-slot-check"
                                  aria-hidden="true"
                                />
                              )}
                              <strong>{TIME_WINDOWS[slot].label}</strong>
                              <span>{TIME_WINDOWS[slot].range}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`ssd-block ssd-panel-card ssd-notes-panel${
                        editsDisabled ? " is-disabled" : ""
                      }`}
                    >
                      <div className="ssd-notes-head">
                        <div className="ssd-notes-head-main">
                          <span className="ssd-notes-icon" aria-hidden="true">
                            <FiMessageSquare />
                          </span>
                          <div>
                            <h3>Notes</h3>
                            <p>
                              {editsDisabled
                                ? "View-only until you claim this ticket"
                                : "Pick a suggestion or write your own"}
                            </p>
                          </div>
                        </div>
                        {!editsDisabled ? (
                          <span className="ssd-notes-hint-pill">Draft</span>
                        ) : (
                          <span className="ssd-notes-hint-pill ssd-notes-hint-pill--locked">
                            <FiLock aria-hidden="true" /> Locked
                          </span>
                        )}
                      </div>

                      <div className="ssd-notes-suggestions">
                        <span className="ssd-notes-suggestions-label">
                          Quick suggestions
                        </span>
                        <div className="ssd-quick-notes">
                          {QUICK_NOTES.map((text) => {
                            const isActive = noteDraft.trim() === text;
                            return (
                              <button
                                key={text}
                                type="button"
                                className={`ssd-suggest-chip${
                                  isActive ? " is-active" : ""
                                }`}
                                disabled={editsDisabled || saving}
                                onClick={() => setNoteDraft(text)}
                              >
                                {text}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="ssd-note-compose">
                        <label className="ssd-note-compose-label" htmlFor="ssd-note-draft">
                          Your note
                        </label>
                        <textarea
                          id="ssd-note-draft"
                          rows={3}
                          placeholder={
                            editsDisabled
                              ? "Claim this ticket to add notes…"
                              : "Type a note, or tap a suggestion above…"
                          }
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                          disabled={editsDisabled}
                        />
                        <div className="ssd-note-compose-foot">
                          <span className="ssd-muted">
                            {noteDraft.trim()
                              ? `${noteDraft.trim().length} characters`
                              : "Visible to your team on this ticket"}
                          </span>
                          <div className="ssd-note-compose-actions">
                            {noteDraft.trim() ? (
                              <button
                                type="button"
                                className="ssd-btn ssd-btn-ghost ssd-btn-sm"
                                disabled={editsDisabled || saving}
                                onClick={() => setNoteDraft("")}
                              >
                                Clear
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="ssd-btn ssd-btn-primary ssd-btn-sm"
                              disabled={
                                editsDisabled || saving || !noteDraft.trim()
                              }
                              onClick={() =>
                                updateTicket({ note: noteDraft })
                              }
                            >
                              <FiCheck /> Add note
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="ssd-block ssd-panel-card ssd-activity">
                      <div className="ssd-block-head ssd-activity-head">
                        <div>
                          <h3>Activity history</h3>
                        </div>
                        <span className="ssd-activity-badge">
                          {(selected.notes || []).length} event
                          {(selected.notes || []).length === 1 ? "" : "s"}
                        </span>
                      </div>
                      {(selected.notes || []).length === 0 ? (
                        <div className="ssd-timeline-empty">
                          <p>No activity yet</p>
                          <span>Notes and updates will appear here</span>
                        </div>
                      ) : (
                        <ol className="ssd-timeline">
                          {[...(selected.notes || [])]
                            .reverse()
                            .map((note, idx) => {
                              const agentName =
                                note.addedByName ||
                                note.addedByEmail ||
                                "Agent";
                              const isLatest = idx === 0;
                              return (
                                <li
                                  key={note.id || `${note.createdAt}-${idx}`}
                                  className={`ssd-timeline-item${
                                    isLatest ? " is-latest" : ""
                                  } ssd-timeline-item--${idx % 3}`}
                                >
                                  <div
                                    className="ssd-timeline-rail"
                                    aria-hidden="true"
                                  >
                                    <span className="ssd-timeline-node">
                                      {isLatest ? (
                                        <span className="ssd-timeline-node-core" />
                                      ) : null}
                                    </span>
                                  </div>
                                  <article className="ssd-timeline-card">
                                    <header className="ssd-timeline-card-top">
                                      <div className="ssd-timeline-agent">
                                        <span
                                          className="ssd-timeline-avatar"
                                          aria-hidden="true"
                                        >
                                          {String(agentName)
                                            .charAt(0)
                                            .toUpperCase()}
                                        </span>
                                        <div className="ssd-timeline-agent-text">
                                          <strong>{agentName}</strong>
                                          <span className="ssd-timeline-kind">
                                            {isLatest
                                              ? "Latest update"
                                              : "Note added"}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="ssd-timeline-meta">
                                        {isLatest ? (
                                          <span className="ssd-timeline-latest-pill">
                                            Latest
                                          </span>
                                        ) : null}
                                        <time
                                          className="ssd-timeline-time"
                                          dateTime={
                                            note.createdAt || undefined
                                          }
                                        >
                                          {formatWhen(note.createdAt)}
                                        </time>
                                      </div>
                                    </header>
                                    <p className="ssd-timeline-text">
                                      {note.text}
                                    </p>
                                  </article>
                                </li>
                              );
                            })}
                        </ol>
                      )}
                    </div>
                  </div>
                )}
                </div>
              </section>
            </div>
          </ScrollReveal>
        )}
      </div>
    </div>
  );
}
