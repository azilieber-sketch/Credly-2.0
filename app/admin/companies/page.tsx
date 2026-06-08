"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/_lib/supabase";

interface SupabaseCompany {
  id: string;
  name: string;
  email: string;
  industry: string;
  credits: number;
  credits_used: number;
  status: "pending" | "active" | "suspended";
  created_at: string;
}

type CompanyStatus = "pending" | "active" | "depleted" | "suspended";
type StatusFilter = "all" | CompanyStatus;

function getStatus(co: SupabaseCompany): CompanyStatus {
  if (co.status === "pending") return "pending";
  if (co.status === "suspended") return "suspended";
  if (co.credits_used >= co.credits) return "depleted";
  return "active";
}

const STATUS_BADGE: Record<CompanyStatus, string> = {
  pending:   "bg-indigo-50 text-indigo-700",
  active:    "bg-emerald-50 text-emerald-700",
  depleted:  "bg-amber-50 text-amber-700",
  suspended: "bg-red-50 text-red-700",
};

const INDUSTRIES = ["E-commerce", "SaaS", "Retail", "Fashion", "Home & Garden", "Healthcare", "Finance", "Outdoors", "Design", "Other"];
const CREDIT_OPTIONS = [500, 2000, 10000] as const;

function AddCompanyModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [industry, setIndustry] = useState("E-commerce");
  const [credits,  setCredits]  = useState<500 | 2000 | 10000>(500);
  const [error,    setError]    = useState<string | null>(null);
  const [saving,   setSaving]   = useState(false);

  const handle = async () => {
    if (!name.trim() || !email.trim()) return;
    if (!supabase) return;
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.from("companies").insert({
      name:         name.trim(),
      email:        email.trim(),
      industry,
      credits,
      credits_used: 0,
      status:       "active",
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    onAdded();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 sm:p-7" onClick={(e) => e.stopPropagation()}>
        <div className="sm:hidden w-10 h-1 bg-zinc-200 rounded-full mx-auto mb-5" />
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-zinc-900">Add company</h2>
          <button onClick={onClose} className="hidden sm:flex w-7 h-7 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 text-xl">×</button>
        </div>
        <div className="flex flex-col gap-3">
          <input
            placeholder="Company name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-zinc-200 rounded-lg px-3 py-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <input
            placeholder="Contact email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-zinc-200 rounded-lg px-3 py-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="w-full border border-zinc-200 rounded-lg px-3 py-3 text-sm text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
          </select>
          <select
            value={credits}
            onChange={(e) => setCredits(Number(e.target.value) as 500 | 2000 | 10000)}
            className="w-full border border-zinc-200 rounded-lg px-3 py-3 text-sm text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            {CREDIT_OPTIONS.map((c) => <option key={c} value={c}>{c.toLocaleString()} credits</option>)}
          </select>
          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
          <button
            onClick={handle}
            disabled={!name.trim() || !email.trim() || saving}
            className="w-full mt-1 text-sm font-semibold bg-zinc-900 text-white py-3 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-40"
          >
            {saving ? "Adding…" : "Add company"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<SupabaseCompany[]>([]);
  const [search,    setSearch]    = useState("");
  const [filter,    setFilter]    = useState<StatusFilter>("all");
  const [showAdd,   setShowAdd]   = useState(false);
  const [loading,   setLoading]   = useState(true);

  const load = async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase.from("companies").select("*").order("created_at", { ascending: false });
    if (data) setCompanies(data as SupabaseCompany[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const approve = async (id: string) => {
    if (!supabase) return;
    await supabase.from("companies").update({ status: "active" }).eq("id", id);
    load();
  };

  if (!supabase) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 md:px-8 md:py-8">
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <p className="text-sm font-semibold text-zinc-900 mb-1">Supabase not configured</p>
          <p className="text-sm text-zinc-400">Add your Supabase environment variables to enable company management.</p>
        </div>
      </div>
    );
  }

  const pendingCount = companies.filter((c) => c.status === "pending").length;

  const visible = companies
    .filter((c) => filter === "all" || getStatus(c) === filter)
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 md:px-8 md:py-8">
      {showAdd && <AddCompanyModal onClose={() => setShowAdd(false)} onAdded={load} />}

      <div className="flex items-start justify-between mb-6 md:mb-8 gap-4">
        <div>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">Admin</p>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">Companies</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            {companies.length} accounts on the platform
            {pendingCount > 0 && (
              <span className="text-indigo-600 font-medium"> · {pendingCount} pending approval</span>
            )}.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="text-sm font-semibold bg-zinc-900 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-zinc-800 transition-colors flex-shrink-0"
        >
          <span className="hidden sm:inline">+ Add company</span>
          <span className="sm:hidden">+ Add</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-zinc-200 rounded-lg text-sm text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto pb-0.5">
          {(["all", "pending", "active", "depleted", "suspended"] as StatusFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-2 rounded-lg font-medium capitalize transition-all flex-shrink-0 ${
                filter === f ? "bg-zinc-900 text-white" : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : visible.length === 0 ? (
          <div className="py-16 text-center text-sm text-zinc-400">No companies found.</div>
        ) : (
          <>
            <table className="w-full hidden sm:table">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/60">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Company</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Industry</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Credits</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Used</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {visible.map((co, i) => {
                  const st = getStatus(co);
                  return (
                    <tr
                      key={co.id}
                      className={`hover:bg-zinc-50 transition-colors cursor-pointer ${i < visible.length - 1 ? "border-b border-zinc-100" : ""}`}
                      onClick={() => window.location.assign(`/admin/companies/${co.id}`)}
                    >
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-semibold text-zinc-900">{co.name}</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">{co.email}</p>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-zinc-500">{co.industry}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-zinc-900 text-right tabular-nums">{co.credits.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-sm text-zinc-500 text-right tabular-nums">{co.credits_used.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[st]}`}>
                          {st}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {co.status === "pending" && (
                            <button
                              onClick={(e) => { e.stopPropagation(); approve(co.id); }}
                              className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-2.5 py-1 rounded-lg transition-colors"
                            >
                              Approve
                            </button>
                          )}
                          <Link
                            href={`/admin/companies/${co.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                          >
                            View →
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="sm:hidden divide-y divide-zinc-100">
              {visible.map((co) => {
                const st = getStatus(co);
                const remaining = Math.max(co.credits - co.credits_used, 0);
                return (
                  <Link key={co.id} href={`/admin/companies/${co.id}`} className="block px-4 py-4 hover:bg-zinc-50 transition-colors active:bg-zinc-100">
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-900">{co.name}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{co.industry}</p>
                      </div>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize flex-shrink-0 ml-2 ${STATUS_BADGE[st]}`}>
                        {st}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-0.5">Credits</p>
                        <p className="text-sm font-medium text-zinc-700">{co.credits.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-0.5">Used</p>
                        <p className="text-sm font-medium text-zinc-700">{co.credits_used.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-0.5">Remaining</p>
                        <p className="text-sm font-medium text-zinc-700">{remaining.toLocaleString()}</p>
                      </div>
                    </div>
                    {co.status === "pending" && (
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); approve(co.id); }}
                        className="mt-3 w-full text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 py-2 rounded-lg transition-colors"
                      >
                        Approve account
                      </button>
                    )}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
