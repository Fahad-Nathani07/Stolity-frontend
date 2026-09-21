/**
 * Positions file-row / card 3-dot menus (fixed to viewport):
 * - prefers sitting just left of the ⋯ button
 * - flips to the right when left space is tight (sidebar / small screens)
 * - shifts up only when it would overflow the footer / scrollport
 *
 * Stays in the React tree (no body portal) so action onClick handlers keep working.
 */
const MENU_SELECTOR = ".custom-dropdown-menu";
const DROPUP_CLASS = "ram-dropup";
const VIEWPORT_CLASS = "ram-viewport";
const OPEN_END_CLASS = "ram-open-end";
const EDGE_PAD = 8;
const H_GAP = 10; /* gap between menu and toggle */
const FALLBACK_MENU_HEIGHT = 340;
const FALLBACK_MENU_WIDTH = 240;

function resolveDropdown(eventTarget) {
  if (!eventTarget) return null;
  if (eventTarget.classList?.contains("dropdown")) return eventTarget;
  return (
    eventTarget.closest?.(".dropdown") ||
    eventTarget.querySelector?.(".dropdown") ||
    null
  );
}

function getScrollParent(dropdown) {
  return (
    dropdown?.closest?.(".content-wrapper") ||
    document.querySelector(
      ".main-panel:has(> .files-pagination-footer) > .content-wrapper"
    ) ||
    null
  );
}

function getStickyTopLimit(dropdown) {
  let top = 0;

  const filter = document.querySelector(".stolity-list-sticky .filerbar_row");
  if (filter) top = Math.max(top, filter.getBoundingClientRect().bottom);

  const thead = document.querySelector("#filestable thead");
  if (thead) top = Math.max(top, thead.getBoundingClientRect().bottom);

  const cardHeader = document.querySelector(".files-card-view-header");
  if (cardHeader) top = Math.max(top, cardHeader.getBoundingClientRect().bottom);

  const scrollParent = getScrollParent(dropdown);
  if (scrollParent) {
    top = Math.max(top, scrollParent.getBoundingClientRect().top);
  }

  return top;
}

function getBottomLimit(dropdown) {
  let bottom = window.innerHeight;
  if (window.visualViewport?.height) {
    bottom = Math.min(
      bottom,
      window.visualViewport.height + (window.visualViewport.offsetTop || 0)
    );
  }

  const footer = document.querySelector(".files-pagination-footer");
  if (footer) bottom = Math.min(bottom, footer.getBoundingClientRect().top);

  const scrollParent = getScrollParent(dropdown);
  if (scrollParent) {
    bottom = Math.min(bottom, scrollParent.getBoundingClientRect().bottom);
  }

  return bottom;
}

/** Left edge the menu must stay clear of (viewport pad + visible sidebar). */
function getLeftLimit() {
  let left = EDGE_PAD;
  const sidebar = document.querySelector(".sidebar.sidebar-offcanvas, .sidebar");
  if (sidebar) {
    const rect = sidebar.getBoundingClientRect();
    if (rect.width > 8 && rect.right > 4) {
      left = Math.max(left, Math.ceil(rect.right) + EDGE_PAD);
    }
  }
  return left;
}

function measureMenuHeight(menu) {
  const measured = Math.max(
    menu.getBoundingClientRect().height || 0,
    menu.scrollHeight || 0,
    menu.offsetHeight || 0
  );
  return measured > 40 ? measured : FALLBACK_MENU_HEIGHT;
}

function measureMenuWidth(menu) {
  const measured = Math.max(
    menu.getBoundingClientRect().width || 0,
    menu.scrollWidth || 0,
    menu.offsetWidth || 0
  );
  return measured > 80 ? measured : FALLBACK_MENU_WIDTH;
}

function clearMenuPlacement(menu) {
  if (!menu) return;
  menu.classList.remove(VIEWPORT_CLASS, OPEN_END_CLASS);
  [
    "position",
    "top",
    "bottom",
    "left",
    "right",
    "transform",
    "max-height",
    "overflow",
    "overflow-y",
    "width",
    "display",
    "opacity",
    "visibility",
    "pointer-events",
    "z-index",
  ].forEach((prop) => menu.style.removeProperty(prop));
}

function placeMenuFixed(menu, { top, right = null, left = null }) {
  menu.classList.add(VIEWPORT_CLASS);
  menu.classList.toggle(OPEN_END_CLASS, left != null);
  menu.style.setProperty("position", "fixed", "important");
  menu.style.setProperty("z-index", "10050", "important");
  menu.style.setProperty("bottom", "auto", "important");
  menu.style.setProperty("top", `${Math.max(EDGE_PAD, top)}px`, "important");
  menu.style.setProperty("transform", "none", "important");
  menu.style.setProperty("max-height", "none", "important");
  menu.style.setProperty("overflow", "visible", "important");

  if (left != null) {
    menu.style.setProperty("left", `${Math.max(EDGE_PAD, left)}px`, "important");
    menu.style.setProperty("right", "auto", "important");
  } else {
    menu.style.setProperty("left", "auto", "important");
    menu.style.setProperty(
      "right",
      `${Math.max(EDGE_PAD, right ?? EDGE_PAD)}px`,
      "important"
    );
  }
}

