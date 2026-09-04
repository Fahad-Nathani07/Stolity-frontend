import React from "react";
import { FaUndo } from "react-icons/fa";
import "./BulkSelectionToolbar.css";

function ActionButton({ label, onClick, className = "", tone = "default", children }) {
  return (
    <li>
      <button
        type="button"
        aria-label={label}
        data-tooltip={label}
        onClick={onClick}
        className={`bulk-selection-toolbar__action-btn bulk-selection-toolbar__action-btn--${tone} ${className}`.trim()}
      >
        {children}
      </button>
    </li>
  );
}

/**
 * Shared bulk-selection toolbar for Files, NestedPage, Favourites, RecycleBin.
 * Uses original selected_table_row styling from global CSS.
 */
export default function BulkSelectionToolbar({
  selectedCount = 0,
  isSelectAll = false,
  onSelectAllToggle,
  variant = "files",
  showCopy = true,
  onDownload,
  onCopy,
  onMove,
  onDelete,
  onRestore,
}) {
  if (selectedCount <= 0) return null;

  return (
    <div className="selected_table_row">
      <div className="selected_table_text">
        <span>{selectedCount} Selected</span>
        <button type="button" onClick={onSelectAllToggle} className="button-18">
          {isSelectAll ? "Deselect All" : "Select All"}
        </button>
      </div>

      <ul className="selected_table_icons" style={{ gap: 0 }}>
        {variant === "files" ? (
          <>
            <ActionButton
              label="Download all selected files"
              onClick={onDownload}
              className="icon-download"
            />
            {showCopy && (
              <ActionButton
                label="Copy all selected files"
                onClick={onCopy}
                className="icon-copy"
              />
            )}
            <ActionButton
              label="Move selected files and folders"
              onClick={onMove}
              className="icon-move"
            />
            <ActionButton
              label="All selected files will be moved to Recycle Bin"
              onClick={onDelete}
              className="icon-delete2"
              tone="danger"
            />
          </>
        ) : (
          <>
            <ActionButton
              label="Restore selected items"
              onClick={onRestore}
              tone="success"
            >
              <FaUndo />
            </ActionButton>
            <ActionButton
              label="Permanently delete selected items"
              onClick={onDelete}
              className="icon-delete2"
              tone="danger"
            />
          </>
        )}
      </ul>
    </div>
  );
}
