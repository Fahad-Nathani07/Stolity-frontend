/**
 * External file-selection store.
 * Select-all paints DOM in one pass (no per-row React updates).
 */

const files = new Set();
const folders = new Set();
const rowListeners = new Set();
const chromeListeners = new Set();

function emitChrome() {
  chromeListeners.forEach((listener) => listener());
}

/** Row checkboxes (unused on select-all path) */
export function subscribeFileSelection(listener) {
  rowListeners.add(listener);
  return () => rowListeners.delete(listener);
}

/** Toolbar + header checkbox only */
export function subscribeSelectionChrome(listener) {
  chromeListeners.add(listener);
  return () => chromeListeners.delete(listener);
}

export function getFileSelectionKeys() {
  return Array.from(files);
}

export function getFolderSelectionKeys() {
  return Array.from(folders);
}

export function getFileSelectionCount() {
  return files.size + folders.size;
}

export function hasFileSelection() {
  return files.size > 0 || folders.size > 0;
}

export function isFileSelected(fileName) {
  return files.has(fileName);
}

export function isFolderSelected(fileName) {
  return folders.has(fileName);
}

export function isItemSelected(fileName, isFolder) {
  return isFolder ? folders.has(fileName) : files.has(fileName);
}

/**
 * Select-all / bulk paint: only rows with an enabled checkbox in the DOM.
 * Lets NestedPage select items inside a shared folder (isShared=true but checkbox enabled),
 * while Files.jsx shared-folder shortcuts stay excluded via disabled checkboxes.
 */
function isBulkSelectableItem(item) {
  if (!item?.fileName || item.fileName === "blackbox") return false;
  const el = findRowCheckbox(item.fileName);
  if (el) return !el.disabled;
  // Fallback before checkbox mounts: keep prior Files.jsx behavior
  return !item.isShared;
}

/** Snapshot for header checkbox: based on current page selectable items */
export function getPageSelectAllState(pageItems = []) {
  const selectable = pageItems.filter(isBulkSelectableItem);
  if (selectable.length === 0) {
    return { checked: false, indeterminate: false, selectedOnPage: 0, total: 0 };
  }
  let selectedOnPage = 0;
  for (let i = 0; i < selectable.length; i++) {
    const item = selectable[i];
    if (isItemSelected(item.fileName, item.isFolder)) selectedOnPage += 1;
  }
  return {
    checked: selectedOnPage === selectable.length,
    indeterminate: selectedOnPage > 0 && selectedOnPage < selectable.length,
    selectedOnPage,
    total: selectable.length,
  };
}

function findRowCheckbox(fileName) {
  if (typeof document === "undefined" || fileName == null) return null;
  const safe =
    typeof CSS !== "undefined" && typeof CSS.escape === "function"
      ? CSS.escape(String(fileName))
      : String(fileName).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return document.querySelector(`input[data-file-select="${safe}"]`);
}

export function toggleFileSelection(fileName, isFolder) {
  const bucket = isFolder ? folders : files;
  if (bucket.has(fileName)) bucket.delete(fileName);
  else bucket.add(fileName);
  const el = findRowCheckbox(fileName);
  if (el && !el.disabled) {
    el.checked = bucket.has(fileName);
    el.indeterminate = false;
  }
  syncSelectionDomClass();
  emitChrome();
}

function beginBulkSelectPaint() {
  if (typeof document === "undefined") return [];
  const roots = document.querySelectorAll(
    "#filestable, #dataView, #listViewContent, .files-card-view-header"
  );
  roots.forEach((el) => el.classList.add("files-bulk-selecting"));
  return roots;
}

function endBulkSelectPaint(roots) {
  if (!roots || !roots.length) return;
  // Next frame so the checked paint lands without transition/style thrash
  requestAnimationFrame(() => {
    roots.forEach((el) => el.classList.remove("files-bulk-selecting"));
  });
}

/** One query — avoid getElementById per row (paths break ids / thrash layout) */
function paintPageCheckboxes(pageItems, selected) {
  if (typeof document === "undefined") return;

  const allow = new Set();
  for (let i = 0; i < pageItems.length; i++) {
    const item = pageItems[i];
    if (!isBulkSelectableItem(item)) continue;
    allow.add(item.fileName);
  }

  const nodes = document.querySelectorAll("input[data-file-select]");
  for (let i = 0; i < nodes.length; i++) {
    const el = nodes[i];
    if (el.disabled) continue;
    const key = el.getAttribute("data-file-select");
    if (!allow.has(key)) continue;
    el.checked = selected;
    el.indeterminate = false;
  }

  const headers = document.querySelectorAll("#check-Atharva");
  for (let i = 0; i < headers.length; i++) {
    headers[i].checked = selected;
    headers[i].indeterminate = false;
  }
}

function applyPageSelection(pageItems, selected) {
  for (let i = 0; i < pageItems.length; i++) {
    const item = pageItems[i];
    if (!isBulkSelectableItem(item)) continue;
    if (selected) {
      if (item.isFolder) folders.add(item.fileName);
      else files.add(item.fileName);
    } else if (item.isFolder) {
      folders.delete(item.fileName);
    } else {
      files.delete(item.fileName);
    }
  }

  const roots = beginBulkSelectPaint();
  paintPageCheckboxes(pageItems, selected);

  // Defer chrome (toolbar + has-bulk-selection) so checkbox paint isn't blocked
  requestAnimationFrame(() => {
    syncSelectionDomClass();
    emitChrome();
    endBulkSelectPaint(roots);
  });
}

export function selectPageItems(pageItems = []) {
  applyPageSelection(pageItems, true);
}

export function deselectPageItems(pageItems = []) {
  applyPageSelection(pageItems, false);
}

export function toggleSelectAllPage(pageItems = []) {
  const { checked } = getPageSelectAllState(pageItems);
  if (checked) deselectPageItems(pageItems);
  else selectPageItems(pageItems);
  return !checked;
}

export function clearFileSelection() {
  if (files.size === 0 && folders.size === 0) return;
  files.clear();
  folders.clear();
  if (typeof document !== "undefined") {
    const roots = beginBulkSelectPaint();
    const nodes = document.querySelectorAll("input[data-file-select]");
    for (let i = 0; i < nodes.length; i++) {
      const el = nodes[i];
      if (el.disabled) continue;
      el.checked = false;
      el.indeterminate = false;
    }
    const headers = document.querySelectorAll("#check-Atharva");
    for (let i = 0; i < headers.length; i++) {
      headers[i].checked = false;
      headers[i].indeterminate = false;
    }
    requestAnimationFrame(() => {
      syncSelectionDomClass();
      emitChrome();
      endBulkSelectPaint(roots);
    });
    return;
  }
  syncSelectionDomClass();
  emitChrome();
}

export function setFileSelection(nextFiles = [], nextFolders = []) {
  files.clear();
  folders.clear();
  for (let i = 0; i < nextFiles.length; i++) files.add(nextFiles[i]);
  for (let i = 0; i < nextFolders.length; i++) folders.add(nextFolders[i]);
  syncSelectionDomClass();
  emitChrome();
}

/** DOM class for row-action disable styling without page re-render */
export function syncSelectionDomClass() {
  const has = hasFileSelection();
  document
    .querySelectorAll(".stolity-list-sticky, #dataView, #listViewContent")
    .forEach((el) => {
      el.classList.toggle("has-bulk-selection", has);
    });
}

export function subscribeFileSelectionWithDom(listener) {
  const wrapped = () => {
    syncSelectionDomClass();
    listener();
  };
  return subscribeSelectionChrome(wrapped);
}
