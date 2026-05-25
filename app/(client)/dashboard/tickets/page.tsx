"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/_lib/supabase";

type IssueCategory = "billing" | "technical" | "general";
type Priority      = "low" | "medium" | "high";
type TicketStatus  = "open" | "in-progress" | "resolved";

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

type StatusFilter = TicketStatus | "all";

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all",         label: "All"         },
  { id: "open",        label: "Open"        },
  { id: "in-progress", label: "In Progress" },
  { id: "resolved",    label: "Resolved"    },
];

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

// ── Not configured ────────────────────────────────────────────────────────────

function NotConfigured() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 md:px-8 md:py-10">
      <div className="mb-7">
        <span className="inline-block text-amber-700 font-semibold text-xs uppercase tracking-widest bg-amber-50 border border-amber-100 px-3 py-1 rounded-full mb-3">
          Support
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">Ticket Inbox</h1>
      </div>
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
        <p className="text-sm font-semibold text-gray-900 mb-2">Configuration required</p>
        <p className="text-sm text-stone-500">
          Add <code className="bg-stone-100 px-1.5 py-0.5 rounded text-xs font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="bg-stone-100 px-1.5 py-0.5 rounded text-xs font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to
          your Vercel environment variables, then redeploy.
        </p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TicketsPage() {
  const [tickets,  setTickets]  = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [filter,   setFilter]   = useState<StatusFilter>("all");
  const [loading,  setLoading]  = useState(true);
  const [noEmail,  setNoEmail]  = useState(false);
  const [noAccount, setNoAccount] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }

    const { data: { session } } = await supabase.auth.getSession();
    const userEmail = session?.user?.email;
    if (!userEmail) { setNoEmail(true); setLoading(false); return; }

    supabase
      .from("companies")
      .select("id, name")
      .eq("email", userEmail)
      .single()
      .then(({ data: company }) => {
        if (!company) {
          setNoAccount(userEmail);
          setLoading(false);
          return;
        }
        supabase!
          .from("tickets")
          .select("*")
          .eq("company_id", company.id)
          .order("created_at", { ascending: false })
          .then(({ data }) => {
            if (data) setTickets(data as Ticket[]);
            setLoading(false);
          });
      });
  }, []);

  if (!supabase) return <NotConfigured />;

  if (noEmail) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 md:px-8 md:py-10">
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
          <p className="text-sm font-semibold text-gray-900 mb-1">Not signed in</p>
          <p className="text-sm text-stone-500">Please sign in to view your support tickets.</p>
        </div>
      </div>
    );
  }

  if (noAccount) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 md:px-8 md:py-10">
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
          <p className="text-sm font-semibold text-gray-900 mb-1">No account found</p>
          <p className="text-sm text-stone-500">No company account is associated with <span className="font-medium text-gray-700">{noAccount}</span>.</p>
        </div>
      </div>
    );
  }

  // ── Conversation view ───────────────────────────────────────────────────────

  if (selected) {
    const st = STATUS_CFG[selected.status] ?? STATUS_CFG.open;
    const sentAt = new Date(selected.created_at).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
    const initials = selected.company_name.slice(0, 2).toUpperCase();

    return (
      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 md:px-8 md:py-10">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-1.5 text-xs font-medium text-stone-400 hover:text-stone-700 mb-6 transition-colors group"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          All tickets
        </button>

        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 sm:p-6 mb-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-base font-bold text-gray-900">{selected.company_name}</p>
              <p className="text-sm text-stone-400 mt-0.5">{selected.email}</p>
              <p className="text-xs text-stone-400 mt-1">{sentAt}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 capitalize">
                {selected.issue_category}
              </span>
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${PRIORITY_BADGE[selected.priority]}`}>
                {selected.priority}
              </span>
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${st.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${st.dot}`} />
                {st.label}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 mb-4">
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-600 flex-shrink-0">
                {initials}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900">{selected.company_name}</p>
                <p className="text-[11px] text-stone-400">{sentAt}</p>
              </div>
            </div>
            <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">{selected.description}</p>
          </div>

          {selected.reply && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 ml-6 sm:ml-10">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 flex-shrink-0">
                  ST
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">Support Team</p>
                  <p className="text-[11px] text-stone-400">{selected.replied_at ? timeAgo(selected.replied_at) : ""}</p>
                </div>
              </div>
              <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">{selected.reply}</p>
            </div>
          )}
        </div>

        {!selected.reply && (
          <div className="bg-stone-50 border border-stone-100 rounded-2xl p-5 text-center">
            <p className="text-sm text-stone-400">Awaiting response from our support team.</p>
          </div>
        )}
      </div>
    );
  }

  // ── Inbox view ──────────────────────────────────────────────────────────────

  const filtered  = filter === "all" ? tickets : tickets.filter((t) => t.status === filter);
  const openCount = tickets.filter((t) => t.status === "open").length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 md:px-8 md:py-10">
      <div className="mb-7 md:mb-10">
        <span className="inline-block text-amber-700 font-semibold text-xs uppercase tracking-widest bg-amber-50 border border-amber-100 px-3 py-1 rounded-full mb-3">
          Support
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 leading-snug">
          Ticket Inbox
        </h1>
        <p className="text-stone-400 mt-2 text-sm">
          {tickets.length} total · {openCount} open
        </p>
      </div>

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
              const st      = STATUS_CFG[ticket.status] ?? STATUS_CFG.open;
              const hasReply = ticket.reply !== null;
              return (
                <button
                  key={ticket.id}
                  onClick={() => setSelected(ticket)}
                  className="w-full text-left px-5 py-4 hover:bg-stone-50/80 transition-colors flex items-start gap-3.5 group"
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-[7px] ${PRIORITY_DOT[ticket.priority]}`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className={`text-sm truncate ${hasReply ? "font-medium text-gray-700" : "font-semibold text-gray-900"}`}>
                        {ticket.company_name}
                      </p>
                      <span className="text-[11px] text-stone-400 flex-shrink-0">{timeAgo(ticket.created_at)}</span>
                    </div>

                    <p className="text-xs text-stone-400 mb-1.5">{ticket.email}</p>
                    <p className="text-xs text-stone-500 truncate mb-2">{ticket.description}</p>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-stone-400 bg-stone-50 px-2 py-0.5 rounded capitalize">
                        {ticket.issue_category}
                      </span>
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
    </div>
  );
}
