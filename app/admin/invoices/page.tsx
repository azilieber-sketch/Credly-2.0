"use client";

type InvoiceStatus = "paid" | "pending";

interface AdminInvoice {
  id: string;
  company: string;
  date: string;
  plan: string;
  credits: number;
  amount: string;
  status: InvoiceStatus;
}

const INVOICES: AdminInvoice[] = [
  { id: "INV-0024", company: "Lumina Apparel",  date: "May 1, 2026",  plan: "Growth",  credits: 2000,  amount: "$149.00", status: "paid"    },
  { id: "INV-0023", company: "Petal & Oak",     date: "May 1, 2026",  plan: "Starter", credits: 500,   amount: "$49.00",  status: "pending" },
  { id: "INV-0022", company: "Dusk Goods Co.",  date: "Apr 1, 2026",  plan: "Growth",  credits: 2000,  amount: "$149.00", status: "paid"    },
  { id: "INV-0021", company: "Forma Studio",    date: "Apr 1, 2026",  plan: "Scale",   credits: 10000, amount: "$499.00", status: "paid"    },
  { id: "INV-0020", company: "Reef Supply",     date: "Mar 1, 2026",  plan: "Starter", credits: 500,   amount: "$49.00",  status: "paid"    },
];

const STATUS_CONFIG: Record<InvoiceStatus, { dot: string; text: string }> = {
  paid:    { dot: "bg-emerald-500", text: "text-emerald-600" },
  pending: { dot: "bg-amber-400",   text: "text-amber-600"   },
};

const totalRevenue = INVOICES
  .filter((i) => i.status === "paid")
  .reduce((s, i) => s + parseFloat(i.amount.replace("$", "")), 0);

export default function AdminInvoicesPage() {
  return (
    <div className="max-w-4xl mx-auto px-8 py-10">

      <div className="flex items-start justify-between mb-10">
        <div>
          <span className="inline-block text-amber-700 font-semibold text-xs uppercase tracking-widest bg-amber-50 border border-amber-100 px-3 py-1 rounded-full mb-4">
            Invoices
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">All invoices</h1>
          <p className="text-stone-400 mt-2 text-sm">
            ${totalRevenue.toFixed(2)} collected · {INVOICES.filter(i => i.status === "paid").length} paid invoices
          </p>
        </div>
        <button className="mt-1 text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-violet-700 active:scale-[0.97] transition-all shadow-sm shadow-indigo-200/60">
          Issue invoice
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-stone-100">
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Invoice</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Company</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Plan</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Credits</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Amount</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {INVOICES.map((inv, i) => {
              const st = STATUS_CONFIG[inv.status];
              return (
                <tr key={inv.id} className={`hover:bg-stone-50/60 transition-colors ${i < INVOICES.length - 1 ? "border-b border-stone-100" : ""}`}>
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-mono font-medium text-gray-900">{inv.id}</span>
                    <p className="text-[11px] text-stone-400 mt-0.5">{inv.date}</p>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-gray-900">{inv.company}</td>
                  <td className="px-5 py-3.5 text-sm text-stone-500">{inv.plan}</td>
                  <td className="px-5 py-3.5 text-sm text-stone-500 text-right tabular-nums">{inv.credits.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-gray-900 text-right tabular-nums">{inv.amount}</td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold capitalize ${st.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${st.dot}`} />
                      {inv.status}
                    </span>
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
