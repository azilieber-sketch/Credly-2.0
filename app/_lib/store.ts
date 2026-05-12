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

export interface Company {
  id: string;
  name: string;
  email: string;
  plan: string;
  credits: number;
  used: number;
  joined: string;
}

export interface AdminInvoice {
  id: string;
  company: string;
  date: string;
  plan: string;
  credits: number;
  amount: string;
  status: "paid" | "pending";
}

export const PLANS = [
  { name: "Starter", credits: 500,   price: 49,  priceStr: "$49.00",  rollover: "7 days"  },
  { name: "Growth",  credits: 2000,  price: 149, priceStr: "$149.00", rollover: "30 days" },
  { name: "Scale",   credits: 10000, price: 499, priceStr: "$499.00", rollover: "90 days" },
] as const;

export type Plan = typeof PLANS[number];

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
  { id: "1", name: "Lumina Apparel",  email: "admin@lumina.co",       plan: "Growth",  credits: 2000,  used: 580,  joined: "Jan 12, 2026" },
  { id: "2", name: "Petal & Oak",     email: "hello@petalandoak.com", plan: "Starter", credits: 500,   used: 312,  joined: "Feb 3, 2026"  },
  { id: "3", name: "Dusk Goods Co.",  email: "ops@duskgoods.com",     plan: "Growth",  credits: 2000,  used: 95,   joined: "Mar 18, 2026" },
  { id: "4", name: "Reef Supply",     email: "team@reefsupply.io",    plan: "Starter", credits: 500,   used: 500,  joined: "Nov 5, 2025"  },
  { id: "5", name: "Forma Studio",    email: "info@formastudio.co",   plan: "Scale",   credits: 10000, used: 3201, joined: "Oct 22, 2025" },
];

export const DEFAULT_ADMIN_INVOICES: AdminInvoice[] = [
  { id: "INV-A024", company: "Lumina Apparel",  date: "May 1, 2026",  plan: "Growth",  credits: 2000,  amount: "$149.00", status: "paid"    },
  { id: "INV-A023", company: "Petal & Oak",     date: "May 1, 2026",  plan: "Starter", credits: 500,   amount: "$49.00",  status: "pending" },
  { id: "INV-A022", company: "Dusk Goods Co.",  date: "Apr 1, 2026",  plan: "Growth",  credits: 2000,  amount: "$149.00", status: "paid"    },
  { id: "INV-A021", company: "Forma Studio",    date: "Apr 1, 2026",  plan: "Scale",   credits: 10000, amount: "$499.00", status: "paid"    },
  { id: "INV-A020", company: "Reef Supply",     date: "Mar 1, 2026",  plan: "Starter", credits: 500,   amount: "$49.00",  status: "paid"    },
];

const CLIENT_KEY          = "credly_client";
const COMPANIES_KEY       = "credly_companies";
const ADMIN_INVOICES_KEY  = "credly_admin_invoices";

export function getClient(): ClientData {
  if (typeof window === "undefined") return { ...DEFAULT_CLIENT };
  try {
    const raw = localStorage.getItem(CLIENT_KEY);
    if (!raw) return { ...DEFAULT_CLIENT };
    return JSON.parse(raw) as ClientData;
  } catch {
    return { ...DEFAULT_CLIENT };
  }
}

export function saveClient(data: ClientData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLIENT_KEY, JSON.stringify(data));
}

export function getCompanies(): Company[] {
  if (typeof window === "undefined") return [...DEFAULT_COMPANIES];
  try {
    const raw = localStorage.getItem(COMPANIES_KEY);
    if (!raw) return [...DEFAULT_COMPANIES];
    return JSON.parse(raw) as Company[];
  } catch {
    return [...DEFAULT_COMPANIES];
  }
}

export function saveCompanies(data: Company[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(COMPANIES_KEY, JSON.stringify(data));
}

export function getAdminInvoices(): AdminInvoice[] {
  if (typeof window === "undefined") return [...DEFAULT_ADMIN_INVOICES];
  try {
    const raw = localStorage.getItem(ADMIN_INVOICES_KEY);
    if (!raw) return [...DEFAULT_ADMIN_INVOICES];
    return JSON.parse(raw) as AdminInvoice[];
  } catch {
    return [...DEFAULT_ADMIN_INVOICES];
  }
}

export function saveAdminInvoices(data: AdminInvoice[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_INVOICES_KEY, JSON.stringify(data));
}

export function nextInvoiceId(invoices: { id: string }[], prefix = "INV-"): string {
  if (invoices.length === 0) return `${prefix}0001`;
  const nums = invoices
    .map((inv) => parseInt(inv.id.replace(/^INV-[A-Z]?/, ""), 10))
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

export function companyStatus(co: Company): "active" | "depleted" {
  return co.used >= co.credits ? "depleted" : "active";
}
