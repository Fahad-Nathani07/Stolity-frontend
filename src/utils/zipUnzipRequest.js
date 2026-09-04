/**
 * Shared axios options for zip-object / unzip-object.
 * Large folders often take >60s; default/proxy idle cuts must not abort the browser call.
 * Host nginx should also set proxy_read_timeout high for these routes.
 */
export const ZIP_UNZIP_REQUEST_OPTIONS = {
  timeout: 0,
  // Keep the TCP socket from being treated as idle by some stacks
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
};

export function getZipUnzipErrorMessage(error, fallback) {
  if (error?.code === "ECONNABORTED" || /timeout/i.test(error?.message || "")) {
    return "Zip/unzip timed out. Try a smaller folder, or ask devops to raise proxy_read_timeout for these APIs.";
  }
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}
