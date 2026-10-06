import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { FiArrowLeft, FiPlus, FiSend, FiLifeBuoy } from "react-icons/fi";
import SideNav from "../components/SideNav";
import { showToast } from "../components/ToastProvider";
import AvatarDefault from "../images/AvatarDefault.jpg";
import {
  SUPPORT_TICKET_CATEGORIES,
  formatTicketCategory,
  formatTicketStatus,
  ticketDisplayCode,
  TICKET_MESSAGE_MIN,
  TICKET_MESSAGE_MAX,
} from "../utils/supportTicketConstants";
import "../css/FilesToolbar.css";
import "../css/FilesPage.css";
import "../css/SupportTickets.css";

const apiUrl = process.env.REACT_APP_API_ENDPOINT;

function authHeaders() {
  const token = sessionStorage.getItem("number");
  return { Authorization: `Bearer ${token}` };
}

function formatWhen(iso) {
  if (!iso) return "";
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

function statusTone(status) {
  const s = String(status || "").toLowerCase();
  if (s === "open") return "open";
  if (s === "in_progress") return "progress";
  if (s === "closed") return "done";
  return "neutral";
}

/** 0 = unassigned/open, 1 = in progress, 2 = completed */
function ticketBucket(item) {
  const s = String(item?.status || "").toLowerCase();
  if (s === "closed" || s === "answered") return "completed";
  if (s === "in_progress" || s === "assigned") return "in_progress";
  return "unassigned";
}

function ticketBucketRank(bucket) {
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
  { id: "unassigned", label: "Unassigned" },
  { id: "in_progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
];

export default function SupportTicketsPage() {
  const navigate = useNavigate();
  const { ticketId } = useParams();
  const [searchParams] = useSearchParams();
  const wantNew = searchParams.get("new") === "1" || ticketId === "new";
  const userProfile = useSelector((state) => state.userProfile);
  const FILES_MOBILE_BP = 767;
  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== "undefined" && window.innerWidth <= FILES_MOBILE_BP
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${FILES_MOBILE_BP}px)`);
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [category, setCategory] = useState("other");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [listFilter, setListFilter] = useState("all");
  const messagesEndRef = useRef(null);

  const view = wantNew ? "new" : ticketId ? "chat" : "list";
  const displayName =
    userProfile?.name || sessionStorage.getItem("name") || "User";
  const avatarUrl =
    userProfile?.avatar || sessionStorage.getItem("avatar") || "";

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}my-support-tickets`, {
        headers: authHeaders(),
      });
      setTickets(Array.isArray(res.data?.result) ? res.data.result : []);
    } catch (err) {
      showToast(
        "error",
        err.response?.data?.message || "Failed to load tickets"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTicket = useCallback(async (id, { soft = false } = {}) => {
    if (!id || id === "new") return;
    try {
      if (!soft) setDetailLoading(true);
      const res = await axios.get(`${apiUrl}support/questions/${id}`, {
        headers: authHeaders(),
      });
      setSelected(res.data?.result || null);
    } catch (err) {
      if (!soft) {
        showToast(
          "error",
          err.response?.data?.message || "Failed to load ticket"
        );
        setSelected(null);
      }
    } finally {
      if (!soft) setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    if (view === "chat" && ticketId) {
      fetchTicket(ticketId);
      const t = setInterval(() => fetchTicket(ticketId, { soft: true }), 30000);
      return () => clearInterval(t);
    }
    setSelected(null);
    return undefined;
  }, [view, ticketId, fetchTicket]);

  const sortedMessages = useMemo(() => {
    const list = Array.isArray(selected?.messages) ? [...selected.messages] : [];
    list.sort((a, b) =>
      String(a.createdAt || "").localeCompare(String(b.createdAt || ""))
    );
    return list;
  }, [selected]);

  useEffect(() => {
    if (view !== "chat") return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [view, sortedMessages.length, selected?.id]);

  const isClosed = String(selected?.status || "").toLowerCase() === "closed";

  const filterCounts = useMemo(() => {
    const counts = {
      all: tickets.length,
      unassigned: 0,
      in_progress: 0,
      completed: 0,
    };
    for (const t of tickets) {
      counts[ticketBucket(t)] += 1;
    }
    return counts;
  }, [tickets]);

  const visibleTickets = useMemo(() => {
    const filtered =
      listFilter === "all"
        ? [...tickets]
        : tickets.filter((t) => ticketBucket(t) === listFilter);

    filtered.sort((a, b) => {
      const rankDiff =
        ticketBucketRank(ticketBucket(a)) - ticketBucketRank(ticketBucket(b));
      if (rankDiff !== 0) return rankDiff;
      return ticketUpdatedMs(b) - ticketUpdatedMs(a);
    });
    return filtered;
  }, [tickets, listFilter]);

  const openCount = filterCounts.unassigned + filterCounts.in_progress;

  const handleCreate = async (e) => {
    e.preventDefault();
    const text = message.trim();
    if (text.length < TICKET_MESSAGE_MIN) {
      showToast("warning", "Please enter a short message.");
      return;
    }
    try {
      setSubmitting(true);
      const res = await axios.post(
        `${apiUrl}support/tickets`,
        { category, message: text },
        { headers: authHeaders() }
      );
      const id = res.data?.id || res.data?.result?.id;
      showToast("success", "Ticket created");
      setMessage("");
      await fetchTickets();
      if (id) navigate(`/SupportTickets/${id}`);
      else navigate("/SupportTickets");
    } catch (err) {
      showToast(
        "error",
        err.response?.data?.message || "Could not create ticket"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!ticketId || isClosed) return;
    const text = replyText.trim();
    if (text.length < TICKET_MESSAGE_MIN) return;
    try {
      setSendingReply(true);
      const res = await axios.post(
        `${apiUrl}support/questions/${ticketId}/messages`,
        { message: text },
        { headers: authHeaders() }
      );
      setSelected(res.data?.result || selected);
      setReplyText("");
    } catch (err) {
      showToast(
        "error",
        err.response?.data?.message || "Failed to send message"
      );
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div
      className={`stu-layout files-layout${
        isMobile ? " files-layout--mobile" : ""
      }`}
    >
      <SideNav />
      <nav className="navbar p-0 fixed-top d-flex flex-row files-navbar">
        <div className="navbar-menu-wrapper flex-grow files-navbar__shell">
          <header className="files-app-header">
            <div className="files-app-header__titles">
              <h1 className="files-app-header__title">Support Tickets</h1>
              <div className="files-app-header__end">
                {view === "list" ? (
                  <button
                    type="button"
                    className="files-app-header__support"
                    title="Raise ticket"
                    aria-label="Raise ticket"
                    onClick={() => navigate("/SupportTickets/new")}
                  >
                    <FiPlus aria-hidden="true" />
                    Raise
                  </button>
                ) : (
                  <button
                    type="button"
                    className="files-app-header__support"
                    title="All tickets"
                    aria-label="All tickets"
                    onClick={() => navigate("/SupportTickets")}
                  >
                    <FiLifeBuoy aria-hidden="true" />
                    Tickets
                  </button>
                )}
                <div className="files-app-header__welcome files-nav-welcome">
                  <span className="files-nav-welcome__greet">Welcome back</span>
                  <span className="files-nav-welcome__name">{displayName}</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="files-app-header__profile"
              title="Edit profile"
              aria-label="Open profile"
              onClick={() => navigate("/UserProfile")}
            >
              <img
                src={avatarUrl || AvatarDefault}
                alt=""
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = AvatarDefault;
                }}
              />
            </button>
          </header>
        </div>
      </nav>

      <div className={`stu-page${view === "chat" ? " stu-page--chat" : ""}`}>
            {view === "list" ? (
              <div className="stu-shell">
                <header className="stu-hero">
                  <div className="stu-hero-text">
                    <span className="stu-hero-icon" aria-hidden="true">
                      <FiLifeBuoy />
                    </span>
                    <div>
                      <h2>Support Tickets</h2>
                      <p>
                        Chat with Stolity support. Track open tickets and past
                        conversations in one place.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="stu-btn stu-btn--primary stu-hero-cta"
                    onClick={() => navigate("/SupportTickets/new")}
                  >
                    <FiPlus /> Raise Ticket
                  </button>
                </header>

                <div className="stu-stats">
                  <div className="stu-stat">
                    <span>Total</span>
                    <strong>{tickets.length}</strong>
                  </div>
                  <div className="stu-stat">
                    <span>Active</span>
                    <strong>{openCount}</strong>
                  </div>
                  <div className="stu-stat">
                    <span>Closed</span>
                    <strong>{filterCounts.completed}</strong>
                  </div>
                </div>

                <div className="stu-filters" role="tablist" aria-label="Ticket filters">
                  {LIST_FILTERS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      role="tab"
                      aria-selected={listFilter === f.id}
                      className={`stu-filter-chip${
                        listFilter === f.id ? " is-active" : ""
                      }`}
                      onClick={() => setListFilter(f.id)}
                    >
                      {f.label}
                      <em>{filterCounts[f.id] ?? 0}</em>
                    </button>
                  ))}
                </div>

                <div className="stu-panel">
                  {loading ? (
                    <p className="stu-empty">Loading your tickets…</p>
                  ) : visibleTickets.length === 0 ? (
                    <div className="stu-empty-state">
                      <FiLifeBuoy aria-hidden="true" />
                      <h3>
                        {tickets.length === 0
                          ? "No tickets yet"
                          : "No tickets in this filter"}
                      </h3>
                      <p>
                        {tickets.length === 0
                          ? "Need help with billing, uploads, or your account?"
                          : "Try another filter or raise a new ticket."}
                      </p>
                      {tickets.length === 0 ? (
                        <button
                          type="button"
                          className="stu-btn stu-btn--primary"
                          onClick={() => navigate("/SupportTickets/new")}
                        >
                          <FiPlus /> Raise your first ticket
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <>
                      <div className="stu-table-wrap stu-table-wrap--desktop">
                        <table className="stu-table">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Category</th>
                              <th>Message</th>
                              <th>Status</th>
                              <th>Updated</th>
                            </tr>
                          </thead>
                          <tbody>
                            {visibleTickets.map((t) => (
                              <tr
                                key={t.id}
                                onClick={() =>
                                  navigate(`/SupportTickets/${t.id}`)
                                }
                              >
                                <td className="stu-mono">
                                  {ticketDisplayCode(t.id)}
                                </td>
                                <td>{formatTicketCategory(t.category)}</td>
                                <td className="stu-preview" title={t.question}>
                                  {String(t.question || "").slice(0, 80)}
                                  {String(t.question || "").length > 80
                                    ? "…"
                                    : ""}
                                </td>
                                <td>
                                  <span
                                    className={`stu-status stu-status--${statusTone(
                                      t.status
                                    )}`}
                                  >
                                    {formatTicketStatus(t.status)}
                                  </span>
                                </td>
                                <td className="stu-when">
                                  {formatWhen(t.updatedAt || t.createdAt)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="stu-ticket-cards" aria-label="Tickets">
                        {visibleTickets.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            className="stu-ticket-card"
                            onClick={() => navigate(`/SupportTickets/${t.id}`)}
                          >
                            <div className="stu-ticket-card__top">
                              <span className="stu-mono">
                                {ticketDisplayCode(t.id)}
                              </span>
                              <span
                                className={`stu-status stu-status--${statusTone(
                                  t.status
                                )}`}
                              >
                                {formatTicketStatus(t.status)}
                              </span>
                            </div>
                            <div className="stu-ticket-card__cat">
                              {formatTicketCategory(t.category)}
                            </div>
                            <p className="stu-ticket-card__preview">
                              {String(t.question || "").slice(0, 110)}
                              {String(t.question || "").length > 110 ? "…" : ""}
                            </p>
                            <div className="stu-ticket-card__when">
                              {formatWhen(t.updatedAt || t.createdAt)}
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : null}

            {view === "new" ? (
              <div className="stu-shell stu-shell--narrow">
                <button
                  type="button"
                  className="stu-back"
                  onClick={() => navigate("/SupportTickets")}
                >
                  <FiArrowLeft /> All tickets
                </button>

                <form className="stu-form-card" onSubmit={handleCreate}>
                  <div className="stu-form-head">
                    <h2>Raise a ticket</h2>
                    <p>
                      Pick a category and describe the issue. Our team will
                      reply in this chat.
                    </p>
                  </div>

                  <label className="stu-label" htmlFor="stu-category">
                    Category
                    <select
                      id="stu-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      {SUPPORT_TICKET_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="stu-cat-pills" role="list">
                    {SUPPORT_TICKET_CATEGORIES.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        role="listitem"
                        className={`stu-cat-pill${
                          category === c.id ? " is-active" : ""
                        }`}
                        onClick={() => setCategory(c.id)}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>

                  <label className="stu-label" htmlFor="stu-message">
                    How can we help?
                    <textarea
                      id="stu-message"
                      rows={6}
                      maxLength={TICKET_MESSAGE_MAX}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe what’s going wrong, what you expected, and any steps to reproduce…"
                    />
                  </label>

                  <div className="stu-form-foot">
                    <span className="stu-muted">
                      {message.trim().length}/{TICKET_MESSAGE_MAX}
                    </span>
                    <button
                      type="submit"
                      className="stu-btn stu-btn--primary"
                      disabled={
                        submitting ||
                        message.trim().length < TICKET_MESSAGE_MIN
                      }
                    >
                      {submitting ? "Creating…" : "Create ticket"}
                    </button>
                  </div>
                </form>
              </div>
            ) : null}

            {view === "chat" ? (
              <div className="stu-shell stu-shell--chat">
                <button
                  type="button"
                  className="stu-back"
                  onClick={() => navigate("/SupportTickets")}
                >
                  <FiArrowLeft /> All tickets
                </button>

                {detailLoading && !selected ? (
                  <div className="stu-panel">
                    <p className="stu-empty">Loading conversation…</p>
                  </div>
                ) : !selected ? (
                  <div className="stu-panel">
                    <p className="stu-empty">Ticket not found.</p>
                  </div>
                ) : (
                  <div className="stu-chat-card">
                    <header className="stu-chat-head">
                      <div>
                        <p className="stu-chat-kicker">
                          {formatTicketCategory(selected.category)}
                        </p>
                        <h2>{ticketDisplayCode(selected.id)}</h2>
                      </div>
                      <span
                        className={`stu-status stu-status--${statusTone(
                          selected.status
                        )}`}
                      >
                        {formatTicketStatus(selected.status)}
                      </span>
                    </header>

                    <div className="stu-chat-stream">
                      {sortedMessages.length === 0 ? (
                        <p className="stu-empty">No messages yet.</p>
                      ) : (
                        sortedMessages.map((m) => {
                          const mine = m.senderRole !== "agent";
                          return (
                            <div
                              key={m.id}
                              className={`stu-msg${mine ? " is-mine" : ""}`}
                            >
                              <div className="stu-msg-meta">
                                {mine
                                  ? "You"
                                  : m.senderName || "Stolity Support"}{" "}
                                · {formatWhen(m.createdAt)}
                              </div>
                              <div className="stu-msg-bubble">
                                <p>{m.text}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {isClosed ? (
                      <div className="stu-chat-closed">
                        This ticket is closed. You can still read the
                        conversation.
                      </div>
                    ) : (
                      <form
                        className="stu-composer"
                        onSubmit={handleSendMessage}
                      >
                        <textarea
                          rows={2}
                          maxLength={TICKET_MESSAGE_MAX}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write a message to support…"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              if (
                                !sendingReply &&
                                replyText.trim().length >= TICKET_MESSAGE_MIN
                              ) {
                                handleSendMessage(e);
                              }
                            }
                          }}
                        />
                        <button
                          type="submit"
                          className="stu-btn stu-btn--primary stu-btn--send"
                          disabled={
                            sendingReply ||
                            replyText.trim().length < TICKET_MESSAGE_MIN
                          }
                        >
                          <FiSend />
                          {sendingReply ? "Sending…" : "Send"}
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            ) : null}
      </div>
    </div>
  );
}
