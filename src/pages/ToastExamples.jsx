import React, { useCallback, useEffect, useState } from "react";
import SideNav from "../components/SideNav";
import {
  CheckCircle,
  XCircle,
  Info,
  AlertTriangle,
  X,
} from "lucide-react";
import { FaCheckCircle } from "react-icons/fa";
import { BsXCircleFill } from "react-icons/bs";
import { IoIosInformationCircle } from "react-icons/io";
import { FaExclamationTriangle } from "react-icons/fa";
import "../css/ToastExamples.css";

const STATUS = {
  success: {
    label: "Success",
    color: "#10b981",
    soft: "rgba(16, 185, 129, 0.3)",
    tint: "#ecfdf5",
    Lucide: CheckCircle,
    Fa: FaCheckCircle,
  },
  error: {
    label: "Error",
    color: "#ef4444",
    soft: "rgba(239, 68, 68, 0.3)",
    tint: "#fef2f2",
    Lucide: XCircle,
    Fa: BsXCircleFill,
  },
  warning: {
    label: "Warning",
    color: "#e5660f",
    soft: "rgba(255, 171, 73, 0.35)",
    tint: "#fff7ed",
    Lucide: AlertTriangle,
    Fa: FaExclamationTriangle,
  },
  info: {
    label: "Info",
    color: "#3b82f6",
    soft: "rgba(59, 130, 246, 0.3)",
    tint: "#eff6ff",
    Lucide: Info,
    Fa: IoIosInformationCircle,
  },
};

const SAMPLE_MSG = {
  success: "File uploaded successfully.",
  error: "Something went wrong. Please try again.",
  warning: "Storage is almost full.",
  info: "Your session will expire soon.",
};

const ToastProviderStyle = ({ status = "success", title, message, onClose }) => {
  const s = STATUS[status];
  const Icon = s.Lucide;
  return (
    <div
      className="te-toast te-style-provider"
      style={{ "--te-status": s.color }}
    >
      <div className="te-toast-row">
        <Icon size={20} color={s.color} style={{ marginTop: 2, flexShrink: 0 }} />
        <div className="te-toast-copy">
          {title ? <p className="te-toast-title">{title}</p> : null}
          <p className="te-toast-msg">{message}</p>
        </div>
        {onClose ? (
          <button type="button" className="te-toast-close" onClick={onClose} aria-label="Close">
            <X size={14} />
          </button>
        ) : null}
      </div>
    </div>
  );
};

