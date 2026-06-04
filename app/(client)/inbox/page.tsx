"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/app/_lib/supabase";
import SourceIcon from "@/app/_components/SourceIcon";
import { getCurrentWorkspace, Workspace } from "@/app/_lib/workspace";

// ── Types ──────────────────────────────────────────────────────────────────────

type Priority     = "low" | "medium" | "high";
type TicketStatus = "open" | "in-progress" | "resolved";

interface Ticket {
  id: string;
  workspace_id: string | null;
  company_name: string;
  email: string;
  issue_category: "billing" | "technical" | "general";
  priority: Priority;
  description: string;
  status: TicketStatus;
  created_at: string;
  source: string | null;
}

interface Message {
  id: string;
  ticket_id: string;
  workspace_id: string;
  sender_type: "customer" | "agent";
  sender_name: string | null;
  sender_email: string | null;
  body: string;
  channel: string | null;
  created_at: string;
}

// ── Config ──────────────────────────────────────────────────────────────────────

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

type StatusFilter = TicketStatus | "all";

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all",         label: "All"         },
  { id: "open",        label: "Open"        },
  { id: "in-progress", label: "In Progress" },
  { id: "resolved",    label: "Resolved"    },
];

// ── Helpers ──────────────────────────────────────────────────────────────────────

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

function buildAIDraft(ticket: Ticket): string {
  const body: Record<string, string> = {
    billing:   `I've reviewed your account and I can see the concern you've raised. I'd be happy to look into the billing details and clarify any charges or discrepancies.\n\nCould you please share the invoice number or approximate date of the charge in question? That will help me pull up the exact details and get this resolved as quickly as possible.`,
    technical: `I've noted the technical issue you've described and I want to get this sorted out right away. To help me investigate, could you let me know which browser or device you're using, and whether this started after any recent changes on your end? Any error messages or screenshots would also be really helpful.`,
    general:   `I'd be happy to help with your inquiry. To make sure I give you the most accurate information, could you share a few more details about what you're looking to accomplish? I want to make sure we address your needs fully.`,
  };
  return `Hi there,\n\nThank you for reaching out — we appreciate you getting in touch.\n\n${body[ticket.issue_category] ?? body.general}\n\nPlease don't hesitate to reply with any additional information and I'll get back to you as soon as possible.\n\nBest regards,\nSupport Team`;
}

