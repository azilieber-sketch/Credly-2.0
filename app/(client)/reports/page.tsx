"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReportType = "weekly" | "monthly";
type Filter     = "all" | ReportType;

interface Report {
  id: number;
  type: ReportType;
  title: string;
  description: string;
  date: string;
  metrics: {
    credits: number;
    topCategory: { emoji: string; label: string };
    resolutionRate: number;
    avgResponse: string;
  };
  insight: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const REPORTS: Report[] = [
  {
    id: 1,
    type: "weekly",
    title: "Weekly Usage Summary",
    description: "Credit consumption and category breakdown for the week of Apr 28 – May 4.",
    date: "May 4, 2026",
    metrics: {
      credits: 47,
      topCategory: { emoji: "📦", label: "Shipping" },
      resolutionRate: 92,
      avgResponse: "1m 48s",
    },
    insight: "Shipping-related usage increased by 18% compared to last week.",
  },
  {
    id: 2,
    type: "monthly",
    title: "April Usage Report",
    description: "Monthly breakdown of all credit usage by category in April.",
    date: "Apr 30, 2026",
    metrics: {
      credits: 184,
      topCategory: { emoji: "🔁", label: "Returns" },
      resolutionRate: 89,
      avgResponse: "2m 12s",
    },
    insight: "Return-related usage peaked mid-month, likely tied to the spring sale.",
  },
  {
    id: 3,
    type: "weekly",
    title: "Category Breakdown",
    description: "Breakdown of the most common query types handled last week.",
    date: "Apr 27, 2026",
    metrics: {
      credits: 38,
      topCategory: { emoji: "💬", label: "Inquiries" },
      resolutionRate: 95,
      avgResponse: "1m 22s",
    },
    insight: "General inquiries were the top category — most resolved in under 2 minutes.",
  },
  {
    id: 4,
    type: "monthly",
    title: "March Usage Report",
    description: "Full summary of March credit activity, including category trends.",
    date: "Mar 31, 2026",
    metrics: {
      credits: 210,
      topCategory: { emoji: "📦", label: "Shipping" },
      resolutionRate: 87,
      avgResponse: "2m 35s",
    },
    insight: "Escalation rate was slightly higher in March — mostly payment disputes.",
  },
];

const TYPE_CONFIG: Record<ReportType, { text: string; cls: string }> = {
  weekly:  { text: "Weekly",  cls: "bg-sky-50 text-sky-600 border-sky-100" },
  monthly: { text: "Monthly", cls: "bg-violet-50 text-violet-600 border-violet-100" },
};

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all",     label: "All" },
  { id: "weekly",  label: "Weekly" },
  { id: "monthly", label: "Monthly" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = filter === "all" ? REPORTS : REPORTS.filter((r) => r.type === filter);

  return (
    <div className="max-w-3xl mx-auto px-8 py-10">

      {/* ── Header ── */}
      <div className="mb-10">
        <span className="inline-block text-amber-700 font-semibold text-xs uppercase tracking-widest bg-amber-50 border border-amber-100 px-3 py-1 rounded-full mb-4">
          Reports
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 leading-snug">
          Summaries and insights from<br />your usage activity.
        </h1>
        <p className="text-stone-400 mt-2 text-sm leading-relaxed">
          A clear record of how credits have been used over time.
        </p>
      </div>

      {/* ── Filters ── */}
      <div className="flex gap-1 mb-7">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
              filter === f.id
                ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100"
                : "text-stone-400 hover:text-stone-700 hover:bg-stone-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Report cards ── */}
      <div className="flex flex-col gap-5">
        {filtered.map((report) => (
          <div
            key={report.id}
            className="bg-white rounded-2xl border border-stone-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-6"
          >
            <div className="flex items-start justify-between mb-1">
              <h3 className="text-base font-bold text-gray-900">{report.title}</h3>
              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${TYPE_CONFIG[report.type].cls}`}>
                  {TYPE_CONFIG[report.type].text}
                </span>
                <span className="text-[11px] text-stone-300">{report.date}</span>
              </div>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed mb-5">{report.description}</p>

            <div className="grid grid-cols-4 gap-4 py-4 border-t border-b border-stone-100">
              <div>
                <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Credits</p>
                <p className="text-2xl font-black text-gray-900 tabular-nums">{report.metrics.credits}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Top Category</p>
                <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5 mt-1">
                  <span className="text-base leading-none">{report.metrics.topCategory.emoji}</span>
                  {report.metrics.topCategory.label}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Resolution</p>
                <p className="text-2xl font-black text-emerald-500 tabular-nums">{report.metrics.resolutionRate}%</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Avg Response</p>
                <p className="text-2xl font-black text-gray-900">{report.metrics.avgResponse}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
              <p className="text-xs text-stone-400">{report.insight}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
