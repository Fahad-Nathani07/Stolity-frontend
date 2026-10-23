import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  FiRefreshCw,
  FiMail,
  FiMessageSquare,
  FiCheck,
  FiLock,
  FiUnlock,
  FiSend,
  FiSearch,
  FiX,
  FiTrash2,
} from "react-icons/fi";
import { showToast } from "../components/ToastProvider";
import {
  formatTicketCategory,
  formatTicketDeviceType,
  formatTicketStatus,
} from "../utils/supportTicketConstants";
import "../css/SupportTicketsAdmin.css";

const FAQ_STATUS_ACTIONS = [
  { id: "assigned", label: "In progress" },
  { id: "answered", label: "Answered" },
  { id: "closed", label: "Closed" },
];

const TICKET_STATUS_ACTIONS = [
  { id: "open", label: "Open" },
  { id: "in_progress", label: "In Progress" },
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
  const mapped = formatTicketStatus(value);
  if (mapped && mapped !== value) return mapped;
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

function isTicketItem(item) {
  return String(item?.source || "").toLowerCase() === "ticket";
}

function statusTone(status) {
  const s = String(status || "").toLowerCase();
  if (s === "open" || s === "pending") return "open";
  if (s === "in_progress" || s === "assigned") return "progress";
  if (s === "closed" || s === "answered") return "done";
  return "neutral";
}

/** Admin buckets: unassigned / in_progress / completed */
function adminTicketBucket(item) {
  const s = String(item?.status || "").toLowerCase();
  if (s === "closed" || s === "answered") return "completed";
  if (!item?.assignedTo) return "unassigned";
  return "in_progress";
}

function adminBucketRank(bucket) {
  if (bucket === "unassigned") return 0;
  if (bucket === "in_progress") return 1;
  if (bucket === "completed") return 2;
  return 3;
}

function ticketUpdatedMs(item) {
  const iso = item?.updatedAt || item?.createdAt || "";
  const ms = iso ? Date.parse(iso) : 0;
  return Number.isFinite(ms) ? ms : 0;
}

const LIST_FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "unassigned", label: "Unassigned" },
  { id: "in_progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
];

