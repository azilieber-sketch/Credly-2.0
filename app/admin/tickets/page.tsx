"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/app/_lib/supabase";
import SourceIcon from "@/app/_components/SourceIcon";

type Priority     = "low" | "medium" | "high";
type TicketStatus = "open" | "in-progress" | "resolved";

interface Ticket {
  id: string;
  company_id: string | null;
  company_name: string;
  email: string;
  issue_category: "billing" | "technical" | "general";
  priority: Priority;
  description: string;
  status: TicketStatus;
  created_at: string;
  reply: string | null;
  replied_at: string | null;
  source: string | null;
}

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<TicketStatus, { label: string; badge: string; dot: string }> = {
  open:          { label: "Open",        badge: "bg-amber-50 text-amber-700",     dot: "bg-amber-400"   },
  "in-progress": { label: "In Progress", badge: "bg-indigo-50 text-indigo-700",   dot: "bg-indigo-500"  },
  resolved:      { label: "Resolved",    badge: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
};

const PRIORITY_DOT: Record<Priority, string> = {
  low:    "bg-stone-300",
  medium: "bg-amber-400",
  high:   "bg-red-500",
};

const PRIORITY_BADGE: Record<Priority, string> = {
  low:    "bg-stone-50 text-stone-500",
  medium: "bg-amber-50 text-amber-600",
  high:   "bg-red-50 text-red-600",
};

type SortKey = "newest" | "oldest" | "priority" | "company";

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function waitingTime(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (hours < 1)  return "< 1h";
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
}

function buildAIDraft(ticket: Ticket): string {
  const body: Record<string, string> = {
    billing:   `I've reviewed your account and I can see the concern you've raised. I'd be happy to look into the billing details and clarify any charges or discrepancies.\n\nCould you please share the invoice number or approximate date of the charge in question? That will help me pull up the exact details and get this resolved as quickly as possible.`,
    technical: `I've noted the technical issue you've described and I want to get this sorted out right away. To help me investigate, could you let me know which browser or device you're using, and whether this started after any recent changes on your end? Any error messages or screenshots would also be really helpful.`,
    general:   `I'd be happy to help with your inquiry. To make sure I give you the most accurate information, could you share a few more details about what you're looking to accomplish? I want to make sure we address your needs fully.`,
  };
  return `Hi ${ticket.company_name},\n\nThank you for reaching out — we appreciate you getting in touch.\n\n${body[ticket.issue_category] ?? body.general}\n\nPlease don't hesitate to reply with any additional information and I'll get back to you as soon as possible.\n\nBest regards,\nSupport Team`;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminTicketsPage() {
  const [tickets,        setTickets]        = useState<Ticket[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [selected,       setSelected]       = useState<Ticket | null>(null);
  const [replyText,      setReplyText]      = useState("");
  const [sending,        setSending]        = useState(false);
  const [suggesting,     setSuggesting]     = useState(false);
  const [toast,          setToast]          = useState<string | null>(null);

  // Filters
  const [statusFilter,   setStatusFilter]   = useState<TicketStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [sourceFilter,   setSourceFilter]   = useState<string>("all");
  const [companyFilter,  setCompanyFilter]  = useState<string>("all");
  const [sortKey,        setSortKey]        = useState<SortKey>("newest");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const load = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("tickets")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setTickets(data as Ticket[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    if (!supabase) return;
    const channel = supabase
      .channel("admin-tickets-inbox")
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets" }, () => load())
      .subscribe();
    return () => { supabase!.removeChannel(channel); };
  }, [load]);

  // ── Derived ──────────────────────────────────────────────────────────────────

  const companies = Array.from(new Set(tickets.map((t) => t.company_name))).sort();
  const sources   = Array.from(new Set(tickets.map((t) => t.source ?? "unknown"))).sort();

  const filtered = tickets
    .filter((t) => statusFilter   === "all" || t.status   === statusFilter)
    .filter((t) => priorityFilter === "all" || t.priority === priorityFilter)
    .filter((t) => sourceFilter   === "all" || (t.source ?? "unknown") === sourceFilter)
    .filter((t) => companyFilter  === "all" || t.company_name === companyFilter)
    .sort((a, b) => {
      if (sortKey === "newest")   return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortKey === "oldest")   return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortKey === "priority") return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (sortKey === "company")  return a.company_name.localeCompare(b.company_name);
      return 0;
    });

  // ── Reply ─────────────────────────────────────────────────────────────────────

  const handleSendReply = async () => {
    if (!replyText.trim() || !selected || !supabase) return;
    setSending(true);

    if (selected.source === "gmail") {
      await fetch("/api/integrations/gmail/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket_id: selected.id, reply_text: replyText.trim() }),
      }).catch(() => null);
    }

    const now = new Date().toISOString();
    await supabase.from("tickets").update({
      reply: replyText.trim(), replied_at: now, status: "resolved",
    }).eq("id", selected.id);
    const updated: Ticket = { ...selected, reply: replyText.trim(), replied_at: now, status: "resolved" };
    setTickets((prev) => prev.map((t) => (t.id === selected.id ? updated : t)));
    setSelected(updated);
    setReplyText("");
    setSending(false);
    showToast("Reply sent — ticket resolved");
  };

  const suggestReply = () => {
    if (!selected || suggesting) return;
    setSuggesting(true);
    setTimeout(() => { setReplyText(buildAIDraft(selected)); setSuggesting(false); }, 1400);
  };

  // ── Conversation view ─────────────────────────────────────────────────────────

  if (selected) {
    const st = STATUS_CFG[selected.status];
    const sentAt = new Date(selected.created_at).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
    const initials = selected.company_name.slice(0, 2).toUpperCase();

    return (
      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 md:px-8 md:py-8">
        {toast && (
          <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 bg-zinc-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg">
            {toast}
          </div>
        )}

        <button
          onClick={() => { setSelected(null); setReplyText(""); }}
          className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-700 mb-6 transition-colors group"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          All tickets
        </button>

        <div className="bg-white rounded-xl border border-zinc-200 p-5 sm:p-6 mb-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-base font-bold text-zinc-900">{selected.company_name}</p>
              <p className="text-sm text-zinc-400 mt-0.5">{selected.email}</p>
              <p className="text-xs text-zinc-400 mt-1">{sentAt}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600 capitalize">
                {selected.issue_category}
              </span>
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${PRIORITY_BADGE[selected.priority]}`}>
                {selected.priority}
              </span>
              <SourceIcon source={selected.source} size={18} />
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
                <p className="text-xs font-semibold text-zinc-900">{selected.company_name}</p>
                <p className="text-[11px] text-zinc-400">{sentAt}</p>
              </div>
            </div>
            <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">{selected.description}</p>
          </div>

          {selected.reply && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 ml-6 sm:ml-10">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 flex-shrink-0">
                  A
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-900">Support Agent</p>
                  <p className="text-[11px] text-zinc-400">{selected.replied_at ? timeAgo(selected.replied_at) : ""}</p>
                </div>
              </div>
              <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">{selected.reply}</p>
            </div>
          )}
        </div>

        {selected.status !== "resolved" ? (
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
                </svg>
                {suggesting ? "Thinking…" : "Suggest AI Reply"}
              </button>
              <button
                onClick={handleSendReply}
                disabled={!replyText.trim() || sending}
                className="text-sm font-semibold bg-zinc-900 text-white px-5 py-2.5 rounded-lg hover:bg-zinc-800 active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sending ? "Sending…" : "Send Reply"}
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

  // ── Inbox view ────────────────────────────────────────────────────────────────

  const openCount = tickets.filter((t) => t.status === "open").length;
  const highCount = tickets.filter((t) => t.priority === "high" && t.status !== "resolved").length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 md:px-8 md:py-8">
      {toast && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 bg-zinc-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">Admin</p>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">Global Inbox</h1>
            <p className="text-sm text-zinc-400 mt-0.5">
              {openCount} open · {highCount > 0 && <span className="text-red-500 font-medium">{highCount} high priority</span>}
              {highCount === 0 && "no high priority"} · {tickets.length} total
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-zinc-400">Live</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 mb-4 flex flex-wrap gap-3">
        {/* Company */}
        <select
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          className="text-xs border border-zinc-200 rounded-lg px-2.5 py-2 bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 min-w-[120px]"
        >
          <option value="all">All companies</option>
          {companies.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TicketStatus | "all")}
          className="text-xs border border-zinc-200 rounded-lg px-2.5 py-2 bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="all">All statuses</option>
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>

        {/* Priority */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as Priority | "all")}
          className="text-xs border border-zinc-200 rounded-lg px-2.5 py-2 bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="all">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* Source */}
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="text-xs border border-zinc-200 rounded-lg px-2.5 py-2 bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 capitalize"
        >
          <option value="all">All sources</option>
          {sources.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>

        {/* Sort */}
        <div className="ml-auto">
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="text-xs border border-zinc-200 rounded-lg px-2.5 py-2 bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="priority">By priority</option>
            <option value="company">By company</option>
          </select>
        </div>
      </div>

      {/* Ticket list */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-14">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-sm text-zinc-400">
              {tickets.length === 0 ? "No tickets yet." : "No tickets match the current filters."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {filtered.map((ticket) => {
              const st       = STATUS_CFG[ticket.status];
              const waiting  = ticket.status !== "resolved" ? waitingTime(ticket.created_at) : null;
              const isOld    = waiting && Date.now() - new Date(ticket.created_at).getTime() > 86400000;
              return (
                <button
                  key={ticket.id}
                  onClick={() => { setSelected(ticket); setReplyText(""); }}
                  className="w-full text-left px-5 py-4 hover:bg-zinc-50/80 transition-colors flex items-start gap-3 group"
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-[7px] ${PRIORITY_DOT[ticket.priority]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 truncate">{ticket.company_name}</p>
                        <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full capitalize flex-shrink-0 ${PRIORITY_BADGE[ticket.priority]}`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400 flex-shrink-0">{timeAgo(ticket.created_at)}</span>
                    </div>
                    <p className="text-xs text-zinc-400 mb-1">{ticket.email}</p>
                    <p className="text-xs text-zinc-500 truncate mb-2">{ticket.description}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <SourceIcon source={ticket.source} size={13} />
                      <span className="text-[11px] font-medium text-zinc-400 bg-zinc-50 px-2 py-0.5 rounded capitalize">
                        {ticket.issue_category}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${st.badge}`}>
                        <span className={`w-1 h-1 rounded-full flex-shrink-0 ${st.dot}`} />
                        {st.label}
                      </span>
                      {waiting && (
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${isOld ? "bg-red-50 text-red-600" : "bg-zinc-50 text-zinc-500"}`}>
                          {isOld ? "⚠ " : ""}{waiting} waiting
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

      <p className="text-xs text-zinc-400 text-center mt-4">
        {filtered.length} of {tickets.length} tickets · Updates in real time
      </p>
    </div>
  );
}
