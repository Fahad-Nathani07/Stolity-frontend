import axios from "axios";

export const SHARE_TIME_OPTIONS = [
  "1 Min",
  "10 Min",
  "1 Hour",
  "10 Hours",
  "1 Day",
  "10 Days",
];

export const SHARE_TIME_TO_SECONDS = {
  "1 Min": 60,
  "10 Min": 600,
  "1 Hour": 3600,
  "10 Hours": 36000,
  "1 Day": 86400,
  "10 Days": 864000,
};

export function computeShareExpirySeconds({
  shareMode,
  useManualEntry,
  manualTimeValue,
  manualTimeUnit,
  selectedTimeOption,
}) {
  if (shareMode !== "limited") return null;

  if (useManualEntry && manualTimeValue) {
    const value = parseInt(manualTimeValue, 10);
    if (Number.isNaN(value) || value <= 0) return null;

    switch (manualTimeUnit) {
      case "Min":
        return value * 60;
      case "Hour":
        return value * 3600;
      case "Day":
        return value * 86400;
      default:
        return null;
    }
  }

  if (!useManualEntry && selectedTimeOption) {
    return SHARE_TIME_TO_SECONDS[selectedTimeOption] ?? null;
  }

  return null;
}

export async function fetchShareUrl({
  apiUrl,
  token,
  filePath,
  shareMode,
  signedTime,
  shared,
}) {
  const isLimited = shareMode === "limited";
  const endpoint = isLimited ? "get-private-url" : "file-info";

  const params = {
    ...(shared ? { shared } : {}),
    ...(isLimited
      ? {
          key: filePath,
          ...(signedTime ? { signedTime } : {}),
        }
      : { filePath }),
  };

  const res = await axios.get(`${apiUrl}${endpoint}`, {
    params,
    headers: { Authorization: `Bearer ${token}` },
    responseType: "json",
  });

  const parsedData =
    typeof res.data === "string" ? JSON.parse(res.data) : res.data;

  return parsedData?.url ?? null;
}
