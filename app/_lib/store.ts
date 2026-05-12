// ─── Client types ─────────────────────────────────────────────────────────────

export interface Invoice {
  id: string;
  date: string;
  period: string;
  plan: string;
  credits: number;
  amount: string;
  status: "paid" | "pending" | "overdue";
}

export interface ClientData {
  name: string;
  creditsTotal: number;
  creditsUsed: number;
  plan: string;
  notifications: {
    weeklyReport: boolean;
    lowCreditAlert: boolean;
    invoiceIssued: boolean;
  };
  invoices: Invoice[];
}

// ─── Admin types ───────────────────────────────────────────────────────────────

export interface Company {
  id: string;
  name: string;
  email: string;
  plan: string;
  credits: number;
  used: number;
  joined: string;
  status: "active" | "suspended";
  industry: string;
  agents: number;
  mrr: number;
}

export interface AdminInvoice {
  id: string;
  company: string;
  companyId?: string;
  date: string;
  plan: string;
  credits: number;
  amount: string;
  status: "paid" | "pending";
}

export type ActivityType =
  | "credit_issued"
  | "company_added"
  | "invoice_paid"
  | "plan_changed"
  | "company_suspended"
  | "company_activated"
  | "invoice_generated";

export interface ActivityLog {
  id: string;
  type: ActivityType;
  company?: string;
  companyId?: string;
  description: string;
  timestamp: string;
  amount?: string;
}

// ─── Plans ────────────────────────────────────────────────────────────────────

export const PLANS = [
  { name: "Starter", credits: 500,   price: 49,  priceStr: "$49.00",  rollover: "7 days"  },
  { name: "Growth",  credits: 2000,  price: 149, priceStr: "$149.00", rollover: "30 days" },
  { name: "Scale",   credits: 10000, price: 499, priceStr: "$499.00", rollover: "90 days" },
] as const;

export type Plan = typeof PLANS[number];

// ─── Seed data ─────────────────────────────────────────────────────────────────

export const DEFAULT_CLIENT: ClientData = {
  name: "",
  creditsTotal: 2000,
  creditsUsed: 347,
  plan: "Growth",
  notifications: { weeklyReport: true, lowCreditAlert: true, invoiceIssued: false },
  invoices: [
    { id: "INV-0024", date: "May 1, 2026",  period: "May 2026",  plan: "Growth",  credits: 2000, amount: "$149.00", status: "paid" },
    { id: "INV-0023", date: "Apr 1, 2026",  period: "Apr 2026",  plan: "Starter", credits: 500,  amount: "$49.00",  status: "paid" },
    { id: "INV-0022", date: "Mar 1, 2026",  period: "Mar 2026",  plan: "Growth",  credits: 2000, amount: "$149.00", status: "paid" },
    { id: "INV-0021", date: "Feb 1, 2026",  period: "Feb 2026",  plan: "Growth",  credits: 2000, amount: "$149.00", status: "paid" },
    { id: "INV-0020", date: "Jan 3, 2026",  period: "Jan 2026",  plan: "Starter", credits: 500,  amount: "$49.00",  status: "paid" },
    { id: "INV-0019", date: "Dec 1, 2025",  period: "Dec 2025",  plan: "Growth",  credits: 2000, amount: "$149.00", status: "paid" },
  ],
};

export const DEFAULT_COMPANIES: Company[] = [
  { id: "1", name: "Lumina Apparel",  email: "admin@lumina.co",        plan: "Growth",  credits: 2000,  used: 580,  joined: "Jan 12, 2026", status: "active",    industry: "Fashion",      agents: 4  , mrr: 149  },
  { id: "2", name: "Petal & Oak",     email: "hello@petalandoak.com",  plan: "Starter", credits: 500,   used: 312,  joined: "Feb 3, 2026",  status: "active",    industry: "Home & Garden",agents: 2  , mrr: 49   },
  { id: "3", name: "Dusk Goods Co.",  email: "ops@duskgoods.com",      plan: "Growth",  credits: 2000,  used: 95,   joined: "Mar 18, 2026", status: "active",    industry: "Lifestyle",    agents: 3  , mrr: 149  },
  { id: "4", name: "Reef Supply",     email: "team@reefsupply.io",     plan: "Starter", credits: 500,   used: 500,  joined: "Nov 5, 2025",  status: "active",    industry: "Outdoors",     agents: 2  , mrr: 49   },
  { id: "5", name: "Forma Studio",    email: "info@formastudio.co",    plan: "Scale",   credits: 10000, used: 3201, joined: "Oct 22, 2025", status: "active",    industry: "Design",       agents: 8  , mrr: 499  },
  { id: "6", name: "Vega Commerce",   email: "support@vegacommerce.io",plan: "Growth",  credits: 2000,  used: 1820, joined: "Dec 1, 2025",  status: "active",    industry: "E-commerce",   agents: 5  , mrr: 149  },
  { id: "7", name: "Birch & Co.",     email: "hello@birchandco.com",   plan: "Starter", credits: 500,   used: 12,   joined: "May 2, 2026",  status: "active",    industry: "Retail",       agents: 1  , mrr: 49   },
  { id: "8", name: "Orbit Health",    email: "ops@orbithealth.co",     plan: "Scale",   credits: 10000, used: 6430, joined: "Aug 14, 2025", status: "suspended", industry: "Health",       agents: 12 , mrr: 0    },
];

