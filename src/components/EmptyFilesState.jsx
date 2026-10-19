import React from "react";
import empty_folder from "../images/empty_folder.svg";
import "./EmptyFilesState.css";

const EMPTY_COPY = {
  files: {
    title: "This folder is empty",
    description:
      "Upload files or create a new folder here to add content to this location.",
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
    <div className="files-empty-state">
      <div className="files-empty-state__inner">
        <div className="files-empty-state__art" aria-hidden="true">
          <img src={empty_folder} alt="" />
        </div>

        <div className="files-empty-state__title">
          {isFiltered ? copy.filteredTitle : copy.title}
        </div>

        <div className="files-empty-state__desc">
          {isFiltered ? copy.filteredDescription : copy.description}
        </div>
      </div>
    </div>
  );
};

export default EmptyFilesState;
