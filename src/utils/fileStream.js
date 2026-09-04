/**
 * Direct streaming URL for getFileDefault (token in query).
 * Browser loads progressively — avoids axios buffer + base64 for large images.
 */
export function buildFileStreamUrl(
  apiUrl,
  token,
  filePath,
  { shared = false, sharedName = "" } = {}
) {
  const params = new URLSearchParams();
  params.set("token", token || "");
  params.set("filePath", filePath || "");
  if (shared && sharedName) {
    params.set("shared", sharedName);
  }
  return `${apiUrl}getFileDefault?${params.toString()}`;
}

/** Download fully in background; resolve only when the image is complete. */
export function preloadStreamedImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}
