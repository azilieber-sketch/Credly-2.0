"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type InvoiceStatus = "paid" | "pending" | "overdue";
type Filter        = "all" | InvoiceStatus;

interface Invoice {
  id: string;
  date: string;
  period: string;
  plan: string;
  credits: number;
  amount: string;
  status: InvoiceStatus;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const INVOICES: Invoice[] = [
  { id: "INV-0024", date: "May 1, 2026",  period: "May 2026",  plan: "Growth",  credits: 2000, amount: "$149.00", status: "paid"    },
  { id: "INV-0023", date: "Apr 1, 2026",  period: "Apr 2026",  plan: "Starter", credits: 500,  amount: "$49.00",  status: "paid"    },
  { id: "INV-0022", date: "Mar 1, 2026",  period: "Mar 2026",  plan: "Growth",  credits: 2000, amount: "$149.00", status: "paid"    },
  { id: "INV-0021", date: "Feb 1, 2026",  period: "Feb 2026",  plan: "Growth",  credits: 2000, amount: "$149.00", status: "paid"    },
  { id: "INV-0020", date: "Jan 3, 2026",  period: "Jan 2026",  plan: "Starter", credits: 500,  amount: "$49.00",  status: "paid"    },
  { id: "INV-0019", date: "Dec 1, 2025",  period: "Dec 2025",  plan: "Growth",  credits: 2000, amount: "$149.00", status: "paid"    },
];

const STATUS_CONFIG: Record<InvoiceStatus, { text: string; dotColor: string; textColor: string }> = {
  paid:    { text: "Paid",    dotColor: "bg-emerald-500", textColor: "text-emerald-600" },
  pending: { text: "Pending", dotColor: "bg-amber-400",   textColor: "text-amber-600"   },
  overdue: { text: "Overdue", dotColor: "bg-red-500",     textColor: "text-red-600"     },
};

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all",     label: "All" },
  { id: "paid",    label: "Paid" },
  { id: "pending", label: "Pending" },
  { id: "overdue", label: "Overdue" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InvoicesPage() {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = filter === "all" ? INVOICES : INVOICES.filter((inv) => inv.status === filter);

  const totalPaid = INVOICES
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + parseFloat(inv.amount.replace("$", "")), 0);

  return (
    <div className="max-w-3xl mx-auto px-8 py-10">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <span className="inline-block text-amber-700 font-semibold text-xs uppercase tracking-widest bg-amber-50 border border-amber-100 px-3 py-1 rounded-full mb-4">
            Invoices
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 leading-snug">
            Billing history
          </h1>
          <p className="text-stone-400 mt-2 text-sm">
            ${totalPaid.toFixed(2)} total paid · {INVOICES.filter(i => i.status === "paid").length} invoices
          </p>
        </div>
        <button className="mt-1 text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-violet-700 active:scale-[0.97] transition-all shadow-sm shadow-indigo-200/60 flex-shrink-0">
          Buy credits
        </button>
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

      {/* ── Invoice table ── */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-stone-400">No invoices found.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Invoice</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Period</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Plan</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Credits</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Amount</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv, i) => {
                const status = STATUS_CONFIG[inv.status];
                return (
                  <tr
                    key={inv.id}
                    className={`hover:bg-stone-50/60 transition-colors ${i < filtered.length - 1 ? "border-b border-stone-100" : ""}`}
                  >
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-mono font-medium text-gray-900">{inv.id}</span>
                      <p className="text-[11px] text-stone-400 mt-0.5">{inv.date}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-stone-500">{inv.period}</td>
                    <td className="px-5 py-3.5 text-sm text-stone-500">{inv.plan}</td>
                    <td className="px-5 py-3.5 text-sm text-stone-500 text-right tabular-nums">
                      {inv.credits.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-gray-900 text-right tabular-nums">
                      {inv.amount}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${status.textColor}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${status.dotColor}`} />
                        {status.text}
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
