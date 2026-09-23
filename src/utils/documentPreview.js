import {
  resolveMediaPlayUrl,
  getSpacesObjectFetchWorks,
  setSpacesObjectFetchWorks,
} from "./mediaPlayUrl";

/**
 * PDF / txt: signed Spaces URL with inline disposition (iframe — no JS CORS).
 * Office docs: need arrayBuffer → Spaces fetch if CORS allows, else getFile proxy.
 */

const EXT_TO_MIME = {
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  pptm: "application/vnd.ms-powerpoint.presentation.macroEnabled.12",
  pps: "application/vnd.ms-powerpoint",
  ppsx: "application/vnd.openxmlformats-officedocument.presentationml.slideshow",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xlsm: "application/vnd.ms-excel.sheet.macroEnabled.12",
  csv: "text/csv",
  odt: "application/vnd.oasis.opendocument.text",
  ods: "application/vnd.oasis.opendocument.spreadsheet",
  odp: "application/vnd.oasis.opendocument.presentation",
  pdf: "application/pdf",
  txt: "text/plain",
};

const IFRAME_EXTS = new Set(["pdf", "txt"]);

function normalizeApiBase(apiUrl) {
  return String(apiUrl || "").replace(/\/+$/, "");
}

function fileExt(filePath) {
  const name = String(filePath || "").split("/").pop() || "";
  return name.includes(".") ? name.split(".").pop().toLowerCase() : "";
}

export function mimeFromFilePath(filePath) {
  return EXT_TO_MIME[fileExt(filePath)] || "application/octet-stream";
}

function basename(filePath) {
  return String(filePath || "").split("/").pop() || "file";
}

async function blobUrlFromArrayBuffer(arrayBuffer, filePath, contentType) {
  const name = basename(filePath);
  const mime = mimeFromFilePath(filePath) || contentType || "application/octet-stream";
  const fileObject = new File([arrayBuffer], name, { type: mime });
  return URL.createObjectURL(fileObject);
}

async function fetchViaGetFile({
  apiUrl,
  token,
  filePath,
  shared,
  sharedName,
  signal,
}) {
  const params = new URLSearchParams({ filePath: String(filePath || "") });
  if (shared && sharedName) params.set("shared", String(sharedName));

  const res = await fetch(
    `${normalizeApiBase(apiUrl)}/getFile?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    }
  );
  if (!res.ok) throw new Error(`getFile ${res.status}`);
  const buf = await res.arrayBuffer();
  return blobUrlFromArrayBuffer(
    buf,
    filePath,
    res.headers.get("content-type")
  );
}

function isCorsLikeError(err) {
  const msg = String(err?.message || err || "").toLowerCase();
  return (
    err?.name === "TypeError" ||
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("cors")
  );
}

/**
 * Preview URL for documents.
 * PDF/txt → Spaces signed URL (inline) for iframe — no fetch CORS needed.
 * Office → blob URL (Spaces fetch if CORS OK, else getFile).
 *
 * @returns {Promise<string>}
 */
export async function resolveDocumentBlobUrl({
  apiUrl,
  token,
  filePath,
  shared = false,
  sharedName = "",
  signal,
}) {
  const path = String(filePath || "");
  if (!path) throw new Error("filePath required");

  const ext = fileExt(path);

  // PDF / text: iframe can load Spaces URL without JS CORS
  if (IFRAME_EXTS.has(ext)) {
    return resolveMediaPlayUrl({
      apiUrl,
      token,
      filePath: path,
      shared,
      sharedName,
      inline: true,
      signal,
    });
  }

  // Office: need bytes in JS — skip Spaces fetch if CORS already known broken
  if (getSpacesObjectFetchWorks() !== false) {
    try {
      const playUrl = await resolveMediaPlayUrl({
        apiUrl,
        token,
        filePath: path,
        shared,
        sharedName,
        signal,
      });

      // Proxy fallback URL from resolveMediaPlayUrl — still fetchable same-origin
      const isProxy = String(playUrl).includes("getFileDefault");
      if (!isProxy) {
        const res = await fetch(playUrl, {
          method: "GET",
          mode: "cors",
          credentials: "omit",
          signal,
        });
        if (!res.ok) throw new Error(`preview object fetch ${res.status}`);
        const buf = await res.arrayBuffer();
        setSpacesObjectFetchWorks(true);
        return blobUrlFromArrayBuffer(
          buf,
          path,
          res.headers.get("content-type")
        );
      }

      const res = await fetch(playUrl, {
        method: "GET",
        credentials: "omit",
        signal,
      });
      if (!res.ok) throw new Error(`getFileDefault ${res.status}`);
      return blobUrlFromArrayBuffer(
        await res.arrayBuffer(),
        path,
        res.headers.get("content-type")
      );
    } catch (err) {
      if (err?.name === "AbortError") throw err;
      if (isCorsLikeError(err)) {
        setSpacesObjectFetchWorks(false);
      }
      console.warn(
        "[doc] Spaces preview fetch failed; using getFile proxy.",
        err?.message || err
      );
    }
  }

  return fetchViaGetFile({
    apiUrl,
    token,
    filePath: path,
    shared,
    sharedName,
    signal,
  });
}
