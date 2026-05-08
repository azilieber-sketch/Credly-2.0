"use client";

export default function AdminReportsPage() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-10">

      <div className="mb-10">
        <span className="inline-block text-amber-700 font-semibold text-xs uppercase tracking-widest bg-amber-50 border border-amber-100 px-3 py-1 rounded-full mb-4">
          Reports
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Platform reports</h1>
        <p className="text-stone-400 mt-2 text-sm">Aggregate usage and performance across all client accounts.</p>
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-12 flex flex-col items-center text-center">
        <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400 mb-4">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-gray-900 mb-1">Admin reports coming soon</p>
        <p className="text-sm text-stone-400 max-w-xs leading-relaxed">
          Aggregate weekly and monthly reports across all companies will appear here.
        </p>
      </div>

    </div>
  );
}
