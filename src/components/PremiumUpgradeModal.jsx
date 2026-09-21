import React, { useEffect } from "react";
import { FiX } from "react-icons/fi";
import { HiOutlineSparkles } from "react-icons/hi2";
import crownIcon from "../images/crown.svg";
import "./PremiumUpgradeModal.css";

export default function PremiumUpgradeModal({
  isOpen,
  onClose,
  onUpgrade,
  title = "Unlock Premium Feature",
  description = "This action is available for premium users only. Upgrade your Stolity plan to continue.",
  cancelLabel = "Not now",
  confirmLabel = "Upgrade plan",
  zIndex,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="premium-upgrade-overlay"
      style={zIndex != null ? { zIndex } : undefined}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="premium-upgrade-dialog"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="premium-upgrade-title"
      >
        <div className="premium-upgrade-card">
          <header className="premium-upgrade-header">
            <div className="premium-upgrade-header-main">
              <div className="premium-upgrade-icon-wrap" aria-hidden="true">
                <img src={crownIcon} alt="" className="premium-upgrade-crown" />
              </div>
              <div className="premium-upgrade-header-text">
                <span className="premium-upgrade-badge">
                  <HiOutlineSparkles aria-hidden="true" />
                  Stolity Premium
                </span>
                <h2 id="premium-upgrade-title" className="premium-upgrade-title">
                  {title}
                </h2>
                <p className="premium-upgrade-text">{description}</p>
              </div>
            </div>
            <button
              type="button"
              className="premium-upgrade-close-btn"
              onClick={onClose}
              aria-label="Close"
            >
              <FiX />
            </button>
          </header>

          <ul className="premium-upgrade-perks">
            <li>File type filters &amp; advanced sort</li>
            <li>Faster workflows across your files</li>
            <li>Premium tools built for power users</li>
          </ul>

          <footer className="premium-upgrade-actions">
            <button
              type="button"
              className="premium-upgrade-btn premium-upgrade-btn--ghost"
              onClick={onClose}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              className="premium-upgrade-btn premium-upgrade-btn--primary"
              onClick={() => {
                onClose?.();
                onUpgrade?.();
              }}
            >
              {confirmLabel}
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