export const DEFAULT_ADMIN_INVOICES: AdminInvoice[] = [
  { id: "INV-A028", company: "Forma Studio",    companyId: "5", date: "May 1, 2026",  plan: "Scale",   credits: 10000, amount: "$499.00", status: "paid"    },
  { id: "INV-A027", company: "Lumina Apparel",  companyId: "1", date: "May 1, 2026",  plan: "Growth",  credits: 2000,  amount: "$149.00", status: "paid"    },
  { id: "INV-A026", company: "Vega Commerce",   companyId: "6", date: "May 1, 2026",  plan: "Growth",  credits: 2000,  amount: "$149.00", status: "paid"    },
  { id: "INV-A025", company: "Petal & Oak",     companyId: "2", date: "May 1, 2026",  plan: "Starter", credits: 500,   amount: "$49.00",  status: "pending" },
  { id: "INV-A024", company: "Dusk Goods Co.",  companyId: "3", date: "Apr 1, 2026",  plan: "Growth",  credits: 2000,  amount: "$149.00", status: "paid"    },
  { id: "INV-A023", company: "Reef Supply",     companyId: "4", date: "Mar 1, 2026",  plan: "Starter", credits: 500,   amount: "$49.00",  status: "paid"    },
  { id: "INV-A022", company: "Orbit Health",    companyId: "8", date: "Feb 1, 2026",  plan: "Scale",   credits: 10000, amount: "$499.00", status: "pending" },
  { id: "INV-A021", company: "Lumina Apparel",  companyId: "1", date: "Jan 1, 2026",  plan: "Growth",  credits: 2000,  amount: "$149.00", status: "paid"    },
  { id: "INV-A020", company: "Forma Studio",    companyId: "5", date: "Jan 1, 2026",  plan: "Scale",   credits: 10000, amount: "$499.00", status: "paid"    },
];

export const DEFAULT_ACTIVITY_LOGS: ActivityLog[] = [
  { id: "a1",  type: "invoice_paid",       company: "Forma Studio",   companyId: "5", description: "Invoice INV-A028 paid — $499.00",          timestamp: "2026-05-12T10:32:00Z", amount: "$499.00" },
  { id: "a2",  type: "invoice_paid",       company: "Lumina Apparel", companyId: "1", description: "Invoice INV-A027 paid — $149.00",          timestamp: "2026-05-12T09:15:00Z", amount: "$149.00" },
  { id: "a3",  type: "company_added",      company: "Birch & Co.",    companyId: "7", description: "New company registered on Starter plan",    timestamp: "2026-05-10T14:20:00Z"                   },
  { id: "a4",  type: "credit_issued",      company: "Lumina Apparel", companyId: "1", description: "2,000 credits issued (Growth plan)",        timestamp: "2026-05-08T11:05:00Z", amount: "$149.00" },
  { id: "a5",  type: "company_suspended",  company: "Orbit Health",   companyId: "8", description: "Account suspended — payment overdue",      timestamp: "2026-05-07T16:30:00Z"                   },
  { id: "a6",  type: "plan_changed",       company: "Vega Commerce",  companyId: "6", description: "Plan upgraded: Starter → Growth",          timestamp: "2026-05-06T09:50:00Z"                   },
  { id: "a7",  type: "invoice_generated",  company: "Petal & Oak",    companyId: "2", description: "Invoice INV-A025 generated — $49.00",       timestamp: "2026-05-05T13:00:00Z", amount: "$49.00"  },
  { id: "a8",  type: "credit_issued",      company: "Forma Studio",   companyId: "5", description: "10,000 credits issued (Scale plan)",        timestamp: "2026-05-01T08:00:00Z", amount: "$499.00" },
  { id: "a9",  type: "credit_issued",      company: "Vega Commerce",  companyId: "6", description: "2,000 credits issued (Growth plan)",        timestamp: "2026-05-01T08:05:00Z", amount: "$149.00" },
  { id: "a10", type: "company_added",      company: "Dusk Goods Co.", companyId: "3", description: "New company registered on Growth plan",     timestamp: "2026-03-18T10:00:00Z"                   },
  { id: "a11", type: "invoice_paid",       company: "Reef Supply",    companyId: "4", description: "Invoice INV-A023 paid — $49.00",            timestamp: "2026-03-04T15:22:00Z", amount: "$49.00"  },
  { id: "a12", type: "company_added",      company: "Forma Studio",   companyId: "5", description: "New company registered on Scale plan",      timestamp: "2025-10-22T09:00:00Z"                   },
];

