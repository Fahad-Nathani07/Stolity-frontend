import React, { useId } from "react";
import LogoStolityMini from "../images/NewLogo.svg";
import "./brandLoaders.css";

export const BrandLogoMark = ({ size = 40, invert = false, className = "" }) => (
  <img
    src={LogoStolityMini}
    alt="Stolity"
    className={`bl-logo${invert ? " bl-logo--invert" : ""}${className ? ` ${className}` : ""}`}
    style={{ width: size, height: size }}
  />
);

export const RipplePulseMark = ({ size = 40 }) => (
  <div className="bl-ripple" aria-hidden="true">
    <span className="bl-ripple-ring" />
    <span className="bl-ripple-ring" />
    <BrandLogoMark size={size} />
  </div>
);

export const DualRingMark = ({ size = 40 }) => (
  <div className="bl-dual" aria-hidden="true">
    <BrandLogoMark size={size} />
  </div>
);

export const OrbitDotsMark = ({ size = 40 }) => (
  <div className="bl-orbit" aria-hidden="true">
    <span className="bl-orbit-dot" />
    <span className="bl-orbit-dot" />
    <span className="bl-orbit-dot" />
    <BrandLogoMark size={size} />
  </div>
);

export const ArcSpinnerMark = ({ size = 40 }) => {
  const gradId = useId().replace(/:/g, "");
  return (
    <div
      className="bl-arc"
      aria-hidden="true"
      style={{ width: size * 2.4, height: size * 2.4 }}
    >
      <svg className="bl-arc-svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e5660f" />
            <stop offset="50%" stopColor="#e7400c" />
            <stop offset="100%" stopColor="#e5252a" />
          </linearGradient>
        </defs>
        <circle className="bl-arc-track" cx="50" cy="50" r="40" />
        <circle
          className="bl-arc-progress"
          cx="50"
          cy="50"
          r="40"
          style={{ stroke: `url(#${gradId})` }}
        />
      </svg>
      <span className="bl-arc-logo">
        <BrandLogoMark size={size} />
      </span>
    </div>
  );
};

export const SoftProgressMark = ({ size = 40 }) => (
  <div className="bl-progress" aria-hidden="true">
    <BrandLogoMark size={size} />
    <div className="bl-progress-track">
      <span className="bl-progress-fill" />
    </div>
  </div>
);

export const BrandLoaderOverlay = ({ children }) => (
  <div className="bl-overlay" role="status" aria-label="Loading">
    {children}
  </div>
);
