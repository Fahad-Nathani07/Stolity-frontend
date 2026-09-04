import { useCallback, useState } from "react";
import {
  getStoredItemsPerPage,
  setStoredItemsPerPage,
} from "../utils/listPageSize";

/**
 * Persists "Rows per page" across Files, NestedPage, Favourites, RecycleBin, etc.
 */
export default function useListPageSize() {
  const [itemsPerPage, setItemsPerPageState] = useState(getStoredItemsPerPage);

  const setItemsPerPage = useCallback((size) => {
    const next = Number(size);
    if (!Number.isFinite(next) || next <= 0) return;
    setStoredItemsPerPage(next);
    setItemsPerPageState(next);
  }, []);

  return [itemsPerPage, setItemsPerPage];
}
