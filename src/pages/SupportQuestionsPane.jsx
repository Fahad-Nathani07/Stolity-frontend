import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  FiRefreshCw,
  FiClock,
  FiUser,
  FiMail,
  FiMessageSquare,
  FiCheck,
  FiLock,
  FiUnlock,
  FiSend,
  FiSearch,
} from "react-icons/fi";
import { showToast } from "../components/ToastProvider";
import {
  SupportMultiFilterSelect,
  markPaneScrolling,
} from "../components/SupportFilterSelect";

const STATUS_OPTIONS = [
  { id: "pending", label: "Pending" },
  { id: "assigned", label: "Assigned" },
  { id: "answered", label: "Answered" },
  { id: "closed", label: "Closed" },
];

const STATUS_ACTIONS = [
  { id: "assigned", label: "In progress" },
  { id: "answered", label: "Answered" },
  { id: "closed", label: "Closed" },
];

const QUICK_NOTES = [
  "Replied by email",
  "Need more details from user",
  "FAQ covers this — pointed them there",
  "Escalated internally",
  "Resolved",
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

function ticketCode(id, prefix = "Q") {
  if (!id) return "————";
  return `${prefix}-${String(id).replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase() || "XXXX"}`;
}

function personInitials(name, email, fallback = "?") {
  const fromName = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
  if (fromName) return fromName;
  const fromEmail = String(email || "").trim().charAt(0).toUpperCase();
  return fromEmail || fallback;
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

function buildReplySubject(questionText) {
  const snippet = String(questionText || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 48);
  if (!snippet) return "Re: Your Stolity support question";
  return `Re: Your Stolity question — ${snippet}${
    String(questionText || "").trim().length > 48 ? "…" : ""
  }`;
}

function buildActivityEvents(item) {
  const notes = (item?.notes || []).map((note, idx) => ({
    id: note.id || `note-${note.createdAt || idx}`,
    kind: "note",
    at: note.createdAt || "",
    agentName: note.addedByName || note.addedByEmail || "Agent",
    text: note.text || "",
    subject: null,
  }));
  const replies = (item?.replies || []).map((reply, idx) => ({
    id: reply.id || `reply-${reply.sentAt || idx}`,
    kind: "reply",
    at: reply.sentAt || "",
    agentName: reply.sentByName || reply.sentByEmail || "Agent",
    text: reply.message || "",
    subject: reply.subject || null,
  }));
  return [...notes, ...replies].sort((a, b) => {
    const ta = a.at ? new Date(a.at).getTime() : 0;
    const tb = b.at ? new Date(b.at).getTime() : 0;
    return tb - ta;
  });
}

export default function SupportQuestionsPane({
  apiUrl,
  authHeaders,
  email,
  myId,
  token,
  onItemCountChange,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [replyDraft, setReplyDraft] = useState("");
  const [actionMsg, setActionMsg] = useState(null);
  const [refreshIn, setRefreshIn] = useState(SOFT_REFRESH_MS / 1000);

  const noteDraftRef = useRef("");
  const replyDraftRef = useRef("");
  const savingRef = useRef(false);
  const claimingRef = useRef(false);
  const selectedIdRef = useRef(null);

  useEffect(() => {
    noteDraftRef.current = noteDraft;
  }, [noteDraft]);
  useEffect(() => {
    replyDraftRef.current = replyDraft;
  }, [replyDraft]);
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
    onItemCountChange?.(items.length);
  }, [items.length, onItemCountChange]);

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
          text: "This question is no longer in the list.",
        });
        return;
      }
      if (
        preserveDraft &&
        (noteDraftRef.current.trim() || replyDraftRef.current.trim())
      ) {
        setSelected(still);
      } else {
        setSelected(still);
      }
    },
    []
  );

  const fetchList = useCallback(
    async ({ soft = false, force = false } = {}) => {
      if (!token) return;
      if (
        soft &&
        !force &&
        (noteDraftRef.current.trim() ||
          replyDraftRef.current.trim() ||
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
        if (Array.isArray(statusFilter) && statusFilter.length === 1) {
          params.status = statusFilter[0];
        }
        const res = await axios.get(`${apiUrl}support/questions`, {
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
              "Failed to load questions."
          );
        }
      } finally {
        if (!soft) setLoading(false);
      }
    },
    [apiUrl, authHeaders, statusFilter, token, syncSelectedFromList]
  );

  useEffect(() => {
    fetchList({ soft: false });
  }, [fetchList]);

  useEffect(() => {
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
  }, [fetchList]);

  const matchesSearch = useCallback(
    (item) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      const hay = [
        item.name,
        item.email,
        item.question,
        ticketCode(item.id),
        item.status,
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

  const selectedOwnership = useMemo(() => {
    const state = ownershipState(selected, email, myId);
    return {
      isMine: state === "mine",
      isLockedToOther: state === "taken",
      isOpen: state === "open",
    };
  }, [selected, email, myId]);

  const activityEvents = useMemo(
    () => (selected ? buildActivityEvents(selected) : []),
    [selected]
  );

  const openTicket = (item) => {
    setSelectedId(item.id);
    setSelected(item);
    setNoteDraft("");
    setReplyDraft("");
    setActionMsg(null);
    const state = ownershipState(item, email, myId);
    if (state === "taken") {
      setActionMsg({
        type: "error",
        text: `This question is under ${
          item.assignedTo?.email || item.assignedTo?.name || "another agent"
        }. View only.`,
      });
    } else if (state === "mine") {
      setActionMsg({
        type: "success",
        text: "This question is assigned to you.",
      });
    }
  };

  const claimTicket = async (fromItem) => {
    const ticket = fromItem?.id ? fromItem : selected;
    if (!ticket?.id || claiming) return;
    if (fromItem?.id) {
      setSelectedId(fromItem.id);
      setSelected(fromItem);
      setNoteDraft("");
      setReplyDraft("");
    }
    setClaiming(true);
    setActionMsg(null);
    try {
      const res = await axios.post(
        `${apiUrl}support/questions/${ticket.id}/claim`,
        {},
        { headers: authHeaders }
      );
      setSelected(res.data?.result || ticket);
      setSelectedId((res.data?.result || ticket).id);
      if (res.data?.claimed) {
        showToast(
          "success",
          "You can add notes and mark it answered.",
          "Question assigned to you"
        );
        setActionMsg({
          type: "success",
          text: "You are assigned to this question.",
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
          `This question is under ${ownerEmail}.`,
          "Already assigned"
        );
        setActionMsg({
          type: "error",
          text: `This question is under ${ownerEmail}.`,
        });
        await fetchList({ soft: true });
      } else {
        const msg =
          err.response?.data?.message || "Could not claim this question.";
        setActionMsg({ type: "error", text: msg });
        showToast("error", msg, "Claim failed");
      }
    } finally {
      setClaiming(false);
    }
  };

  const releaseTicket = async () => {
    if (!selected?.id || releasing || !selectedOwnership.isMine) return;
    if (!window.confirm("Release this question for other agents?")) return;
    setReleasing(true);
    try {
      const res = await axios.post(
        `${apiUrl}support/questions/${selected.id}/release`,
        {},
        { headers: authHeaders }
      );
      setSelected(res.data?.result || selected);
      setNoteDraft("");
      showToast("success", "Question is available again.", "Released");
      setActionMsg({
        type: "success",
        text: "Question released.",
      });
      await fetchList({ soft: true });
    } catch (err) {
      const msg =
        err.response?.data?.message || "Could not release this question.";
      setActionMsg({ type: "error", text: msg });
      showToast("error", msg, "Release failed");
    } finally {
      setReleasing(false);
    }
  };

  const updateTicket = async (payload) => {
    if (!selected?.id || saving || !selectedOwnership.isMine) return;
    setSaving(true);
    setActionMsg(null);
    try {
      const res = await axios.patch(
        `${apiUrl}support/questions/${selected.id}`,
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
        setSelected(result);
        setItems((prev) =>
          prev.map((item) =>
            item.id === result.id ? { ...item, ...result } : item
          )
        );
        setActionMsg({
          type: "error",
          text:
            err.response?.data?.message ||
            "Only the assigned agent can update this.",
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

  const sendReply = async () => {
    if (!selected?.id || sendingReply || !selectedOwnership.isMine) return;
    const message = replyDraft.trim();
    if (message.length < 10) {
      showToast(
        "warning",
        "Write at least 10 characters for the reply.",
        "Reply too short"
      );
      return;
    }

    setSendingReply(true);
    setActionMsg(null);
    try {
      const res = await axios.post(
        `${apiUrl}support/questions/${selected.id}/reply`,
        { message },
        { headers: authHeaders }
      );
      setSelected(res.data?.result || selected);
      setReplyDraft("");
      showToast(
        "success",
        `Email sent to ${selected.email}.`,
        "Reply sent"
      );
      setActionMsg({
        type: "success",
        text: "Reply email sent. Question marked as answered.",
      });
      await fetchList({ soft: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to send reply email.";
      setActionMsg({ type: "error", text: msg });
      showToast("error", msg, "Send failed");
    } finally {
      setSendingReply(false);
    }
  };

  const renderCard = (item, keyPrefix = "") => {
    const state = ownershipState(item, email, myId);
    const isSelected = selectedId === item.id;
    const displayName = item.name || item.email || "User";
    const preview =
      item.question?.length > 72
        ? `${item.question.slice(0, 72)}…`
        : item.question || "—";

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
            {personInitials(item.name, item.email)}
          </div>
          <div className="ssd-card-identity">
            <div className="ssd-card-name-line">
              <strong>{displayName}</strong>
              <span
                className={`ssd-card-status-dot ssd-card-status-dot--${
                  item.status || "pending"
                }`}
                aria-hidden="true"
              />
            </div>
            <div className="ssd-card-phone">
              <FiMail aria-hidden="true" />
              <span>{item.email || "—"}</span>
            </div>
          </div>
          <span className={`ssd-pill ssd-pill-${item.status}`}>
            {formatLabel(item.status)}
          </span>
        </div>

        <div className="ssd-card-row ssd-card-row--meta">
          <div className="ssd-card-email">
            <FiUser aria-hidden="true" />
            <span title={ticketCode(item.id)}>#{ticketCode(item.id)}</span>
          </div>
          <span className="ssd-card-when">{formatWhen(item.createdAt)}</span>
        </div>

        <div className="ssd-card-row ssd-card-row--foot">
          <div className="ssd-card-slot">
            <FiMessageSquare aria-hidden="true" />
            <span title={item.question || ""}>{preview}</span>
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
    selectedOwnership.isMine && !claiming && !releasing && !sendingReply;
  const editsDisabled = !canEdit;
  const replySubject = selected ? buildReplySubject(selected.question) : "";
  const listTotal = available.length + mine.length + taken.length;
  const selectedReplies = selected?.replies || [];
  const latestReply =
    selectedReplies.length === 0
      ? null
      : [...selectedReplies].sort((a, b) => {
          const ta = a.sentAt ? new Date(a.sentAt).getTime() : 0;
          const tb = b.sentAt ? new Date(b.sentAt).getTime() : 0;
          return tb - ta;
        })[0];

  return (
    <div className="ssd-callbacks">
      <div className="ssd-toolbar">
        <div className="ssd-filters">
          <SupportMultiFilterSelect
            label="Status"
            values={statusFilter}
            options={STATUS_OPTIONS}
            onChange={setStatusFilter}
            allLabel="All statuses"
            ariaLabel="Filter by status"
          />
          <div className="ssd-search-field">
            <span className="ssd-search-wrap">
              <FiSearch aria-hidden="true" />
              <input
                type="search"
                placeholder="Search name, email, or ID…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </span>
          </div>
        </div>
        <div className="ssd-toolbar-right">
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
        </div>
      </div>

      {error && <div className="ssd-banner ssd-banner-error">{error}</div>}

      <div className="ssd-layout">
        <section className="ssd-list-pane">
          <div className="ssd-pane-scroll" onScroll={markPaneScrolling}>
            <div className="ssd-list-head">
              <h2>
                {listTotal} question{listTotal === 1 ? "" : "s"}
              </h2>
            </div>
            {loading ? (
              <p className="ssd-empty">Loading questions…</p>
            ) : items.length === 0 ? (
              <p className="ssd-empty">No questions found.</p>
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
                    <p className="ssd-group-empty">No open questions.</p>
                  ) : (
                    available.map((item) => renderCard(item, "open-"))
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
                      No questions currently assigned to you.
                    </p>
                  ) : (
                    mine.map((item) => renderCard(item, "mine-"))
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
                      No questions taken by teammates.
                    </p>
                  ) : (
                    taken.map((item) => renderCard(item, "taken-"))
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        <section className="ssd-detail-pane">
          <div className="ssd-pane-scroll" onScroll={markPaneScrolling}>
            {!selected ? (
              <div className="ssd-empty-detail">
                <div className="ssd-empty-icon" aria-hidden="true">
                  <FiMessageSquare />
                </div>
                <h3>No question selected</h3>
                <p>
                  Select a question to view details. Claim only when you want
                  it.
                </p>
              </div>
            ) : (
              <div className="ssd-detail">
                <div className="ssd-detail-hero">
                  <div className="ssd-detail-hero-main">
                    <div
                      className="ssd-avatar ssd-avatar--lg"
                      aria-hidden="true"
                    >
                      {personInitials(selected.name, selected.email)}
                    </div>
                    <div className="ssd-detail-hero-text">
                      <div className="ssd-detail-hero-topline">
                        <p className="ssd-ticket-id">
                          Support question #{ticketCode(selected.id)}
                        </p>
                        <span
                          className={`ssd-status-inline ssd-pill-${selected.status}`}
                        >
                          {formatLabel(selected.status)}
                        </span>
                      </div>
                      <h2>
                        {selected.name || selected.email || "User"}
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
                    {selectedOwnership.isMine && (
                      <button
                        type="button"
                        className="ssd-btn ssd-btn-ghost ssd-btn-sm"
                        disabled={releasing || claiming}
                        onClick={releaseTicket}
                      >
                        <FiUnlock /> Release
                      </button>
                    )}
                  </div>
                </div>

                <div className="ssd-q-body">
                  <div className="ssd-qa-item ssd-qa-item--question">
                    <span className="ssd-qa-badge" aria-hidden="true">
                      Q
                    </span>
                    <div className="ssd-qa-content">
                      <h3>Question</h3>
                      <p>{selected.question}</p>
                    </div>
                  </div>
                  <div className="ssd-qa-item ssd-qa-item--answer">
                    <span className="ssd-qa-badge" aria-hidden="true">
                      A
                    </span>
                    <div className="ssd-qa-content">
                      <h3>Answer</h3>
                      {latestReply?.message ? (
                        <>
                          <p>{latestReply.message}</p>
                          {selectedReplies.length > 1 ? (
                            <span className="ssd-qa-meta">
                              Latest of {selectedReplies.length} email replies
                            </span>
                          ) : null}
                        </>
                      ) : (
                        <p className="ssd-qa-empty">No answer sent yet</p>
                      )}
                    </div>
                  </div>
                </div>

                {selectedOwnership.isOpen && (
                  <div className="ssd-claim-prompt">
                    <div>
                      <strong>Claim this question?</strong>
                      <span>
                        Opening does not assign it. Confirm to assign it to you
                        so teammates cannot take it.
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
                      <strong>Question already assigned</strong>
                      <span>
                        This question is under{" "}
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
                          "Ask the assigned agent to release this question.",
                          "Request release"
                        )
                      }
                    >
                      Request release
                    </button>
                  </div>
                )}

                {actionMsg && !selectedOwnership.isLockedToOther && (
                  <div className={`ssd-banner ssd-banner-${actionMsg.type}`}>
                    {actionMsg.text}
                  </div>
                )}

                <dl className="ssd-facts">
                  <div className="ssd-fact ssd-fact--contact">
                    <dt>Contact</dt>
                    <dd>
                      <a
                        className="ssd-fact-link"
                        href={`mailto:${selected.email}`}
                      >
                        {selected.email}
                      </a>
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
                    </dd>
                  </div>
                  <div className="ssd-fact">
                    <dt>Replies</dt>
                    <dd>
                      <span className="ssd-fact-primary">
                        {(selected.replies || []).length}
                      </span>
                      <span className="ssd-fact-secondary">Email replies</span>
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
                      <h3>Update status</h3>
                      <p>
                        {selectedOwnership.isOpen
                          ? "Claim the question to update status"
                          : selectedOwnership.isLockedToOther
                            ? "Read-only — assigned to another agent"
                            : "Mark how you handled it"}
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
                          {selected.status === action.id ? (
                            <FiCheck aria-hidden="true" />
                          ) : null}
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
                      <h3>Email reply</h3>
                      <p>
                        {editsDisabled
                          ? "Claim the question to send an email reply"
                          : "Sends from Stolity noreply — stays on this page"}
                      </p>
                    </div>
                    <label className="ssd-reply-label">
                      Subject (auto)
                      <input
                        type="text"
                        className="ssd-reply-subject"
                        value={replySubject}
                        readOnly
                        disabled={editsDisabled}
                      />
                    </label>
                    <label className="ssd-reply-label">
                      Message
                      <textarea
                        rows={4}
                        className="ssd-reply-message"
                        placeholder={
                          editsDisabled
                            ? "Claim this question to reply…"
                            : "Write your reply to the customer…"
                        }
                        value={replyDraft}
                        onChange={(e) => setReplyDraft(e.target.value)}
                        disabled={editsDisabled || sendingReply}
                      />
                    </label>
                    <p className="ssd-reply-hint">
                      Email footer will tell the customer to request a callback
                      from Help &amp; Support for further issues (noreply
                      sender).
                    </p>
                    <button
                      type="button"
                      className="ssd-btn ssd-btn-primary"
                      disabled={
                        editsDisabled ||
                        sendingReply ||
                        replyDraft.trim().length < 10
                      }
                      onClick={sendReply}
                    >
                      <FiSend />{" "}
                      {sendingReply ? "Sending…" : "Send reply email"}
                    </button>
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
                            ? "View-only until you claim this question"
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
                    <label
                      className="ssd-note-compose-label"
                      htmlFor="ssd-q-note-draft"
                    >
                      Your note
                    </label>
                    <textarea
                      id="ssd-q-note-draft"
                      rows={3}
                      placeholder={
                        editsDisabled
                          ? "Claim this question to add notes…"
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
                          : "Visible to your team on this question"}
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
                          onClick={() => updateTicket({ note: noteDraft })}
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
                      {activityEvents.length} event
                      {activityEvents.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  {activityEvents.length === 0 ? (
                    <div className="ssd-timeline-empty">
                      <p>No activity yet</p>
                      <span>Notes and email replies will appear here</span>
                    </div>
                  ) : (
                    <ol className="ssd-timeline">
                      {activityEvents.map((event, idx) => {
                        const isLatest = idx === 0;
                        return (
                          <li
                            key={event.id}
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
                                    {String(event.agentName)
                                      .charAt(0)
                                      .toUpperCase()}
                                  </span>
                                  <div className="ssd-timeline-agent-text">
                                    <strong>{event.agentName}</strong>
                                    <span className="ssd-timeline-kind">
                                      {event.kind === "reply"
                                        ? isLatest
                                          ? "Latest email reply"
                                          : "Email reply sent"
                                        : isLatest
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
                                    dateTime={event.at || undefined}
                                  >
                                    {formatWhen(event.at)}
                                  </time>
                                </div>
                              </header>
                              {event.subject ? (
                                <p className="ssd-timeline-subject">
                                  {event.subject}
                                </p>
                              ) : null}
                              <p className="ssd-timeline-text">{event.text}</p>
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
    </div>
  );
}
