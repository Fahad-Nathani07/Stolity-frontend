import React, { useCallback, useSyncExternalStore } from "react";
import BulkSelectionToolbar from "./BulkSelectionToolbar";
import {
  subscribeSelectionChrome,
  getFileSelectionCount,
  getFolderSelectionKeys,
  getPageSelectAllState,
  toggleSelectAllPage,
  clearFileSelection,
} from "./fileSelectionStore";

/**
 * Bulk toolbar that subscribes to selection count — parent page does not re-render.
 */
export default function StoreBulkSelectionToolbar({
  pageItems,
  variant = "files",
  showCopy: showCopyProp = true,
  showDownload = true,
  onDownload,
  onCopy,
  onMove,
  onDelete,
  onRestore,
}) {
  const itemsRef = React.useRef(pageItems);
  itemsRef.current = pageItems;

  const getCount = useCallback(() => getFileSelectionCount(), []);
  const selectedCount = useSyncExternalStore(
    subscribeSelectionChrome,
    getCount,
    getCount
  );

  const getSelectAll = useCallback(() => {
    return getPageSelectAllState(itemsRef.current).checked;
  }, []);
  const isSelectAll = useSyncExternalStore(
    subscribeSelectionChrome,
    getSelectAll,
    getSelectAll
  );

  const getFolderCount = useCallback(() => getFolderSelectionKeys().length, []);
  const folderCount = useSyncExternalStore(
    subscribeSelectionChrome,
    getFolderCount,
    getFolderCount
  );

  return (
    <BulkSelectionToolbar
      selectedCount={selectedCount}
      isSelectAll={isSelectAll}
      onSelectAllToggle={() => toggleSelectAllPage(itemsRef.current)}
      onClear={clearFileSelection}
      variant={variant}
      showCopy={showCopyProp && folderCount === 0}
      showDownload={showDownload}
      onDownload={onDownload}
      onCopy={onCopy}
      onMove={onMove}
      onDelete={onDelete}
      onRestore={onRestore}
    />
  );
}
