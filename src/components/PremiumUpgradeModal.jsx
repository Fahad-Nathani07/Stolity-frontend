import React, { useEffect } from "react";
import { FiX, FiCheck, FiArrowRight } from "react-icons/fi";
import { HiOutlineSparkles } from "react-icons/hi2";
import crownIcon from "../images/crown.svg";
import "./PremiumUpgradeModal.css";
import {Crown} from 'lucide-react';

const DEFAULT_PERKS = [
  "File type filters & advanced sort",
  "Faster workflows across your files",
  "Premium tools built for power users",
];

export default function PremiumUpgradeModal({
  isOpen,
  onClose,
  onUpgrade,
  title = "Unlock Premium",
  description = "This action is available on Stolity Premium. Upgrade your plan to continue.",
  cancelLabel = "Not now",
  confirmLabel = "Upgrade plan",
  perks = DEFAULT_PERKS,
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
          <button
            type="button"
            className="premium-upgrade-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <FiX />
          </button>

          <div className="premium-upgrade-hero">
            <div className="premium-upgrade-icon-ring" aria-hidden="true">
              <div className="premium-upgrade-icon-wrap">
                <img src={crownIcon} alt="" className="premium-upgrade-crown" />
                {/* <Crown className="premium-upgrade-crown" color="#c4231c" /> */}
              </div>
            </div>
            <span className="premium-upgrade-badge">
              <HiOutlineSparkles aria-hidden="true" />
              Stolity Premium
            </span>
            <h2 id="premium-upgrade-title" className="premium-upgrade-title">
              {title}
            </h2>
            <p className="premium-upgrade-text">{description}</p>
          </div>

          <ul className="premium-upgrade-perks">
            {(Array.isArray(perks) ? perks : DEFAULT_PERKS).map((perk) => (
              <li key={perk}>
                <span className="premium-upgrade-perk-check" aria-hidden="true">
                  <FiCheck />
                </span>
                <span>{perk}</span>
              </li>
            ))}
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
              <FiArrowRight aria-hidden="true" />
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
