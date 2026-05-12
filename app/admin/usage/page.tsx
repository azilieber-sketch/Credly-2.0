"use client";

import { useEffect, useState } from "react";
import { getCompanies, Company } from "@/app/_lib/store";

const RATIOS = { shipping: 0.52, returns: 0.27, inquiries: 0.21 };

export default function AdminUsagePage() {
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => { setCompanies(getCompanies()); }, []);

  const rows = companies.map((co) => ({
    ...co,
    shipping:   Math.round(co.used * RATIOS.shipping),
    returns:    Math.round(co.used * RATIOS.returns),
    inquiries:  Math.round(co.used * RATIOS.inquiries),
  }));

  const platformTotal = rows.reduce((s, r) => s + r.used, 0);

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">

      <div className="mb-10">
        <span className="inline-block text-amber-700 font-semibold text-xs uppercase tracking-widest bg-amber-50 border border-amber-100 px-3 py-1 rounded-full mb-4">
          Usage Monitoring
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Platform usage</h1>
        <p className="text-stone-400 mt-2 text-sm">
          {platformTotal.toLocaleString()} credits consumed across all companies.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        {rows.length === 0 ? (
          <div className="py-16 text-center text-sm text-stone-400">No usage data yet.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Company</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold text-stone-400 uppercase tracking-wider">📦 Shipping</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold text-stone-400 uppercase tracking-wider">🔁 Returns</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold text-stone-400 uppercase tracking-wider">💬 Inquiries</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Total</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Share</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const sharePct = platformTotal > 0 ? Math.round((row.used / platformTotal) * 100) : 0;
                return (
                  <tr key={row.id} className={`hover:bg-stone-50/60 transition-colors ${i < rows.length - 1 ? "border-b border-stone-100" : ""}`}>
                    <td className="px-5 py-3.5 text-sm font-semibold text-gray-900">{row.name}</td>
                    <td className="px-5 py-3.5 text-sm text-stone-500 text-right tabular-nums">{row.shipping.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-sm text-stone-500 text-right tabular-nums">{row.returns.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-sm text-stone-500 text-right tabular-nums">{row.inquiries.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-gray-900 text-right tabular-nums">{row.used.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1 bg-stone-100 rounded-full">
                          <div className="h-1 bg-indigo-400 rounded-full" style={{ width: `${sharePct}%` }} />
                        </div>
                        <span className="text-xs text-stone-400 tabular-nums w-7 text-right">{sharePct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
