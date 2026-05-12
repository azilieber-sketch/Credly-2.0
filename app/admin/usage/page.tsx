"use client";

import { useEffect, useState } from "react";
import { getCompanies, Company, companyStatus } from "@/app/_lib/store";

const RATIOS    = { shipping: 0.52, returns: 0.27, inquiries: 0.21 };
const MONTHS    = [
  { label: "Dec", value: 2800 },
  { label: "Jan", value: 3900 },
  { label: "Feb", value: 4600 },
  { label: "Mar", value: 5800 },
  { label: "Apr", value: 6400 },
  { label: "May", value: 0, live: true },
];

export default function AdminUsagePage() {
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => { setCompanies(getCompanies()); }, []);

  const platformTotal = companies.reduce((s, c) => s + c.used, 0);
  const months = MONTHS.map((m) => (m.live ? { ...m, value: platformTotal } : m));
  const maxMonth = Math.max(...months.map((m) => m.value), 1);

  const totals = {
    shipping:   Math.round(platformTotal * RATIOS.shipping),
    returns:    Math.round(platformTotal * RATIOS.returns),
    inquiries:  Math.round(platformTotal * RATIOS.inquiries),
  };

  const rows = companies.map((co) => ({
    ...co,
    shipping:  Math.round(co.used * RATIOS.shipping),
    returns:   Math.round(co.used * RATIOS.returns),
    inquiries: Math.round(co.used * RATIOS.inquiries),
  })).sort((a, b) => b.used - a.used);

  return (
    <div className="max-w-5xl mx-auto px-8 py-8">

      <div className="mb-8">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">Admin</p>
        <h1 className="text-2xl font-bold text-zinc-900">Usage</h1>
        <p className="text-sm text-zinc-400 mt-0.5">{platformTotal.toLocaleString()} credits consumed platform-wide</p>
      </div>

      {/* ── Trend chart ── */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 mb-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm font-semibold text-zinc-900">Credit consumption trend</p>
            <p className="text-xs text-zinc-400 mt-0.5">Platform-wide, last 6 months</p>
          </div>
          <span className="text-xs font-semibold text-zinc-400">All companies</span>
        </div>
        <div className="flex items-end gap-3 h-32">
          {months.map((m) => {
            const pct = Math.round((m.value / maxMonth) * 100);
            return (
              <div key={m.label} className="flex flex-col items-center gap-1.5 flex-1">
                <span className="text-[10px] text-zinc-400 tabular-nums">{m.value > 0 ? `${(m.value / 1000).toFixed(1)}k` : ""}</span>
                <div className="w-full flex flex-col justify-end rounded-t-md" style={{ height: "80px" }}>
                  <div
                    className={`w-full rounded-t-md transition-all ${m.live ? "bg-indigo-300" : "bg-indigo-500"}`}
                    style={{ height: pct > 0 ? `${pct}%` : "2px" }}
                  />
                </div>
                <span className="text-[10px] text-zinc-400">{m.label}</span>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-zinc-300 mt-2">May is the current month (in progress)</p>
      </div>

      {/* ── Category totals ── */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: "📦 Shipping",   value: totals.shipping,  color: "text-indigo-600" },
          { label: "🔁 Returns",    value: totals.returns,   color: "text-violet-600" },
          { label: "💬 Inquiries",  value: totals.inquiries, color: "text-sky-600"    },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-zinc-200 p-5">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">{c.label}</p>
            <p className={`text-2xl font-black tabular-nums ${c.color}`}>{c.value.toLocaleString()}</p>
            <p className="text-xs text-zinc-400 mt-1">{platformTotal > 0 ? Math.round((c.value / platformTotal) * 100) : 0}% of total</p>
          </div>
        ))}
      </div>

      {/* ── Per-company breakdown ── */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/60">
          <p className="text-sm font-semibold text-zinc-900">By company</p>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/40">
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Company</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Shipping</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Returns</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Inquiries</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Total</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Share</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const sharePct = platformTotal > 0 ? Math.round((row.used / platformTotal) * 100) : 0;
              const st = companyStatus(row);
              return (
                <tr key={row.id} className={`hover:bg-zinc-50 transition-colors ${i < rows.length - 1 ? "border-b border-zinc-100" : ""}`}>
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-semibold text-zinc-900">{row.name}</p>
                    {st !== "active" && (
                      <p className="text-[11px] text-zinc-400 capitalize mt-0.5">{st}</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-zinc-500 text-right tabular-nums">{row.shipping.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-sm text-zinc-500 text-right tabular-nums">{row.returns.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-sm text-zinc-500 text-right tabular-nums">{row.inquiries.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-zinc-900 text-right tabular-nums">{row.used.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-14 h-1.5 bg-zinc-100 rounded-full">
                        <div className="h-1.5 bg-indigo-400 rounded-full" style={{ width: `${sharePct}%` }} />
                      </div>
                      <span className="text-xs text-zinc-400 tabular-nums w-7 text-right">{sharePct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
