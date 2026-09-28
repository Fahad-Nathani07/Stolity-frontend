import { useCallback, useRef, useState } from "react";
import {
  evaluateUploadBatchLimits,
  UPLOAD_BATCH_CANCEL,
  UPLOAD_BATCH_CONTINUE,
  UPLOAD_BATCH_ZIP_INSTEAD,
} from "../utils/uploadBatchLimits";

/**
 * Promise-based gate for large upload batches.
 * @param {Array} entries
 * @param {{ source?: 'files'|'folder' }} [options]
 * Returns UPLOAD_BATCH_CONTINUE | CANCEL | ZIP_INSTEAD.
 */
export function useUploadBatchLimitGate() {
  const [batchLimitPrompt, setBatchLimitPrompt] = useState(null);
  const resolverRef = useRef(null);

  const confirmUploadBatch = useCallback(async (entries, options = {}) => {
    const source = options.source === "folder" ? "folder" : "files";
    const evaluation = evaluateUploadBatchLimits(entries);
    if (!evaluation || evaluation.level === "none") {
      return UPLOAD_BATCH_CONTINUE;
    }

    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setBatchLimitPrompt({ ...evaluation, source });
    });
  }, []);

  const onBatchLimitChoice = useCallback((choice) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setBatchLimitPrompt(null);
    resolve?.(choice || UPLOAD_BATCH_CANCEL);
  }, []);

  return {
    batchLimitPrompt,
    confirmUploadBatch,
    onBatchLimitChoice,
    UPLOAD_BATCH_CONTINUE,
    UPLOAD_BATCH_CANCEL,
    UPLOAD_BATCH_ZIP_INSTEAD,
  };
}
