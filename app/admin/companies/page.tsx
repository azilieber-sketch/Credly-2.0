"use client";

import { useEffect, useState } from "react";
import {
  getCompanies, saveCompanies, Company, companyStatus, PLANS, formatDate,
} from "@/app/_lib/store";

function AddCompanyModal({ onClose, onAdd }: { onClose: () => void; onAdd: (c: Company) => void }) {
  const [name, setName]   = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan]   = useState<string>("Growth");

  const submit = () => {
    if (!name.trim() || !email.trim()) return;
    const selectedPlan = PLANS.find((p) => p.name === plan) ?? PLANS[1];
    const newCo: Company = {
      id:      Date.now().toString(),
      name:    name.trim(),
      email:   email.trim(),
      plan:    selectedPlan.name,
      credits: selectedPlan.credits,
      used:    0,
      joined:  formatDate(),
    };
    onAdd(newCo);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Add company</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors text-xl">×</button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Company name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Corp"
              className="border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-stone-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-stone-50"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@company.com"
              className="border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-stone-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-stone-50"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Plan</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-stone-50"
            >
              {PLANS.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} — {p.credits.toLocaleString()} credits ({p.priceStr})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 text-sm font-medium text-stone-500 border border-stone-200 px-4 py-2.5 rounded-xl hover:bg-stone-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!name.trim() || !email.trim()}
            className="flex-1 text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2.5 rounded-xl hover:from-indigo-700 hover:to-violet-700 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add company
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => { setCompanies(getCompanies()); }, []);

  const handleAdd = (co: Company) => {
    const updated = [co, ...companies];
    saveCompanies(updated);
    setCompanies(updated);
  };

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">
      {modalOpen && <AddCompanyModal onClose={() => setModalOpen(false)} onAdd={handleAdd} />}

      <div className="flex items-start justify-between mb-10">
        <div>
          <span className="inline-block text-amber-700 font-semibold text-xs uppercase tracking-widest bg-amber-50 border border-amber-100 px-3 py-1 rounded-full mb-4">
            Companies
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Client accounts</h1>
          <p className="text-stone-400 mt-2 text-sm">{companies.length} companies on the platform.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="mt-1 text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-violet-700 active:scale-[0.97] transition-all shadow-sm shadow-indigo-200/60 flex-shrink-0"
        >
          Add company
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        {companies.length === 0 ? (
          <div className="py-16 text-center text-sm text-stone-400">No companies yet.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Company</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Plan</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Credits</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Joined</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((co, i) => {
                const pct        = Math.min(Math.round((co.used / co.credits) * 100), 100);
                const isDepleted = companyStatus(co) === "depleted";
                return (
                  <tr key={co.id} className={`hover:bg-stone-50/60 transition-colors ${i < companies.length - 1 ? "border-b border-stone-100" : ""}`}>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-semibold text-gray-900">{co.name}</p>
                      <p className="text-[11px] text-stone-400 mt-0.5">{co.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-stone-500">{co.plan}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm font-semibold text-gray-900 tabular-nums">
                          {co.used.toLocaleString()} <span className="text-stone-400 font-normal text-xs">/ {co.credits.toLocaleString()}</span>
                        </span>
                        <div className="w-16 h-1 bg-stone-100 rounded-full">
                          <div className={`h-1 rounded-full ${isDepleted ? "bg-red-400" : "bg-indigo-400"}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-stone-400">{co.joined}</td>
                    <td className="px-5 py-3.5 text-right">
                      {isDepleted ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-red-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                          Depleted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                          Active
                        </span>
                      )}
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
