/** Move APIs send tiny JSON bodies — axios upload progress hits 100% before the server finishes. */

export const MOVE_PROGRESS_START = 12;

export function startMoveTransfer(addUpload, updateUploadProgress, label, extras = {}) {
  const uploadId = Date.now() + Math.random();
  addUpload(uploadId, label, { operation: "move", ...extras });
  updateUploadProgress(uploadId, MOVE_PROGRESS_START);
  return uploadId;
}

export function finishMoveTransfer(updateUploadProgress, removeUpload, uploadId) {
  if (uploadId == null) return;
  updateUploadProgress(uploadId, 100);
  window.setTimeout(() => removeUpload(uploadId), 1000);
}

export function failMoveTransfer(removeUpload, uploadId) {
  if (uploadId == null) return;
  removeUpload(uploadId);
}
