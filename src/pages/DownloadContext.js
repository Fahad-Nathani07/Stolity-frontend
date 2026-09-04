import { createContext, useState, useCallback, useEffect } from "react";
import { SESSION_END_EVENT } from "../utils/endUserSession";

export const DownloadContext = createContext({
  downloads: [],
  addDownload: () => {},
  updateDownloadProgress: () => {},
  removeDownload: () => {},
  cancelDownload: () => {},
  cancelAllDownloads: () => {},
  pauseDownload: () => {},
  pauseAllDownloads: () => {},
  resumeDownload: () => {},
  resumeAllDownloads: () => {},
});

export const DownloadProvider = ({ children }) => {
  const [downloads, setDownloads] = useState([]);

  const addDownload = (id, fileName, abortController, isFolder = false) => {
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
  };

  const cancelDownload = (id) => {
    setDownloads((prev) => {
      const download = prev.find((d) => d.id === id);
      if (download?.abortController) {
        download.abortController.abort();
      }
      return prev.filter((d) => d.id !== id);
    });
  };

  const cancelAllDownloads = useCallback(() => {
    setDownloads((prev) => {
      prev.forEach((d) => {
        try {
          if (!d.paused) d.abortController?.abort?.();
        } catch (e) {}
      });
      return [];
    });
  }, []);

  const pauseDownload = (id) => {
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
  };

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

  const resumeDownload = (id) => {
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
  };

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

  const updateDownloadProgress = (id, progress) => {
    setDownloads((prev) =>
      prev.map((download) =>
        download.id === id ? { ...download, progress } : download
      )
    );
  };

  const removeDownload = (id) => {
    setDownloads((prev) => prev.filter((download) => download.id !== id));
  };

  useEffect(() => {
    const onSessionEnd = () => cancelAllDownloads();
    window.addEventListener(SESSION_END_EVENT, onSessionEnd);
    return () => window.removeEventListener(SESSION_END_EVENT, onSessionEnd);
  }, [cancelAllDownloads]);

  return (
    <DownloadContext.Provider
      value={{
        downloads,
        addDownload,
        updateDownloadProgress,
        removeDownload,
        cancelDownload,
        cancelAllDownloads,
        pauseDownload,
        pauseAllDownloads,
        resumeDownload,
        resumeAllDownloads,
      }}
    >
      {children}
    </DownloadContext.Provider>
  );
};
