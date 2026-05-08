"use client";

const USAGE_DATA = [
  { company: "Lumina Apparel", shipping: 320, returns: 160, inquiries: 100, total: 580  },
  { company: "Petal & Oak",    shipping: 140, returns: 92,  inquiries: 80,  total: 312  },
  { company: "Dusk Goods Co.", shipping: 50,  returns: 25,  inquiries: 20,  total: 95   },
  { company: "Reef Supply",    shipping: 280, returns: 140, inquiries: 80,  total: 500  },
  { company: "Forma Studio",   shipping: 1800,returns: 900, inquiries: 501, total: 3201 },
];

const PLATFORM_TOTAL = USAGE_DATA.reduce((s, r) => s + r.total, 0);

export default function AdminUsagePage() {
  return (
    <div className="max-w-4xl mx-auto px-8 py-10">

      <div className="mb-10">
        <span className="inline-block text-amber-700 font-semibold text-xs uppercase tracking-widest bg-amber-50 border border-amber-100 px-3 py-1 rounded-full mb-4">
          Usage Monitoring
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Platform usage</h1>
        <p className="text-stone-400 mt-2 text-sm">
          {PLATFORM_TOTAL.toLocaleString()} credits consumed across all companies.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-stone-100">
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Company</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold text-stone-400 uppercase tracking-wider">📦 Shipping</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold text-stone-400 uppercase tracking-wider">🔁 Returns</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold text-stone-400 uppercase tracking-wider">💬 Inquiries</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Total</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Share</th>
            </tr>
          </thead>
          <tbody>
            {USAGE_DATA.map((row, i) => {
              const sharePct = Math.round((row.total / PLATFORM_TOTAL) * 100);
              return (
                <tr key={row.company} className={`hover:bg-stone-50/60 transition-colors ${i < USAGE_DATA.length - 1 ? "border-b border-stone-100" : ""}`}>
                  <td className="px-5 py-3.5 text-sm font-semibold text-gray-900">{row.company}</td>
                  <td className="px-5 py-3.5 text-sm text-stone-500 text-right tabular-nums">{row.shipping.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-sm text-stone-500 text-right tabular-nums">{row.returns.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-sm text-stone-500 text-right tabular-nums">{row.inquiries.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-gray-900 text-right tabular-nums">{row.total.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1 bg-stone-100 rounded-full">
                        <div className="h-1 bg-indigo-400 rounded-full" style={{ width: `${sharePct}%` }} />
                      </div>
                      <span className="text-xs text-stone-400 tabular-nums w-7 text-right">{sharePct}%</span>
                    </div>
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
