export const BULK_ROW_ACTION_TOAST_MESSAGE =
  "Please clear your selection first, or use the action buttons in the top bar.";

export function isRowActionDisabledItem(file) {
  if (!file) return false;
  const name = String(file.fileName || "")
    .replace(/\/+$/, "")
    .trim()
    .toLowerCase();
  return (
    name === "blackbox" ||
    file.isShared === true ||
    file.isShared === "true"
  );
}

export function handleBulkSelectionRowActionClick(
  event,
  hasBulkSelection,
  showToast
) {
  if (!hasBulkSelection) return;
  event.preventDefault();
  event.stopPropagation();
  showToast("warning", BULK_ROW_ACTION_TOAST_MESSAGE);
}

export function closeAllRowDropdowns() {
  if (typeof document === "undefined") return;
  document.querySelectorAll(".dropdown.show").forEach((el) => {
    el.classList.remove("show");
    el.querySelectorAll(".dropdown-menu.show").forEach((menu) => {
      menu.classList.remove("show");
    });
  });
}

export function getBulkRowActionToggleProps(hasBulkSelection, showToast) {
  return {
    className: `dropdown-toggle${
      hasBulkSelection ? " row-action-bulk-disabled" : ""
    }`,
    "data-toggle": hasBulkSelection ? undefined : "dropdown",
    "aria-disabled": hasBulkSelection ? true : undefined,
    onClick: (e) =>
      handleBulkSelectionRowActionClick(e, hasBulkSelection, showToast),
  };
}

/** Disable ⋮ menu for blackbox + shared folders (no Bootstrap dropdown open). */
export function getRestrictedRowActionToggleProps(file) {
  const disabled = isRowActionDisabledItem(file);
  return {
    className: `dropdown-toggle${
      disabled ? " row-action-bulk-disabled" : ""
    }`,
    "data-toggle": disabled ? undefined : "dropdown",
    "aria-disabled": disabled ? true : undefined,
    title: disabled ? "Actions not available for this item" : undefined,
    onClick: disabled
      ? (e) => {
          e.preventDefault();
          e.stopPropagation();
        }
      : undefined,
  };
}
