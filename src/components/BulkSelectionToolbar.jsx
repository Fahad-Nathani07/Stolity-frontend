import React from "react";
import { History as RotateCcwClock } from "lucide-react";
import { FiX } from "react-icons/fi";
import { Tooltip, Whisper } from "rsuite";
import "rsuite/Tooltip/styles/index.css";
import "./BulkSelectionToolbar.css";

function ActionButton({
  label,
  onClick,
  className = "",
  tone = "default",
  disabled = false,
  placement = "top",
  children,
}) {
  const button = (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      className={`bulk-selection-toolbar__action-btn bulk-selection-toolbar__action-btn--${tone} ${className}`.trim()}
    >
      {children}
    </button>
  );

  if (disabled) {
    return <li>{button}</li>;
  }

  return (
    <li>
      <Whisper
        placement={placement}
        trigger="hover"
        delayOpen={180}
        delayClose={80}
        enterable={false}
        preventOverflow
        container={() => document.body}
        speaker={
          <Tooltip className="bulk-selection-toolbar__tooltip">
            {label}
          </Tooltip>
        }
      >
        <span className="bulk-selection-toolbar__whisper-anchor">{button}</span>
      </Whisper>
    </li>
  );
}

function ActionsList({
  variant,
  showCopy,
  showDownload,
  onDownload,
  onCopy,
  onMove,
  onDelete,
  onRestore,
  isOpen,
}) {
  if (variant === "files") {
    return (
      <ul className="selected_table_icons bulk-selection-slot__actions">
        {showDownload && (
          <ActionButton
            label="Download all selected files"
            onClick={onDownload}
            className="icon-download"
            placement="topStart"
            disabled={!isOpen}
          />
        )}
        {showCopy && (
          <ActionButton
            label="Copy all selected files"
            onClick={onCopy}
            className="icon-copy"
            disabled={!isOpen}
          />
        )}
        <ActionButton
          label="Move selected files and folders"
          onClick={onMove}
          className="icon-move"
          disabled={!isOpen}
        />
        <ActionButton
          label="All selected files will be moved to Recycle Bin"
          onClick={onDelete}
          className="icon-delete2"
          tone="danger"
          placement="topEnd"
          disabled={!isOpen}
        />
      </ul>
    );
  }

  return (
    <ul className="selected_table_icons bulk-selection-slot__actions">
      <ActionButton
        label="Restore selected items"
        onClick={onRestore}
        tone="success"
        placement="topStart"
        disabled={!isOpen}
      >
        <RotateCcwClock size={18} strokeWidth={2} aria-hidden="true" />
      </ActionButton>
      <ActionButton
        label="Permanently delete selected items"
        onClick={onDelete}
        className="icon-delete2"
        tone="danger"
        placement="topEnd"
        disabled={!isOpen}
      />
    </ul>
  );
}

/**
 * Shared bulk-selection toolbar for Files, NestedPage, Favourites, RecycleBin.
 *
 * Default: floating bottom dock (no table layout jump).
 * Inline in-flow bar kept below (commented) as the previous approach.
 */
export default function BulkSelectionToolbar({
  selectedCount = 0,
  isSelectAll = false,
  onSelectAllToggle,
  onClear,
  variant = "files",
  showCopy = true,
  showDownload = true,
  onDownload,
  onCopy,
  onMove,
  onDelete,
  onRestore,
}) {
  const isOpen = selectedCount > 0;

  /* ─────────────────────────────────────────────────────────────
   * PREVIOUS (in-flow) bar — pushed the table / sticky header down.
   * Kept for reference; do not delete.
   *
  return (
    <div
      className={`selected_table_row bulk-selection-slot${isOpen ? " is-open" : ""}`}
      aria-hidden={!isOpen}
    >
      <div className="bulk-selection-slot__inner">
        <div className="bulk-selection-slot__bar">
          <div className="selected_table_text">
            <span>{selectedCount} Selected</span>
            <button
              type="button"
              onClick={onSelectAllToggle}
              className="button-18"
              disabled={!isOpen}
              tabIndex={isOpen ? 0 : -1}
            >
              {isSelectAll ? "Deselect All" : "Select All"}
            </button>
          </div>
          <ActionsList
            variant={variant}
            showCopy={showCopy}
            showDownload={showDownload}
            onDownload={onDownload}
            onCopy={onCopy}
            onMove={onMove}
            onDelete={onDelete}
            onRestore={onRestore}
            isOpen={isOpen}
          />
        </div>
      </div>
    </div>
  );
   * ───────────────────────────────────────────────────────────── */

  // NEW: fixed floating dock — overlays content, table stays put
  return (
    <div
      className={`bulk-selection-float${isOpen ? " is-open" : ""}`}
      aria-hidden={!isOpen}
      role="toolbar"
      aria-label="Bulk selection actions"
    >
      <div className="bulk-selection-float__pill">
        <div className="bulk-selection-float__count">
          <span className="bulk-selection-float__count-num">{selectedCount}</span>
          <span className="bulk-selection-float__count-label">selected</span>
        </div>

        <div className="bulk-selection-float__divider" aria-hidden="true" />

        <button
          type="button"
          className="bulk-selection-float__text-btn"
          onClick={onSelectAllToggle}
          disabled={!isOpen}
          tabIndex={isOpen ? 0 : -1}
        >
          {isSelectAll ? "Deselect all" : "Select all"}
        </button>

        <div className="bulk-selection-float__divider" aria-hidden="true" />

        <ActionsList
          variant={variant}
          showCopy={showCopy}
          showDownload={showDownload}
          onDownload={onDownload}
          onCopy={onCopy}
          onMove={onMove}
          onDelete={onDelete}
          onRestore={onRestore}
          isOpen={isOpen}
        />

        <div className="bulk-selection-float__divider" aria-hidden="true" />

        <button
          type="button"
          className="bulk-selection-float__clear"
          onClick={onClear}
          disabled={!isOpen || !onClear}
          tabIndex={isOpen ? 0 : -1}
          aria-label="Clear selection"
          title="Clear selection"
        >
          <FiX aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
