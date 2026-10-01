import { useCallback, useRef, useState } from "react";
import {
  evaluateDownloadBatchLimits,
  DOWNLOAD_BATCH_CANCEL,
  DOWNLOAD_BATCH_CONTINUE,
  DOWNLOAD_BATCH_ZIP_AND_DOWNLOAD,
} from "../utils/downloadBatchLimits";

/**
 * Promise-based gate for large download batches.
 * @returns DOWNLOAD_BATCH_CONTINUE | CANCEL | ZIP_AND_DOWNLOAD
 */
export function useDownloadBatchLimitGate() {
  const [batchLimitPrompt, setBatchLimitPrompt] = useState(null);
  const resolverRef = useRef(null);

  const confirmDownloadBatch = useCallback(async (stats) => {
    const evaluation = evaluateDownloadBatchLimits({
      count: stats?.count,
      totalBytes: stats?.totalBytes,
      source: stats?.source === "folder" ? "folder" : stats?.source || "files",
    });
    if (!evaluation || evaluation.level === "none") {
      return DOWNLOAD_BATCH_CONTINUE;
    }

    const source = stats?.source === "folder" ? "folder" : stats?.source || "files";
    const canZipAndDownload = Boolean(stats?.canZipAndDownload);

    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setBatchLimitPrompt({
        ...evaluation,
        source,
        canZipAndDownload,
      });
    });
  }, []);

  const onBatchLimitChoice = useCallback((choice) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setBatchLimitPrompt(null);
    resolve?.(choice || DOWNLOAD_BATCH_CANCEL);
  }, []);

  return {
    downloadBatchLimitPrompt: batchLimitPrompt,
    confirmDownloadBatch,
    onDownloadBatchLimitChoice: onBatchLimitChoice,
    DOWNLOAD_BATCH_CONTINUE,
    DOWNLOAD_BATCH_CANCEL,
    DOWNLOAD_BATCH_ZIP_AND_DOWNLOAD,
  };
}
