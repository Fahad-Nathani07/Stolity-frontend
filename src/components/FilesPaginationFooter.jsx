import React, { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "./FilesPaginationFooter.css";

const DEFAULT_PAGE_SIZES = [10, 15, 25, 50, 100];
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingCustom, setEditingCustom] = useState(false);
  const [customDraft, setCustomDraft] = useState(String(itemsPerPage || 15));
  const customInputRef = useRef(null);
  const sizeControlRef = useRef(null);

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

  useEffect(() => {
    if (!menuOpen) return undefined;

    const onPointerDown = (e) => {
      if (!sizeControlRef.current?.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const totalPages = Math.max(1, Math.ceil(totalEntries / itemsPerPage) || 1);
  const page = Math.min(Math.max(1, currentPage), totalPages);
  const startItem = totalEntries === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const endItem = Math.min(page * itemsPerPage, totalEntries);
  const canPrev = page > 1 && totalEntries > 0;
  const canNext = page < totalPages && totalEntries > 0;

  const displaySize = Number(itemsPerPage) || 15;

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
    setMenuOpen(false);
    if (nextSize !== Number(itemsPerPage)) {
      onItemsPerPageChange?.(nextSize);
    }
  };

  const cancelCustomEdit = () => {
    setCustomDraft(String(itemsPerPage || 15));
    setEditingCustom(false);
  };

  const selectPreset = (nextSize) => {
    setEditingCustom(false);
    setMenuOpen(false);
    if (nextSize !== Number(itemsPerPage)) {
      onItemsPerPageChange?.(nextSize);
    }
  };

  const openCustomEditor = () => {
    setMenuOpen(false);
    setCustomDraft(isPreset ? "" : String(itemsPerPage || ""));
    setEditingCustom(true);
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
              ref={sizeControlRef}
              className={`fp-size-control${editingCustom ? " is-editing" : ""}${
                menuOpen ? " is-open" : ""
              }`}
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
                <>
                  <button
                    type="button"
                    id="fp-page-size"
                    className="fp-size-trigger"
                    onClick={() => setMenuOpen((open) => !open)}
                    aria-labelledby="fp-page-size-label"
                    aria-label="Rows per page"
                    aria-haspopup="listbox"
                    aria-expanded={menuOpen}
                  >
                    <span className="fp-size-trigger-value">{displaySize}</span>
                    <ChevronDown
                      className={`fp-size-chevron${menuOpen ? " is-open" : ""}`}
                      size={14}
                      strokeWidth={2.4}
                      aria-hidden
                    />
                  </button>

                  {menuOpen ? (
                    <div
                      className="fp-size-menu"
                      role="listbox"
                      aria-labelledby="fp-page-size-label"
                    >
                      <div className="fp-size-menu-title">Rows per page</div>
                      {presets.map((size) => {
                        const selected = Number(itemsPerPage) === size;
                        return (
                          <button
                            key={size}
                            type="button"
                            role="option"
                            aria-selected={selected}
                            className={`fp-size-option${
                              selected ? " is-selected" : ""
                            }`}
                            onClick={() => selectPreset(size)}
                          >
                            <span>{size}</span>
                            {selected ? (
                              <Check
                                className="fp-size-check"
                                size={14}
                                strokeWidth={2.5}
                                aria-hidden
                              />
                            ) : null}
                          </button>
                        );
                      })}
                      {!isPreset ? (
                        <button
                          type="button"
                          role="option"
                          aria-selected
                          className="fp-size-option is-selected"
                          onClick={() => openCustomEditor()}
                        >
                          <span>{itemsPerPage}</span>
                          <Check
                            className="fp-size-check"
                            size={14}
                            strokeWidth={2.5}
                            aria-hidden
                          />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        role="option"
                        aria-selected={false}
                        className="fp-size-option fp-size-option--custom"
                        onClick={openCustomEditor}
                      >
                        <span>Custom…</span>
                      </button>
                    </div>
                  ) : null}
                </>
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
