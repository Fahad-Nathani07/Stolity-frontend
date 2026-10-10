import {
  getSpacesObjectFetchWorks,
  setSpacesObjectFetchWorks,
} from "./mediaPlayUrl";

/** First bytes — container header / early frames */
const START_BYTES = 1.5 * 1024 * 1024;
/** Last bytes — helps when MP4 `moov` is at the end of the file */
const END_BYTES = 2.5 * 1024 * 1024;

/**
 * Non-blocking Range probes against the Spaces URL.
 * Does not delay attaching <video>/ReactPlayer — runs in parallel so we
 * warm TCP/TLS (and maybe HTTP cache) without holding back start.
 * No-ops if Spaces blocks CORS for JS fetch.
 *
 * @param {string} url
 * @param {{ size?: number, signal?: AbortSignal }} [opts]
 */
export function warmVideoPlaybackCache(url, { size = 0, signal } = {}) {
  if (!url || String(url).startsWith("blob:")) return;
  if (getSpacesObjectFetchWorks() === false) return;
  if (typeof fetch !== "function") return;

  let total = Math.max(0, Number(size) || 0);

  const fetchRange = async (start, end) => {
    const res = await fetch(url, {
      method: "GET",
      headers: { Range: `bytes=${start}-${end}` },
      mode: "cors",
      credentials: "omit",
      signal,
    });
    if (!(res.ok || res.status === 206)) {
      throw new Error(`warm-range ${res.status}`);
    }
    setSpacesObjectFetchWorks(true);

    if (!total) {
      const cr = res.headers.get("Content-Range");
      const m = cr && /\/(\d+)\s*$/.exec(cr);
      if (m) total = Number(m[1]) || 0;
      if (!total) {
        const cl = Number(res.headers.get("Content-Length")) || 0;
        if (cl > 0 && start === 0) total = cl;
      }
    }

    // Drain body so the response can be cached when Cache-Control allows it
    await res.arrayBuffer();
    return res;
  };

  const run = async () => {
    try {
      if (total > START_BYTES + END_BYTES + 4096) {
        await Promise.all([
          fetchRange(0, START_BYTES - 1),
          fetchRange(total - END_BYTES, total - 1),
        ]);
        return;
      }

      // Unknown / small: tip first; if size discovered, also warm the tail (moov).
      await fetchRange(0, Math.min(START_BYTES, 512 * 1024) - 1);
      if (total > START_BYTES + END_BYTES + 4096) {
        await fetchRange(total - END_BYTES, total - 1);
      }
    } catch (err) {
      if (err?.name === "AbortError") return;
      setSpacesObjectFetchWorks(false);
    }
  };

  run();
}
