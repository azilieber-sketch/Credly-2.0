"use client";

import { useEffect, useState, useCallback } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import SourceIcon, { SOURCE_COLORS, SOURCE_LABELS } from "@/app/_components/SourceIcon";
import { supabase } from "@/app/_lib/supabase";

// ── Types ──────────────────────────────────────────────────────────────────────

type TicketStatus = "open" | "in-progress" | "resolved";

interface Ticket {
  id: string;
  status: TicketStatus;
  source: string | null;
  created_at: string;
  replied_at: string | null;
  description: string;
  issue_category: string;
}

interface CompanyData {
  id: string;
  name: string;
  credits: number;
  credits_used: number;
}

// ── Config ─────────────────────────────────────────────────────────────────────

const SOURCES = ["gmail", "instagram", "shopify", "slack", "unknown"] as const;

const STATUS_CFG: Record<TicketStatus, { label: string; badge: string; dot: string }> = {
  open:          { label: "Open",        badge: "bg-amber-50 text-amber-700",     dot: "bg-amber-400"   },
  "in-progress": { label: "In Progress", badge: "bg-indigo-50 text-indigo-700",   dot: "bg-indigo-500"  },
  resolved:      { label: "Resolved",    badge: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

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

function formatResponseTime(hours: number | null): string {
  if (hours === null) return "—";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

// ── Subcomponents ──────────────────────────────────────────────────────────────

function MetricCard({
  label, value, sub, accent,
}: {
  label: string; value: string; sub: string; accent?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 sm:p-5">
      <p className="text-[10px] sm:text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-3">{label}</p>
      <p className={`text-2xl sm:text-3xl font-black leading-none tabular-nums mb-1 ${accent ?? "text-gray-900"}`}>{value}</p>
      <p className="text-xs text-stone-400">{sub}</p>
    </div>
  );
}

function CustomTooltip({
  active, payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { name: string; value: number } }>;
}) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0].payload;
  return (
    <div className="bg-white border border-stone-100 shadow-lg rounded-xl px-3 py-2 text-left">
      <p className="text-xs font-semibold text-gray-900">{name}</p>
      <p className="text-xs text-stone-400">{value} ticket{value !== 1 ? "s" : ""}</p>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [loading,     setLoading]     = useState(true);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [company,     setCompany]     = useState<CompanyData | null>(null);
  const [tickets,     setTickets]     = useState<Ticket[]>([]);

  const load = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }

    const email = session.user.email!;
    setDisplayName(email.split("@")[0]);

    const { data: co } = await supabase
      .from("companies")
      .select("id, name, credits, credits_used")
      .eq("email", email)
      .single();

    if (!co) { setLoading(false); return; }
    setCompany(co as CompanyData);

    const { data: tkts } = await supabase
      .from("tickets")
      .select("id, status, source, created_at, replied_at, description, issue_category")
      .eq("company_id", co.id)
      .order("created_at", { ascending: false });

    if (tkts) setTickets(tkts as Ticket[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Computed metrics ────────────────────────────────────────────────────────

  const openCount = tickets.filter((t) => t.status === "open").length;

  const weekMs = 7 * 24 * 3600000;
  const resolvedThisWeek = tickets.filter(
    (t) => t.status === "resolved" && t.replied_at && Date.now() - new Date(t.replied_at).getTime() < weekMs
  ).length;

  const resolvedWithTimes = tickets.filter((t) => t.replied_at && t.status === "resolved");
  const avgResponseHours =
    resolvedWithTimes.length > 0
      ? resolvedWithTimes.reduce((sum, t) => {
          return sum + (new Date(t.replied_at!).getTime() - new Date(t.created_at).getTime()) / 3600000;
        }, 0) / resolvedWithTimes.length
      : null;

  const creditsRemaining = company ? Math.max(company.credits - company.credits_used, 0) : 0;

  const sourceData = SOURCES.map((src) => ({
    name:   SOURCE_LABELS[src] ?? src,
    source: src,
    value:  tickets.filter((t) => (t.source ?? "unknown").toLowerCase() === src).length,
    color:  SOURCE_COLORS[src] ?? "#9ca3af",
  })).filter((d) => d.value > 0);

  const recentTickets = tickets.slice(0, 5);

  const month    = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 md:px-8 md:py-10">

      {/* ── Header ── */}
      <div className="mb-7 md:mb-10">
        {displayName && (
          <p className="text-sm text-stone-400 mb-1">{greeting}, {displayName}.</p>
        )}
        <span className="inline-block text-amber-700 font-semibold text-xs uppercase tracking-widest bg-amber-50 border border-amber-100 px-3 py-1 rounded-full mb-3">
          Overview
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
          Support Overview · {month}
        </h1>
        <p className="text-stone-400 mt-2 text-sm">
          Your support is managed by the Credly team. This is a read-only view.
        </p>
      </div>

      {/* ── Metric cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 md:mb-8">
        <MetricCard
          label="Open tickets"
          value={openCount.toString()}
          sub="Awaiting reply"
          accent={openCount > 0 ? "text-amber-500" : "text-gray-900"}
        />
        <MetricCard
          label="Resolved this week"
          value={resolvedThisWeek.toString()}
          sub="Last 7 days"
          accent={resolvedThisWeek > 0 ? "text-emerald-600" : "text-gray-900"}
        />
        <MetricCard
          label="Avg response"
          value={formatResponseTime(avgResponseHours)}
          sub="Per resolved ticket"
        />
        <MetricCard
          label="Credits remaining"
          value={creditsRemaining.toLocaleString()}
          sub={company ? `of ${company.credits.toLocaleString()} total` : "—"}
          accent={creditsRemaining < 500 ? "text-amber-500" : "text-gray-900"}
        />
      </div>

      {/* ── Ticket sources donut ── */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 sm:p-6 mb-6 md:mb-8">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm font-semibold text-gray-900">Ticket sources</p>
          <p className="text-xs text-stone-400">{tickets.length} total</p>
        </div>

        {sourceData.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-stone-400">No tickets yet.</p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">

            {/* Donut */}
            <div className="relative w-44 h-44 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={54}
                    outerRadius={78}
                    paddingAngle={2}
                    dataKey="value"
                    strokeWidth={0}
                    startAngle={90}
                    endAngle={-270}
                  >
                    {sourceData.map((entry) => (
                      <Cell key={entry.source} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-2xl font-black text-gray-900 leading-none">{tickets.length}</p>
                <p className="text-[11px] text-stone-400 mt-0.5">total</p>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-col gap-3.5 w-full">
              {sourceData.map((entry) => {
                const pct = Math.round((entry.value / tickets.length) * 100);
                return (
                  <div key={entry.source} className="flex items-center gap-3">
                    <SourceIcon source={entry.source} size={18} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-900">{entry.name}</span>
                        <span className="text-xs text-stone-400 tabular-nums ml-2">{entry.value}</span>
                      </div>
                      <div className="w-full h-1 bg-stone-100 rounded-full">
                        <div
                          className="h-1 rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: entry.color }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-stone-400 w-8 text-right tabular-nums flex-shrink-0">{pct}%</span>
                  </div>
                );
              })}
            </div>

          </div>
        )}
      </div>

      {/* ── Recent tickets ── */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">Recent tickets</p>
          <a
            href="/dashboard/tickets"
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            View all →
          </a>
        </div>

        {recentTickets.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-stone-400">No tickets yet.</div>
        ) : (
          <div className="divide-y divide-stone-100">
            {recentTickets.map((ticket) => {
              const st = STATUS_CFG[ticket.status] ?? STATUS_CFG.open;
              return (
                <div key={ticket.id} className="flex items-start gap-3.5 px-5 py-4">
                  <div className="flex-shrink-0 mt-0.5">
                    <SourceIcon source={ticket.source} size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-stone-700 truncate leading-snug">{ticket.description}</p>
                    <p className="text-xs text-stone-400 mt-0.5 capitalize">{ticket.issue_category}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${st.badge}`}>
                      <span className={`w-1 h-1 rounded-full flex-shrink-0 ${st.dot}`} />
                      {st.label}
                    </span>
                    <span className="text-[11px] text-stone-400 whitespace-nowrap">{timeAgo(ticket.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
