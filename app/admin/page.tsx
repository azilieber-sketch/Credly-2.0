"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getCompanies, getAdminInvoices, getActivityLogs,
  Company, AdminInvoice, ActivityLog,
  companyStatus, PLAN_MRR, timeAgo,
} from "@/app/_lib/store";

const KPI = ({
  label, value, sub, trend, color = "text-zinc-900",
}: {
  label: string; value: string; sub: string; trend?: string; color?: string;
}) => (
  <div className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5">
    <p className="text-[10px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 sm:mb-3">{label}</p>
    <p className={`text-2xl sm:text-3xl font-black leading-none tabular-nums mb-1.5 ${color}`}>{value}</p>
    <div className="flex items-center gap-1.5">
      {trend && (
        <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
          {trend}
        </span>
      )}
      <p className="text-xs text-zinc-400 truncate">{sub}</p>
    </div>
  </div>
);

const ACTIVITY_CONFIG: Record<string, { label: string; dot: string; text: string }> = {
  credit_issued:      { label: "Credits",   dot: "bg-indigo-500",  text: "text-indigo-600"  },
  company_added:      { label: "New",       dot: "bg-emerald-500", text: "text-emerald-600" },
  invoice_paid:       { label: "Payment",   dot: "bg-emerald-500", text: "text-emerald-600" },
  invoice_generated:  { label: "Invoice",   dot: "bg-amber-500",   text: "text-amber-600"   },
  plan_changed:       { label: "Plan",      dot: "bg-violet-500",  text: "text-violet-600"  },
  company_suspended:  { label: "Suspended", dot: "bg-red-500",     text: "text-red-600"     },
  company_activated:  { label: "Activated", dot: "bg-emerald-500", text: "text-emerald-600" },
};

const USAGE_MONTHS = [
  { label: "Dec", value: 2800 },
  { label: "Jan", value: 3900 },
  { label: "Feb", value: 4600 },
  { label: "Mar", value: 5800 },
  { label: "Apr", value: 6400 },
  { label: "May", value: 4688, partial: true },
];

export default function AdminOverview() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [invoices,  setInvoices]  = useState<AdminInvoice[]>([]);
  const [activity,  setActivity]  = useState<ActivityLog[]>([]);

  useEffect(() => {
    setCompanies(getCompanies());
    setInvoices(getAdminInvoices());
    setActivity(getActivityLogs());
  }, []);

  const mrr         = companies.filter(c => c.status !== "suspended").reduce((s, c) => s + (PLAN_MRR[c.plan] ?? 0), 0);
  const activeCount = companies.filter(c => companyStatus(c) === "active").length;
  const creditsMTD  = companies.reduce((s, c) => s + c.used, 0);
  const pendingInvs = invoices.filter(i => i.status === "pending").length;
  const atRisk      = companies.filter(c => companyStatus(c) === "depleted" || c.status === "suspended");
  const usageMax    = Math.max(...USAGE_MONTHS.map(m => m.value));

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 md:px-8 md:py-8">

      {/* ── Header ── */}
      <div className="mb-6 md:mb-8">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">Credly Admin</p>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">Platform Overview</h1>
        <p className="text-sm text-zinc-400 mt-0.5">May 2026 · {companies.length} companies</p>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 md:mb-8">
        <KPI label="Monthly Revenue"  value={`$${mrr.toLocaleString()}`}  sub="Active accounts"          trend="+12%" />
        <KPI label="Active Companies" value={activeCount.toString()}       sub={`of ${companies.length} total`}       />
        <KPI label="Credits MTD"      value={creditsMTD.toLocaleString()}  sub="All accounts"             trend="+8%"  />
        <KPI label="Pending Invoices" value={pendingInvs.toString()}       sub="Awaiting payment"
          color={pendingInvs > 0 ? "text-amber-500" : "text-zinc-900"} />
      </div>

      {/* ── Chart + Revenue by plan ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 mb-5">

        {/* Bar chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <div>
              <p className="text-sm font-semibold text-zinc-900">Credit consumption</p>
              <p className="text-xs text-zinc-400 mt-0.5">Platform-wide, last 6 months</p>
            </div>
            <span className="text-xs font-semibold text-zinc-400">{creditsMTD.toLocaleString()} MTD</span>
          </div>
          <div className="flex items-end gap-1.5 sm:gap-2 h-24 sm:h-28">
            {USAGE_MONTHS.map((m) => {
              const pct = Math.round((m.value / usageMax) * 100);
              return (
                <div key={m.label} className="flex flex-col items-center gap-1.5 flex-1">
                  <span className="text-[9px] sm:text-[10px] text-zinc-400 tabular-nums hidden sm:block">{(m.value / 1000).toFixed(1)}k</span>
                  <div className="w-full flex flex-col justify-end" style={{ height: "72px" }}>
                    <div
                      className={`w-full rounded-t-md transition-all ${m.partial ? "bg-indigo-300" : "bg-indigo-500"}`}
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-zinc-400">{m.label}</span>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-zinc-400 mt-2 sm:mt-3">May is a partial month</p>
        </div>

        {/* Revenue by plan */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5 sm:p-6">
          <p className="text-sm font-semibold text-zinc-900 mb-1">Revenue by plan</p>
          <p className="text-xs text-zinc-400 mb-4 sm:mb-5">Active accounts</p>
          <div className="flex flex-col gap-4">
            {(["Scale", "Growth", "Starter"] as const).map((plan) => {
              const count   = companies.filter(c => c.plan === plan && c.status !== "suspended").length;
              const revenue = count * (PLAN_MRR[plan] ?? 0);
              const pct     = mrr > 0 ? Math.round((revenue / mrr) * 100) : 0;
              const colors: Record<string, string> = { Scale: "bg-indigo-500", Growth: "bg-violet-400", Starter: "bg-sky-400" };
              return (
                <div key={plan}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-zinc-600">{plan}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-400">{count} co.</span>
                      <span className="text-xs font-semibold text-zinc-900">${revenue}</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-100 rounded-full">
                    <div className={`h-1.5 rounded-full ${colors[plan]}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Activity feed + At risk ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">

        {/* Recent activity */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
            <p className="text-sm font-semibold text-zinc-900">Recent activity</p>
            <Link href="/admin/activity" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-zinc-100">
            {activity.slice(0, 6).map((log) => {
              const cfg = ACTIVITY_CONFIG[log.type] ?? { label: "Event", dot: "bg-zinc-400", text: "text-zinc-600" };
              return (
                <div key={log.id} className="flex items-start sm:items-center gap-3 px-5 py-3">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 sm:mt-0 ${cfg.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-700 truncate">{log.description}</p>
                    {log.company && (
                      <p className="text-xs text-zinc-400 mt-0.5">{log.company}</p>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 flex-shrink-0">
                    {log.amount && <span className="text-xs font-semibold text-zinc-700">{log.amount}</span>}
                    <span className="text-xs text-zinc-400 whitespace-nowrap">{timeAgo(log.timestamp)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* At risk */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
            <p className="text-sm font-semibold text-zinc-900">Needs attention</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${atRisk.length > 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
              {atRisk.length}
            </span>
          </div>
          {atRisk.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-zinc-400">All accounts healthy</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {atRisk.map((co) => {
                const st = companyStatus(co);
                return (
                  <Link href={`/admin/companies/${co.id}`} key={co.id} className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-50 transition-colors">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${st === "suspended" ? "bg-red-500" : "bg-amber-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-800 truncate">{co.name}</p>
                      <p className="text-xs text-zinc-400 mt-0.5 capitalize">{st}</p>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-300 flex-shrink-0">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
