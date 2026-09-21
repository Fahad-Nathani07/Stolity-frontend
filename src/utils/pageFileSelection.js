/**
 * Page-scoped file/folder selection helpers (select-all / indeterminate).
 */

export function getSelectablePageItems(list = []) {
  return list.filter(
    (file) => file?.fileName !== "blackbox" && !file?.isShared
  );
}

export function partitionSelectableNames(items = []) {
  const files = [];
  const folders = [];
  for (let i = 0; i < items.length; i++) {
    const file = items[i];
    if (file.isFolder) folders.push(file.fileName);
    else files.push(file.fileName);
  }
  return { files, folders };
}

export function countSelectedOnPage(items, keysSet, keys2Set) {
  let n = 0;
  for (let i = 0; i < items.length; i++) {
    const file = items[i];
    if (file.isFolder ? keys2Set.has(file.fileName) : keysSet.has(file.fileName)) {
      n += 1;
    }
  }
  return n;
}

export function mergeUniqueNames(prev, additions) {
  if (!additions.length) return prev;
  const set = new Set(prev);
  const before = set.size;
  for (let i = 0; i < additions.length; i++) set.add(additions[i]);
  if (set.size === before) return prev;
  return Array.from(set);
}

export function removeNames(prev, removeSet) {
  if (!removeSet.size || !prev.length) return prev;
  const next = prev.filter((k) => !removeSet.has(k));
  return next.length === prev.length ? prev : next;
}

/** Paint select-all instantly; clear after React selection state commits. */
export function setOptimisticPageSelection(selecting) {
  const roots = [
    document.getElementById("listViewContent"),
    document.getElementById("dataView"),
  ].filter(Boolean);
  const seen = new Set();
  for (const root of roots) {
    if (seen.has(root)) continue;
    seen.add(root);
    root.classList.toggle("files-select-all-optimistic", selecting);
    root.classList.toggle("files-select-none-optimistic", !selecting);
  }
}

export function clearOptimisticPageSelection() {
  document
    .querySelectorAll(
      ".files-select-all-optimistic, .files-select-none-optimistic"
    )
    .forEach((el) => {
      el.classList.remove(
        "files-select-all-optimistic",
        "files-select-none-optimistic"
      );
    });
}
