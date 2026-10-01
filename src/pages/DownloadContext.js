import {
  createContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useContext,
} from "react";
import { SESSION_END_EVENT } from "../utils/endUserSession";

const defaultActions = {
  addDownload: () => {},
  updateDownloadProgress: () => {},
  removeDownload: () => {},
  cancelDownload: () => {},
  cancelAllDownloads: () => {},
  pauseDownload: () => {},
  pauseAllDownloads: () => {},
  resumeDownload: () => {},
  resumeAllDownloads: () => {},
};

/** Progress list — only UI that shows progress should subscribe. */
export const DownloadListContext = createContext([]);

/** Stable action methods — pages can subscribe without re-rendering on % ticks. */
export const DownloadActionsContext = createContext(defaultActions);

/** Backward-compatible combined context. Prefer list/actions split for less re-renders. */
export const DownloadContext = createContext({
  downloads: [],
  ...defaultActions,
});

export const DownloadProvider = ({ children }) => {
  const [downloads, setDownloads] = useState([]);

  const addDownload = useCallback(
    (id, fileName, abortController, isFolder = false) => {
      setDownloads((prev) => [
        ...prev,
        {
          id,
          fileName,
          isFolder: Boolean(isFolder),
          progress: 0,
          abortController,
          paused: false,
          operation: "download",
        },
      ]);
    },
    []
  );

  const cancelDownload = useCallback((id) => {
    setDownloads((prev) => {
      const download = prev.find((d) => d.id === id);
      if (
        download?.abortController &&
        Math.round(download.progress || 0) < 100
      ) {
        download.abortController.abort();
      }
      return prev.filter((d) => d.id !== id);
    });
  }, []);

  const cancelAllDownloads = useCallback(() => {
    setDownloads((prev) => {
      const seen = new Set();
      prev.forEach((d) => {
        try {
          if (d.paused) return;
          const ac = d.abortController;
          if (!ac || seen.has(ac)) return;
          seen.add(ac);
          ac.abort?.();
        } catch (e) {}
      });
      return [];
    });
  }, []);

  const pauseDownload = useCallback((id) => {
    setDownloads((prev) => {
      const download = prev.find((d) => d.id === id);
      if (download && download.abortController && !download.paused) {
        download.abortController.abort();
        return prev.map((d) =>
          d.id === id ? { ...d, paused: true } : d
        );
      }
      return prev;
    });
  }, []);

  const pauseAllDownloads = useCallback(() => {
    setDownloads((prev) =>
      prev.map((d) => {
        if (Math.round(d.progress || 0) >= 100 || d.paused) return d;
        try {
          d.abortController?.abort?.();
        } catch (e) {}
        return { ...d, paused: true };
      })
    );
  }, []);

  const resumeDownload = useCallback((id) => {
    setDownloads((prev) => {
      const download = prev.find((d) => d.id === id);
      if (download && download.paused) {
        const newAbortController = new AbortController();
        return prev.map((d) =>
          d.id === id
            ? { ...d, abortController: newAbortController, paused: false }
            : d
        );
      }
      return prev;
    });
  }, []);

  const resumeAllDownloads = useCallback(() => {
    setDownloads((prev) =>
      prev.map((d) => {
        if (Math.round(d.progress || 0) >= 100 || !d.paused) return d;
        return {
          ...d,
          abortController: new AbortController(),
          paused: false,
        };
      })
    );
  }, []);

  const updateDownloadProgress = useCallback((id, progress) => {
    const next = Math.min(100, Math.max(0, Number(progress) || 0));
    const nextRounded = Math.round(next);
    setDownloads((prev) => {
      const idx = prev.findIndex((d) => d.id === id);
      if (idx < 0) return prev;
      const cur = prev[idx];
      // Skip no-op updates (same displayed %).
      if (Math.round(cur.progress || 0) === nextRounded && nextRounded < 100) {
        return prev;
      }
      if (cur.progress === next) return prev;
      const copy = prev.slice();
      copy[idx] = { ...cur, progress: next };
      return copy;
    });
  }, []);

  const removeDownload = useCallback((id) => {
    setDownloads((prev) => prev.filter((download) => download.id !== id));
  }, []);

  useEffect(() => {
    const onSessionEnd = () => cancelAllDownloads();
    window.addEventListener(SESSION_END_EVENT, onSessionEnd);
    return () => window.removeEventListener(SESSION_END_EVENT, onSessionEnd);
  }, [cancelAllDownloads]);

  const actions = useMemo(
    () => ({
      addDownload,
      updateDownloadProgress,
      removeDownload,
      cancelDownload,
      cancelAllDownloads,
      pauseDownload,
      pauseAllDownloads,
      resumeDownload,
      resumeAllDownloads,
    }),
    [
      addDownload,
      updateDownloadProgress,
      removeDownload,
      cancelDownload,
      cancelAllDownloads,
      pauseDownload,
      pauseAllDownloads,
      resumeDownload,
      resumeAllDownloads,
    ]
  );

  const combined = useMemo(
    () => ({
      downloads,
      ...actions,
    }),
    [downloads, actions]
  );

  return (
    <DownloadActionsContext.Provider value={actions}>
      <DownloadListContext.Provider value={downloads}>
        <DownloadContext.Provider value={combined}>
          {children}
        </DownloadContext.Provider>
      </DownloadListContext.Provider>
    </DownloadActionsContext.Provider>
  );
};

/** Pages: actions only (no re-render on progress ticks). */
export function useDownloadActions() {
  return useContext(DownloadActionsContext);
}

/** Progress UI: downloads list only. */
export function useDownloadList() {
  return useContext(DownloadListContext);
}
