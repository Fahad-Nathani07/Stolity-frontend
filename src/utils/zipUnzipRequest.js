import axios from "axios";

/**
 * Shared axios options for zip-object / unzip-object.
 * Large folders often take >60s; ALB/nginx idle cuts kill silent responses.
 * Web sends X-Keepalive: 1 so the server streams NDJSON pings until done.
 */
export const ZIP_UNZIP_REQUEST_OPTIONS = {
  timeout: 0,
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
  responseType: "text",
  transformResponse: [(data) => data],
  headers: {
    "X-Keepalive": "1",
  },
};

export function parseZipUnzipResponse(raw) {
  if (raw == null || raw === "") {
    throw new Error("Empty zip/unzip response");
  }
  if (typeof raw === "object") {
    return raw;
  }

  const text = String(raw).trim();
  if (!text) {
    throw new Error("Empty zip/unzip response");
  }

  // Legacy single JSON object
  if (text.startsWith("{") && !text.includes("\n")) {
    return JSON.parse(text);
  }

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (let i = lines.length - 1; i >= 0; i -= 1) {
    let obj;
    try {
      obj = JSON.parse(lines[i]);
    } catch {
      continue;
    }

    if (obj?.type === "ping") continue;

    if (obj?.type === "error") {
      const err = new Error(
        obj.error || obj.message || obj.details || "Zip/unzip failed"
      );
      err.response = { data: obj, status: obj.statusCode || 500 };
      throw err;
    }

    if (obj?.type === "done") {
      const { type, ...payload } = obj;
      return payload;
    }

    // Unknown final object — return as-is
    return obj;
  }

  throw new Error("Zip/unzip response missing final result");
}

export async function postZipOrUnzip(url, data, config = {}) {
  const response = await axios.post(url, data, {
    ...ZIP_UNZIP_REQUEST_OPTIONS,
    ...config,
    headers: {
      ...ZIP_UNZIP_REQUEST_OPTIONS.headers,
      ...(config.headers || {}),
    },
    responseType: "text",
    transformResponse: [(body) => body],
  });

  return parseZipUnzipResponse(response.data);
}

export function getZipUnzipErrorMessage(error, fallback) {
  if (error?.code === "ECONNABORTED" || /timeout/i.test(error?.message || "")) {
    return "Zip/unzip timed out. Large folders need more time — ask devops to raise ALB/nginx idle timeout, or try a smaller folder.";
  }
  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.response?.data?.details ||
    error?.message ||
    fallback
  );
}

export function getZipSuccessMessage(result) {
  if (result?.renamed && result?.zipFilePath) {
    const name = String(result.zipFilePath).split("/").pop();
    return `Zipped as "${name}" (a file with that name already existed)`;
  }
  return "File successfully zipped!";
}
