"use client";

import { useEffect, useState } from "react";
import {
  getCompanies, saveCompanies, getAdminInvoices, saveAdminInvoices,
  Company, companyStatus, PLANS, Plan, nextInvoiceId, formatDate,
} from "@/app/_lib/store";

function IssueCreditModal({
  company,
  onClose,
  onIssued,
}: {
  company: Company;
  onClose: () => void;
  onIssued: (plan: Plan) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-900">Issue credits</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors text-xl">×</button>
        </div>
        <p className="text-sm text-stone-400 mb-6">Adding credits to <span className="font-semibold text-gray-700">{company.name}</span>.</p>

        <div className="flex flex-col gap-3">
          {PLANS.map((plan) => (
            <button
              key={plan.name}
              onClick={() => { onIssued(plan); onClose(); }}
              className="flex items-center justify-between p-4 rounded-2xl border border-stone-200 hover:border-indigo-300 hover:bg-indigo-50/40 active:scale-[0.99] transition-all text-left"
            >
              <div>
                <p className="text-sm font-bold text-gray-900">{plan.name}</p>
                <p className="text-xs text-stone-400 mt-0.5">{plan.credits.toLocaleString()} credits · {plan.rollover} rollover</p>
              </div>
              <p className="text-lg font-black text-gray-900">{plan.priceStr}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CreditsPage() {
  const [companies, setCompanies]   = useState<Company[]>([]);
  const [issueFor, setIssueFor]     = useState<Company | null>(null);

  useEffect(() => { setCompanies(getCompanies()); }, []);

  const handleIssue = (plan: Plan) => {
    if (!issueFor) return;

    const updated = companies.map((c) =>
      c.id === issueFor.id ? { ...c, credits: c.credits + plan.credits, plan: plan.name } : c
    );
    saveCompanies(updated);
    setCompanies(updated);

    const adminInvs = getAdminInvoices();
    const newInv = {
      id:      nextInvoiceId(adminInvs, "INV-A"),
      company: issueFor.name,
      date:    formatDate(),
      plan:    plan.name,
      credits: plan.credits,
      amount:  plan.priceStr,
      status:  "paid" as const,
    };
    saveAdminInvoices([newInv, ...adminInvs]);
  };

  const totalIssued    = companies.reduce((s, c) => s + c.credits, 0);
  const totalConsumed  = companies.reduce((s, c) => s + c.used, 0);
  const totalRemaining = totalIssued - totalConsumed;

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">
      {issueFor && (
        <IssueCreditModal company={issueFor} onClose={() => setIssueFor(null)} onIssued={handleIssue} />
      )}

      <div className="mb-10">
        <span className="inline-block text-amber-700 font-semibold text-xs uppercase tracking-widest bg-amber-50 border border-amber-100 px-3 py-1 rounded-full mb-4">
          Credits
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Credit allocations</h1>
        <p className="text-stone-400 mt-2 text-sm">Platform-wide credit issuance and consumption.</p>
      </div>

      {/* ── Totals ── */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total issued",    value: totalIssued.toLocaleString()    },
          { label: "Total consumed",  value: totalConsumed.toLocaleString()  },
          { label: "Total remaining", value: totalRemaining.toLocaleString() },
        ].map((m) => (
          <div key={m.label} className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm">
            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-3">{m.label}</p>
            <p className="text-3xl font-black text-gray-900 leading-none tabular-nums">{m.value}</p>
          </div>
        ))}
      </div>

      {/* ── Allocations table ── */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-stone-100">
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Company</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Plan</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Issued</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Used</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Remaining</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((co, i) => {
              const isDepleted = companyStatus(co) === "depleted";
              return (
                <tr key={co.id} className={`hover:bg-stone-50/60 transition-colors ${i < companies.length - 1 ? "border-b border-stone-100" : ""}`}>
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-semibold text-gray-900">{co.name}</p>
                    <p className="text-[11px] text-stone-400 mt-0.5">{co.joined}</p>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-stone-500">{co.plan}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-gray-900 text-right tabular-nums">{co.credits.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-sm text-stone-500 text-right tabular-nums">{co.used.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-right tabular-nums">
                    <span className={`text-sm font-semibold ${isDepleted ? "text-red-500" : "text-gray-900"}`}>
                      {Math.max(co.credits - co.used, 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => setIssueFor(co)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Issue credits
                    </button>
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
