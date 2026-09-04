export const BULK_ROW_ACTION_TOAST_MESSAGE =
  "Please clear your selection first, or use the action buttons in the top bar.";

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
