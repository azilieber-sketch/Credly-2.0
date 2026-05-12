"use client";

import { useEffect, useState } from "react";
import { getAdminInvoices, AdminInvoice } from "@/app/_lib/store";

type StatusFilter = "all" | "paid" | "pending";

const STATUS_CONFIG: Record<"paid" | "pending", { dot: string; text: string; textColor: string }> = {
  paid:    { dot: "bg-emerald-500", text: "Paid",    textColor: "text-emerald-600" },
  pending: { dot: "bg-amber-400",   text: "Pending", textColor: "text-amber-600"   },
};

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all",     label: "All"     },
  { id: "paid",    label: "Paid"    },
  { id: "pending", label: "Pending" },
];

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
  const [filter, setFilter]     = useState<StatusFilter>("all");

  useEffect(() => { setInvoices(getAdminInvoices()); }, []);

  const filtered = filter === "all" ? invoices : invoices.filter((i) => i.status === filter);

  const totalRevenue = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + parseFloat(i.amount.replace("$", "")), 0);

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">

      <div className="flex items-start justify-between mb-10">
        <div>
          <span className="inline-block text-amber-700 font-semibold text-xs uppercase tracking-widest bg-amber-50 border border-amber-100 px-3 py-1 rounded-full mb-4">
            Invoices
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">All invoices</h1>
          <p className="text-stone-400 mt-2 text-sm">
            ${totalRevenue.toFixed(2)} collected · {invoices.filter((i) => i.status === "paid").length} paid invoices
          </p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex gap-1 mb-5">
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

      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-stone-400">No invoices found.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Invoice</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Company</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Plan</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Credits</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Amount</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv, i) => {
                const st = STATUS_CONFIG[inv.status];
                return (
                  <tr key={inv.id} className={`hover:bg-stone-50/60 transition-colors ${i < filtered.length - 1 ? "border-b border-stone-100" : ""}`}>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-mono font-medium text-gray-900">{inv.id}</span>
                      <p className="text-[11px] text-stone-400 mt-0.5">{inv.date}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-gray-900">{inv.company}</td>
                    <td className="px-5 py-3.5 text-sm text-stone-500">{inv.plan}</td>
                    <td className="px-5 py-3.5 text-sm text-stone-500 text-right tabular-nums">{inv.credits.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-gray-900 text-right tabular-nums">{inv.amount}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${st.textColor}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${st.dot}`} />
                        {st.text}
                      </span>
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
