"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/app/_lib/supabase";
import SourceIcon, { SourceIconRaw } from "@/app/_components/SourceIcon";
import {
  getAdminInvoices, saveAdminInvoices, getActivityLogs, addActivityLog,
  AdminInvoice, ActivityLog, Plan, PLANS, nextInvoiceId, formatDate, timeAgo,
} from "@/app/_lib/store";

// ── Types ──────────────────────────────────────────────────────────────────────

interface SupabaseCompany {
  id: string;
  name: string;
  email: string;
  industry: string;
  credits: number;
  credits_used: number;
  status: "active" | "suspended";
  created_at: string;
}

type CompanyStatus = "active" | "depleted" | "suspended";

function getCompanyStatus(co: SupabaseCompany): CompanyStatus {
  if (co.status === "suspended") return "suspended";
  if (co.credits_used >= co.credits) return "depleted";
  return "active";
}

type IssueCategory = "billing" | "technical" | "general";
type Priority = "low" | "medium" | "high";
type TicketStatus = "open" | "in-progress" | "resolved";

interface Ticket {
  id: string;
  company_id: string | null;
  company_name: string;
  email: string;
  issue_category: IssueCategory;
  priority: Priority;
  description: string;
  status: TicketStatus;
  created_at: string;
  reply: string | null;
  replied_at: string | null;
  source: string | null;
}

interface Integration {
  company_id: string;
  channel: string;
  status: "connected" | "disconnected";
  credentials: Record<string, string>;
}

interface IntChannelConfig {
  id: string;
  name: string;
  provider: string;
  description: string;
  permissions: string[];
  btnClass: string;
}

const INT_CHANNELS: IntChannelConfig[] = [
  {
    id: "gmail",
    name: "Gmail",
    provider: "Google",
    description: "Receive and reply to customer emails on behalf of this company.",
    permissions: [
      "Read and send emails",
      "Manage inbox labels and filters",
      "Access message metadata and attachments",
    ],
    btnClass: "bg-white border border-stone-300 text-zinc-700 hover:bg-stone-50",
  },
  {
    id: "slack",
    name: "Slack",
    provider: "Slack",
    description: "Post ticket alerts and updates to this company's Slack workspace.",
    permissions: [
      "Send messages to channels",
      "Read channel and workspace info",
      "Post automated ticket notifications",
    ],
    btnClass: "bg-[#4A154B] text-white hover:bg-[#3a0f3a] border border-transparent",
  },
  {
    id: "hubspot",
    name: "HubSpot",
    provider: "HubSpot",
    description: "Sync contacts, tickets, and conversations with this company's CRM.",
    permissions: [
      "Read and write CRM contacts",
      "Access ticket and deal records",
      "Sync conversation history",
    ],
    btnClass: "bg-[#FF7A59] text-white hover:bg-[#e86a4a] border border-transparent",
  },
  {
    id: "instagram",
    name: "Instagram",
    provider: "Meta",
    description: "Manage DMs and comments from this company's Instagram Business account.",
    permissions: [
      "Read and reply to direct messages",
      "Access Instagram Business account info",
      "Manage comments on business posts",
    ],
    btnClass: "bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white border border-transparent",
  },
];

// ── Config ─────────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  active:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  depleted:  "bg-amber-50 text-amber-700 border-amber-200",
  suspended: "bg-red-50 text-red-700 border-red-200",
};

const BREAKDOWN = [
  { label: "Shipping",  ratio: 0.52, color: "bg-indigo-400" },
  { label: "Returns",   ratio: 0.27, color: "bg-violet-400" },
  { label: "Inquiries", ratio: 0.21, color: "bg-sky-400"    },
];

