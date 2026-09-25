import React from "react";
import { ToastContainer, toast } from "react-toastify";
import {
  CheckCircle,
  XCircle,
  Info,
  AlertTriangle,
  X,
} from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import "./ToastProvider.css";

const typeConfig = {
  success: {
    icon: CheckCircle,
    color: "#10b981",
    label: "Success",
  },
  error: {
    icon: XCircle,
    color: "#ef4444",
    label: "Error",
  },
  info: {
    icon: Info,
    color: "#3b82f6",
    label: "Info",
  },
  warning: {
    icon: AlertTriangle,
    color: "#e5660f",
    label: "Warning",
  },
  default: {
    icon: Info,
    color: "#64748b",
    label: "Notice",
  },
};

const GLOBAL_TOAST_ID = "stolity-global-toast";

const defaultOptions = {
  position: "top-right",
  autoClose: 4000,
  hideProgressBar: true,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: false,
  closeButton: false,
  toastId: GLOBAL_TOAST_ID,
  className: "stolity-toast",
  bodyClassName: "stolity-toast-body",
};

/**
 * Global toast — Compact pill (white).
 * Only one toast at a time (shared toastId + ToastContainer limit={1}).
 *
 * @param {string} type success | error | warning | info
 * @param {string} message
 * @param {string} [title] optional; defaults to status label
 * @param {object} [options] react-toastify overrides
 */
export const showToast = (type, message, title = "", options = {}) => {
  const config = typeConfig[String(type || "").toLowerCase()] || typeConfig.default;
  const Icon = config.icon;
  const heading = title || config.label;

  // Hard-disable stacking: clear any existing toast first
  toast.dismiss();

  toast(
    ({ closeToast }) => (
      <div className="stolity-toast-pill" role="status">
        <span
          className="stolity-toast-pill-icon"
          style={{ background: config.color }}
          aria-hidden="true"
        >
          <Icon size={16} color="#fff" strokeWidth={2.25} />
        </span>
        <div className="stolity-toast-pill-copy">
          {heading ? (
            <p className="stolity-toast-pill-title">{heading}</p>
          ) : null}
          {message ? (
            <p className="stolity-toast-pill-msg">{message}</p>
          ) : null}
        </div>
        <button
          type="button"
          className="stolity-toast-pill-close"
          aria-label="Close"
          onClick={closeToast}
        >
          <X size={14} />
        </button>
      </div>
    ),
    {
      ...defaultOptions,
      ...options,
      toastId: GLOBAL_TOAST_ID,
    }
  );
};

export const ToastRoot = () => (
  <ToastContainer
    position="top-right"
    limit={1}
    newestOnTop={false}
    closeButton={false}
    hideProgressBar
    autoClose={4000}
    draggable={false}
    className="stolity-toast-container"
    style={{ zIndex: 99999 }}
  />
);
