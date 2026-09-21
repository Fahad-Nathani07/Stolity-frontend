import React from "react";
import {
  isItemSelected,
  toggleFileSelection,
} from "./fileSelectionStore";

/**
 * Uncontrolled row checkbox. Select-all updates via DOM in the store
 * using [data-file-select] (no React re-render per row).
 */
export default function RowSelectCheckbox({
  fileName,
  isFolder = false,
  disabled = false,
  id,
  className,
  style,
  onClick,
}) {
  return (
    <input
      id={id || undefined}
      data-file-select={fileName}
      data-file-folder={isFolder ? "1" : "0"}
      type="checkbox"
      className={className}
      style={style}
      disabled={disabled}
      defaultChecked={disabled ? false : isItemSelected(fileName, isFolder)}
      onClick={onClick}
      onChange={() => {
        if (disabled) return;
        toggleFileSelection(fileName, isFolder);
      }}
    />
  );
}
