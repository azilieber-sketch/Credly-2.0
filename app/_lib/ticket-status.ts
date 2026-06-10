// Ticket status model (status replaces the old urgency/priority UI):
//   new (created) → read (admin opened) → answered (admin replied)
//   → customer-replied (inbound appended) → resolved (MANUAL only).
// Shared by the admin views, the client portal, and the email pipeline.

export type TicketStatus = "new" | "read" | "answered" | "customer-replied" | "resolved";

export const TICKET_STATUS_CFG: Record<TicketStatus, { label: string; badge: string; dot: string }> = {
  "new":              { label: "New",              badge: "bg-amber-50 text-amber-700",     dot: "bg-amber-400"   },
  "read":             { label: "Read",             badge: "bg-zinc-100 text-zinc-600",      dot: "bg-zinc-400"    },
  "answered":         { label: "Answered",         badge: "bg-indigo-50 text-indigo-700",   dot: "bg-indigo-500"  },
  "customer-replied": { label: "Customer replied", badge: "bg-rose-50 text-rose-600",       dot: "bg-rose-400"    },
  "resolved":         { label: "Resolved",         badge: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
};

// Statuses where the ball is in the support team's court.
export const ATTENTION_STATUSES: TicketStatus[] = ["new", "read", "customer-replied"];

export const needsAttention = (status: TicketStatus) => ATTENTION_STATUSES.includes(status);
