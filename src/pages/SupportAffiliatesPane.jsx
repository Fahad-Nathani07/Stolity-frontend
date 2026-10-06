import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import {
  FiRefreshCw,
  FiLink,
  FiCopy,
  FiPlus,
  FiSearch,
  FiInbox,
  FiPercent,
  FiMousePointer,
  FiUserPlus,
  FiUsers,
  FiX,
  FiMail,
} from "react-icons/fi";
import { showToast } from "../components/ToastProvider";
import { markPaneScrolling } from "../components/SupportFilterSelect";

function formatWhen(iso, withTime = false) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      ...(withTime
        ? { hour: "2-digit", minute: "2-digit", second: "2-digit" }
        : {}),
    });
  } catch {
    return iso;
  }
}

function formatRate(rate) {
  const n = Number(rate);
  if (Number.isNaN(n)) return "0%";
  return `${n}%`;
}

function sortReferredUsers(users) {
  return [...(Array.isArray(users) ? users : [])].sort((a, b) => {
    const ta = a?.at ? Date.parse(a.at) : 0;
    const tb = b?.at ? Date.parse(b.at) : 0;
    return tb - ta;
  });
}

function initialsFromAffiliate(affiliate) {
  const name = String(affiliate?.affiliateName || "").trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  const local = String(affiliate?.affiliateEmail || "").split("@")[0];
  return (local.slice(0, 2) || "?").toUpperCase();
}

