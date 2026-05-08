"use client";

const COMPANIES = [
  { name: "Lumina Apparel",   email: "admin@lumina.co",       plan: "Growth",  credits: 2000, used: 580,  status: "active",   joined: "Jan 12, 2026" },
  { name: "Petal & Oak",      email: "hello@petalandoak.com", plan: "Starter", credits: 500,  used: 312,  status: "active",   joined: "Feb 3, 2026"  },
  { name: "Dusk Goods Co.",   email: "ops@duskgoods.com",     plan: "Growth",  credits: 2000, used: 95,   status: "active",   joined: "Mar 18, 2026" },
  { name: "Reef Supply",      email: "team@reefsupply.io",    plan: "Starter", credits: 500,  used: 500,  status: "depleted", joined: "Nov 5, 2025"  },
  { name: "Forma Studio",     email: "info@formastudio.co",   plan: "Scale",   credits: 10000,used: 3201, status: "active",   joined: "Oct 22, 2025" },
];

export default function CompaniesPage() {
  return (
    <div className="max-w-4xl mx-auto px-8 py-10">

      <div className="flex items-start justify-between mb-10">
        <div>
          <span className="inline-block text-amber-700 font-semibold text-xs uppercase tracking-widest bg-amber-50 border border-amber-100 px-3 py-1 rounded-full mb-4">
            Companies
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Client accounts</h1>
          <p className="text-stone-400 mt-2 text-sm">{COMPANIES.length} companies on the platform.</p>
        </div>
        <button className="mt-1 text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-violet-700 active:scale-[0.97] transition-all shadow-sm shadow-indigo-200/60 flex-shrink-0">
          Add company
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
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
            {COMPANIES.map((co, i) => {
              const pct = Math.round((co.used / co.credits) * 100);
              const isDepleted = co.status === "depleted";
              return (
                <tr key={co.name} className={`hover:bg-stone-50/60 transition-colors ${i < COMPANIES.length - 1 ? "border-b border-stone-100" : ""}`}>
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
                        <div
                          className={`h-1 rounded-full ${isDepleted ? "bg-red-400" : "bg-indigo-400"}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
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
      </div>

    </div>
  );
}
