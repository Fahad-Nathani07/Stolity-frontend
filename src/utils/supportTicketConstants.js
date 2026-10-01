export const SUPPORT_TICKET_CATEGORIES = [
  { id: "billing", label: "Billing" },
  { id: "storage", label: "Storage" },
  { id: "performance", label: "Performance" },
  { id: "upload", label: "Upload" },
  { id: "download", label: "Download" },
  { id: "account", label: "Account" },
  { id: "other", label: "Other" },
];

export const TICKET_STATUS_LABELS = {
  open: "Open",
  in_progress: "In Progress",
  closed: "Closed",
  // FAQ (admin list may mix)
  pending: "Pending",
  assigned: "Assigned",
  answered: "Answered",
};

export function formatTicketCategory(id) {
  const found = SUPPORT_TICKET_CATEGORIES.find((c) => c.id === id);
  if (found) return found.label;
  if (!id) return "—";
  return String(id)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatTicketStatus(status) {
  const key = String(status || "").toLowerCase();
  return TICKET_STATUS_LABELS[key] || formatTicketCategory(key);
}

export function ticketDisplayCode(id) {
  if (!id) return "————";
  return `T-${String(id).replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase() || "XXXX"}`;
}

export const TICKET_MESSAGE_MIN = 2;
export const TICKET_MESSAGE_MAX = 4000;
