"use client";

export default function AdminSettingsPage() {
  return (
    <div className="max-w-2xl mx-auto px-8 py-10">

      <div className="mb-10">
        <span className="inline-block text-amber-700 font-semibold text-xs uppercase tracking-widest bg-amber-50 border border-amber-100 px-3 py-1 rounded-full mb-4">
          Settings
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Platform settings</h1>
        <p className="text-stone-400 mt-2 text-sm">Configure global platform defaults and admin preferences.</p>
      </div>

      {/* ── Credit defaults ── */}
      <section className="mb-8">
        <div className="mb-5">
          <h2 className="text-base font-bold text-gray-900">Default credit plans</h2>
          <p className="text-sm text-stone-400 mt-0.5">Credit packages available to client accounts.</p>
        </div>
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          {[
            { name: "Starter", credits: 500,   price: "$49.00",  rollover: "7 days"  },
            { name: "Growth",  credits: 2000,  price: "$149.00", rollover: "30 days" },
            { name: "Scale",   credits: 10000, price: "$499.00", rollover: "90 days" },
          ].map((plan, i, arr) => (
            <div key={plan.name} className={`flex items-center justify-between px-5 py-4 ${i < arr.length - 1 ? "border-b border-stone-100" : ""}`}>
              <div>
                <p className="text-sm font-semibold text-gray-900">{plan.name}</p>
                <p className="text-xs text-stone-400 mt-0.5">{plan.credits.toLocaleString()} credits · {plan.rollover} rollover</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-900">{plan.price}</span>
                <button className="text-xs font-medium text-stone-400 hover:text-stone-700 border border-stone-200 px-2.5 py-1 rounded-lg transition-colors">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Admin access ── */}
      <section>
        <div className="mb-5">
          <h2 className="text-base font-bold text-gray-900">Admin access</h2>
          <p className="text-sm text-stone-400 mt-0.5">Manage who can access the admin panel.</p>
        </div>
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-12 flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400 mb-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-900 mb-1">Team access management coming soon</p>
          <p className="text-sm text-stone-400 max-w-xs leading-relaxed">
            Invite team members and assign admin roles here.
          </p>
        </div>
      </section>

    </div>
  );
}
