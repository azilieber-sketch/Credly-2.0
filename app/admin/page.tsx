"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/app/_lib/supabase";
import SourceIcon from "@/app/_components/SourceIcon";

type Priority    = "low" | "medium" | "high";
type TicketStatus = "open" | "in-progress" | "resolved";

interface Ticket {
  id: string;
  company_id: string | null;
  company_name: string;
  email: string;
  issue_category: string;
  priority: Priority;
  description: string;
  status: TicketStatus;
  created_at: string;
  reply: string | null;
  replied_at: string | null;
  source: string | null;
}

interface Company {
  id: string;
  name: string;
  email: string;
  industry: string;
  credits: number;
  credits_used: number;
  status: "active" | "suspended";
  created_at: string;
}

interface Inquiry {
  id: string;
  email: string;
  message: string | null;
  status: "new" | "contacted";
  created_at: string;
}

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

const STATUS_CFG: Record<TicketStatus, { label: string; badge: string; dot: string }> = {
  open:          { label: "Open",        badge: "bg-amber-50 text-amber-700",     dot: "bg-amber-400"   },
  "in-progress": { label: "In Progress", badge: "bg-indigo-50 text-indigo-700",   dot: "bg-indigo-500"  },
  resolved:      { label: "Resolved",    badge: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
};

export default function AdminOverview() {
  const [tickets,   setTickets]   = useState<Ticket[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading,   setLoading]   = useState(true);

  const load = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    const [{ data: tData }, { data: cData }, { data: qData }] = await Promise.all([
      supabase.from("tickets").select("*").order("created_at", { ascending: false }),
      supabase.from("companies").select("*").order("name"),
      supabase.from("inquiries").select("*").order("created_at", { ascending: false }),
    ]);
    if (tData) setTickets(tData as Ticket[]);
    if (cData) setCompanies(cData as Company[]);
    if (qData) setInquiries(qData as Inquiry[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    if (!supabase) return;
    const channel = supabase
      .channel(`admin-overview-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "inquiries" }, () => load())
      .subscribe();
    return () => { supabase!.removeChannel(channel); };
  }, [load]);

  const now   = Date.now();
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const openTickets      = tickets.filter((t) => t.status === "open");
  const highPriority     = tickets.filter((t) => t.priority === "high" && t.status !== "resolved");
  const resolvedToday    = tickets.filter((t) => t.status === "resolved" && t.replied_at && new Date(t.replied_at) >= today);
  const companiesWaiting = companies.filter((co) =>
    tickets.some((t) => t.company_id === co.id && t.status === "open" && now - new Date(t.created_at).getTime() > 86400000)
  );

  const companyRows = companies.map((co) => {
    const coTickets = tickets.filter((t) => t.company_id === co.id);
    const openCount = coTickets.filter((t) => t.status === "open").length;
    const hasHigh   = coTickets.some((t) => t.priority === "high" && t.status !== "resolved");
    const last      = coTickets[0]?.created_at ?? null;
    const indicator = hasHigh ? "red" : openCount > 0 ? "amber" : "green";
    return { ...co, openCount, indicator, last };
  }).sort((a, b) => {
    const o = { red: 0, amber: 1, green: 2 } as const;
    return o[a.indicator as keyof typeof o] - o[b.indicator as keyof typeof o];
  });

  const recentTickets   = tickets.slice(0, 10);
  const newInquiries    = inquiries.filter((q) => q.status === "new");
  const recentInquiries = inquiries.slice(0, 4);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 md:px-8 md:py-8">

      {/* Header */}
      <div className="mb-6 md:mb-8">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">TicketFlow Admin</p>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">Support Operations</h1>
        <p className="text-sm text-zinc-400 mt-0.5">{companies.length} companies · Live</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          {
            label: "Open Tickets",
            value: loading ? "—" : openTickets.length.toString(),
            sub: "Across all companies",
            color: !loading && openTickets.length > 0 ? "text-amber-500" : "text-zinc-900",
          },
          {
            label: "High Priority",
            value: loading ? "—" : highPriority.length.toString(),
            sub: "Need attention now",
            color: !loading && highPriority.length > 0 ? "text-red-500" : "text-zinc-900",
          },
          {
            label: "Resolved Today",
            value: loading ? "—" : resolvedToday.length.toString(),
            sub: "Since midnight",
            color: "text-emerald-600",
          },
          {
            label: "Waiting 24h+",
            value: loading ? "—" : companiesWaiting.length.toString(),
            sub: "Companies overdue",
            color: !loading && companiesWaiting.length > 0 ? "text-red-500" : "text-zinc-900",
          },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5">
            <p className="text-[10px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">{kpi.label}</p>
            <p className={`text-2xl sm:text-3xl font-black leading-none tabular-nums mb-1.5 ${kpi.color}`}>{kpi.value}</p>
            <p className="text-xs text-zinc-400">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Inquiries — new leads from the landing page */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden mb-5">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-zinc-900">Inquiries</p>
            {newInquiries.length > 0 && (
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                {newInquiries.length} new
              </span>
            )}
          </div>
          <Link href="/admin/inquiries" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
            View all →
          </Link>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recentInquiries.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-zinc-400">No inquiries yet.</div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {recentInquiries.map((q) => (
              <Link
                key={q.id}
                href="/admin/inquiries"
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-50 transition-colors group"
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${q.status === "new" ? "bg-indigo-500" : "bg-zinc-300"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 truncate group-hover:text-indigo-700 transition-colors">{q.email}</p>
                  <p className="text-xs text-zinc-400 truncate mt-0.5">{q.message || "No message"}</p>
                </div>
                <span className={`hidden sm:inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${
                  q.status === "new" ? "bg-indigo-50 text-indigo-700" : "bg-emerald-50 text-emerald-700"
                }`}>
                  {q.status}
                </span>
                <span className="text-[11px] text-zinc-400 whitespace-nowrap flex-shrink-0">{timeAgo(q.created_at)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Company list */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden mb-5">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <p className="text-sm font-semibold text-zinc-900">Companies</p>
          <Link href="/admin/companies" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
            Manage all →
          </Link>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : companyRows.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-zinc-400">No companies yet.</div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {companyRows.map((co) => (
              <Link
                key={co.id}
                href={`/admin/companies/${co.id}`}
                className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-zinc-50 transition-colors group"
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  co.indicator === "red" ? "bg-red-500" : co.indicator === "amber" ? "bg-amber-400" : "bg-emerald-500"
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-zinc-900 truncate group-hover:text-indigo-700 transition-colors">{co.name}</p>
                    {co.openCount > 0 && (
                      <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                        co.indicator === "red" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                      }`}>
                        {co.openCount} open
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {co.last ? `Last ticket ${timeAgo(co.last)}` : "No tickets yet"}
                  </p>
                </div>
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1.5 rounded-lg group-hover:bg-indigo-100 transition-colors flex-shrink-0">
                  View tickets
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-300 group-hover:text-zinc-400 transition-colors flex-shrink-0">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent tickets */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <p className="text-sm font-semibold text-zinc-900">Recent tickets</p>
          <Link href="/admin/tickets" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
            Global inbox →
          </Link>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recentTickets.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-zinc-400">No tickets yet.</div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {recentTickets.map((ticket) => {
              const st = STATUS_CFG[ticket.status];
              return (
                <Link
                  key={ticket.id}
                  href={`/admin/companies/${ticket.company_id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-50 transition-colors group"
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[ticket.priority]}`} />
                  <SourceIcon source={ticket.source} size={14} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-zinc-900 truncate">{ticket.company_name}</p>
                      <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full capitalize flex-shrink-0 ${PRIORITY_BADGE[ticket.priority]}`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 truncate">{ticket.description}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${st.badge}`}>
                      <span className={`w-1 h-1 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>
                    <span className="text-[11px] text-zinc-400 whitespace-nowrap">{timeAgo(ticket.created_at)}</span>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-300 group-hover:text-zinc-400 transition-colors flex-shrink-0">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
