// src/components/ToastProvider.jsx

import { ToastContainer, toast } from "react-toastify";
import {
  CheckCircle,
  XCircle,
  Info,
  AlertTriangle,
} from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

// ===== Type Config =====
const typeConfig = {
  success: {
    icon: CheckCircle,
    bg: "#ffffff",              // 90% white + 10% soft green tint
    border: "#10b981",          // emerald-500 (kept vibrant)
    iconColor: "#059669",       // emerald-600
  },
  error: {
    icon: XCircle,
    bg: "#ffffff",              // 90% white + 10% soft red tint
    border: "#ef4444",          // red-500
    iconColor: "#b91c1c",       // red-700
  },
  info: {
    icon: Info,
    bg: "#ffffff",              // 90% white + 10% soft blue tint
    border: "#3b82f6",          // blue-500
    iconColor: "#1d4ed8",       // blue-700
  },
  warning: {
    icon: AlertTriangle,
    bg: "#ffffff",              // 90% white + 10% soft amber tint
    border: "#f59e0b",          // amber-500
    iconColor: "#b45309",       // amber-700
  },
  default: {
    icon: Info,
    bg: "#ffffff",              // 90% white + 10% soft gray tint
    border: "#9ca3af",          // gray-400 (softer)
    iconColor: "#4b5563",       // gray-600
  },
};

// ===== Default Options =====
const defaultOptions = {
  position: "top-right",
  autoClose: 4000,
  hideProgressBar: true,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

// Global variable to track the current active toast ID
let activeToastId = null;

// ===== Main Function – Replace previous toast =====
export const showToast = (
  type,
  message,
  title = "",
  options = {}
) => {
  const config = typeConfig[type?.toLowerCase()] || typeConfig.default;

  const Icon = config.icon;

  const content = (
    <div
      style={{
        display: "flex",
        gap: "12px",
        alignItems: "flex-start",
      }}
    >
      <Icon
        size={20}
        color={config.iconColor}
        style={{ marginTop: 2 }}
      />

      <div>
        {title && (
          <div
            style={{
              fontWeight: 600,
              fontSize: "14px",
              marginBottom: "2px",
              color: "#111827",
            }}
          >
            {title}
          </div>
        )}
        <div
          style={{
            fontSize: "13px",
            color: "#374151",
          }}
        >
          {message}
        </div>
      </div>
    </div>
  );

  // If there's an existing toast, dismiss it first
  if (activeToastId) {
    toast.dismiss(activeToastId);
  }

  // Show new toast and store its ID
  const id = toast(content, {
    ...defaultOptions,
    ...options,
    style: {
      background: config.bg,
      borderLeft: `4px solid ${config.border}`,
      borderRadius: "12px",
      padding: "14px 16px",
      boxShadow: "0 8px 25px rgba(0,0,0,0.06)",
      fontFamily: '"SF Pro", "SFProText", -apple-system, BlinkMacSystemFont, sans-serif',
      minWidth: "420px",
      maxWidth: "520px",
    },
  });

  activeToastId = id;
};

// ===== Root Container =====
export const ToastRoot = () => (
  <ToastContainer
    newestOnTop
    closeButton={false}
    style={{ zIndex: 99999, paddingBottom: "0" }}
  />
);