function positionDropdown(dropdown) {
  if (!dropdown?.classList.contains("show")) return;

  const toggle = dropdown.querySelector(".dropdown-toggle");
  const menu = dropdown.querySelector(MENU_SELECTOR);
  if (!toggle || !menu) return;

  const toggleRect = toggle.getBoundingClientRect();
  const limitTop = getStickyTopLimit(dropdown);
  const limitBottom = getBottomLimit(dropdown);
  const leftLimit = getLeftLimit();
  const menuHeight = measureMenuHeight(menu);
  const menuWidth = measureMenuWidth(menu);
  const viewportRight = window.innerWidth - EDGE_PAD;

  // Vertical: same row as toggle; shift up if needed
  let top = toggleRect.top;
  if (top + menuHeight > limitBottom - EDGE_PAD) {
    top = limitBottom - menuHeight - EDGE_PAD;
  }
  if (top < limitTop + EDGE_PAD) {
    top = limitTop + EDGE_PAD;
  }
  dropdown.classList.toggle(DROPUP_CLASS, top < toggleRect.top - 1);

  // Horizontal: prefer left of ⋯; flip right when it would hit sidebar / edge
  const preferredLeft = toggleRect.left - H_GAP - menuWidth;
  let left = null;
  let right = null;

  if (preferredLeft >= leftLimit) {
    right = window.innerWidth - toggleRect.left + H_GAP;
  } else {
    left = toggleRect.right + H_GAP;
    if (left + menuWidth > viewportRight) {
      left = Math.max(leftLimit, viewportRight - menuWidth);
    }
  }

  placeMenuFixed(menu, { top, right, left });

  const rect = menu.getBoundingClientRect();
  if (rect.bottom > limitBottom - 2) {
    const correctedTop = Math.max(
      limitTop + EDGE_PAD,
      limitBottom - rect.height - EDGE_PAD
    );
    dropdown.classList.add(DROPUP_CLASS);
    placeMenuFixed(menu, { top: correctedTop, right, left });
  }

  const after = menu.getBoundingClientRect();
  if (after.left < leftLimit - 1) {
    placeMenuFixed(menu, {
      top: after.top,
      left: leftLimit,
      right: null,
    });
  }
}

function onShow(event) {
  const dropdown = resolveDropdown(event.currentTarget || event.target);
  if (!dropdown?.querySelector(MENU_SELECTOR)) return;

  const run = () => positionDropdown(dropdown);
  run();
  requestAnimationFrame(() => {
    run();
    requestAnimationFrame(run);
  });
  window.setTimeout(run, 40);
}

function onHide(event) {
  const dropdown = resolveDropdown(event.currentTarget || event.target);
  if (!dropdown) return;
  dropdown.classList.remove(DROPUP_CLASS);
  clearMenuPlacement(dropdown.querySelector(MENU_SELECTOR));
}

function onToggleClick(event) {
  const toggle = event.target.closest?.(".dropdown-toggle");
  if (
    !toggle ||
    toggle.classList.contains("row-action-bulk-disabled") ||
    toggle.getAttribute("aria-disabled") === "true"
  ) {
    return;
  }
  const dropdown = toggle.closest(".dropdown");
  if (!dropdown?.querySelector(MENU_SELECTOR)) return;

  window.setTimeout(() => {
    if (dropdown.classList.contains("show")) {
      positionDropdown(dropdown);
      requestAnimationFrame(() => positionDropdown(dropdown));
    }
  }, 0);
}

function onReposition() {
  document.querySelectorAll(`.dropdown.show > ${MENU_SELECTOR}`).forEach((menu) => {
    const dropdown = menu.closest(".dropdown");
    if (dropdown) positionDropdown(dropdown);
  });
}

export function installRowActionDropdownPosition() {
  if (typeof document === "undefined") return () => {};

  const $ = window.jQuery || window.$;
  let jqBound = false;

  if ($?.fn?.on) {
    jqBound = true;
    $(document).on(
      "show.bs.dropdown.ramPos shown.bs.dropdown.ramPos",
      ".dropdown",
      onShow
    );
    $(document).on(
      "hide.bs.dropdown.ramPos hidden.bs.dropdown.ramPos",
      ".dropdown",
      onHide
    );
  }

  document.addEventListener("show.bs.dropdown", onShow, true);
  document.addEventListener("shown.bs.dropdown", onShow, true);
  document.addEventListener("hide.bs.dropdown", onHide, true);
  document.addEventListener("hidden.bs.dropdown", onHide, true);
  document.addEventListener("click", onToggleClick, true);
  window.addEventListener("resize", onReposition);
  document.addEventListener("scroll", onReposition, true);

  return () => {
    if (jqBound) $(document).off(".ramPos");
    document.removeEventListener("show.bs.dropdown", onShow, true);
    document.removeEventListener("shown.bs.dropdown", onShow, true);
    document.removeEventListener("hide.bs.dropdown", onHide, true);
    document.removeEventListener("hidden.bs.dropdown", onHide, true);
    document.removeEventListener("click", onToggleClick, true);
    window.removeEventListener("resize", onReposition);
    document.removeEventListener("scroll", onReposition, true);
  };
}
