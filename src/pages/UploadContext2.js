// UploadContext.jsx
import { createContext, useCallback, useState, useRef } from "react";
import axios from "axios";

export const UploadContext = createContext({
  uploads: [],
  addUpload: () => {},
  updateUploadProgress: () => {},
  updateUploadMeta: () => {},
  removeUpload: () => {},
  abortUpload: () => {},
  pauseUpload: () => {},
  resumeUpload: () => {},
  getUpload: () => {},
  isPausing: () => false,
});

export const UploadProvider = ({ children, apiUrl, token }) => {
  const [uploads, setUploads] = useState([]);

  // synchronous in-memory map to mark pause-intent (avoids react state races)
  const pausingMapRef = useRef(new Map());
  // deferred removals when an upload is paused (to avoid race where worker waits but the entry gets removed)
  const pendingRemovalsRef = useRef(new Set());
  // synchronous in-memory map of uploads for immediate reads (keeps in sync with `uploads` state)
  const uploadMapRef = useRef(new Map());

  const syncSetUploadRef = (id, obj) => {
    if (!obj) {
      uploadMapRef.current.delete(id);
    } else {
      uploadMapRef.current.set(id, obj);
    }
  };

  const addUpload = useCallback((id, fileName, extras = {}) => {
    console.log("[UploadContext] addUpload", { id, fileName, extras });
    const entry = { id, fileName, progress: 0, paused: false, ...extras };
    // update map synchronously
    syncSetUploadRef(id, entry);
    // update state for UI
    setUploads((prev) => [...prev, entry]);
  }, []);

  const updateUploadProgress = useCallback((id, progress) => {
    // update state
    setUploads((prev) =>
      prev.map((upload) => (upload.id === id ? { ...upload, progress } : upload))
    );
    // update sync map
    const existing = uploadMapRef.current.get(id);
    if (existing) {
      uploadMapRef.current.set(id, { ...existing, progress });
    }
  }, []);

  const updateUploadMeta = useCallback((id, meta = {}) => {
    console.log("[UploadContext] updateUploadMeta", { id, meta });
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, ...meta } : u)));
    const existing = uploadMapRef.current.get(id) || {};
    uploadMapRef.current.set(id, { ...existing, ...meta });
  }, []);

  // removeUpload now defers removal if upload is currently pausing (to avoid race)
  const removeUpload = useCallback((id) => {
    const isPausing = pausingMapRef.current.has(id);
    console.log("[UploadContext] removeUpload called", { id, isPausing });
    if (isPausing) {
      // queue removal until resume to avoid racing with waitUntilResumed
      console.log("[UploadContext] deferring removal until resume for id", id);
      pendingRemovalsRef.current.add(id);
      return;
    }
    // normal removal: update both map and state
    syncSetUploadRef(id, null);
    setUploads((prev) => prev.filter((upload) => upload.id !== id));
    console.log("[UploadContext] removeUpload: removed", id);
  }, []);

  const setUploadPaused = useCallback((id, paused = true) => {
    console.log("[UploadContext] setUploadPaused", { id, paused });
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, paused } : u)));
    const existing = uploadMapRef.current.get(id);
    if (existing) {
      uploadMapRef.current.set(id, { ...existing, paused });
    } else {
      // if not present yet, set a minimal entry so synchronous reads see paused
      uploadMapRef.current.set(id, { id, paused, fileName: existing?.fileName || "", progress: existing?.progress || 0 });
    }
  }, []);

  // get upload by id (synchronous read from ref)
  const getUpload = useCallback((id) => {
    return uploadMapRef.current.get(id);
  }, []);

  const buildAwsUrl = useCallback((apiUrlRaw, endpointPath) => {
    const base = (apiUrlRaw || "").replace(/\/+$/, "");
    const ep = (endpointPath || "").replace(/^\/+/, "");
    if (base.match(/\/aws(\/|$)/)) {
      return `${base}/${ep}`;
    }
    return `${base}/aws/${ep}`;
  }, []);

  const abortUpload = useCallback(
    async (id) => {
      console.log("[UploadContext] abortUpload called", { id });
      const upload = uploadMapRef.current.get(id);
      if (!upload) {
        console.log("[UploadContext] abortUpload: upload not found", { id });
        return;
      }

      try {
        if (upload.controller && typeof upload.controller.abort === "function") {
          console.log("[UploadContext] abortUpload: aborting controller", { id });
          upload.controller.abort();
        }
      } catch (e) {
        console.warn("Local abort failed", e);
      }

      try {
        if (upload.key && upload.uploadId && apiUrl && token) {
          const url = buildAwsUrl(apiUrl, "abort-multipart-upload");
          console.log("[UploadContext] abortUpload: calling server abort", { id, url });
          await axios.post(
            url,
            { key: upload.key, uploadId: upload.uploadId },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
        }
      } catch (err) {
        console.error("Server abort failed:", err?.response?.data || err.message || err);
      }

      // clear any pausing intent if present and pending removes
      try {
        pausingMapRef.current.delete(id);
        pendingRemovalsRef.current.delete(id);
      } catch (e) {}

      // remove from sync map and state
      syncSetUploadRef(id, null);
      setUploads((prev) => prev.filter((u) => u.id !== id));
      console.log("[UploadContext] abortUpload: removed upload from state", { id });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apiUrl, token, buildAwsUrl]
  );

  // ===== pause / resume with synchronous pausing intent marker & deferred removal =====

  // pauseUpload: mark pausing intent synchronously, set paused state, then abort current controller
  const pauseUpload = useCallback(
    (id) => {
      console.log("[UploadContext] pauseUpload called", { id });
      const upload = uploadMapRef.current.get(id);
      if (!upload) {
        console.log("[UploadContext] pauseUpload: upload not found in map - still setting pausing intent", { id });
        // still mark pausing intent so worker sees it (handles race where upload may not be in state yet)
        pausingMapRef.current.set(id, true);
        // also set minimal map entry so getUpload sees it
        uploadMapRef.current.set(id, { id, paused: true, fileName: "", progress: 0 });
        return;
      }

      // mark intent synchronously so upload worker can detect it immediately
      pausingMapRef.current.set(id, true);
      console.log("[UploadContext] pauseUpload: pausingMap set", { id });

      // set paused in react state (UI) and sync map
      setUploadPaused(id, true);

      // abort in-flight request to stop immediate chunk upload (uploadPart will reject)
      try {
        if (upload.controller && typeof upload.controller.abort === "function") {
          console.log("[UploadContext] pauseUpload: aborting controller to stop current chunk", { id });
          upload.controller.abort();
        }
      } catch (e) {
        console.warn("pause abort failed", e);
      }
    },
    [setUploadPaused]
  );

  // resumeUpload: clear pausing intent synchronously, create fresh controller and clear paused flag
  const resumeUpload = useCallback(
    (id) => {
      console.log("[UploadContext] resumeUpload called", { id });

      // clear synchronous pausing intent
      pausingMapRef.current.delete(id);
      console.log("[UploadContext] resumeUpload: cleared pausingMap", { id });

      // create a fresh controller for subsequent requests
      const newController = typeof AbortController !== "undefined" ? new AbortController() : null;

      // attach controller and clear paused flag in state and sync map
      setUploads((prev) =>
        prev.map((u) => (u.id === id ? { ...u, controller: newController, paused: false } : u))
      );
      const existing = uploadMapRef.current.get(id);
      if (existing) {
        uploadMapRef.current.set(id, { ...existing, controller: newController, paused: false });
      } else {
        uploadMapRef.current.set(id, { id, controller: newController, paused: false, fileName: "", progress: 0 });
      }

      // if a removal was requested while paused, perform it now
      if (pendingRemovalsRef.current.has(id)) {
        console.log("[UploadContext] resumeUpload: performing deferred removal for", id);
        pendingRemovalsRef.current.delete(id);
        syncSetUploadRef(id, null);
        setUploads((prev) => prev.filter((u) => u.id !== id));
      }
    },
    []
  );

  // synchronous check for pause-intent
  const isPausing = useCallback((id) => {
    return pausingMapRef.current.has(id);
  }, []);

  return (
    <UploadContext.Provider
      value={{
        uploads,
        addUpload,
        updateUploadProgress,
        updateUploadMeta,
        removeUpload,
        abortUpload,
        pauseUpload,
        resumeUpload,
        getUpload,
        isPausing,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
};
  