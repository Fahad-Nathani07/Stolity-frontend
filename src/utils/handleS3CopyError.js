/**
 * Prefer API error body (`message` or `error`) for user-facing toasts.
 */
export function getApiErrorMessage(
  error,
  fallback = "Something went wrong. Please try again."
) {
  const data = error?.response?.data;
  const raw =
    (typeof data === "string" && data) ||
    data?.message ||
    data?.error ||
    error?.message ||
    "";
  const msg = String(raw || "").trim();
  return msg || fallback;
}

export const handleS3CopyError = (
  error,
  showToast,
  fallback = "Failed to copy file. Please try again."
) => {
  console.error("Transfer error:", error);

  const errorMessage = getApiErrorMessage(error, "");

  if (
    errorMessage.includes("Invalid character in header content") &&
    errorMessage.includes("x-amz-copy-source")
  ) {
    showToast(
      "warning",
      "Unable to copy this file due to special characters in the name. Please rename the file (remove symbols like ｜, emojis, or unusual spaces) and try again."
    );
    return;
  }

  showToast("error", errorMessage || fallback);
};