const TICKET_STATUS_CFG: Record<TicketStatus, { label: string; badge: string; dot: string }> = {
  open:          { label: "Open",        badge: "bg-amber-50 text-amber-700",     dot: "bg-amber-400"   },
  "in-progress": { label: "In Progress", badge: "bg-indigo-50 text-indigo-700",   dot: "bg-indigo-500"  },
  resolved:      { label: "Resolved",    badge: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
};

const PRIORITY_DOT: Record<Priority, string> = {
  low:    "bg-stone-300",
  medium: "bg-amber-400",
  high:   "bg-red-500",
};

type TicketFilter = TicketStatus | "all";

const TICKET_FILTERS: { id: TicketFilter; label: string }[] = [
  { id: "all",         label: "All"         },
  { id: "open",        label: "Open"        },
  { id: "in-progress", label: "In Progress" },
  { id: "resolved",    label: "Resolved"    },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function planPrice(credits: number): string {
  if (credits >= 10000) return "$499/mo";
  if (credits >= 2000)  return "$149/mo";
  return "$49/mo";
}

function buildAIDraft(ticket: Ticket): string {
  const body: Record<IssueCategory, string> = {
    billing: `I've reviewed your account and I can see the concern you've raised. I'd be happy to look into the billing details and clarify any charges or discrepancies.\n\nCould you please share the invoice number or approximate date of the charge in question? That will help me pull up the exact details and get this resolved as quickly as possible.`,
    technical: `I've noted the technical issue you've described and I want to get this sorted out right away. To help me investigate, could you let me know which browser or device you're using, and whether this started after any recent changes on your end? Any error messages or screenshots would also be really helpful.`,
    general: `I'd be happy to help with your inquiry. To make sure I give you the most accurate information, could you share a few more details about what you're looking to accomplish? I want to make sure we address your needs fully.`,
  };
  return `Hi ${ticket.company_name},\n\nThank you for reaching out — we appreciate you getting in touch.\n\n${body[ticket.issue_category]}\n\nPlease don't hesitate to reply with any additional information and I'll get back to you as soon as possible.\n\nBest regards,\nSupport Team`;
}

// ── IntConnectModal ────────────────────────────────────────────────────────────

function IntConnectModal({
  config,
  companyName,
  onClose,
  onSave,
}: {
  config: IntChannelConfig;
  companyName: string;
  onClose: () => void;
  onSave: () => Promise<void>;
}) {
  const [connecting, setConnecting] = useState(false);
  const [done,       setDone]       = useState(false);

  const handleConnect = async () => {
    if (connecting || done) return;
    setConnecting(true);
    await new Promise((r) => setTimeout(r, 1200));
    await onSave();
    setDone(true);
    setConnecting(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden w-10 h-1 bg-zinc-200 rounded-full mx-auto mb-5" />
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2.5">
            <SourceIconRaw source={config.id} size={22} />
            <h2 className="text-base font-bold text-zinc-900">Connect {config.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="hidden sm:flex w-7 h-7 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 text-xl transition-colors"
          >
            ×
          </button>
        </div>
        <p className="text-sm text-zinc-500 mt-1 mb-5">
          For <span className="font-medium text-zinc-700">{companyName}</span> · via {config.provider} OAuth
        </p>

        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Permissions requested</p>
        <ul className="flex flex-col gap-2 mb-6">
          {config.permissions.map((perm) => (
            <li key={perm} className="flex items-start gap-2 text-sm text-zinc-600">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 mt-0.5 flex-shrink-0">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              {perm}
            </li>
          ))}
        </ul>

        <button
          onClick={handleConnect}
          disabled={connecting || done}
          className={`w-full text-sm font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${config.btnClass} disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {connecting ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin opacity-70" />
              Connecting…
            </>
          ) : done ? (
            "Connected!"
          ) : (
            `Continue with ${config.provider}`
          )}
        </button>

        <p className="text-[11px] text-zinc-400 text-center mt-3">
          You&apos;ll be redirected to {config.provider} to authorize access.
        </p>
      </div>
    </div>
  );
}

// ── PlanModal ──────────────────────────────────────────────────────────────────

function PlanModal({ company, onClose, onDone }: { company: SupabaseCompany; onClose: () => void; onDone: (plan: Plan) => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 sm:p-7" onClick={(e) => e.stopPropagation()}>
        <div className="sm:hidden w-10 h-1 bg-zinc-200 rounded-full mx-auto mb-5" />
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold text-zinc-900">Issue credits</h2>
          <button onClick={onClose} className="hidden sm:flex w-7 h-7 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 text-xl">×</button>
        </div>
        <p className="text-sm text-zinc-500 mb-5">Adding credits to <span className="font-semibold text-zinc-700">{company.name}</span>.</p>
        <div className="flex flex-col gap-2.5">
          {PLANS.map((plan) => (
            <button
              key={plan.name}
              onClick={() => { onDone(plan); onClose(); }}
              className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200 hover:border-indigo-300 hover:bg-indigo-50/40 active:scale-[0.99] transition-all text-left"
            >
              <div>
                <p className="text-sm font-bold text-zinc-900">{plan.name}</p>
                <p className="text-xs text-zinc-400">{plan.credits.toLocaleString()} credits</p>
              </div>
              <p className="text-base font-black text-zinc-900">{plan.priceStr}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [company,        setCompany]        = useState<SupabaseCompany | null>(null);
  const [tickets,        setTickets]        = useState<Ticket[]>([]);
  const [invoices,       setInvoices]       = useState<AdminInvoice[]>([]);
  const [activity,       setActivity]       = useState<ActivityLog[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [notFound,       setNotFound]       = useState(false);
  const [modal,          setModal]          = useState<"credits" | null>(null);
  const [toast,          setToast]          = useState<string | null>(null);
  const [ticketFilter,   setTicketFilter]   = useState<TicketFilter>("all");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText,      setReplyText]      = useState("");
  const [suggesting,     setSuggesting]     = useState(false);
  const [integrations,     setIntegrations]     = useState<Integration[]>([]);
  const [modalIntChannel,  setModalIntChannel]  = useState<string | null>(null);

  const searchParams = useSearchParams();

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  useEffect(() => {
    if (searchParams.get("gmail") === "connected") showToast("Gmail connected successfully");
    if (searchParams.get("error") === "gmail_auth_failed") showToast("Gmail connection failed — please try again");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);

    const { data: coData } = await supabase.from("companies").select("*").eq("id", id).single();
    if (!coData) {
      setNotFound(true); setLoading(false); return;
    }
    setCompany(coData as SupabaseCompany);
    setNotFound(false);

    const { data: ticketData } = await supabase.from("tickets").select("*").eq("company_id", id).order("created_at", { ascending: false });
    if (ticketData) setTickets(ticketData as Ticket[]);

    const { data: intData } = await supabase.from("integrations").select("company_id, channel, status, credentials").eq("company_id", id);
    if (intData) setIntegrations(intData as Integration[]);

    const allInvs = getAdminInvoices();
    setInvoices(allInvs.filter((inv) => inv.companyId === id || inv.company === (coData as SupabaseCompany).name));
    setActivity(getActivityLogs().filter((a) => a.companyId === id));

    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleIssueCredits = async (plan: Plan) => {
    if (!company || !supabase) return;
    await supabase.from("companies").update({ credits: company.credits + plan.credits }).eq("id", id);
    const allInvs = getAdminInvoices();
    const newInv: AdminInvoice = {
      id: nextInvoiceId(allInvs, "INV-A"),
      company: company.name,
      companyId: id,
      date: formatDate(),
      plan: plan.name,
      credits: plan.credits,
      amount: plan.priceStr,
      status: "paid",
    };
    saveAdminInvoices([newInv, ...allInvs]);
    addActivityLog({ type: "credit_issued", company: company.name, companyId: id, description: `${plan.credits.toLocaleString()} credits issued (${plan.name} plan)`, amount: plan.priceStr });
    await load();
    showToast(`${plan.credits.toLocaleString()} credits added`);
  };

  const handleToggleSuspend = async () => {
    if (!company || !supabase) return;
    const newStatus = company.status === "suspended" ? "active" : "suspended";
    await supabase.from("companies").update({ status: newStatus }).eq("id", id);
    addActivityLog({
      type: newStatus === "suspended" ? "company_suspended" : "company_activated",
      company: company.name,
      companyId: id,
      description: newStatus === "suspended" ? "Account suspended by admin" : "Account reactivated by admin",
    });
    await load();
    showToast(newStatus === "suspended" ? "Account suspended" : "Account reactivated");
  };

  const handleGenerateInvoice = () => {
    if (!company) return;
    const allInvs = getAdminInvoices();
    const plan    = PLANS.find((p) => p.credits === company.credits) ?? PLANS[1];
    const newInv: AdminInvoice = {
      id: nextInvoiceId(allInvs, "INV-A"),
      company: company.name,
      companyId: id,
      date: formatDate(),
      plan: plan.name,
      credits: plan.credits,
      amount: plan.priceStr,
      status: "pending",
    };
    saveAdminInvoices([newInv, ...allInvs]);
    addActivityLog({ type: "invoice_generated", company: company.name, companyId: id, description: `Invoice ${newInv.id} generated — ${plan.priceStr}`, amount: plan.priceStr });
    load();
    showToast("Invoice generated");
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket || !supabase) return;

    if (selectedTicket.source === "gmail") {
      await fetch("/api/integrations/gmail/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket_id: selectedTicket.id, reply_text: replyText.trim() }),
      }).catch(() => null);
    }

    const now = new Date().toISOString();
    await supabase.from("tickets").update({
      reply: replyText.trim(),
      replied_at: now,
      status: "resolved",
    }).eq("id", selectedTicket.id);
    const updated: Ticket = { ...selectedTicket, reply: replyText.trim(), replied_at: now, status: "resolved" };
    setTickets((prev) => prev.map((t) => (t.id === selectedTicket.id ? updated : t)));
    setSelectedTicket(updated);
    setReplyText("");
    showToast("Reply sent — ticket resolved");
  };

  const suggestReply = () => {
    if (!selectedTicket || suggesting) return;
    setSuggesting(true);
    setTimeout(() => {
      setReplyText(buildAIDraft(selectedTicket));
      setSuggesting(false);
    }, 1400);
  };

  const handleIntConnect = async (channelId: string) => {
    if (!supabase) return;
    await supabase.from("integrations").upsert(
      { company_id: id, channel: channelId, status: "connected", credentials: { method: "oauth" } },
      { onConflict: "company_id,channel" }
    );
    setModalIntChannel(null);
    await load();
    showToast(`${INT_CHANNELS.find((c) => c.id === channelId)?.name} connected`);
  };

  const handleIntDisconnect = async (channelId: string) => {
    if (!supabase) return;
    await supabase.from("integrations").upsert(
      { company_id: id, channel: channelId, status: "disconnected", credentials: {} },
      { onConflict: "company_id,channel" }
    );
    await load();
    showToast("Integration disconnected");
  };

  // ── Loading / not found ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 md:px-8 md:py-8 flex items-center justify-center py-24">
        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !company) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-sm text-zinc-400">Company not found.</p>
        <Link href="/admin/companies" className="text-sm text-indigo-600 hover:underline mt-2 block">← Back to companies</Link>
      </div>
    );
  }

  // ── Conversation view ──────────────────────────────────────────────────────

  if (selectedTicket) {
    const st = TICKET_STATUS_CFG[selectedTicket.status];
    const sentAt = new Date(selectedTicket.created_at).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
    const initials = selectedTicket.company_name.slice(0, 2).toUpperCase();

    return (
      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 md:px-8 md:py-8">
        {toast && (
          <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 bg-zinc-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg">
            {toast}
          </div>
        )}

        <button
          onClick={() => { setSelectedTicket(null); setReplyText(""); }}
          className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-700 mb-6 transition-colors group"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {company.name}
        </button>

        <div className="bg-white rounded-xl border border-zinc-200 p-5 sm:p-6 mb-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-base font-bold text-zinc-900">{selectedTicket.company_name}</p>
              <p className="text-sm text-zinc-400 mt-0.5">{selectedTicket.email}</p>
              <p className="text-xs text-zinc-400 mt-1">{sentAt}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600 capitalize">
                {selectedTicket.issue_category}
              </span>
              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${
                selectedTicket.priority === "high" ? "bg-red-50 text-red-600" :
                selectedTicket.priority === "medium" ? "bg-amber-50 text-amber-600" :
                "bg-zinc-50 text-zinc-500"
              }`}>
                {selectedTicket.priority}
              </span>
              <SourceIcon source={selectedTicket.source} size={18} />
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${st.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${st.dot}`} />
                {st.label}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 mb-4">
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-600 flex-shrink-0">
                {initials}
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-900">{selectedTicket.company_name}</p>
                <p className="text-[11px] text-zinc-400">{sentAt}</p>
              </div>
            </div>
            <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">{selectedTicket.description}</p>
          </div>

          {selectedTicket.reply && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 ml-6 sm:ml-10">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 flex-shrink-0">
                  A
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-900">Support Agent</p>
                  <p className="text-[11px] text-zinc-400">{selectedTicket.replied_at ? timeAgo(selectedTicket.replied_at) : ""}</p>
                </div>
              </div>
              <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">{selectedTicket.reply}</p>
            </div>
          )}
        </div>

        {selectedTicket.status !== "resolved" ? (
          <div className="bg-white rounded-xl border border-zinc-200 p-5 sm:p-6">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">Reply</p>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={5}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all resize-none mb-3"
              placeholder="Write a reply…"
            />
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <button
                onClick={suggestReply}
                disabled={suggesting}
                className="flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-3.5 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-5.74L4 10l5.91-1.74L12 2z" />
                  <path d="M19 15l.94 2.06L22 18l-2.06.94L19 21l-.94-2.06L16 18l2.06-.94L19 15z" />
                </svg>
                {suggesting ? "Thinking…" : "Suggest AI Reply"}
              </button>
              <button
                onClick={handleSendReply}
                disabled={!replyText.trim()}
                className="text-sm font-semibold bg-zinc-900 text-white px-5 py-2.5 rounded-lg hover:bg-zinc-800 active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Send Reply
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-center">
            <p className="text-sm text-zinc-400">Ticket resolved</p>
          </div>
        )}
      </div>
    );
  }

  // ── Main company view ──────────────────────────────────────────────────────

  const st               = getCompanyStatus(company);
  const creditsRemaining = Math.max(company.credits - company.credits_used, 0);
  const creditPct        = Math.min(Math.round((company.credits_used / company.credits) * 100), 100);
  const breakdown        = BREAKDOWN.map((b) => ({ ...b, credits: Math.round(company.credits_used * b.ratio) }));

  const joinedDate = new Date(company.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const filteredTickets = ticketFilter === "all" ? tickets : tickets.filter((t) => t.status === ticketFilter);

  const openTicketCount   = tickets.filter((t) => t.status === "open").length;
  const lastWeek          = new Date(Date.now() - 7 * 86400000);
  const resolvedThisWeek  = tickets.filter((t) => t.status === "resolved" && t.replied_at && new Date(t.replied_at) >= lastWeek).length;
  const resolvedWithTimes = tickets.filter((t) => t.status === "resolved" && !!t.replied_at);
  const avgResponseHours  = resolvedWithTimes.length > 0
    ? Math.round(resolvedWithTimes.reduce((s, t) => s + (new Date(t.replied_at!).getTime() - new Date(t.created_at).getTime()), 0) / resolvedWithTimes.length / 3600000)
    : null;
  const highPriCount      = tickets.filter((t) => t.priority === "high" && t.status !== "resolved").length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 md:px-8 md:py-8">
      {modal === "credits" && <PlanModal company={company} onClose={() => setModal(null)} onDone={handleIssueCredits} />}

      {modalIntChannel && (() => {
        const cfg = INT_CHANNELS.find((c) => c.id === modalIntChannel);
        return cfg ? (
          <IntConnectModal
            config={cfg}
            companyName={company.name}
            onClose={() => setModalIntChannel(null)}
            onSave={() => handleIntConnect(modalIntChannel)}
          />
        ) : null;
      })()}

      {toast && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 bg-zinc-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-400 mb-5">
        <Link href="/admin/companies" className="hover:text-zinc-700 transition-colors">Companies</Link>
        <span>/</span>
        <span className="text-zinc-700 font-medium truncate">{company.name}</span>
      </div>

      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-start justify-between gap-4 mb-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">{company.name}</h1>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS_BADGE[st]}`}>{st}</span>
          </div>
        </div>
        <p className="text-sm text-zinc-400">{company.email} · {company.industry} · Joined {joinedDate}</p>

        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={handleGenerateInvoice}
            className="text-sm font-medium text-zinc-600 border border-zinc-200 px-3 py-2 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            Generate invoice
          </button>
          <button
            onClick={() => setModal("credits")}
            className="text-sm font-semibold bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Issue credits
          </button>
          <button
            onClick={handleToggleSuspend}
            className={`text-sm font-semibold px-3 py-2 rounded-lg transition-colors ${
              company.status === "suspended"
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
            }`}
          >
            {company.status === "suspended" ? "Reactivate" : "Suspend"}
          </button>
        </div>
      </div>

      {/* Ticket stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-5">
        {[
          { label: "Open Tickets",       value: openTicketCount.toString(),                              sub: "Awaiting reply",     color: openTicketCount > 0 ? "text-amber-500" : "text-zinc-900" },
          { label: "Resolved This Week", value: resolvedThisWeek.toString(),                             sub: "Last 7 days",        color: "text-emerald-600" },
          { label: "Avg Response",       value: avgResponseHours !== null ? `${avgResponseHours}h` : "—", sub: "Hours to resolve",   color: "text-zinc-900" },
          { label: "High Priority",      value: highPriCount.toString(),                                 sub: "Need attention",     color: highPriCount > 0 ? "text-red-500" : "text-zinc-900" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5">
            <p className="text-[10px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">{s.label}</p>
            <p className={`text-xl sm:text-2xl font-black leading-none tabular-nums mb-1 ${s.color}`}>{s.value}</p>
            <p className="text-xs text-zinc-400">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Support Tickets */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden mb-5">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-zinc-900">Support Tickets</p>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500">
              {tickets.length}
            </span>
          </div>
        </div>

        <div className="flex gap-1 px-5 py-3 border-b border-zinc-100 overflow-x-auto">
          {TICKET_FILTERS.map((f) => {
            const count = f.id === "all" ? tickets.length : tickets.filter((t) => t.status === f.id).length;
            return (
              <button
                key={f.id}
                onClick={() => setTicketFilter(f.id)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex-shrink-0 ${
                  ticketFilter === f.id
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                {f.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                  ticketFilter === f.id ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-400"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {filteredTickets.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-zinc-400">
            {tickets.length === 0 ? "No tickets yet." : "No tickets match this filter."}
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {filteredTickets.map((ticket) => {
              const tst      = TICKET_STATUS_CFG[ticket.status];
              const waitMs   = Date.now() - new Date(ticket.created_at).getTime();
              const waitHrs  = Math.floor(waitMs / 3600000);
              const waitDays = Math.floor(waitMs / 86400000);
              const waitLabel = waitDays > 0 ? `${waitDays}d` : waitHrs > 0 ? `${waitHrs}h` : "< 1h";
              const isOverdue = ticket.status !== "resolved" && waitMs > 86400000;
              return (
                <button
                  key={ticket.id}
                  onClick={() => { setSelectedTicket(ticket); setReplyText(""); }}
                  className="w-full text-left px-5 py-4 hover:bg-zinc-50 transition-colors flex items-start gap-3.5 group"
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-[7px] ${PRIORITY_DOT[ticket.priority]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-zinc-900 truncate">{ticket.company_name}</p>
                      <span className="text-[11px] text-zinc-400 flex-shrink-0">{timeAgo(ticket.created_at)}</span>
                    </div>
                    <p className="text-xs text-zinc-400 mb-1">{ticket.email}</p>
                    <p className="text-xs text-zinc-500 truncate mb-2">{ticket.description}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-medium text-zinc-400 bg-zinc-50 px-2 py-0.5 rounded capitalize">
                        {ticket.issue_category}
                      </span>
                      <SourceIcon source={ticket.source} size={14} />
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${tst.badge}`}>
                        <span className={`w-1 h-1 rounded-full flex-shrink-0 ${tst.dot}`} />
                        {tst.label}
                      </span>
                      {ticket.status !== "resolved" && (
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${isOverdue ? "bg-red-50 text-red-600" : "bg-zinc-50 text-zinc-500"}`}>
                          {isOverdue ? "⚠ " : ""}{waitLabel} waiting
                        </span>
                      )}
                    </div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-300 group-hover:text-zinc-400 flex-shrink-0 mt-1 transition-colors">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Integrations */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden mb-5">
        <div className="px-5 py-4 border-b border-zinc-100">
          <p className="text-sm font-semibold text-zinc-900">Integrations</p>
          <p className="text-xs text-zinc-400 mt-0.5">Connected channels for {company.name}.</p>
        </div>
        <div className="divide-y divide-zinc-100">
          {INT_CHANNELS.map((ch) => {
            const row       = integrations.find((i) => i.channel === ch.id && i.status === "connected");
            const connected = !!row;
            return (
              <div key={ch.id} className="flex items-center gap-3.5 px-5 py-3.5">
                <SourceIconRaw source={ch.id} size={20} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900">{ch.name}</p>
                  {connected && (
                    <p className="text-xs text-zinc-400 mt-0.5">via OAuth</p>
                  )}
                </div>
                {connected ? (
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                      Connected
                    </span>
                    {ch.id === "gmail" && row.credentials.email && (
                      <span className="text-[11px] text-zinc-400">{row.credentials.email}</span>
                    )}
                    <button
                      onClick={() => handleIntDisconnect(ch.id)}
                      className="text-xs font-medium text-zinc-400 hover:text-zinc-700 border border-zinc-200 px-2.5 py-1 rounded-lg hover:bg-zinc-50 transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[11px] text-zinc-400">Not connected</span>
                    <button
                      onClick={() => {
                        if (ch.id === "gmail") {
                          window.location.href = `/api/integrations/gmail/auth?company_id=${id}`;
                        } else {
                          setModalIntChannel(ch.id);
                        }
                      }}
                      className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      Connect
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Credits & Billing */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-5">
        {[
          { label: "Credits used",      value: company.credits_used.toLocaleString(), sub: "This period",                              color: undefined },
          { label: "Credits remaining", value: creditsRemaining.toLocaleString(),     sub: `of ${company.credits.toLocaleString()} total`, color: creditsRemaining < 100 ? "text-amber-500" : undefined },
          { label: "Plan",              value: planPrice(company.credits),             sub: `${company.credits.toLocaleString()} credits`, color: undefined },
          { label: "Invoices",          value: invoices.length.toString(),             sub: `${invoices.filter((i) => i.status === "paid").length} paid`, color: undefined },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5">
            <p className="text-[10px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">{s.label}</p>
            <p className={`text-xl sm:text-2xl font-black leading-none tabular-nums mb-1 ${s.color ?? "text-zinc-900"}`}>{s.value}</p>
            <p className="text-xs text-zinc-400">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-5">
        <div className="bg-white rounded-xl border border-zinc-200 p-5 sm:p-6">
          <p className="text-sm font-semibold text-zinc-900 mb-4">Credit balance</p>
          <div className="flex items-end justify-between mb-2">
            <span className="text-2xl sm:text-3xl font-black text-zinc-900 tabular-nums">{creditsRemaining.toLocaleString()}</span>
            <span className="text-sm text-zinc-400">remaining</span>
          </div>
          <div className="w-full h-2 bg-zinc-100 rounded-full mb-2">
            <div
              className={`h-2 rounded-full transition-all ${st === "depleted" ? "bg-amber-400" : st === "suspended" ? "bg-red-400" : "bg-indigo-500"}`}
              style={{ width: `${creditPct}%` }}
            />
          </div>
          <p className="text-xs text-zinc-400">{creditPct}% of {company.credits.toLocaleString()} used</p>
          <button onClick={() => setModal("credits")} className="mt-4 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
            Issue more credits
          </button>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-5 sm:p-6">
          <p className="text-sm font-semibold text-zinc-900 mb-4">Usage breakdown</p>
          {company.credits_used === 0 ? (
            <p className="text-sm text-zinc-400 pt-4">No usage yet.</p>
          ) : (
            <div className="flex flex-col gap-3.5">
              {breakdown.map((item) => {
                const pct = Math.round((item.credits / company.credits_used) * 100);
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-zinc-600">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-400">{pct}%</span>
                        <span className="text-xs font-semibold text-zinc-900 tabular-nums w-10 text-right">{item.credits}</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-100 rounded-full">
                      <div className={`h-1.5 rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-5">
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
            <p className="text-sm font-semibold text-zinc-900">Invoice history</p>
            <button onClick={handleGenerateInvoice} className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors">+ Generate</button>
          </div>
          {invoices.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-zinc-400">No invoices yet.</div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {invoices.slice(0, 5).map((inv) => (
                <div key={inv.id} className="flex items-center justify-between px-5 py-3 gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-mono font-medium text-zinc-800">{inv.id}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{inv.date} · {inv.plan}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-semibold text-zinc-900">{inv.amount}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${inv.status === "paid" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100">
            <p className="text-sm font-semibold text-zinc-900">Activity</p>
          </div>
          {activity.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-zinc-400">No activity yet.</div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {activity.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-start gap-3 px-5 py-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-700">{log.description}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{timeAgo(log.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-xl border border-red-100 p-5 sm:p-6">
        <p className="text-sm font-semibold text-zinc-900 mb-0.5">Danger zone</p>
        <p className="text-xs text-zinc-400 mb-4">These actions affect the account immediately.</p>
        <div className="flex items-start sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-700">{company.status === "suspended" ? "Reactivate account" : "Suspend account"}</p>
            <p className="text-xs text-zinc-400 mt-0.5">
              {company.status === "suspended" ? "Restore access for this company." : "Block all access for this company."}
            </p>
          </div>
          <button
            onClick={handleToggleSuspend}
            className={`text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex-shrink-0 ${
              company.status === "suspended"
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "border border-red-200 text-red-600 hover:bg-red-50"
            }`}
          >
            {company.status === "suspended" ? "Reactivate" : "Suspend account"}
          </button>
        </div>
      </div>
    </div>
  );
}
