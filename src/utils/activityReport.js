/**
 * Client helpers for File Activity audit status updates.
 * Fire-and-forget — never block downloads/uploads on audit failures.
 */

function buildActivityUrl(apiUrlRaw, path) {
  const base = String(apiUrlRaw || "").replace(/\/+$/, "");
  const ep = String(path || "").replace(/^\/+/, "");
  if (base.match(/\/aws(\/|$)/)) {
    return `${base}/${ep}`;
  }
  return `${base}/aws/${ep}`;
}

export async function reportActivityStatus({
  apiUrl,
  token,
  eventId,
  status,
  errorMessage,
}) {
  if (!eventId || !token || !apiUrl) return { ok: false, skipped: true };
  try {
    const url = buildActivityUrl(
      apiUrl,
      `activity/events/${encodeURIComponent(eventId)}/status`
    );
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status,
        errorMessage: errorMessage || undefined,
      }),
    });
    if (!res.ok) {
      return { ok: false, status: res.status };
    }
    return { ok: true };
  } catch (err) {
    console.warn("[activity] status update failed:", err?.message || err);
    return { ok: false, error: err?.message };
  }
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

/** Non-blocking wrapper. */
export function queueActivityStatus(opts) {
  reportActivityStatus(opts).catch(() => {});
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
