"use client";

const ALLOCATIONS = [
  { company: "Lumina Apparel",   plan: "Growth",  credits: 2000,  used: 580,  date: "Jan 12, 2026", amount: "$149.00" },
  { company: "Petal & Oak",      plan: "Starter", credits: 500,   used: 312,  date: "Feb 3, 2026",  amount: "$49.00"  },
  { company: "Dusk Goods Co.",   plan: "Growth",  credits: 2000,  used: 95,   date: "Mar 18, 2026", amount: "$149.00" },
  { company: "Reef Supply",      plan: "Starter", credits: 500,   used: 500,  date: "Nov 5, 2025",  amount: "$49.00"  },
  { company: "Forma Studio",     plan: "Scale",   credits: 10000, used: 3201, date: "Oct 22, 2025", amount: "$499.00" },
];

const TOTALS = {
  issued:    ALLOCATIONS.reduce((s, a) => s + a.credits, 0),
  consumed:  ALLOCATIONS.reduce((s, a) => s + a.used, 0),
  remaining: ALLOCATIONS.reduce((s, a) => s + (a.credits - a.used), 0),
};

export default function CreditsPage() {
  return (
    <div className="max-w-4xl mx-auto px-8 py-10">

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
          { label: "Total issued",    value: TOTALS.issued.toLocaleString()    },
          { label: "Total consumed",  value: TOTALS.consumed.toLocaleString()  },
          { label: "Total remaining", value: TOTALS.remaining.toLocaleString() },
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
              <th className="px-5 py-3 text-right text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody>
            {ALLOCATIONS.map((a, i) => (
              <tr key={a.company} className={`hover:bg-stone-50/60 transition-colors ${i < ALLOCATIONS.length - 1 ? "border-b border-stone-100" : ""}`}>
                <td className="px-5 py-3.5">
                  <p className="text-sm font-semibold text-gray-900">{a.company}</p>
                  <p className="text-[11px] text-stone-400 mt-0.5">{a.date}</p>
                </td>
                <td className="px-5 py-3.5 text-sm text-stone-500">{a.plan}</td>
                <td className="px-5 py-3.5 text-sm font-semibold text-gray-900 text-right tabular-nums">{a.credits.toLocaleString()}</td>
                <td className="px-5 py-3.5 text-sm text-stone-500 text-right tabular-nums">{a.used.toLocaleString()}</td>
                <td className="px-5 py-3.5 text-sm text-stone-500 text-right tabular-nums">{(a.credits - a.used).toLocaleString()}</td>
                <td className="px-5 py-3.5 text-sm font-semibold text-gray-900 text-right tabular-nums">{a.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