const ToastPremiumStyle = ({ status = "success", message, onClose }) => {
  const s = STATUS[status];
  const Icon = s.Fa;
  return (
    <div
      className="te-toast te-style-premium"
      style={{ "--te-status-soft": s.soft }}
    >
      <div className="te-toast-row">
        <Icon style={{ width: 22, height: 22, color: s.color, flexShrink: 0, marginTop: 2 }} />
        <div className="te-toast-copy">
          <p className="te-toast-title">{s.label}</p>
          <p className="te-toast-msg">{message}</p>
        </div>
        {onClose ? (
          <button type="button" className="te-toast-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        ) : null}
      </div>
    </div>
  );
};

const ToastChakraStyle = ({ status = "success", message, onClose }) => {
  const s = STATUS[status];
  return (
    <div className="te-toast te-style-chakra" style={{ "--te-status": s.color }}>
      <div className="te-toast-row">
        <div className="te-toast-copy">
          <span className="te-toast-status-chip">{s.label}</span>
          <p className="te-toast-msg">{message}</p>
        </div>
        {onClose ? (
          <button type="button" className="te-toast-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        ) : null}
      </div>
    </div>
  );
};

const ToastSoftFill = ({ status = "success", title, message, onClose }) => {
  const s = STATUS[status];
  const Icon = s.Lucide;
  return (
    <div
      className="te-toast te-style-soft"
      style={{ "--te-tint": s.tint, "--te-status-soft": s.soft }}
    >
      <div className="te-toast-row">
        <Icon size={20} color={s.color} style={{ marginTop: 2, flexShrink: 0 }} />
        <div className="te-toast-copy">
          <p className="te-toast-title">{title || s.label}</p>
          <p className="te-toast-msg">{message}</p>
        </div>
        {onClose ? (
          <button type="button" className="te-toast-close" onClick={onClose} aria-label="Close">
            <X size={14} />
          </button>
        ) : null}
      </div>
    </div>
  );
};

const ToastBrandRail = ({ status = "success", title, message, onClose }) => {
  const s = STATUS[status];
  const Icon = s.Lucide;
  return (
    <div className="te-toast te-style-brand">
      <div className="te-toast-row">
        <Icon size={20} color={s.color} style={{ marginTop: 2, flexShrink: 0 }} />
        <div className="te-toast-copy">
          <p className="te-toast-title">{title || s.label}</p>
          <p className="te-toast-msg">{message}</p>
        </div>
        {onClose ? (
          <button type="button" className="te-toast-close" onClick={onClose} aria-label="Close">
            <X size={14} />
          </button>
        ) : null}
      </div>
    </div>
  );
};

const ToastCompactPill = ({ status = "success", title, message, onClose }) => {
  const s = STATUS[status];
  const Icon = s.Lucide;
  return (
    <div className="te-toast te-style-pill" style={{ "--te-status": s.color }}>
      <span className="te-pill-icon">
        <Icon size={16} color="#fff" />
      </span>
      <div className="te-toast-copy">
        <p className="te-toast-title">{title || s.label}</p>
        <p className="te-toast-msg">{message}</p>
      </div>
      {onClose ? (
        <button type="button" className="te-toast-close" onClick={onClose} aria-label="Close">
          <X size={14} />
        </button>
      ) : null}
    </div>
  );
};

const ToastCompactPillLight = ({ status = "success", title, message, onClose }) => {
  const s = STATUS[status];
  const Icon = s.Lucide;
  return (
    <div className="te-toast te-style-pill-light" style={{ "--te-status": s.color }}>
      <span className="te-pill-icon">
        <Icon size={16} color="#fff" />
      </span>
      <div className="te-toast-copy">
        <p className="te-toast-title">{title || s.label}</p>
        <p className="te-toast-msg">{message}</p>
      </div>
      {onClose ? (
        <button type="button" className="te-toast-close" onClick={onClose} aria-label="Close">
          <X size={14} />
        </button>
      ) : null}
    </div>
  );
};

const ToastTopLine = ({ status = "success", title, message, onClose }) => {
  const s = STATUS[status];
  const Icon = s.Lucide;
  return (
    <div className="te-toast te-style-top-line" style={{ "--te-status": s.color }}>
      <div className="te-toast-row">
        <Icon size={18} color={s.color} style={{ marginTop: 2, flexShrink: 0 }} />
        <div className="te-toast-copy">
          <p className="te-toast-title">{title || s.label}</p>
          <p className="te-toast-msg">{message}</p>
        </div>
        {onClose ? (
          <button type="button" className="te-toast-close" onClick={onClose} aria-label="Close">
            <X size={14} />
          </button>
        ) : null}
      </div>
    </div>
  );
};

const ToastIconBadge = ({ status = "success", title, message, onClose }) => {
  const s = STATUS[status];
  const Icon = s.Lucide;
  return (
    <div
      className="te-toast te-style-badge"
      style={{ "--te-tint": s.tint, "--te-status": s.color }}
    >
      <div className="te-toast-row">
        <span className="te-badge-icon">
          <Icon size={18} color={s.color} />
        </span>
        <div className="te-toast-copy">
          <p className="te-toast-title">{title || s.label}</p>
          <p className="te-toast-msg">{message}</p>
        </div>
        {onClose ? (
          <button type="button" className="te-toast-close" onClick={onClose} aria-label="Close">
            <X size={14} />
          </button>
        ) : null}
      </div>
    </div>
  );
};

const DESIGNS = [
  {
    id: "provider",
    title: "ToastProvider (current)",
    description: "react-toastify white card with left status border — used by Support & FAQ.",
    badge: "current",
    Component: ToastProviderStyle,
  },
  {
    id: "premium",
    title: "Premium glass (current)",
    description: "Chakra custom render with blur glass + status border — used on Files pages.",
    badge: "current",
    Component: ToastPremiumStyle,
  },
  {
    id: "chakra",
    title: "Chakra default (current)",
    description: "Stock Chakra toast title/description look — still used in a few older pages.",
    badge: "current",
    Component: ToastChakraStyle,
  },
  {
    id: "soft",
    title: "Soft fill",
    description: "Tinted background by status — calm and simple.",
    badge: "new",
    Component: ToastSoftFill,
  },
  {
    id: "brand",
    title: "Brand rail",
    description: "White card with Stolity orange gradient left rail.",
    badge: "new",
    Component: ToastBrandRail,
  },
  {
    id: "pill",
    title: "Compact pill",
    description: "Dark rounded pill with status icon circle — minimal footprint.",
    badge: "new",
    Component: ToastCompactPill,
  },
  {
    id: "pill-light",
    title: "Compact pill (white) — GLOBAL",
    description: "Active app-wide toast. Top-right, single toast only (no stacking).",
    badge: "current",
    Component: ToastCompactPillLight,
  },
  {
    id: "topline",
    title: "Top accent",
    description: "Clean white card with a thin top status line.",
    badge: "new",
    Component: ToastTopLine,
  },
  {
    id: "badge",
    title: "Icon badge",
    description: "Rounded icon tile + title/message — matches Files / Support UI language.",
    badge: "new",
    Component: ToastIconBadge,
  },
];

const ToastExamples = () => {
  const [live, setLive] = useState([]);

  const dismiss = useCallback((id) => {
    setLive((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const fire = useCallback(
    (designId, status) => {
      const design = DESIGNS.find((d) => d.id === designId);
      if (!design) return;
      const id = `${designId}-${status}-${Date.now()}`;
      setLive((prev) => [
        {
          id,
          designId,
          status,
          title: STATUS[status].label,
          message: SAMPLE_MSG[status],
          Component: design.Component,
        },
        ...prev,
      ].slice(0, 3));
      window.setTimeout(() => dismiss(id), 3500);
    },
    [dismiss]
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setLive([]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="te-page-shell">
      <SideNav />
      <div className="te-page">
        <div className="te-breadcrumb">
          <span>Examples</span>
          <span className="te-breadcrumb-sep" aria-hidden="true">
            /
          </span>
          <span className="te-breadcrumb-current">Toasts</span>
        </div>

        <div className="te-shell">
          <header className="te-hero">
            <p className="te-eyebrow">Toast gallery</p>
            <h1 className="te-title">Toast style examples</h1>
            <p className="te-subtitle">
              Global toast is now <strong>Compact pill (white)</strong> —
              top-right, one at a time. Other cards below are for reference only.
            </p>
          </header>

          <p className="te-section-label">All designs</p>
          <div className="te-grid">
            {DESIGNS.map((item) => {
              const Preview = item.Component;
              return (
                <article className="te-card" key={item.id}>
                  <div className="te-stage">
                    <Preview
                      status="success"
                      title="Success"
                      message={SAMPLE_MSG.success}
                    />
                  </div>
                  <div className="te-card-body">
                    <span
                      className={`te-badge${
                        item.badge === "new"
                          ? " te-badge--new"
                          : " te-badge--current"
                      }`}
                    >
                      {item.badge === "new" ? "New" : "In use"}
                    </span>
                    <h2 className="te-card-title">{item.title}</h2>
                    <p className="te-card-desc">{item.description}</p>
                    <div className="te-actions">
                      <button
                        type="button"
                        className="te-btn te-btn--primary"
                        onClick={() => fire(item.id, "success")}
                      >
                        Preview success
                      </button>
                      <button
                        type="button"
                        className="te-btn"
                        onClick={() => fire(item.id, "error")}
                      >
                        Error
                      </button>
                      <button
                        type="button"
                        className="te-btn"
                        onClick={() => fire(item.id, "warning")}
                      >
                        Warning
                      </button>
                      <button
                        type="button"
                        className="te-btn"
                        onClick={() => fire(item.id, "info")}
                      >
                        Info
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>

      {live.length > 0 ? (
        <div className="te-live-stack" aria-live="polite">
          {live.map((t) => {
            const Comp = t.Component;
            return (
              <Comp
                key={t.id}
                status={t.status}
                title={t.title}
                message={t.message}
                onClose={() => dismiss(t.id)}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

export default ToastExamples;