// Synthesize the originating customer message from the ticket itself, for
// threads that have no messages rows yet (e.g. tickets created before the
// messages table, or by channels that only wrote the ticket).
function syntheticOpening(ticket: Ticket): Message {
  return {
    id:           `ticket-${ticket.id}`,
    ticket_id:    ticket.id,
    workspace_id: ticket.workspace_id ?? "",
    sender_type:  "customer",
    sender_name:  ticket.company_name || ticket.email,
    sender_email: ticket.email,
    body:         ticket.description,
    channel:      ticket.source,
    created_at:   ticket.created_at,
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InboxPage() {
  const [workspace,    setWorkspace]    = useState<Workspace | null>(null);
  const [tickets,      setTickets]      = useState<Ticket[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [noWorkspace,  setNoWorkspace]  = useState(false);

  const [selected,     setSelected]     = useState<Ticket | null>(null);
  const [messages,     setMessages]     = useState<Message[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);

  const [replyText,    setReplyText]    = useState("");
  const [sending,      setSending]      = useState(false);
  const [suggesting,   setSuggesting]   = useState(false);
  const [filter,       setFilter]       = useState<StatusFilter>("all");
  const [toast,        setToast]        = useState<string | null>(null);

  const wsRef = useRef<Workspace | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const loadTickets = useCallback(async (wsId: string) => {
    if (!supabase) return;
    const { data } = await supabase
      .from("tickets")
      .select("*")
      .eq("workspace_id", wsId)
      .order("created_at", { ascending: false });
    if (data) setTickets(data as Ticket[]);
  }, []);

  // Initial load + realtime subscription, both scoped to the workspace.
  useEffect(() => {
    let channel: ReturnType<NonNullable<typeof supabase>["channel"]> | null = null;

    (async () => {
      if (!supabase) { setLoading(false); return; }
      const ws = await getCurrentWorkspace(supabase);
      if (!ws) { setNoWorkspace(true); setLoading(false); return; }
      wsRef.current = ws;
      setWorkspace(ws);
      await loadTickets(ws.id);
      setLoading(false);

      channel = supabase
        .channel(`inbox-${ws.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "tickets", filter: `workspace_id=eq.${ws.id}` },
          () => loadTickets(ws.id)
        )
        .subscribe();
    })();

    return () => { if (channel && supabase) supabase.removeChannel(channel); };
  }, [loadTickets]);

  // Load the thread when a ticket is opened.
  const openTicket = async (ticket: Ticket) => {
    setSelected(ticket);
    setReplyText("");
    setMessages([]);
    setThreadLoading(true);
    if (!supabase) { setThreadLoading(false); return; }
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("ticket_id", ticket.id)
      .order("created_at", { ascending: true });
    const rows = (data as Message[]) ?? [];
    // Always surface the ticket's originating message. Channels that only write
    // the ticket (not a customer message row) get a synthesized opening so the
    // customer's first message is never lost.
    const hasCustomer = rows.some((m) => m.sender_type === "customer");
    setMessages(hasCustomer ? rows : [syntheticOpening(ticket), ...rows]);
    setThreadLoading(false);
  };

  // ── Reply: persist to messages (always), send via Gmail when applicable ──────
  const handleSendReply = async () => {
    const ws = wsRef.current;
    if (!replyText.trim() || !selected || !supabase || !ws) return;
    setSending(true);
    const body = replyText.trim();

    // 1) Persist the agent message — the source of truth, regardless of channel.
    const { data: inserted, error } = await supabase
      .from("messages")
      .insert({
        ticket_id:    selected.id,
        workspace_id: ws.id,
        sender_type:  "agent",
        sender_name:  "You",
        body,
        channel:      selected.source,
      })
      .select()
      .single();

    if (error) {
      setSending(false);
      showToast("Could not save reply — please try again");
      return;
    }

    // 2) Best-effort outbound send for email tickets (does not block persistence).
    if (selected.source === "gmail") {
      await fetch("/api/integrations/gmail/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket_id: selected.id, reply_text: body }),
      }).catch(() => null);
    }

    // 3) Move an open ticket to in-progress so the dashboard reflects activity.
    if (selected.status === "open") {
      await supabase.from("tickets").update({ status: "in-progress" }).eq("id", selected.id);
      const updated = { ...selected, status: "in-progress" as TicketStatus };
      setSelected(updated);
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    }

    // The synthesized opening (if any) is already in `prev`; just append.
    setMessages((prev) => [...prev, inserted as Message]);
    setReplyText("");
    setSending(false);
    showToast("Reply sent");
  };

  const setStatus = async (status: TicketStatus) => {
    if (!selected || !supabase) return;
    await supabase.from("tickets").update({ status }).eq("id", selected.id);
    const updated = { ...selected, status };
    setSelected(updated);
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    showToast(status === "resolved" ? "Ticket resolved" : "Ticket reopened");
  };

  const suggestReply = () => {
    if (!selected || suggesting) return;
    setSuggesting(true);
    setTimeout(() => { setReplyText(buildAIDraft(selected)); setSuggesting(false); }, 1200);
  };

  // ── Config-missing / no-workspace states ─────────────────────────────────────

  if (!supabase) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 sm:px-6 md:px-8">
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
          <p className="text-sm font-semibold text-gray-900 mb-1">Not configured</p>
          <p className="text-sm text-stone-500">Supabase environment variables are missing.</p>
        </div>
      </div>
    );
  }

  if (noWorkspace && !loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 sm:px-6 md:px-8">
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
          <p className="text-sm font-semibold text-gray-900 mb-1">No workspace found</p>
          <p className="text-sm text-stone-500">Your account isn&apos;t linked to a workspace yet. Try signing out and back in.</p>
        </div>
      </div>
    );
  }

  // ── Conversation view ────────────────────────────────────────────────────────

  if (selected) {
    const st = STATUS_CFG[selected.status] ?? STATUS_CFG.open;
    const headerDate = new Date(selected.created_at).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });

    return (
      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 md:px-8 md:py-8">
        {toast && (
          <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 bg-zinc-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg">
            {toast}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 mb-6">
          <button
            onClick={() => { setSelected(null); setReplyText(""); setMessages([]); }}
            className="flex items-center gap-1.5 text-xs font-medium text-stone-400 hover:text-stone-700 transition-colors group"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            All tickets
          </button>
          {selected.status === "resolved" ? (
            <button
              onClick={() => setStatus("in-progress")}
              className="text-xs font-semibold text-stone-500 border border-stone-200 px-3 py-1.5 rounded-lg hover:bg-stone-50 transition-colors"
            >
              Reopen
            </button>
          ) : (
            <button
              onClick={() => setStatus("resolved")}
              className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              Mark resolved
            </button>
          )}
        </div>

        {/* Ticket header */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 sm:p-6 mb-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-base font-bold text-gray-900">{selected.company_name || selected.email}</p>
              <p className="text-sm text-stone-400 mt-0.5">{selected.email}</p>
              <p className="text-xs text-stone-400 mt-1">{headerDate}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 capitalize">
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

        {/* Thread */}
        <div className="flex flex-col gap-3 mb-4">
          {threadLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            messages.map((m) => {
              const isAgent  = m.sender_type === "agent";
              const initials = (m.sender_name || m.sender_email || "?").slice(0, 2).toUpperCase();
              return (
                <div
                  key={m.id}
                  className={`rounded-2xl border p-5 ${
                    isAgent ? "bg-indigo-50 border-indigo-100 ml-6 sm:ml-10" : "bg-white border-stone-100 shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      isAgent ? "bg-indigo-100 text-indigo-600" : "bg-stone-100 text-stone-600"
                    }`}>
                      {isAgent ? "You" : initials}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">
                        {isAgent ? "You" : (m.sender_name || m.sender_email)}
                      </p>
                      <p className="text-[11px] text-stone-400">{timeAgo(m.created_at)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">{m.body}</p>
                </div>
              );
            })
          )}
        </div>

        {/* Reply box */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 sm:p-6">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">Reply</p>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={5}
            className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all resize-none mb-3"
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
          {selected.source === "gmail" && (
            <p className="text-[11px] text-stone-400 mt-3">
              This reply is saved to the thread and emailed to the customer via Gmail (if connected).
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Inbox list view ───────────────────────────────────────────────────────────

  const filtered  = filter === "all" ? tickets : tickets.filter((t) => t.status === filter);
  const openCount = tickets.filter((t) => t.status === "open").length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 md:px-8 md:py-8">
      {toast && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 bg-zinc-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <span className="inline-block text-amber-700 font-semibold text-xs uppercase tracking-widest bg-amber-50 border border-amber-100 px-3 py-1 rounded-full mb-3">
          Inbox
        </span>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
              {workspace ? workspace.name : "Inbox"}
            </h1>
            <p className="text-sm text-stone-400 mt-1">{tickets.length} total · {openCount} open</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-stone-400">Live</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
        {FILTERS.map((f) => {
          const count = f.id === "all" ? tickets.length : tickets.filter((t) => t.status === f.id).length;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium transition-all flex-shrink-0 ${
                filter === f.id
                  ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100"
                  : "text-stone-400 hover:text-stone-700 hover:bg-stone-50"
              }`}
            >
              {f.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                filter === f.id ? "bg-indigo-100 text-indigo-600" : "bg-stone-100 text-stone-400"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Ticket list */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-14">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-sm text-stone-400">
              {tickets.length === 0 ? "No tickets yet." : "No tickets match this filter."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filtered.map((ticket) => {
              const st = STATUS_CFG[ticket.status] ?? STATUS_CFG.open;
              return (
                <button
                  key={ticket.id}
                  onClick={() => openTicket(ticket)}
                  className="w-full text-left px-5 py-4 hover:bg-stone-50/80 transition-colors flex items-start gap-3.5 group"
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-[7px] ${PRIORITY_DOT[ticket.priority]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-gray-900 truncate">{ticket.company_name || ticket.email}</p>
                      <span className="text-[11px] text-stone-400 flex-shrink-0">{timeAgo(ticket.created_at)}</span>
                    </div>
                    <p className="text-xs text-stone-400 mb-1.5">{ticket.email}</p>
                    <p className="text-xs text-stone-500 truncate mb-2">{ticket.description}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-stone-400 bg-stone-50 px-2 py-0.5 rounded capitalize">
                        {ticket.issue_category}
                      </span>
                      <SourceIcon source={ticket.source} size={14} />
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${st.badge}`}>
                        <span className={`w-1 h-1 rounded-full flex-shrink-0 ${st.dot}`} />
                        {st.label}
                      </span>
                    </div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-300 group-hover:text-stone-400 flex-shrink-0 mt-1 transition-colors">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-stone-400 text-center mt-4">
        {filtered.length} of {tickets.length} tickets · Updates in real time
      </p>
    </div>
  );
}
