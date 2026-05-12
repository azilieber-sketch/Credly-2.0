"use client";

import { useEffect, useState } from "react";
import {
  getCompanies, saveCompanies, getAdminInvoices, saveAdminInvoices, addActivityLog,
  Company, companyStatus, PLANS, Plan, nextInvoiceId, formatDate,
} from "@/app/_lib/store";

function IssueCreditModal({ company, onClose, onIssued }: { company: Company; onClose: () => void; onIssued: (plan: Plan) => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 sm:p-7" onClick={(e) => e.stopPropagation()}>
        <div className="sm:hidden w-10 h-1 bg-zinc-200 rounded-full mx-auto mb-5" />
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold text-zinc-900">Issue credits</h2>
          <button onClick={onClose} className="hidden sm:flex w-7 h-7 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 text-xl">×</button>
        </div>
        <p className="text-sm text-zinc-500 mb-5">Issuing credits to <span className="font-semibold text-zinc-700">{company.name}</span>.</p>
        <div className="flex flex-col gap-2.5">
          {PLANS.map((plan) => (
            <button
              key={plan.name}
              onClick={() => { onIssued(plan); onClose(); }}
              className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200 hover:border-indigo-300 hover:bg-indigo-50/40 active:scale-[0.99] transition-all text-left"
            >
              <div>
                <p className="text-sm font-bold text-zinc-900">{plan.name}</p>
                <p className="text-xs text-zinc-400">{plan.credits.toLocaleString()} credits · {plan.rollover} rollover</p>
              </div>
              <p className="text-base font-black text-zinc-900">{plan.priceStr}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CreditsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [issueFor,  setIssueFor]  = useState<Company | null>(null);
  const [toast,     setToast]     = useState<string | null>(null);

  useEffect(() => { setCompanies(getCompanies()); }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const handleIssue = (plan: Plan) => {
    if (!issueFor) return;
    const updated = companies.map((c) => c.id === issueFor.id ? { ...c, credits: c.credits + plan.credits, plan: plan.name, mrr: plan.price } : c);
    saveCompanies(updated);
    setCompanies(updated);
    const allInvs = getAdminInvoices();
    const newInv = {
      id: nextInvoiceId(allInvs, "INV-A"),
      company: issueFor.name,
      companyId: issueFor.id,
      date: formatDate(),
      plan: plan.name,
      credits: plan.credits,
      amount: plan.priceStr,
      status: "paid" as const,
    };
    saveAdminInvoices([newInv, ...allInvs]);
    addActivityLog({ type: "credit_issued", company: issueFor.name, companyId: issueFor.id, description: `${plan.credits.toLocaleString()} credits issued (${plan.name})`, amount: plan.priceStr });
    showToast(`${plan.credits.toLocaleString()} credits added to ${issueFor.name}`);
  };

  const totalIssued    = companies.reduce((s, c) => s + c.credits, 0);
  const totalConsumed  = companies.reduce((s, c) => s + c.used, 0);
  const totalRemaining = totalIssued - totalConsumed;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 md:px-8 md:py-8">
      {issueFor && <IssueCreditModal company={issueFor} onClose={() => setIssueFor(null)} onIssued={handleIssue} />}

      {toast && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 bg-zinc-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      <div className="mb-6 md:mb-8">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">Admin</p>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">Credits</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Platform-wide credit issuance and consumption.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        {[
          { label: "Total issued",    value: totalIssued.toLocaleString()    },
          { label: "Total consumed",  value: totalConsumed.toLocaleString()  },
          { label: "Total remaining", value: totalRemaining.toLocaleString() },
        ].map((m) => (
          <div key={m.label} className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5">
            <p className="text-[10px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">{m.label}</p>
            <p className="text-2xl sm:text-3xl font-black text-zinc-900 tabular-nums">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        {/* Desktop table */}
        <table className="w-full hidden sm:table">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/60">
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Company</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Plan</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Issued</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Used</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Remaining</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {companies.map((co, i) => {
              const st        = companyStatus(co);
              const remaining = Math.max(co.credits - co.used, 0);
              const pct       = Math.min(Math.round((co.used / co.credits) * 100), 100);
              return (
                <tr key={co.id} className={`hover:bg-zinc-50 transition-colors ${i < companies.length - 1 ? "border-b border-zinc-100" : ""}`}>
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-semibold text-zinc-900">{co.name}</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{co.joined}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded">{co.plan}</span>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-zinc-900 text-right tabular-nums">{co.credits.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-sm text-zinc-500 text-right tabular-nums">{co.used.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-right">
                    <p className={`text-sm font-semibold tabular-nums ${st === "depleted" ? "text-amber-500" : "text-zinc-900"}`}>
                      {remaining.toLocaleString()}
                    </p>
                    <div className="w-16 h-1 bg-zinc-100 rounded-full mt-1 ml-auto">
                      <div className={`h-1 rounded-full ${st === "depleted" ? "bg-amber-400" : "bg-indigo-400"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                      st === "active" ? "bg-emerald-50 text-emerald-700" :
                      st === "suspended" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                    }`}>{st}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => setIssueFor(co)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Issue
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-zinc-100">
          {companies.map((co) => {
            const st        = companyStatus(co);
            const remaining = Math.max(co.credits - co.used, 0);
            const pct       = Math.min(Math.round((co.used / co.credits) * 100), 100);
            return (
              <div key={co.id} className="px-4 py-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{co.name}</p>
                    <span className="text-xs font-semibold text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded mt-1 inline-block">{co.plan}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                      st === "active" ? "bg-emerald-50 text-emerald-700" :
                      st === "suspended" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                    }`}>{st}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-0.5">Issued</p>
                    <p className="text-sm font-semibold text-zinc-900 tabular-nums">{co.credits.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-0.5">Used</p>
                    <p className="text-sm font-medium text-zinc-600 tabular-nums">{co.used.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-0.5">Left</p>
                    <p className={`text-sm font-semibold tabular-nums ${st === "depleted" ? "text-amber-500" : "text-zinc-900"}`}>
                      {remaining.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 h-1.5 bg-zinc-100 rounded-full">
                    <div className={`h-1.5 rounded-full ${st === "depleted" ? "bg-amber-400" : "bg-indigo-400"}`} style={{ width: `${pct}%` }} />
                  </div>
                  <button
                    onClick={() => setIssueFor(co)}
                    className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                  >
                    Issue
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
