import React from "react";
import "./FolderPickerSkeleton.css";

const FolderPickerSkeleton = ({ count = 6 }) => (
  <div className="fps-skeleton-list" aria-hidden="true">
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="fps-skeleton-row">
        <div className="fps-skeleton-icon" />
        <div className="fps-skeleton-text" style={{ width: `${58 + (i % 3) * 12}%` }} />
      </div>
    ))}
  </div>
);

export default FolderPickerSkeleton;
