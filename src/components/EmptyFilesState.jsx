import React from "react";
import empty_folder from "../images/empty_folder.svg";

const EMPTY_COPY = {
  files: {
    title: "No files or folders yet",
    description:
      "Start by uploading your first file or creating a new folder to keep your workspace organised.",
    filteredTitle: "No matches found",
    filteredDescription:
      "Nothing matches your current filters or search. Try adjusting or clearing them to see more items.",
  },
  favourites: {
    title: "No favourites yet",
    description:
      "Files and folders you mark as favourite will appear here for quick access.",
    filteredTitle: "No favourites found",
    filteredDescription:
      "Nothing matches your current filters or search. Try adjusting or clearing them.",
  },
  recycleBin: {
    title: "Recycle bin is empty",
    description:
      "Deleted files and folders will appear here. You can restore them or delete permanently.",
    filteredTitle: "No matches found",
    filteredDescription:
      "Nothing in the recycle bin matches your current filters or search. Try adjusting or clearing them.",
  },
};

/**
 * Shared empty state for list + card file views.
 * @param {boolean} isFiltered - true when active filters/search yield no results
 * @param {"files"|"favourites"|"recycleBin"} variant - page-specific copy
 */
const EmptyFilesState = ({ isFiltered = false, variant = "files" }) => {
  const copy = EMPTY_COPY[variant] || EMPTY_COPY.files;

  return (
    <div
      style={{
        width: "100%",
        height: "calc(72vh - 20px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        background: "linear-gradient(135deg, #fafbff 0%, #f5f7fb 100%)",
        borderRadius: "16px",
        border: "1px solid rgba(15, 23, 42, 0.06)",
        boxSizing: "border-box",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "320px" }}>
        <div
          style={{
            width: 195,
            height: 120,
            margin: "0 auto 16px",
            borderRadius: "999px",
            background: "rgba(59, 130, 246, 0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#2563eb",
            fontSize: 22,
            fontWeight: 600,
          }}
        >
          <img src={empty_folder} alt="" />
        </div>

        <div
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "#0f172a",
            marginBottom: 6,
          }}
        >
          {isFiltered ? copy.filteredTitle : copy.title}
        </div>

        <div
          style={{
            fontSize: 13,
            color: "#64748b",
            lineHeight: 1.6,
          }}
        >
          {isFiltered ? copy.filteredDescription : copy.description}
        </div>
      </div>
    </div>
  );
};

export default EmptyFilesState;
