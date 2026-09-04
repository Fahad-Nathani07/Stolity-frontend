import { useState, useRef, useEffect } from "react";
import axios from "axios";
import lodashDebounce from "lodash.debounce";
import { normalizeSearchResultItems } from "../utils/fileIcon";

const isSearchAbortError = (error) =>
  error?.code === "ERR_CANCELED" ||
  error?.name === "CanceledError" ||
  error?.name === "AbortError";

/**
 * Debounced file search with AbortController cancellation and stale-response guards.
 */
export default function useFileSearch({
  apiUrl,
  token,
  debounceMs = 1000,
  onResults,
  onSearchClear,
  reloadList,
  getSearchParams,
}) {
  const [query, setQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const activeSearchQueryRef = useRef("");
  const prevQueryRef = useRef("");
  const searchAbortRef = useRef(null);
  const searchRequestIdRef = useRef(0);
  const reloadListRef = useRef(reloadList);
  reloadListRef.current = reloadList;
  const getSearchParamsRef = useRef(getSearchParams);
  getSearchParamsRef.current = getSearchParams;
  const onResultsRef = useRef(onResults);
  onResultsRef.current = onResults;
  const onSearchClearRef = useRef(onSearchClear);
  onSearchClearRef.current = onSearchClear;

  const abortSearchRequest = () => {
    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
      searchAbortRef.current = null;
    }
  };

  const invalidateSearch = () => {
    abortSearchRequest();
    searchRequestIdRef.current += 1;
  };

  const runSearch = async (q) => {
    const trimmed = q.trim();

    if (!trimmed) {
      invalidateSearch();
      setSearchLoading(false);
      activeSearchQueryRef.current = "";
      prevQueryRef.current = "";
      reloadListRef.current?.();
      return;
    }

    abortSearchRequest();
    const requestId = ++searchRequestIdRef.current;
    const controller = new AbortController();
    searchAbortRef.current = controller;

    try {
      const extraParams = getSearchParamsRef.current?.() || {};
      const response = await axios.get(`${apiUrl}/search-file`, {
        params: { searchFile: trimmed, ...extraParams },
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      if (requestId !== searchRequestIdRef.current) return;
      if (activeSearchQueryRef.current.trim() !== trimmed) return;

      const list = normalizeSearchResultItems(
        Array.isArray(response.data)
          ? response.data
          : response.data?.results || []
      );
      const isStillActive = () =>
        requestId === searchRequestIdRef.current &&
        activeSearchQueryRef.current.trim() === trimmed;
      await onResultsRef.current?.(list, trimmed, isStillActive);
      if (!isStillActive()) return;
      prevQueryRef.current = trimmed;
    } catch (error) {
      if (isSearchAbortError(error)) return;
    } finally {
      if (
        requestId === searchRequestIdRef.current &&
        activeSearchQueryRef.current.trim() === trimmed
      ) {
        searchAbortRef.current = null;
        setSearchLoading(false);
      }
    }
  };

  const runSearchRef = useRef(runSearch);
  runSearchRef.current = runSearch;

  const debouncedSearchFile = useRef(
    lodashDebounce((q) => {
      runSearchRef.current(q);
    }, debounceMs)
  ).current;

  useEffect(() => {
    return () => {
      debouncedSearchFile.cancel();
      abortSearchRequest();
    };
  }, [debouncedSearchFile]);

  const handleSearchChange = (e) => {
    const q = e.target.value;
    activeSearchQueryRef.current = q;
    setQuery(q);

    if (!q.trim()) {
      debouncedSearchFile.cancel();
      invalidateSearch();
      setSearchLoading(false);
      activeSearchQueryRef.current = "";
      prevQueryRef.current = "";
      reloadListRef.current?.();
      return;
    }

    invalidateSearch();
    setSearchLoading(true);
    onSearchClearRef.current?.();
    debouncedSearchFile(q);
  };

  const clearSearch = () => {
    debouncedSearchFile.cancel();
    invalidateSearch();
    activeSearchQueryRef.current = "";
    setSearchLoading(false);
    setQuery("");
    prevQueryRef.current = "";
    reloadListRef.current?.();
  };

  const resetSearchBar = () => {
    debouncedSearchFile.cancel();
    invalidateSearch();
    activeSearchQueryRef.current = "";
    setQuery("");
    prevQueryRef.current = "";
    setSearchLoading(false);
  };

  return {
    query,
    setQuery,
    searchLoading,
    handleSearchChange,
    clearSearch,
    resetSearchBar,
    prevQueryRef,
  };
}