export default function SupportQuestionsPane({
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
  const [listFilter, setListFilter] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const canHardDelete =
    String(email || "").trim().toLowerCase() === "fahad@infomanav.in";
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

  const unassignedCount = useMemo(
    () => items.filter((item) => adminTicketBucket(item) === "unassigned").length,
    [items]
  );

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
        text: "This ticket is no longer in the list.",
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
        const res = await axios.get(`${apiUrl}support/questions`, {
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
              "Failed to load tickets."
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
      const isTicket = isTicketItem(item);
      const hay = [
        item.name,
        item.email,
        item.question,
        item.category,
        item.deviceType,
        item.status,
        ticketCode(item.id, isTicket ? "T" : "Q"),
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
      active: 0,
      unassigned: 0,
      in_progress: 0,
      completed: 0,
    };
    for (const item of items) {
      const bucket = adminTicketBucket(item);
      counts[bucket] += 1;
      if (bucket !== "completed") counts.active += 1;
    }
    return counts;
  }, [items]);

  const filteredRows = useMemo(() => {
    let list = items.filter(matchesSearch);
    if (listFilter === "active") {
      list = list.filter((item) => adminTicketBucket(item) !== "completed");
    } else if (listFilter !== "all") {
      list = list.filter((item) => adminTicketBucket(item) === listFilter);
    }
    list = [...list].sort((a, b) => {
      const unreadDiff =
        (b.hasUnreadForAgent ? 1 : 0) - (a.hasUnreadForAgent ? 1 : 0);
      if (unreadDiff !== 0) return unreadDiff;
      const rankDiff =
        adminBucketRank(adminTicketBucket(a)) -
        adminBucketRank(adminTicketBucket(b));
      if (rankDiff !== 0) return rankDiff;
      return ticketUpdatedMs(b) - ticketUpdatedMs(a);
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

  const isTicketSelected = isTicketItem(selected);
  const statusActions = isTicketSelected
    ? TICKET_STATUS_ACTIONS
    : FAQ_STATUS_ACTIONS;

  const ticketMessages = useMemo(() => {
    const list = Array.isArray(selected?.messages)
      ? [...selected.messages]
      : [];
    list.sort((a, b) =>
      String(a.createdAt || "").localeCompare(String(b.createdAt || ""))
    );
    return list;
  }, [selected]);

  const canEdit =
    selectedOwnership.isMine && !claiming && !releasing && !sendingReply;
  const editsDisabled = !canEdit;
  const replySubject = selected ? buildReplySubject(selected.question) : "";

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedId(null);
    setSelected(null);
    setNoteDraft("");
    setReplyDraft("");
    setActionMsg(null);
  };

  const patchListItem = (result) => {
    if (!result?.id) return;
    setItems((prev) =>
      prev.map((item) =>
        item.id === result.id ? { ...item, ...result } : item
      )
    );
  };

  const markTicketReadForAgent = async (ticket) => {
    if (!ticket?.id || !isTicketItem(ticket) || !ticket.hasUnreadForAgent) {
      return;
    }
    try {
      const res = await axios.post(
        `${apiUrl}support/questions/${ticket.id}/read`,
        {},
        { headers: authHeaders }
      );
      const result = res.data?.result;
      if (result?.id) {
        setSelected((prev) =>
          prev?.id === result.id
            ? { ...prev, ...result, hasUnreadForAgent: false }
            : prev
        );
        patchListItem({ ...result, hasUnreadForAgent: false });
      } else {
        patchListItem({ ...ticket, hasUnreadForAgent: false });
      }
    } catch {
      /* non-blocking */
    }
  };

  const openTicket = (item) => {
    setSelectedId(item.id);
    setSelected(item);
    setDrawerOpen(true);
    setNoteDraft("");
    setReplyDraft("");
    setActionMsg(null);
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
    if (isTicketItem(item) && item.hasUnreadForAgent) {
      void markTicketReadForAgent(item);
    }
  };

  const claimTicket = async () => {
    const ticket = selected;
    if (!ticket?.id || claiming) return;
    setClaiming(true);
    setActionMsg(null);
    try {
      const res = await axios.post(
        `${apiUrl}support/questions/${ticket.id}/claim`,
        {},
        { headers: authHeaders }
      );
      const result = res.data?.result || ticket;
      setSelected(result);
      patchListItem(result);
      if (res.data?.claimed) {
        showToast("success", "Ticket assigned to you.", "Claimed");
        setActionMsg({ type: "success", text: "You are assigned." });
      }
      if (result?.hasUnreadForAgent) {
        await markTicketReadForAgent(result);
      }
      // force: soft refresh otherwise skips while claimingRef is still true
      await fetchList({ soft: true, force: true });
    } catch (err) {
      if (err.response?.status === 409) {
        const result = err.response?.data?.result || ticket;
        setSelected(result);
        patchListItem(result);
        const ownerEmail =
          result?.assignedTo?.email ||
          result?.assignedTo?.name ||
          "another agent";
        showToast("warning", `Already under ${ownerEmail}.`, "Taken");
        setActionMsg({ type: "error", text: `Under ${ownerEmail}.` });
        await fetchList({ soft: true, force: true });
      } else {
        const msg =
          err.response?.data?.message || "Could not claim this ticket.";
        setActionMsg({ type: "error", text: msg });
        showToast("error", msg, "Claim failed");
      }
    } finally {
      setClaiming(false);
    }
  };

  const deleteTicketPermanently = async () => {
    if (!selected?.id || deleting || !canHardDelete) return;
    const kind = isTicketItem(selected) ? "ticket" : "question";
    const code = ticketCode(selected.id, isTicketItem(selected) ? "T" : "Q");
    if (
      !window.confirm(
        `Permanently delete ${kind} ${code}?\n\nThis removes the document and all messages from Firebase. This cannot be undone.`
      )
    ) {
      return;
    }
    setDeleting(true);
    setActionMsg(null);
    try {
      await axios.delete(`${apiUrl}support/questions/${selected.id}`, {
        headers: authHeaders,
      });
      setItems((prev) => prev.filter((item) => item.id !== selected.id));
      showToast("success", `${kind === "ticket" ? "Ticket" : "Question"} deleted.`, "Deleted");
      closeDrawer();
      await fetchList({ soft: true, force: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Could not delete this ticket.";
      setActionMsg({ type: "error", text: msg });
      showToast("error", msg, "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const releaseTicket = async () => {
    if (!selected?.id || releasing || !selectedOwnership.isMine) return;
    if (!window.confirm("Release this ticket for other agents?")) return;
    setReleasing(true);
    try {
      const res = await axios.post(
        `${apiUrl}support/questions/${selected.id}/release`,
        {},
        { headers: authHeaders }
      );
      const result = res.data?.result || selected;
      setSelected(result);
      patchListItem(result);
      setNoteDraft("");
      showToast("success", "Ticket is available again.", "Released");
      setActionMsg({ type: "success", text: "Released." });
      await fetchList({ soft: true, force: true });
    } catch (err) {
      const msg =
        err.response?.data?.message || "Could not release this ticket.";
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

  const sendReply = async () => {
    if (!selected?.id || sendingReply || !selectedOwnership.isMine) return;
    const message = replyDraft.trim();
    if (message.length < 10) {
      showToast("warning", "Write at least 10 characters.", "Too short");
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
      showToast("success", `Email sent to ${selected.email}.`, "Reply sent");
      setActionMsg({ type: "success", text: "Email reply sent." });
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

  const sendTicketChat = async () => {
    if (!selected?.id || sendingReply || !selectedOwnership.isMine) return;
    const message = replyDraft.trim();
    if (message.length < 2) {
      showToast("warning", "Write a short message.", "Too short");
      return;
    }
    setSendingReply(true);
    setActionMsg(null);
    try {
      const res = await axios.post(
        `${apiUrl}support/questions/${selected.id}/messages`,
        { message },
        { headers: authHeaders }
      );
      setSelected(res.data?.result || selected);
      setReplyDraft("");
      setActionMsg({ type: "success", text: "Message sent." });
      await fetchList({ soft: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to send message.";
      setActionMsg({ type: "error", text: msg });
      showToast("error", msg, "Send failed");
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="sta-root">
      <div className="sta-toolbar">
        <div className="sta-toolbar-primary">
          <div className="sta-seg" role="tablist" aria-label="Ticket filters">
            {LIST_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={listFilter === f.id}
                className={`sta-seg-btn${
                  listFilter === f.id ? " is-active" : ""
                }`}
                onClick={() => setListFilter(f.id)}
              >
                <span className="sta-seg-label">{f.label}</span>
                <span className="sta-seg-count">{filterCounts[f.id] ?? 0}</span>
              </button>
            ))}
          </div>

          <div className="sta-find">
            <FiSearch className="sta-find-icon" aria-hidden="true" />
            <input
              type="search"
              className="sta-find-input"
              placeholder="Search name, email, ID, category…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search tickets"
            />
            {searchQuery ? (
              <button
                type="button"
                className="sta-find-clear"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <FiX aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="sta-toolbar-aside">
          <div className="sta-meters" aria-label="Queue ownership">
            <div className="sta-meter">
              <span className="sta-meter-label">Available</span>
              <strong className="sta-meter-value">{counts.available}</strong>
            </div>
            <div className="sta-meter">
              <span className="sta-meter-label">Mine</span>
              <strong className="sta-meter-value">{counts.mine}</strong>
            </div>
            <div className="sta-meter">
              <span className="sta-meter-label">Taken</span>
              <strong className="sta-meter-value">{counts.taken}</strong>
            </div>
          </div>

          <button
            type="button"
            className={`sta-sync${loading ? " is-busy" : ""}`}
            onClick={() => {
              fetchList({ soft: false });
              setRefreshIn(SOFT_REFRESH_MS / 1000);
            }}
            disabled={loading}
            title="Refresh queue"
            aria-label={`Refresh queue, next auto-refresh in ${refreshIn} seconds`}
          >
            <FiRefreshCw aria-hidden="true" />
            <span className="sta-sync-timer">{refreshIn}s</span>
          </button>
        </div>
      </div>

      {error ? <div className="sta-alert sta-alert--error">{error}</div> : null}

      <div className="sta-table-shell">
        {loading ? (
          <p className="sta-empty">Loading tickets…</p>
        ) : filteredRows.length === 0 ? (
          <p className="sta-empty">No tickets match your filters.</p>
        ) : (
          <table className="sta-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>User</th>
                <th>Category</th>
                <th>Device</th>
                <th>Preview</th>
                <th>Status</th>
                <th>Assigned to</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((item) => {
                const ticket = isTicketItem(item);
                const code = ticketCode(item.id, ticket ? "T" : "Q");
                const state = ownershipState(item, email, myId);
                const preview = String(item.question || "").slice(0, 64);
                const unread = Boolean(ticket && item.hasUnreadForAgent);
                return (
                  <tr
                    key={item.id}
                    className={`sta-row${
                      selectedId === item.id ? " is-active" : ""
                    }${unread ? " is-unread" : ""} sta-row--${state}`}
                    onClick={() => openTicket(item)}
                  >
                    <td>
                      <span className="sta-mono">
                        {unread ? (
                          <span
                            className="sta-unread-dot"
                            title="Customer replied"
                            aria-label="Customer replied"
                          />
                        ) : null}
                        {code}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`sta-type ${
                          ticket ? "sta-type--ticket" : "sta-type--faq"
                        }`}
                      >
                        {ticket ? "Ticket" : "FAQ"}
                      </span>
                    </td>
                    <td>
                      <div className="sta-user">
                        <strong>{item.name || "User"}</strong>
                        <span>{item.email || "—"}</span>
                      </div>
                    </td>
                    <td>
                      {ticket ? formatTicketCategory(item.category) : "—"}
                    </td>
                    <td>
                      {ticket ? formatTicketDeviceType(item.deviceType) : "—"}
                    </td>
                    <td className="sta-preview" title={item.question || ""}>
                      {preview}
                      {String(item.question || "").length > 64 ? "…" : ""}
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
            aria-label="Close ticket details"
            onClick={closeDrawer}
          />
          <aside
            className="sta-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Ticket details"
          >
            <header className="sta-drawer-head">
              <div>
                <p className="sta-drawer-kicker">
                  {isTicketSelected ? "Support ticket" : "FAQ question"} ·{" "}
                  {ticketCode(selected.id, isTicketSelected ? "T" : "Q")}
                </p>
                <h2>
                  {selected.name || selected.email || "User"}
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
                {selectedOwnership.isMine ? (
                  <button
                    type="button"
                    className="sta-btn sta-btn--ghost sta-btn--sm"
                    disabled={releasing || claiming || deleting}
                    onClick={releaseTicket}
                  >
                    <FiUnlock /> Release
                  </button>
                ) : null}
                {canHardDelete ? (
                  <button
                    type="button"
                    className="sta-btn sta-btn--danger sta-btn--sm"
                    disabled={deleting || claiming || releasing}
                    onClick={deleteTicketPermanently}
                    title="Permanently delete from Firebase"
                  >
                    <FiTrash2 />
                    {deleting
                      ? "Deleting…"
                      : isTicketSelected
                        ? "Delete Ticket"
                        : "Delete Question"}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="sta-icon-btn"
                  onClick={closeDrawer}
                  aria-label="Close"
                  disabled={deleting}
                >
                  <FiX />
                </button>
              </div>
            </header>

            <div className="sta-drawer-body">
              {selectedOwnership.isOpen ? (
                <div className="sta-claim">
                  <div>
                    <strong>Claim this {isTicketSelected ? "ticket" : "question"}?</strong>
                    <span>Assign it to yourself to reply and update status.</span>
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
                  <FiLock /> Only the assigned agent can edit this ticket.
                </div>
              ) : null}

              {actionMsg ? (
                <div className={`sta-banner sta-banner--${actionMsg.type}`}>
                  {actionMsg.text}
                </div>
              ) : null}

              <dl className="sta-meta">
                <div>
                  <dt>Contact</dt>
                  <dd>
                    <a href={`mailto:${selected.email}`}>{selected.email}</a>
                  </dd>
                </div>
                <div>
                  <dt>{isTicketSelected ? "Category" : "Source"}</dt>
                  <dd>
                    {isTicketSelected
                      ? formatTicketCategory(selected.category)
                      : "FAQ Ask Question"}
                  </dd>
                </div>
                {isTicketSelected ? (
                  <div>
                    <dt>Device</dt>
                    <dd>{formatTicketDeviceType(selected.deviceType)}</dd>
                  </div>
                ) : null}
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
              </dl>

              {isTicketSelected ? (
                <section className="sta-panel">
                  <h3>Conversation</h3>
                  <div className="sta-chat">
                    {ticketMessages.length === 0 ? (
                      <p className="sta-muted">No messages yet</p>
                    ) : (
                      ticketMessages.map((m) => (
                        <div
                          key={m.id}
                          className={`sta-bubble sta-bubble--${
                            m.senderRole === "agent" ? "agent" : "user"
                          }`}
                        >
                          <div className="sta-bubble-meta">
                            {m.senderRole === "agent"
                              ? m.senderName || "Agent"
                              : selected.name || selected.email || "User"}{" "}
                            · {formatWhen(m.createdAt)}
                          </div>
                          <p>{m.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              ) : (
                <section className="sta-panel">
                  <h3>Question</h3>
                  <p className="sta-question-text">{selected.question}</p>
                </section>
              )}

              <div className="sta-grid-2">
                <section className={`sta-panel${editsDisabled ? " is-locked" : ""}`}>
                  <h3>Update status</h3>
                  <div className="sta-chips">
                    {statusActions.map((action) => (
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

                <section className={`sta-panel${editsDisabled ? " is-locked" : ""}`}>
                  <h3>{isTicketSelected ? "Chat reply" : "Email reply"}</h3>
                  {!isTicketSelected ? (
                    <label className="sta-label">
                      Subject
                      <input
                        type="text"
                        value={replySubject}
                        readOnly
                        disabled={editsDisabled}
                      />
                    </label>
                  ) : null}
                  <label className="sta-label">
                    Message
                    <textarea
                      rows={4}
                      value={replyDraft}
                      onChange={(e) => setReplyDraft(e.target.value)}
                      disabled={editsDisabled || sendingReply}
                      placeholder={
                        editsDisabled
                          ? "Claim to reply…"
                          : "Write your reply…"
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="sta-btn sta-btn--primary"
                    disabled={
                      editsDisabled ||
                      sendingReply ||
                      replyDraft.trim().length < (isTicketSelected ? 2 : 10)
                    }
                    onClick={isTicketSelected ? sendTicketChat : sendReply}
                  >
                    <FiSend />{" "}
                    {sendingReply
                      ? "Sending…"
                      : isTicketSelected
                        ? "Send message"
                        : "Send reply email"}
                  </button>
                </section>
              </div>

              <section className={`sta-panel${editsDisabled ? " is-locked" : ""}`}>
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
                  <span>{activityEvents.length} events</span>
                </div>
                {activityEvents.length === 0 ? (
                  <p className="sta-muted">No notes or email replies yet.</p>
                ) : (
                  <ul className="sta-activity">
                    {activityEvents.map((event) => (
                      <li key={event.id}>
                        <div className="sta-activity-top">
                          <strong>{event.agentName}</strong>
                          <time>{formatWhen(event.at)}</time>
                        </div>
                        <span className="sta-activity-kind">
                          {event.kind === "reply" ? "Email reply" : "Note"}
                        </span>
                        {event.subject ? (
                          <p className="sta-activity-subject">{event.subject}</p>
                        ) : null}
                        <p>{event.text}</p>
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
