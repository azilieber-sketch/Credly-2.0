"use client";

import { useState } from "react";

const REPORTS = [
  {
    id: 1,
    title: "April 2026 — Platform Report",
    period: "Apr 2026",
    date: "May 1, 2026",
    metrics: { credits: 6400, companies: 7, revenue: 944, resolutionRate: 91, newCompanies: 1 },
    insight: "Forma Studio drove 38% of total credit consumption in April.",
  },
  {
    id: 2,
    title: "March 2026 — Platform Report",
    period: "Mar 2026",
    date: "Apr 1, 2026",
    metrics: { credits: 5800, companies: 6, revenue: 795, resolutionRate: 89, newCompanies: 2 },
    insight: "Two new companies onboarded. Reef Supply reached credit depletion.",
  },
  {
    id: 3,
    title: "February 2026 — Platform Report",
    period: "Feb 2026",
    date: "Mar 1, 2026",
    metrics: { credits: 4600, companies: 5, revenue: 646, resolutionRate: 93, newCompanies: 0 },
    insight: "Resolution rate hit 93% — highest on record. Shipping remains top query type.",
  },
  {
    id: 4,
    title: "January 2026 — Platform Report",
    period: "Jan 2026",
    date: "Feb 1, 2026",
    metrics: { credits: 3900, companies: 5, revenue: 597, resolutionRate: 87, newCompanies: 1 },
    insight: "Vega Commerce upgraded from Starter to Growth mid-month.",
  },
];

export default function AdminReportsPage() {
  const [downloaded, setDownloaded] = useState<number | null>(null);

  const handleExport = (id: number) => {
    setDownloaded(id);
    setTimeout(() => setDownloaded(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-8 py-8">

      <div className="mb-8">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">Admin</p>
        <h1 className="text-2xl font-bold text-zinc-900">Reports</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Monthly platform summaries across all companies.</p>
      </div>

      <div className="flex flex-col gap-4">
        {REPORTS.map((report) => (
          <div key={report.id} className="bg-white rounded-xl border border-zinc-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-zinc-900">{report.title}</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Generated {report.date}</p>
              </div>
              <button
                onClick={() => handleExport(report.id)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all flex-shrink-0 ${
                  downloaded === report.id
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "text-zinc-500 border-zinc-200 hover:bg-zinc-50"
                }`}
              >
                {downloaded === report.id ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                    Downloaded
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                    Export
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-5 gap-4 py-4 border-t border-b border-zinc-100">
              {[
                { label: "Credits",         value: report.metrics.credits.toLocaleString()                  },
                { label: "Active cos.",      value: report.metrics.companies.toString()                      },
                { label: "Revenue",          value: `$${report.metrics.revenue.toLocaleString()}`            },
                { label: "Resolution rate",  value: `${report.metrics.resolutionRate}%`, color: "text-emerald-600" },
                { label: "New signups",      value: report.metrics.newCompanies.toString()                   },
              ].map((m) => (
                <div key={m.label}>
                  <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">{m.label}</p>
                  <p className={`text-xl font-black tabular-nums ${(m as { color?: string }).color ?? "text-zinc-900"}`}>{m.value}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 mt-4">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
              <p className="text-xs text-zinc-400">{report.insight}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
