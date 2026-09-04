import React, { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "./FilesPaginationFooter.css";

const DEFAULT_PAGE_SIZES = [10, 15, 25, 50, 100];
const CUSTOM_VALUE = "__custom__";
const MIN_ROWS = 1;
const MAX_ROWS = 500;

/**
 * Shared list pagination bar for Files / Nested / Favourites / RecycleBin.
 */
const FilesPaginationFooter = ({
  totalEntries = 0,
  currentPage = 1,
  itemsPerPage = 15,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
}) => {
  const presets = pageSizeOptions;
  const isPreset = presets.includes(Number(itemsPerPage));
  const [editingCustom, setEditingCustom] = useState(false);
  const [customDraft, setCustomDraft] = useState(String(itemsPerPage || 15));
  const customInputRef = useRef(null);

  useEffect(() => {
    if (!editingCustom) {
      setCustomDraft(String(itemsPerPage || 15));
    }
  }, [itemsPerPage, editingCustom]);

  useEffect(() => {
    if (editingCustom && customInputRef.current) {
      customInputRef.current.focus();
      customInputRef.current.select();
    }
  }, [editingCustom]);

  const totalPages = Math.max(1, Math.ceil(totalEntries / itemsPerPage) || 1);
  const page = Math.min(Math.max(1, currentPage), totalPages);
  const startItem = totalEntries === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const endItem = Math.min(page * itemsPerPage, totalEntries);
  const canPrev = page > 1 && totalEntries > 0;
  const canNext = page < totalPages && totalEntries > 0;

  const selectValue = editingCustom
    ? CUSTOM_VALUE
    : isPreset
      ? String(itemsPerPage)
      : String(itemsPerPage);

  const goTo = (nextPage) => {
    const clamped = Math.min(Math.max(1, nextPage), totalPages);
    if (clamped !== currentPage) onPageChange?.(clamped);
  };

  const applyCustomSize = (raw) => {
    const parsed = Number(String(raw).replace(/\D/g, ""));
    if (!Number.isFinite(parsed) || parsed < MIN_ROWS) {
      setCustomDraft(String(itemsPerPage || 15));
      setEditingCustom(false);
      return;
    }
    const nextSize = Math.min(MAX_ROWS, Math.max(MIN_ROWS, parsed));
    setCustomDraft(String(nextSize));
    setEditingCustom(false);
    if (nextSize !== Number(itemsPerPage)) {
      onItemsPerPageChange?.(nextSize);
    }
  };

  const cancelCustomEdit = () => {
    setCustomDraft(String(itemsPerPage || 15));
    setEditingCustom(false);
  };

  const handleSelectChange = (e) => {
    const value = e.target.value;
    if (value === CUSTOM_VALUE) {
      setCustomDraft(isPreset ? "" : String(itemsPerPage || ""));
      setEditingCustom(true);
      return;
    }
    const nextSize = Number(value);
    if (!Number.isFinite(nextSize) || nextSize <= 0) return;
    setEditingCustom(false);
    onItemsPerPageChange?.(nextSize);
  };

  return (
    <footer className="files-pagination-footer">
      <div className="fp-bar">
        <div className="fp-left">
          <div className="fp-size">
            <span className="fp-size-label" id="fp-page-size-label">
              Rows per page
            </span>

            <div
              className={`fp-size-control${editingCustom ? " is-editing" : ""}`}
            >
              {editingCustom ? (
                <>
                  <input
                    ref={customInputRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="fp-custom-input"
                    value={customDraft}
                    placeholder="e.g. 12"
                    onChange={(e) =>
                      setCustomDraft(e.target.value.replace(/\D/g, "").slice(0, 3))
                    }
                    onBlur={(e) => {
                      // Allow Apply button click before closing
                      const next = e.relatedTarget;
                      if (next?.closest?.(".fp-custom-apply")) return;
                      if (customDraft.trim()) {
                        applyCustomSize(customDraft);
                      } else {
                        cancelCustomEdit();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        applyCustomSize(customDraft);
                      } else if (e.key === "Escape") {
                        e.preventDefault();
                        cancelCustomEdit();
                      }
                    }}
                    aria-labelledby="fp-page-size-label"
                    aria-label="Custom rows per page"
                    title={`Enter ${MIN_ROWS}–${MAX_ROWS}`}
                  />
                  <button
                    type="button"
                    className="fp-custom-apply"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyCustomSize(customDraft)}
                    aria-label="Apply custom rows"
                    title="Apply"
                  >
                    <Check className="fp-custom-apply-icon" strokeWidth={2.5} />
                  </button>
                </>
              ) : (
                <select
                  id="fp-page-size"
                  className="fp-size-select"
                  value={selectValue}
                  onChange={handleSelectChange}
                  aria-labelledby="fp-page-size-label"
                  aria-label="Rows per page"
                >
                  {presets.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                  {!isPreset && (
                    <option value={String(itemsPerPage)}>{itemsPerPage}</option>
                  )}
                  <option value={CUSTOM_VALUE}>Custom…</option>
                </select>
              )}
            </div>
          </div>
        </div>

        <div className="fp-right">
          <span className="fp-range" aria-live="polite">
            {totalEntries > 0
              ? `${startItem}–${endItem} of ${totalEntries}`
              : "0 of 0"}
          </span>

          <div className="fp-nav" role="group" aria-label="Pagination">
            <button
              type="button"
              className="fp-btn"
              onClick={() => goTo(1)}
              disabled={!canPrev}
              aria-label="First page"
              title="First page"
            >
              <ChevronFirst className="fp-icon" />
            </button>
            <button
              type="button"
              className="fp-btn"
              onClick={() => goTo(page - 1)}
              disabled={!canPrev}
              aria-label="Previous page"
              title="Previous page"
            >
              <ChevronLeft className="fp-icon" />
            </button>

            <span className="fp-page-pill">
              <span className="fp-page-num">{page}</span>
              <span className="fp-page-of">/ {totalPages}</span>
            </span>

            <button
              type="button"
              className="fp-btn"
              onClick={() => goTo(page + 1)}
              disabled={!canNext}
              aria-label="Next page"
              title="Next page"
            >
              <ChevronRight className="fp-icon" />
            </button>
            <button
              type="button"
              className="fp-btn"
              onClick={() => goTo(totalPages)}
              disabled={!canNext}
              aria-label="Last page"
              title="Last page"
            >
              <ChevronLast className="fp-icon" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FilesPaginationFooter;
