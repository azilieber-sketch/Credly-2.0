"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getCompanies, saveCompanies, getAdminInvoices, saveAdminInvoices,
  getActivityLogs, addActivityLog,
  Company, AdminInvoice, ActivityLog, Plan,
  companyStatus, PLANS, nextInvoiceId, formatDate, timeAgo,
} from "@/app/_lib/store";

const STATUS_BADGE: Record<string, string> = {
  active:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  depleted:  "bg-amber-50 text-amber-700 border-amber-200",
  suspended: "bg-red-50 text-red-700 border-red-200",
};

const BREAKDOWN = [
  { label: "Shipping",  ratio: 0.52, color: "bg-indigo-400" },
  { label: "Returns",   ratio: 0.27, color: "bg-violet-400" },
  { label: "Inquiries", ratio: 0.21, color: "bg-sky-400"    },
];

function PlanModal({ company, onClose, onDone }: { company: Company; onClose: () => void; onDone: (plan: Plan) => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-zinc-900">Issue credits</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 text-xl">×</button>
        </div>
        <p className="text-sm text-zinc-500 mb-5">Adding credits to <span className="font-semibold text-zinc-700">{company.name}</span>.</p>
        <div className="flex flex-col gap-2.5">
          {PLANS.map((plan) => (
            <button
              key={plan.name}
              onClick={() => { onDone(plan); onClose(); }}
              className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200 hover:border-indigo-300 hover:bg-indigo-50/40 active:scale-[0.99] transition-all text-left"
            >
              <div>
                <p className="text-sm font-bold text-zinc-900">{plan.name}</p>
                <p className="text-xs text-zinc-400">{plan.credits.toLocaleString()} credits</p>
              </div>
              <p className="text-base font-black text-zinc-900">{plan.priceStr}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CompanyDetailPage() {
  const { id }    = useParams<{ id: string }>();
  const router    = useRouter();

  const [company,  setCompany]  = useState<Company | null>(null);
  const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [modal,    setModal]    = useState<"credits" | null>(null);
  const [toast,    setToast]    = useState<string | null>(null);

  const load = () => {
    const cos = getCompanies();
    const co  = cos.find((c) => c.id === id) ?? null;
    setCompany(co);
    const allInvs = getAdminInvoices();
    setInvoices(allInvs.filter((inv) => inv.companyId === id || inv.company === co?.name));
    setActivity(getActivityLogs().filter((a) => a.companyId === id));
  };

  useEffect(() => { load(); }, [id]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleIssueCredits = (plan: Plan) => {
    const cos     = getCompanies();
    const updated = cos.map((c) => c.id === id ? { ...c, credits: c.credits + plan.credits, plan: plan.name, mrr: plan.price } : c);
    saveCompanies(updated);
    const allInvs = getAdminInvoices();
    const newInv: AdminInvoice = {
      id: nextInvoiceId(allInvs, "INV-A"),
      company: company!.name,
      companyId: id,
      date: formatDate(),
      plan: plan.name,
      credits: plan.credits,
      amount: plan.priceStr,
      status: "paid",
    };
    saveAdminInvoices([newInv, ...allInvs]);
    addActivityLog({ type: "credit_issued", company: company!.name, companyId: id, description: `${plan.credits.toLocaleString()} credits issued (${plan.name} plan)`, amount: plan.priceStr });
    load();
    showToast(`${plan.credits.toLocaleString()} credits added`);
  };

  const handleToggleSuspend = () => {
    if (!company) return;
    const newStatus = company.status === "suspended" ? "active" : "suspended";
    const cos       = getCompanies();
    const updated   = cos.map((c) => c.id === id ? { ...c, status: newStatus as Company["status"] } : c);
    saveCompanies(updated);
    addActivityLog({
      type: newStatus === "suspended" ? "company_suspended" : "company_activated",
      company: company.name,
      companyId: id,
      description: newStatus === "suspended" ? "Account suspended by admin" : "Account reactivated by admin",
    });
    load();
    showToast(newStatus === "suspended" ? "Account suspended" : "Account reactivated");
  };

  const handleGenerateInvoice = () => {
    if (!company) return;
    const allInvs = getAdminInvoices();
    const plan    = PLANS.find((p) => p.name === company.plan) ?? PLANS[1];
    const newInv: AdminInvoice = {
      id: nextInvoiceId(allInvs, "INV-A"),
      company: company.name,
      companyId: id,
      date: formatDate(),
      plan: plan.name,
      credits: plan.credits,
      amount: plan.priceStr,
      status: "pending",
    };
    saveAdminInvoices([newInv, ...allInvs]);
    addActivityLog({ type: "invoice_generated", company: company.name, companyId: id, description: `Invoice ${newInv.id} generated — ${plan.priceStr}`, amount: plan.priceStr });
    load();
    showToast("Invoice generated");
  };

  if (!company) {
    return (
      <div className="max-w-4xl mx-auto px-8 py-16 text-center">
        <p className="text-sm text-zinc-400">Company not found.</p>
        <Link href="/admin/companies" className="text-sm text-indigo-600 hover:underline mt-2 block">← Back to companies</Link>
      </div>
    );
  }

  const st               = companyStatus(company);
  const creditsRemaining = Math.max(company.credits - company.used, 0);
  const creditPct        = Math.min(Math.round((company.used / company.credits) * 100), 100);
  const breakdown        = BREAKDOWN.map((b) => ({ ...b, credits: Math.round(company.used * b.ratio) }));

  return (
    <div className="max-w-4xl mx-auto px-8 py-8">
      {modal === "credits" && <PlanModal company={company} onClose={() => setModal(null)} onDone={handleIssueCredits} />}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-sm text-zinc-400 mb-6">
        <Link href="/admin/companies" className="hover:text-zinc-700 transition-colors">Companies</Link>
        <span>/</span>
        <span className="text-zinc-700 font-medium">{company.name}</span>
      </div>

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-zinc-900">{company.name}</h1>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS_BADGE[st]}`}>{st}</span>
          </div>
          <p className="text-sm text-zinc-400">{company.email} · {company.industry} · {company.agents} agent{company.agents !== 1 ? "s" : ""} · Joined {company.joined}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateInvoice}
            className="text-sm font-medium text-zinc-600 border border-zinc-200 px-3 py-2 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            Generate invoice
          </button>
          <button
            onClick={() => setModal("credits")}
            className="text-sm font-semibold bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Issue credits
          </button>
          <button
            onClick={handleToggleSuspend}
            className={`text-sm font-semibold px-3 py-2 rounded-lg transition-colors ${
              company.status === "suspended"
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
            }`}
          >
            {company.status === "suspended" ? "Reactivate" : "Suspend"}
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Credits used",      value: company.used.toLocaleString(),            sub: "This period"           },
          { label: "Credits remaining", value: creditsRemaining.toLocaleString(),        sub: `of ${company.credits.toLocaleString()} total`, color: creditsRemaining < 100 ? "text-amber-500" : "text-zinc-900" },
          { label: "Plan",              value: company.plan,                              sub: company.mrr > 0 ? `$${company.mrr}/mo` : "No billing" },
          { label: "Invoices",          value: invoices.length.toString(),               sub: `${invoices.filter(i => i.status === "paid").length} paid` },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-zinc-200 p-5">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">{s.label}</p>
            <p className={`text-2xl font-black leading-none tabular-nums mb-1 ${(s as { color?: string }).color ?? "text-zinc-900"}`}>{s.value}</p>
            <p className="text-xs text-zinc-400">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5 mb-5">
        {/* Credits */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <p className="text-sm font-semibold text-zinc-900 mb-4">Credit balance</p>
          <div className="flex items-end justify-between mb-2">
            <span className="text-3xl font-black text-zinc-900 tabular-nums">{creditsRemaining.toLocaleString()}</span>
            <span className="text-sm text-zinc-400">remaining</span>
          </div>
          <div className="w-full h-2 bg-zinc-100 rounded-full mb-2">
            <div
              className={`h-2 rounded-full transition-all ${st === "depleted" ? "bg-amber-400" : st === "suspended" ? "bg-red-400" : "bg-indigo-500"}`}
              style={{ width: `${creditPct}%` }}
            />
          </div>
          <p className="text-xs text-zinc-400">{creditPct}% of {company.credits.toLocaleString()} used</p>
          <button onClick={() => setModal("credits")} className="mt-4 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
            Issue more credits
          </button>
        </div>

        {/* Usage breakdown */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <p className="text-sm font-semibold text-zinc-900 mb-4">Usage breakdown</p>
          {company.used === 0 ? (
            <p className="text-sm text-zinc-400 pt-4">No usage yet.</p>
          ) : (
            <div className="flex flex-col gap-3.5">
              {breakdown.map((item) => {
                const pct = Math.round((item.credits / company.used) * 100);
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-zinc-600">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-400">{pct}%</span>
                        <span className="text-xs font-semibold text-zinc-900 tabular-nums w-10 text-right">{item.credits}</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-100 rounded-full">
                      <div className={`h-1.5 rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 mb-5">
        {/* Invoices */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
            <p className="text-sm font-semibold text-zinc-900">Invoice history</p>
            <button onClick={handleGenerateInvoice} className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors">+ Generate</button>
          </div>
          {invoices.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-zinc-400">No invoices yet.</div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {invoices.slice(0, 5).map((inv) => (
                <div key={inv.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-mono font-medium text-zinc-800">{inv.id}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{inv.date} · {inv.plan}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-zinc-900">{inv.amount}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${inv.status === "paid" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100">
            <p className="text-sm font-semibold text-zinc-900">Activity</p>
          </div>
          {activity.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-zinc-400">No activity yet.</div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {activity.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-start gap-3 px-5 py-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-700">{log.description}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{timeAgo(log.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Danger zone ── */}
      <div className="bg-white rounded-xl border border-red-100 p-6">
        <p className="text-sm font-semibold text-zinc-900 mb-0.5">Danger zone</p>
        <p className="text-xs text-zinc-400 mb-4">These actions affect the account immediately.</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-700">{company.status === "suspended" ? "Reactivate account" : "Suspend account"}</p>
            <p className="text-xs text-zinc-400 mt-0.5">
              {company.status === "suspended" ? "Restore access for this company." : "Block all access for this company."}
            </p>
          </div>
          <button
            onClick={handleToggleSuspend}
            className={`text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${
              company.status === "suspended"
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "border border-red-200 text-red-600 hover:bg-red-50"
            }`}
          >
            {company.status === "suspended" ? "Reactivate" : "Suspend account"}
          </button>
        </div>
      </div>
    </div>
  );
}
