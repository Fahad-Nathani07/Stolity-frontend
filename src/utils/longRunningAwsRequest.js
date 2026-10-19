/**
 * Shared axios options for long-running S3 mutations
 * (soft-delete, restore, hard-delete, copy-file, move-file, move-folder).
 * Large folders often take >60s; browser must not abort.
 * Host nginx/ALB should also raise proxy_read_timeout / idle timeout for these routes.
 */
export const LONG_RUNNING_AWS_REQUEST_OPTIONS = {
  timeout: 0,
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
};

export function getLongRunningAwsErrorMessage(error, fallback) {
  if (error?.code === "ECONNABORTED" || /timeout/i.test(error?.message || "")) {
    return (
      "Operation timed out. Large folders need more time — ask devops to raise " +
      "proxy_read_timeout for soft-delete / restore / delete-folder / copy-file / move-file APIs."
    );
  }
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}
