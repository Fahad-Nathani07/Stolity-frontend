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
} from "react-icons/fi";
import { showToast } from "../components/ToastProvider";

const STATUS_OPTIONS = [
  { id: "all", label: "All statuses" },
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

export default function SupportQuestionsPane({
  apiUrl,
  authHeaders,
  email,
  myId,
  token,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [replyDraft, setReplyDraft] = useState("");
  const [actionMsg, setActionMsg] = useState(null);

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

  const syncSelectedFromList = useCallback((list, { preserveDraft = true } = {}) => {
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
    if (preserveDraft && (noteDraftRef.current.trim() || replyDraftRef.current.trim())) {
      setSelected(still);
    } else {
      setSelected(still);
    }
  }, []);

  const fetchList = useCallback(
    async ({ soft = false } = {}) => {
      if (!token) return;
      if (
        soft &&
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
        if (statusFilter !== "all") params.status = statusFilter;
        const res = await axios.get(`${apiUrl}support/questions`, {
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
    const timer = setInterval(() => {
      if (document.hidden) return;
      fetchList({ soft: true });
    }, SOFT_REFRESH_MS);
    return () => clearInterval(timer);
  }, [fetchList]);

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
        (item) => item.assignedTo && !isAssignedToAgent(item, email, myId)
      ),
    [items, email, myId]
  );

  const selectedOwnership = useMemo(() => {
    const state = ownershipState(selected, email, myId);
    return {
      isMine: state === "mine",
      isLockedToOther: state === "taken",
      isOpen: state === "open",
    };
  }, [selected, email, myId]);

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

  const claimTicket = async () => {
    if (!selected?.id || claiming) return;
    setClaiming(true);
    setActionMsg(null);
    try {
      const res = await axios.post(
        `${apiUrl}support/questions/${selected.id}/claim`,
        {},
        { headers: authHeaders }
      );
      setSelected(res.data?.result || selected);
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
        const result = err.response?.data?.result || selected;
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
      setSelected(res.data?.result || selected);
      setNoteDraft("");
      setActionMsg({ type: "success", text: "Updated successfully." });
      await fetchList({ soft: true });
    } catch (err) {
      if (err.response?.status === 409) {
        const result = err.response?.data?.result || selected;
        setSelected(result);
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
    const ownerLabel =
      state === "open"
        ? "Available"
        : state === "mine"
          ? "Assigned to you"
          : item.assignedTo?.email || item.assignedTo?.name || "Taken";
    const preview =
      item.question?.length > 90
        ? `${item.question.slice(0, 90)}…`
        : item.question;

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
          <strong>{item.name || item.email || "User"}</strong>
          <span className={`ssd-pill ssd-pill-${item.status}`}>
            {formatLabel(item.status)}
          </span>
        </div>
        <p className="ssd-q-preview">{preview || "—"}</p>
        <div className={`ssd-card-owner ssd-card-owner--${state}`}>
          {state === "taken" ? (
            <FiLock />
          ) : state === "mine" ? (
            <FiUser />
          ) : (
            <FiUnlock />
          )}
          <span>{ownerLabel}</span>
        </div>
        <div className="ssd-card-foot">{formatWhen(item.createdAt)}</div>
      </button>
    );
  };

  const canEdit =
    selectedOwnership.isMine && !claiming && !releasing && !sendingReply;
  const editsDisabled = !canEdit;
  const replySubject = selected ? buildReplySubject(selected.question) : "";

  return (
    <div className="ssd-callbacks">
      <div className="ssd-toolbar">
        <div className="ssd-filters">
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
            className="ssd-btn ssd-btn-ghost"
            onClick={() => fetchList({ soft: false })}
            disabled={loading}
          >
            <FiRefreshCw />
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="ssd-banner ssd-banner-error">{error}</div>}

      <div className="ssd-layout">
        <section className="ssd-list-pane">
          {loading ? (
            <p className="ssd-empty">Loading questions…</p>
          ) : items.length === 0 ? (
            <p className="ssd-empty">No questions found.</p>
          ) : (
            <>
              <div className="ssd-group">
                <h3>
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
                  Assigned to me
                  <span className="ssd-group-count">{mine.length}</span>
                </h3>
                {mine.length === 0 ? (
                  <p className="ssd-group-empty">Nothing assigned to you.</p>
                ) : (
                  mine.map((item) => renderCard(item, "mine-"))
                )}
              </div>
              <div className="ssd-group">
                <h3>
                  Taken by others
                  <span className="ssd-group-count">{taken.length}</span>
                </h3>
                {taken.length === 0 ? (
                  <p className="ssd-group-empty">No questions taken by teammates.</p>
                ) : (
                  taken.map((item) => renderCard(item, "taken-"))
                )}
              </div>
            </>
          )}
        </section>

        <section className="ssd-detail-pane">
          {!selected ? (
            <div className="ssd-empty-detail">
              <div className="ssd-empty-icon" aria-hidden="true">
                <FiMessageSquare />
              </div>
              <h3>No question selected</h3>
              <p>Select a question to view details. Claim only when you want it.</p>
            </div>
          ) : (
            <div className="ssd-detail">
              <div className="ssd-detail-hero">
                <div className="ssd-detail-hero-main">
                  <div className="ssd-avatar" aria-hidden="true">
                    {(selected.name || selected.email || "?")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div className="ssd-detail-hero-text">
                    <p className="ssd-detail-eyebrow">FAQ question</p>
                    <h2>{selected.name || selected.email || "User"}</h2>
                    <p className="ssd-detail-claim">
                      {selectedOwnership.isOpen
                        ? "Unassigned — claim it to start working."
                        : selectedOwnership.isMine
                          ? "This question is assigned to you."
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
                </div>
              </div>

              <div className="ssd-q-body">
                <h3>Question</h3>
                <p>{selected.question}</p>
              </div>

              {selectedOwnership.isOpen && (
                <div className="ssd-claim-prompt">
                  <div>
                    <strong>Claim this question?</strong>
                    <span>
                      Opening does not assign it. Confirm to assign it to you.
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
                    <strong>Question already assigned</strong>
                    <span>
                      This question is under{" "}
                      <em>
                        {selected.assignedTo?.email ||
                          selected.assignedTo?.name ||
                          "another agent"}
                      </em>
                      .
                    </span>
                  </div>
                </div>
              )}

              {selectedOwnership.isMine && (
                <div className="ssd-owner-actions">
                  <button
                    type="button"
                    className="ssd-btn ssd-btn-ghost"
                    disabled={releasing || claiming}
                    onClick={releaseTicket}
                  >
                    <FiUnlock /> Release
                  </button>
                </div>
              )}

              {actionMsg && !selectedOwnership.isLockedToOther && (
                <div className={`ssd-banner ssd-banner-${actionMsg.type}`}>
                  {actionMsg.text}
                </div>
              )}

              <div className="ssd-info-grid">
                <div className="ssd-info-card">
                  <span className="ssd-info-icon" aria-hidden="true">
                    <FiMail />
                  </span>
                  <div>
                    <span>Email</span>
                    <a href={`mailto:${selected.email}`}>{selected.email}</a>
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
                    {editsDisabled
                      ? "Claim the question to update status"
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
                  <h3>
                    <FiMail /> Email reply
                  </h3>
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
                    rows={5}
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
                  Email footer will tell the customer to request a callback from
                  Help &amp; Support for further issues (noreply sender).
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

                <div className="ssd-replies-list">
                  <h4>Sent replies</h4>
                  {(selected.replies || []).length === 0 ? (
                    <p className="ssd-muted">No email replies yet.</p>
                  ) : (
                    [...(selected.replies || [])]
                      .reverse()
                      .map((reply) => (
                        <div
                          key={reply.id || reply.sentAt}
                          className="ssd-reply-item"
                        >
                          <div className="ssd-note-top">
                            <strong>
                              {reply.sentByName ||
                                reply.sentByEmail ||
                                "Agent"}
                            </strong>
                            <span>{formatWhen(reply.sentAt)}</span>
                          </div>
                          <p className="ssd-reply-item-subject">
                            {reply.subject}
                          </p>
                          <p>{reply.message}</p>
                        </div>
                      ))
                  )}
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
                      ? "Notes are view-only until you claim"
                      : "Internal notes for the team"}
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
                        ? "Claim this question to add notes…"
                        : "Add a custom note…"
                    }
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    disabled={editsDisabled}
                  />
                  <button
                    type="button"
                    className="ssd-btn ssd-btn-primary"
                    disabled={editsDisabled || saving || !noteDraft.trim()}
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
                          <div className="ssd-note-avatar" aria-hidden="true">
                            {(note.addedByName || note.addedByEmail || "A")
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
  );
}
