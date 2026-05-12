"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAdminInvoices, saveAdminInvoices, addActivityLog, AdminInvoice } from "@/app/_lib/store";

type Filter = "all" | "paid" | "pending";

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
  const [filter,   setFilter]   = useState<Filter>("all");
  const [toast,    setToast]    = useState<string | null>(null);

  const load = () => setInvoices(getAdminInvoices());
  useEffect(() => { load(); }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const markPaid = (inv: AdminInvoice) => {
    const updated = getAdminInvoices().map((i) => i.id === inv.id ? { ...i, status: "paid" as const } : i);
    saveAdminInvoices(updated);
    addActivityLog({ type: "invoice_paid", company: inv.company, companyId: inv.companyId, description: `Invoice ${inv.id} marked paid — ${inv.amount}`, amount: inv.amount });
    load();
    showToast(`${inv.id} marked as paid`);
  };

  const filtered       = filter === "all" ? invoices : invoices.filter((i) => i.status === filter);
  const totalRevenue   = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + parseFloat(i.amount.replace("$", "")), 0);
  const pendingRevenue = invoices.filter((i) => i.status === "pending").reduce((s, i) => s + parseFloat(i.amount.replace("$", "")), 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 md:px-8 md:py-8">
      {toast && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 bg-zinc-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      <div className="mb-6 md:mb-8">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">Admin</p>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">Invoices</h1>
        <p className="text-sm text-zinc-400 mt-0.5">
          ${totalRevenue.toFixed(2)} collected
          {pendingRevenue > 0 && <> · <span className="text-amber-600">${pendingRevenue.toFixed(2)} pending</span></>}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        {[
          { label: "Total collected", value: `$${totalRevenue.toFixed(2)}`,   sub: `${invoices.filter(i => i.status === "paid").length} paid invoices`       },
          { label: "Pending",         value: `$${pendingRevenue.toFixed(2)}`, sub: `${invoices.filter(i => i.status === "pending").length} awaiting payment`,
            color: pendingRevenue > 0 ? "text-amber-500" : undefined },
          { label: "Total invoices",  value: invoices.length.toString(),      sub: "All time"                                                                },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5">
            <p className="text-[10px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">{s.label}</p>
            <p className={`text-xl sm:text-2xl font-black tabular-nums ${(s as { color?: string }).color ?? "text-zinc-900"}`}>{s.value}</p>
            <p className="text-xs text-zinc-400 mt-1 truncate">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-1 mb-5">
        {(["all", "paid", "pending"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-2 rounded-lg font-medium capitalize transition-all ${
              filter === f ? "bg-zinc-900 text-white" : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-zinc-400">No invoices found.</div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="w-full hidden sm:table">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/60">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Invoice</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Company</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Plan</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Credits</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Amount</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv, i) => (
                  <tr key={inv.id} className={`hover:bg-zinc-50 transition-colors ${i < filtered.length - 1 ? "border-b border-zinc-100" : ""}`}>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-mono font-medium text-zinc-800">{inv.id}</span>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{inv.date}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      {inv.companyId
                        ? <Link href={`/admin/companies/${inv.companyId}`} className="text-sm font-semibold text-indigo-600 hover:underline">{inv.company}</Link>
                        : <span className="text-sm font-semibold text-zinc-900">{inv.company}</span>
                      }
                    </td>
                    <td className="px-5 py-3.5 text-sm text-zinc-500">{inv.plan}</td>
                    <td className="px-5 py-3.5 text-sm text-zinc-500 text-right tabular-nums">{inv.credits.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-zinc-900 text-right tabular-nums">{inv.amount}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${inv.status === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        {inv.status === "paid" ? "Paid" : "Pending"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {inv.status === "pending" && (
                        <button
                          onClick={() => markPaid(inv)}
                          className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
                        >
                          Mark paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-zinc-100">
              {filtered.map((inv) => (
                <div key={inv.id} className="px-4 py-4">
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-mono font-medium text-zinc-800">{inv.id}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{inv.date} · {inv.plan}</p>
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${inv.status === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                      {inv.status === "paid" ? "Paid" : "Pending"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {inv.companyId
                        ? <Link href={`/admin/companies/${inv.companyId}`} className="text-sm font-semibold text-indigo-600 hover:underline truncate">{inv.company}</Link>
                        : <span className="text-sm font-semibold text-zinc-900 truncate">{inv.company}</span>
                      }
                      <span className="text-xs text-zinc-400 flex-shrink-0">{inv.credits.toLocaleString()} cr</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-semibold text-zinc-900">{inv.amount}</span>
                      {inv.status === "pending" && (
                        <button
                          onClick={() => markPaid(inv)}
                          className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
                        >
                          Mark paid
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
