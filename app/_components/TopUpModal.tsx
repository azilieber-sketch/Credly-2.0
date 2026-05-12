"use client";

import { PLANS, Plan, getClient, saveClient, nextInvoiceId, formatDate, formatPeriod } from "@/app/_lib/store";

interface TopUpModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function TopUpModal({ onClose, onSuccess }: TopUpModalProps) {
  const handleSelect = (plan: Plan) => {
    const client = getClient();
    const now = new Date();
    const newInvoice = {
      id: nextInvoiceId(client.invoices),
      date: formatDate(now),
      period: formatPeriod(now),
      plan: plan.name,
      credits: plan.credits,
      amount: plan.priceStr,
      status: "paid" as const,
    };
    saveClient({
      ...client,
      creditsTotal: client.creditsTotal + plan.credits,
      plan: plan.name,
      invoices: [newInvoice, ...client.invoices],
    });
    onSuccess();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Top up credits</h2>
            <p className="text-sm text-stone-400 mt-0.5">Choose a pack to add to your balance instantly.</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors text-xl"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {PLANS.map((plan) => (
            <button
              key={plan.name}
              onClick={() => handleSelect(plan)}
              className="flex items-center justify-between p-4 rounded-2xl border border-stone-200 hover:border-indigo-300 hover:bg-indigo-50/40 active:scale-[0.99] transition-all text-left"
            >
              <div>
                <p className="text-sm font-bold text-gray-900">{plan.name}</p>
                <p className="text-xs text-stone-400 mt-0.5">
                  {plan.credits.toLocaleString()} credits · {plan.rollover} rollover
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-gray-900">{plan.priceStr}</p>
                <p className="text-[10px] text-stone-400">one-time</p>
              </div>
            </button>
          ))}
        </div>

        <p className="text-xs text-stone-400 text-center mt-5">
          Credits are added to your balance immediately.
        </p>
      </div>
    </div>
  );
}
