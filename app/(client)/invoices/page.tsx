"use client";

import { useEffect, useState } from "react";
import TopUpModal from "@/app/_components/TopUpModal";
import { getClient, ClientData, DEFAULT_CLIENT, Invoice } from "@/app/_lib/store";

type StatusFilter = "all" | "paid" | "pending" | "overdue";

const STATUS_CONFIG: Record<"paid" | "pending" | "overdue", { text: string; dot: string; textColor: string }> = {
  paid:    { text: "Paid",    dot: "bg-emerald-500", textColor: "text-emerald-600" },
  pending: { text: "Pending", dot: "bg-amber-400",   textColor: "text-amber-600"   },
  overdue: { text: "Overdue", dot: "bg-red-500",     textColor: "text-red-600"     },
};

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all",     label: "All"     },
  { id: "paid",    label: "Paid"    },
  { id: "pending", label: "Pending" },
  { id: "overdue", label: "Overdue" },
];

export default function InvoicesPage() {
  const [client, setClient]       = useState<ClientData>(DEFAULT_CLIENT);
  const [filter, setFilter]       = useState<StatusFilter>("all");
  const [topUpOpen, setTopUpOpen] = useState(false);

  const load = () => setClient(getClient());
  useEffect(() => { load(); }, []);

  const invoices: Invoice[] = client.invoices;
  const filtered = filter === "all" ? invoices : invoices.filter((inv) => inv.status === filter);

  const totalPaid = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + parseFloat(inv.amount.replace("$", "")), 0);

  return (
    <div className="max-w-3xl mx-auto px-8 py-10">
      {topUpOpen && <TopUpModal onClose={() => setTopUpOpen(false)} onSuccess={load} />}

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
            ${totalPaid.toFixed(2)} total paid · {invoices.filter((i) => i.status === "paid").length} invoices
          </p>
        </div>
        <button
          onClick={() => setTopUpOpen(true)}
          className="mt-1 text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-violet-700 active:scale-[0.97] transition-all shadow-sm shadow-indigo-200/60 flex-shrink-0"
        >
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
                const st = STATUS_CONFIG[inv.status];
                return (
                  <tr key={inv.id} className={`hover:bg-stone-50/60 transition-colors ${i < filtered.length - 1 ? "border-b border-stone-100" : ""}`}>
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