function ReferredUsersModal({ affiliate, onClose }) {
  const users = useMemo(
    () => sortReferredUsers(affiliate?.lastSignupUsers),
    [affiliate]
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (!affiliate) return null;

  const displayName =
    affiliate.affiliateName ||
    affiliate.affiliateEmail?.split("@")[0] ||
    "Affiliate";
  const clicks = Number(affiliate.totalClicks) || 0;
  const signups = Number(affiliate.totalSignups) || users.length;
  const convRate =
    clicks > 0 ? Math.round((signups / clicks) * 10000) / 100 : 0;

  return createPortal(
    <div className="sud-overlay" role="presentation" onClick={onClose}>
      <div
        className="sud-modal ssd-affiliate-referred-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Referred users"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sud-hero">
          <div className="sud-hero-top">
            <p className="sud-hero-top-label">Referred users</p>
            <button
              type="button"
              className="sud-close"
              onClick={onClose}
              aria-label="Close"
            >
              <FiX />
            </button>
          </div>

          <div className="sud-avatar">{initialsFromAffiliate(affiliate)}</div>

          <div className="sud-hero-main">
            <div className="sud-hero-badges">
              <span className="sud-badge sud-badge--labeled sud-badge--plan">
                <em>Code</em>
                <span className="sud-badge__value">{affiliate.code || "—"}</span>
              </span>
              <span className="sud-badge sud-badge--labeled sud-badge--ok">
                <em>Users</em>
                <span className="sud-badge__value">{users.length}</span>
              </span>
              <span className="sud-badge sud-badge--labeled sud-badge--free">
                <em>Conv.</em>
                <span className="sud-badge__value">{formatRate(convRate)}</span>
              </span>
            </div>
            <h2>{displayName}</h2>
            <div className="sud-hero-meta">
              <span>
                <FiMail /> {affiliate.affiliateEmail || "—"}
              </span>
              <span>
                <FiUsers /> {users.length} referred
              </span>
              <span>
                <FiPercent /> {formatRate(convRate)} conversion
              </span>
            </div>
          </div>

          <div className="sud-hero-aside">
            <div className="sud-kpi">
              <FiMousePointer aria-hidden />
              <div>
                <span>Clicks</span>
                <strong>{clicks}</strong>
              </div>
            </div>
            <div className="sud-kpi">
              <FiUserPlus aria-hidden />
              <div>
                <span>Signups</span>
                <strong>{signups}</strong>
              </div>
            </div>
          </div>
        </header>

        <div className="sud-body ssd-affiliate-referred-modal__body">
          <section className="sud-panel">
            <div className="sud-info-card">
              <h3>Signup list</h3>
              {users.length === 0 ? (
                <div className="ssd-affiliate-referred-modal__empty">
                  <FiInbox aria-hidden />
                  <p>No referred users yet.</p>
                  <span>Signups from this link will appear here.</span>
                </div>
              ) : (
                <div className="ssd-affiliate-referred-modal__table-wrap">
                  <table className="ssd-affiliate-referred-modal__table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>User ID</th>
                        <th>Signed up</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.userId || `${u.email}-${u.at}`}>
                          <td>
                            <div className="ssd-affiliate-referred-user">
                              <span
                                className="ssd-affiliate-referred-user__avatar"
                                aria-hidden
                              >
                                {String(u.name || u.email || "?")
                                  .trim()
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>
                              <strong>{u.name || "—"}</strong>
                            </div>
                          </td>
                          <td>{u.email || "—"}</td>
                          <td>
                            <code>{u.userId || "—"}</code>
                          </td>
                          <td>{formatWhen(u.at, true)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function SupportAffiliatesPane({
  apiUrl,
  authHeaders,
  onItemCountChange,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showGenerate, setShowGenerate] = useState(false);
  const [genEmail, setGenEmail] = useState("");
  const [genName, setGenName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [lastCreated, setLastCreated] = useState(null);
  const [referredModalAffiliate, setReferredModalAffiliate] = useState(null);

  const fetchList = useCallback(
    async ({ soft = false } = {}) => {
      if (!apiUrl || !authHeaders?.Authorization) return;
      if (!soft) setLoading(true);
      setError("");
      try {
        const res = await axios.get(`${apiUrl}support/affiliates`, {
          headers: authHeaders,
        });
        const list = Array.isArray(res.data?.result) ? res.data.result : [];
        setItems(list);
        if (typeof onItemCountChange === "function") {
          onItemCountChange(list.length);
        }
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load affiliate links.";
        setError(msg);
        showToast("error", msg);
      } finally {
        setLoading(false);
      }
    },
    [apiUrl, authHeaders, onItemCountChange]
  );

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((row) => {
      const hay = [
        row.affiliateEmail,
        row.affiliateName,
        row.code,
        row.link,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, search]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, row) => {
        acc.clicks += Number(row.totalClicks) || 0;
        acc.signups += Number(row.totalSignups) || 0;
        return acc;
      },
      { clicks: 0, signups: 0 }
    );
  }, [filtered]);

  const overallRate =
    totals.clicks > 0
      ? Math.round((totals.signups / totals.clicks) * 10000) / 100
      : 0;

  const copyText = async (text, label = "Link") => {
    try {
      await navigator.clipboard.writeText(text);
      showToast("success", `${label} copied`);
    } catch {
      showToast("error", "Could not copy to clipboard");
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    const email = genEmail.trim();
    if (!email || !email.includes("@")) {
      showToast("error", "Enter a valid affiliate email");
      return;
    }
    setGenerating(true);
    try {
      const res = await axios.post(
        `${apiUrl}support/affiliates`,
        { email, name: genName.trim() || undefined },
        { headers: authHeaders }
      );
      const affiliate = res.data?.result;
      setLastCreated(affiliate || null);
      showToast(
        "success",
        res.data?.message ||
          (res.data?.created
            ? "Affiliate link created"
            : "Existing link returned")
      );
      setGenEmail("");
      setGenName("");
      await fetchList({ soft: true });
      if (affiliate?.link) {
        await copyText(affiliate.link, "Affiliate link");
      }
    } catch (err) {
      showToast(
        "error",
        err?.response?.data?.message || "Failed to generate link"
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="ssd-callbacks ssd-users ssd-affiliates">
      {error && <div className="ssd-banner ssd-banner-error">{error}</div>}

      <div className="ssd-users-toolbar">
        <div className="ssd-users-toolbar__left">
          <div className="ssd-search-wrap ssd-search-field">
            <FiSearch aria-hidden />
            <input
              type="search"
              placeholder="Search email, name, or code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search affiliate links"
            />
          </div>
        </div>
        <div className="ssd-users-toolbar__right">
          <button
            type="button"
            className="ssd-btn ssd-btn-primary"
            onClick={() => setShowGenerate((v) => !v)}
          >
            <FiPlus />
            Generate Affiliate Link
          </button>
          <button
            type="button"
            className="ssd-btn ssd-btn-ghost ssd-btn-refresh"
            onClick={() => fetchList()}
            disabled={loading}
            title="Refresh"
          >
            <FiRefreshCw />
            Refresh
          </button>
        </div>
      </div>

      {showGenerate && (
        <form className="ssd-affiliate-generate" onSubmit={handleGenerate}>
          <div className="ssd-affiliate-generate__fields">
            <label>
              <span>Affiliate email</span>
              <input
                type="email"
                required
                value={genEmail}
                onChange={(e) => setGenEmail(e.target.value)}
                placeholder="partner@example.com"
                disabled={generating}
              />
            </label>
            <label>
              <span>Display name (optional)</span>
              <input
                type="text"
                value={genName}
                onChange={(e) => setGenName(e.target.value)}
                placeholder="Partner name"
                disabled={generating}
              />
            </label>
          </div>
          <div className="ssd-affiliate-generate__actions">
            <button
              type="submit"
              className="ssd-btn ssd-btn-primary"
              disabled={generating}
            >
              <FiLink />
              {generating ? "Generating…" : "Generate & copy link"}
            </button>
            <button
              type="button"
              className="ssd-btn ssd-btn-ghost"
              onClick={() => setShowGenerate(false)}
              disabled={generating}
            >
              Cancel
            </button>
          </div>
          {lastCreated?.link && (
            <div className="ssd-affiliate-generate__result">
              <code>{lastCreated.link}</code>
              <button
                type="button"
                className="ssd-btn ssd-btn-ghost ssd-btn-xs"
                onClick={() => copyText(lastCreated.link)}
              >
                <FiCopy /> Copy
              </button>
            </div>
          )}
        </form>
      )}

      <div className="ssd-users-stats">
        <div className="ssd-users-card ssd-users-card--static">
          <span className="ssd-users-card__icon ssd-users-card__icon--accent">
            <FiLink aria-hidden />
          </span>
          <div className="ssd-users-card__body">
            <span className="ssd-users-card__label">Links</span>
            <strong className="ssd-users-card__value">{filtered.length}</strong>
            <span className="ssd-users-card__sub">
              {search.trim() ? "Matching filter" : "Total generated"}
            </span>
          </div>
        </div>
        <div className="ssd-users-card ssd-users-card--static">
          <span className="ssd-users-card__icon ssd-users-card__icon--accent">
            <FiMousePointer aria-hidden />
          </span>
          <div className="ssd-users-card__body">
            <span className="ssd-users-card__label">Clicks</span>
            <strong className="ssd-users-card__value">{totals.clicks}</strong>
            <span className="ssd-users-card__sub">Unique visitors</span>
          </div>
        </div>
        <div className="ssd-users-card ssd-users-card--static">
          <span className="ssd-users-card__icon ssd-users-card__icon--accent">
            <FiUserPlus aria-hidden />
          </span>
          <div className="ssd-users-card__body">
            <span className="ssd-users-card__label">Signups</span>
            <strong className="ssd-users-card__value">{totals.signups}</strong>
            <span className="ssd-users-card__sub">
              Conv. {formatRate(overallRate)}
            </span>
          </div>
        </div>
      </div>

      <div className="ssd-users-table-wrap" onScroll={markPaneScrolling}>
        {loading && !items.length ? (
          <div className="ssd-users-empty">
            <div className="ssd-users-empty-card">
              <span className="ssd-users-empty-spin" aria-hidden />
              <p>Loading affiliate links…</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="ssd-users-empty">
            <div className="ssd-users-empty-card">
              <FiInbox aria-hidden />
              <h3>No affiliate links</h3>
              <p>
                {search.trim()
                  ? "No links match your search."
                  : "Generate a link for an affiliate email to get started."}
              </p>
            </div>
          </div>
        ) : (
          <table className="ssd-users-table">
            <thead>
              <tr>
                <th>Affiliate</th>
                <th>Referral ID</th>
                <th>Link</th>
                <th>Clicks</th>
                <th>Signups</th>
                <th>
                  <span className="ssd-affiliate-th-rate">
                    <FiPercent aria-hidden /> Rate
                  </span>
                </th>
                <th>Referred users</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.code || row.id}>
                  <td>
                    <div className="ssd-affiliate-person">
                      <strong>{row.affiliateName || "—"}</strong>
                      <span>{row.affiliateEmail || "—"}</span>
                    </div>
                  </td>
                  <td>
                    <code className="ssd-affiliate-code">{row.code}</code>
                  </td>
                  <td>
                    <div className="ssd-affiliate-link-cell">
                      <span title={row.link}>{row.link}</span>
                      <button
                        type="button"
                        className="ssd-btn ssd-btn-ghost ssd-btn-xs"
                        onClick={() => copyText(row.link)}
                        title="Copy link"
                      >
                        <FiCopy />
                      </button>
                    </div>
                  </td>
                  <td>{Number(row.totalClicks) || 0}</td>
                  <td>{Number(row.totalSignups) || 0}</td>
                  <td>{formatRate(row.conversionRate)}</td>
                  <td>
                    {Array.isArray(row.lastSignupUsers) &&
                    row.lastSignupUsers.length ? (
                      <button
                        type="button"
                        className="ssd-btn ssd-btn-ghost ssd-btn-xs ssd-affiliate-view-users"
                        onClick={() => setReferredModalAffiliate(row)}
                        title="View referred users"
                      >
                        <FiUsers />
                        View ({row.lastSignupUsers.length})
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{formatWhen(row.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {referredModalAffiliate && (
        <ReferredUsersModal
          affiliate={referredModalAffiliate}
          onClose={() => setReferredModalAffiliate(null)}
        />
      )}
    </div>
  );
}
