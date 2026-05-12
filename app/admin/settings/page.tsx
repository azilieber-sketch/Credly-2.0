"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function Row({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-zinc-50 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-800">{label}</p>
        {sub && <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{sub}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative w-9 h-5 rounded-full transition-colors ${on ? "bg-indigo-500" : "bg-zinc-200"}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${on ? "translate-x-[18px]" : "translate-x-0.5"}`} />
    </button>
  );
}

export default function AdminSettingsPage() {
  const router = useRouter();

  const [saved, setSaved]                         = useState(false);
  const [platformName, setPlatformName]           = useState("Credly");
  const [supportEmail, setSupportEmail]           = useState("support@credly.io");
  const [notifyNewCompany, setNotifyNewCompany]   = useState(true);
  const [notifyLowCredits, setNotifyLowCredits]   = useState(true);
  const [notifyInvoice, setNotifyInvoice]         = useState(false);
  const [maintenanceMode, setMaintenanceMode]     = useState(false);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const handleLogout = () => { localStorage.clear(); router.replace("/"); };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6 md:px-8 md:py-8">

      {showConfirmLogout && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={() => setShowConfirmLogout(false)}>
          <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 sm:p-7" onClick={(e) => e.stopPropagation()}>
            <div className="sm:hidden w-10 h-1 bg-zinc-200 rounded-full mx-auto mb-5" />
            <h2 className="text-base font-bold text-zinc-900 mb-1">Sign out of admin?</h2>
            <p className="text-sm text-zinc-500 mb-6">You'll be redirected to the login page.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmLogout(false)} className="flex-1 text-sm font-semibold text-zinc-600 border border-zinc-200 rounded-xl px-4 py-2.5 hover:bg-zinc-50 transition-colors">Cancel</button>
              <button onClick={handleLogout} className="flex-1 text-sm font-semibold text-white bg-zinc-900 rounded-xl px-4 py-2.5 hover:bg-zinc-800 transition-colors">Sign out</button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 md:mb-8">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">Admin</p>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">Settings</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Platform configuration and admin preferences.</p>
      </div>

      {/* Platform */}
      <div className="bg-white rounded-xl border border-zinc-200 mb-5 overflow-hidden">
        <div className="px-5 sm:px-6 py-5 border-b border-zinc-100">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Platform</p>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-500 block mb-1.5">Platform name</label>
              <input
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="w-full text-sm text-zinc-900 border border-zinc-200 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 block mb-1.5">Support email</label>
              <input
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full text-sm text-zinc-900 border border-zinc-200 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
              />
            </div>
          </div>
          <div className="mt-5">
            <button
              onClick={handleSave}
              className={`text-sm font-semibold px-4 py-2 rounded-lg transition-all ${
                saved ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-zinc-900 text-white hover:bg-zinc-800"
              }`}
            >
              {saved ? "Saved" : "Save changes"}
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl border border-zinc-200 mb-5 overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-zinc-100">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Notifications</p>
        </div>
        <div className="px-5 sm:px-6 pb-2">
          <Row label="New company signup" sub="Alert when a company creates an account">
            <Toggle on={notifyNewCompany} onChange={setNotifyNewCompany} />
          </Row>
          <Row label="Low credit warning" sub="Alert when a company drops below 10% credits">
            <Toggle on={notifyLowCredits} onChange={setNotifyLowCredits} />
          </Row>
          <Row label="Invoice events" sub="Alert on new invoices and overdue payments">
            <Toggle on={notifyInvoice} onChange={setNotifyInvoice} />
          </Row>
        </div>
      </div>

      {/* System */}
      <div className="bg-white rounded-xl border border-zinc-200 mb-5 overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-zinc-100">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">System</p>
        </div>
        <div className="px-5 sm:px-6 pb-2">
          <Row label="Maintenance mode" sub="Blocks client logins and shows a maintenance banner">
            <Toggle on={maintenanceMode} onChange={setMaintenanceMode} />
          </Row>
          <Row label="Admin version" sub="Platform build">
            <span className="text-xs font-mono text-zinc-400 bg-zinc-50 border border-zinc-100 px-2 py-1 rounded">v2.0.0</span>
          </Row>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-xl border border-red-100 overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-red-50">
          <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">Danger zone</p>
        </div>
        <div className="px-5 sm:px-6 pb-4">
          <Row label="Sign out" sub="End your current admin session">
            <button
              onClick={() => setShowConfirmLogout(true)}
              className="text-xs font-semibold text-red-600 border border-red-200 bg-red-50 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors"
            >
              Sign out
            </button>
          </Row>
          <Row label="Reset platform data" sub="Wipe all localStorage — cannot be undone">
            <button
              onClick={() => {
                if (confirm("Reset ALL platform data? This cannot be undone.")) {
                  localStorage.clear();
                  router.replace("/");
                }
              }}
              className="text-xs font-semibold text-red-600 border border-red-200 bg-red-50 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors"
            >
              Reset
            </button>
          </Row>
        </div>
      </div>
    </div>
  );
}
