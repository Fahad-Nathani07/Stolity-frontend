/**
 * Multi-file activity session: 1 STARTED + 1 finish ≈ 2–4 Firestore writes
 * instead of per-file create + /status.
 */

function buildActivityUrl(apiUrlRaw, path) {
  const base = String(apiUrlRaw || "").replace(/\/+$/, "");
  const ep = String(path || "").replace(/^\/+/, "");
  if (base.match(/\/aws(\/|$)/)) {
    return `${base}/${ep}`;
  }
  return `${base}/aws/${ep}`;
}

/**
 * @returns {Promise<string|null>} batchId
 */
export async function startActivityBatch({
  apiUrl,
  token,
  action,
  fileCount,
  estimatedBytes,
  source,
  apis,
}) {
  const count = Math.max(0, Number(fileCount) || 0);
  if (!apiUrl || !token || count < 2) return null;

  const url = buildActivityUrl(apiUrl, "activity/batches");
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: String(action || "").toUpperCase(),
        fileCount: count,
        estimatedBytes:
          estimatedBytes != null ? Math.max(0, Number(estimatedBytes) || 0) : undefined,
        source: source || undefined,
        apis: Array.isArray(apis) ? apis : undefined,
      }),
    });
    if (!res.ok) {
      console.warn("[activity] batch start failed:", res.status);
      return null;
    }
    const data = await res.json();
    return data?.batchId || null;
  } catch (err) {
    console.warn("[activity] batch start error:", err?.message || err);
    return null;
  }
}

/**
 * Fire-and-forget finish — never blocks the UI.
 */
export function finishActivityBatch({
  apiUrl,
  token,
  batchId,
  status,
  successCount,
  failCount,
  sizeBytes,
  failedPaths,
  apis,
  errorMessage,
}) {
  if (!apiUrl || !token || !batchId) return;

  const url = buildActivityUrl(
    apiUrl,
    `activity/batches/${encodeURIComponent(batchId)}`
  );

  fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      status: String(status || "").toUpperCase(),
      successCount:
        successCount != null ? Math.max(0, Number(successCount) || 0) : undefined,
      failCount:
        failCount != null ? Math.max(0, Number(failCount) || 0) : undefined,
      sizeBytes:
        sizeBytes != null ? Math.max(0, Number(sizeBytes) || 0) : undefined,
      failedPaths: Array.isArray(failedPaths)
        ? failedPaths.slice(0, 50)
        : undefined,
      apis: Array.isArray(apis) ? apis : undefined,
      errorMessage: errorMessage || undefined,
    }),
  }).catch((err) => {
    console.warn("[activity] batch finish failed:", err?.message || err);
  });
}

/**
 * Derive terminal status from counters.
 */
export function resolveBatchStatus({
  fileCount,
  successCount = 0,
  failCount = 0,
  cancelCount = 0,
  cancelled = false,
}) {
  const total = Math.max(0, Number(fileCount) || 0);
  const ok = Math.max(0, Number(successCount) || 0);
  const fail = Math.max(0, Number(failCount) || 0);
  const cancel = Math.max(0, Number(cancelCount) || 0);

  if (cancelled && ok === 0) return "CANCELLED";
  if (ok === 0 && fail > 0 && cancel === 0) return "FAILED";
  if (ok === 0 && (fail > 0 || cancel > 0)) {
    return cancel > 0 && fail === 0 ? "CANCELLED" : "FAILED";
  }
  if (ok > 0 && (fail > 0 || cancel > 0 || ok < total)) return "PARTIAL";
  if (ok >= total && total > 0) return "COMPLETED";
  if (cancelled) return "CANCELLED";
  return "PARTIAL";
}
