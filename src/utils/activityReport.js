/**
 * Client helpers for File Activity audit status updates.
 * Fire-and-forget — never block downloads/uploads on audit failures.
 *
 * Status PATCHes are serialized + spaced so bulk folder downloads
 * (2 calls per file) do not hit the API rate limit (300/min).
 */

/** Min gap between successive /activity/.../status calls. */
const ACTIVITY_STATUS_GAP_MS = 250;
const ACTIVITY_STATUS_MAX_RETRIES = 3;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildActivityUrl(apiUrlRaw, path) {
  const base = String(apiUrlRaw || "").replace(/\/+$/, "");
  const ep = String(path || "").replace(/^\/+/, "");
  if (base.match(/\/aws(\/|$)/)) {
    return `${base}/${ep}`;
  }
  return `${base}/aws/${ep}`;
}

function parseRetryAfterMs(res) {
  const header = res?.headers?.get?.("Retry-After");
  if (!header) return 4000;
  const sec = Number(header);
  if (Number.isFinite(sec) && sec >= 0) return Math.min(30_000, sec * 1000);
  return 4000;
}

export async function reportActivityStatus({
  apiUrl,
  token,
  eventId,
  status,
  errorMessage,
}) {
  if (!eventId || !token || !apiUrl) return { ok: false, skipped: true };

  const url = buildActivityUrl(
    apiUrl,
    `activity/events/${encodeURIComponent(eventId)}/status`
  );
  const body = JSON.stringify({
    status,
    errorMessage: errorMessage || undefined,
  });

  for (let attempt = 1; attempt <= ACTIVITY_STATUS_MAX_RETRIES; attempt += 1) {
    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body,
      });
      if (res.status === 429) {
        if (attempt < ACTIVITY_STATUS_MAX_RETRIES) {
          await delay(parseRetryAfterMs(res));
          continue;
        }
        return { ok: false, status: 429 };
      }
      if (!res.ok) {
        return { ok: false, status: res.status };
      }
      return { ok: true };
    } catch (err) {
      console.warn("[activity] status update failed:", err?.message || err);
      if (attempt < ACTIVITY_STATUS_MAX_RETRIES) {
        await delay(500 * attempt);
        continue;
      }
      return { ok: false, error: err?.message };
    }
  }
  return { ok: false };
}

/** Remove a superseded activity event (e.g. direct upload before proxy fallback). */
export async function deleteActivityEvent({ apiUrl, token, eventId }) {
  if (!eventId || !token || !apiUrl) return { ok: false, skipped: true };
  try {
    const url = buildActivityUrl(
      apiUrl,
      `activity/events/${encodeURIComponent(eventId)}`
    );
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      return { ok: false, status: res.status };
    }
    return { ok: true };
  } catch (err) {
    console.warn("[activity] delete failed:", err?.message || err);
    return { ok: false, error: err?.message };
  }
}

/** Chain of status updates — keeps rate under API limit during bulk transfers. */
let activityStatusChain = Promise.resolve();
let lastActivityStatusAt = 0;

/** Non-blocking wrapper with spacing + 429 retry. */
export function queueActivityStatus(opts) {
  activityStatusChain = activityStatusChain
    .then(async () => {
      const wait = Math.max(
        0,
        ACTIVITY_STATUS_GAP_MS - (Date.now() - lastActivityStatusAt)
      );
      if (wait > 0) await delay(wait);
      lastActivityStatusAt = Date.now();
      await reportActivityStatus(opts);
    })
    .catch(() => {});
}

export function queueDeleteActivityEvent(opts) {
  deleteActivityEvent(opts).catch(() => {});
}

export async function reportClientActivity({
  apiUrl,
  token,
  action,
  status,
  fileName,
  path,
  sizeBytes,
  source,
  idempotencyKey,
}) {
  if (!token || !apiUrl) return { ok: false, skipped: true };
  try {
    const url = buildActivityUrl(apiUrl, "activity/events");
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        status,
        fileName,
        path,
        sizeBytes,
        source,
        idempotencyKey,
      }),
    });
    if (!res.ok) return { ok: false, status: res.status };
    const data = await res.json().catch(() => ({}));
    return { ok: true, eventId: data.eventId, created: data.created };
  } catch (err) {
    console.warn("[activity] create failed:", err?.message || err);
    return { ok: false, error: err?.message };
  }
}
