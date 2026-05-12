"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getCompanies, saveCompanies, addActivityLog,
  Company, companyStatus, PLANS, formatDate,
} from "@/app/_lib/store";

type StatusFilter = "all" | "active" | "depleted" | "suspended";

function AddCompanyModal({ onClose, onAdd }: { onClose: () => void; onAdd: (c: Company) => void }) {
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [plan, setPlan]         = useState("Growth");
  const [industry, setIndustry] = useState("E-commerce");

  const submit = () => {
    if (!name.trim() || !email.trim()) return;
    const selectedPlan = PLANS.find((p) => p.name === plan) ?? PLANS[1];
    const newCo: Company = {
      id: Date.now().toString(),
      name: name.trim(),
      email: email.trim(),
      plan: selectedPlan.name,
      credits: selectedPlan.credits,
      used: 0,
      joined: formatDate(),
      status: "active",
      industry: industry.trim() || "Other",
      agents: 1,
      mrr: selectedPlan.price,
    };
    onAdd(newCo);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-7" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-zinc-900">Add company</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors text-xl">×</button>
        </div>
        <div className="flex flex-col gap-4">
          {[
            { label: "Company name", value: name, set: setName, type: "text", placeholder: "e.g. Acme Corp" },
            { label: "Email",        value: email, set: setEmail, type: "email", placeholder: "admin@company.com" },
            { label: "Industry",     value: industry, set: setIndustry, type: "text", placeholder: "e.g. E-commerce" },
          ].map(({ label, value, set, type, placeholder }) => (
            <div key={label} className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">{label}</label>
              <input
                type={type}
                value={value}
                onChange={(e) => set(e.target.value)}
                placeholder={placeholder}
                className="border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-zinc-50"
              />
            </div>
          ))}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Plan</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-zinc-50"
            >
              {PLANS.map((p) => (
                <option key={p.name} value={p.name}>{p.name} — {p.credits.toLocaleString()} credits ({p.priceStr})</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 text-sm font-medium text-zinc-500 border border-zinc-200 px-4 py-2.5 rounded-lg hover:bg-zinc-50 transition-colors">Cancel</button>
          <button
            onClick={submit}
            disabled={!name.trim() || !email.trim()}
            className="flex-1 text-sm font-semibold bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add company
          </button>
        </div>
      </div>
    </div>
  );
}

const STATUS_BADGE: Record<string, string> = {
  active:    "bg-emerald-50 text-emerald-700 border-emerald-100",
  depleted:  "bg-amber-50 text-amber-700 border-amber-100",
  suspended: "bg-red-50 text-red-700 border-red-100",
};

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch]       = useState("");
  const [filter, setFilter]       = useState<StatusFilter>("all");
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => { setCompanies(getCompanies()); }, []);

  const handleAdd = (co: Company) => {
    const updated = [co, ...companies];
    saveCompanies(updated);
    setCompanies(updated);
    addActivityLog({ type: "company_added", company: co.name, companyId: co.id, description: `New company registered on ${co.plan} plan` });
  };

  const visible = companies.filter((co) => {
    const st = companyStatus(co);
    const matchesFilter = filter === "all" || st === filter;
    const matchesSearch = co.name.toLowerCase().includes(search.toLowerCase()) || co.email.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto px-8 py-8">
      {modalOpen && <AddCompanyModal onClose={() => setModalOpen(false)} onAdd={handleAdd} />}

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">Admin</p>
          <h1 className="text-2xl font-bold text-zinc-900">Companies</h1>
          <p className="text-sm text-zinc-400 mt-0.5">{companies.length} accounts on the platform</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="text-sm font-semibold bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 active:scale-[0.98] transition-all flex-shrink-0"
        >
          + Add company
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search companies…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "active", "depleted", "suspended"] as StatusFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-medium capitalize transition-all ${
                filter === f ? "bg-zinc-900 text-white" : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        {visible.length === 0 ? (
          <div className="py-16 text-center text-sm text-zinc-400">No companies found.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/60">
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Company</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Plan</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Credits</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Industry</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Joined</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((co, i) => {
                const st  = companyStatus(co);
                const pct = Math.min(Math.round((co.used / co.credits) * 100), 100);
                return (
                  <tr
                    key={co.id}
                    className={`hover:bg-zinc-50 transition-colors cursor-pointer ${i < visible.length - 1 ? "border-b border-zinc-100" : ""}`}
                    onClick={() => window.location.href = `/admin/companies/${co.id}`}
                  >
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-semibold text-zinc-900">{co.name}</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{co.email}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded">{co.plan}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <p className="text-sm font-semibold text-zinc-900 tabular-nums">{co.used.toLocaleString()} <span className="text-zinc-400 font-normal text-xs">/ {co.credits.toLocaleString()}</span></p>
                      <div className="w-20 h-1 bg-zinc-100 rounded-full mt-1.5 ml-auto">
                        <div className={`h-1 rounded-full ${st === "depleted" ? "bg-amber-400" : st === "suspended" ? "bg-red-400" : "bg-indigo-400"}`} style={{ width: `${pct}%` }} />
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-zinc-400">{co.industry}</td>
                    <td className="px-5 py-3.5 text-sm text-zinc-400">{co.joined}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS_BADGE[st] ?? STATUS_BADGE.active}`}>
                        {st}
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
