/**
 * Client platform header for File Activity device attribution.
 * Mobile apps should send: { "x-client-platform": "mobile" }
 */
export const CLIENT_PLATFORM = "web";

export const CLIENT_PLATFORM_HEADER = "x-client-platform";

/** Headers to merge into authenticated API calls from this web app. */
export function clientPlatformHeaders() {
  return { [CLIENT_PLATFORM_HEADER]: CLIENT_PLATFORM };
}