// ─── Storage keys ──────────────────────────────────────────────────────────────

const CLIENT_KEY         = "credly_client";
const COMPANIES_KEY      = "credly_companies";
const ADMIN_INVOICES_KEY = "credly_admin_invoices";
const ACTIVITY_LOGS_KEY  = "credly_activity_logs";

// ─── Accessors ─────────────────────────────────────────────────────────────────

export function getClient(): ClientData {
  if (typeof window === "undefined") return { ...DEFAULT_CLIENT };
  try {
    const raw = localStorage.getItem(CLIENT_KEY);
    return raw ? (JSON.parse(raw) as ClientData) : { ...DEFAULT_CLIENT };
  } catch { return { ...DEFAULT_CLIENT }; }
}

export function saveClient(data: ClientData): void {
  if (typeof window !== "undefined") localStorage.setItem(CLIENT_KEY, JSON.stringify(data));
}

export function getCompanies(): Company[] {
  if (typeof window === "undefined") return DEFAULT_COMPANIES.map((c) => ({ ...c }));
  try {
    const raw = localStorage.getItem(COMPANIES_KEY);
    if (!raw) return DEFAULT_COMPANIES.map((c) => ({ ...c }));
    const parsed = JSON.parse(raw) as Partial<Company>[];
    return parsed.map((c) => ({
      industry: "Other",
      agents: 1,
      mrr: 0,
      status: "active" as const,
      ...c,
    } as Company));
  } catch { return DEFAULT_COMPANIES.map((c) => ({ ...c })); }
}

export function saveCompanies(data: Company[]): void {
  if (typeof window !== "undefined") localStorage.setItem(COMPANIES_KEY, JSON.stringify(data));
}

export function getAdminInvoices(): AdminInvoice[] {
  if (typeof window === "undefined") return [...DEFAULT_ADMIN_INVOICES];
  try {
    const raw = localStorage.getItem(ADMIN_INVOICES_KEY);
    return raw ? (JSON.parse(raw) as AdminInvoice[]) : [...DEFAULT_ADMIN_INVOICES];
  } catch { return [...DEFAULT_ADMIN_INVOICES]; }
}

export function saveAdminInvoices(data: AdminInvoice[]): void {
  if (typeof window !== "undefined") localStorage.setItem(ADMIN_INVOICES_KEY, JSON.stringify(data));
}

export function getActivityLogs(): ActivityLog[] {
  if (typeof window === "undefined") return [...DEFAULT_ACTIVITY_LOGS];
  try {
    const raw = localStorage.getItem(ACTIVITY_LOGS_KEY);
    return raw ? (JSON.parse(raw) as ActivityLog[]) : [...DEFAULT_ACTIVITY_LOGS];
  } catch { return [...DEFAULT_ACTIVITY_LOGS]; }
}

export function saveActivityLogs(data: ActivityLog[]): void {
  if (typeof window !== "undefined") localStorage.setItem(ACTIVITY_LOGS_KEY, JSON.stringify(data));
}

export function addActivityLog(entry: Omit<ActivityLog, "id" | "timestamp">): void {
  const logs = getActivityLogs();
  const newLog: ActivityLog = {
    ...entry,
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
  };
  saveActivityLogs([newLog, ...logs]);
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

export function nextInvoiceId(invoices: { id: string }[], prefix = "INV-"): string {
  if (invoices.length === 0) return `${prefix}0001`;
  const nums = invoices
    .map((inv) => parseInt(inv.id.replace(/^INV-[A-Z]*/, ""), 10))
    .filter((n) => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}

export function formatDate(date: Date = new Date()): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatPeriod(date: Date = new Date()): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function companyStatus(co: Company): "active" | "depleted" | "suspended" {
  if (co.status === "suspended") return "suspended";
  if (co.used >= co.credits) return "depleted";
  return "active";
}

export const PLAN_MRR: Record<string, number> = {
  Starter: 49,
  Growth: 149,
  Scale: 499,
};
