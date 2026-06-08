"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar, { NavItem } from "@/app/_components/Sidebar";
import { supabase } from "@/app/_lib/supabase";

const NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: "/usage",
    label: "Usage",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
  },
  {
    href: "/reports",
    label: "Reports",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
      </svg>
    ),
  },
  {
    href: "/invoices",
    label: "Invoices",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    ),
  },
  {
    href: "/dashboard/tickets",
    label: "Tickets",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

function PendingScreen({
  email,
  onLogout,
  onRefresh,
}: {
  email: string | null;
  onLogout: () => void;
  onRefresh: () => void;
}) {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 max-w-md w-full p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-5">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Your account is pending approval</h1>
        <p className="text-sm text-stone-500 leading-relaxed mb-1">
          Thanks for signing up
          {email && (
            <>
              {", "}
              <span className="font-medium text-gray-900">{email}</span>
            </>
          )}
          .
        </p>
        <p className="text-sm text-stone-500 leading-relaxed mb-7">
          Our team is reviewing your account. You&apos;ll get access to your dashboard
          as soon as it&apos;s approved.
        </p>
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onRefresh}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-2xl px-4 py-3 text-sm hover:from-indigo-700 hover:to-violet-700 active:scale-[0.98] transition-all"
          >
            Check again
          </button>
          <button
            onClick={onLogout}
            className="w-full text-stone-500 font-medium rounded-2xl px-4 py-3 text-sm hover:bg-stone-50 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [email,   setEmail]   = useState<string | null>(null);
  const [ready,   setReady]   = useState(false);
  const [gate,    setGate]    = useState<"loading" | "pending" | "ok">("loading");
  const [navOpen, setNavOpen] = useState(false);

  // Resolve the signed-in user's company and decide whether they see the portal.
  // A brand-new signup has no company yet (or a 'pending' one) → they wait for
  // admin approval. Creates the pending row if it's missing so every signup
  // shows up in the admin list (covers OAuth / email-confirmation signups too).
  const loadCompany = useCallback(async (userEmail: string) => {
    if (!supabase) return;
    setGate("loading");
    const { data } = await supabase
      .from("companies")
      .select("status")
      .eq("email", userEmail)
      .maybeSingle();
    if (!data) {
      await supabase.from("companies").insert({
        name: userEmail.split("@")[0],
        email: userEmail,
        status: "pending",
      });
      setGate("pending");
      return;
    }
    setGate(data.status === "pending" ? "pending" : "ok");
  }, []);

  useEffect(() => {
    if (!supabase) { router.replace("/"); return; }

    let settled = false;

    const resolve = (email: string | null | undefined) => {
      if (settled) return;
      settled = true;
      if (!email) { router.replace("/"); return; }
      if (email === "admin@credly.com") { router.replace("/admin"); return; }
      setEmail(email);
      setReady(true);
      loadCompany(email);
    };

    supabase.auth.getSession()
      .then(({ data: { session } }) => resolve(session?.user.email))
      .catch(() => { if (!settled) { settled = true; router.replace("/"); } });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") { router.replace("/"); return; }
      if (!settled && (event === "INITIAL_SESSION" || event === "SIGNED_IN")) {
        resolve(session?.user.email);
      }
    });

    return () => subscription.unsubscribe();
  }, [router, loadCompany]);

  useEffect(() => { setNavOpen(false); }, [pathname]);

  const logout = async () => {
    await supabase!.auth.signOut();
    router.push("/");
  };

  if (!ready || gate === "loading") {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (gate === "pending") {
    return (
      <PendingScreen
        email={email}
        onLogout={logout}
        onRefresh={() => { if (email) loadCompany(email); }}
      />
    );
  }

  return (
    <div className="flex h-screen bg-stone-50 overflow-hidden">
      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-sm border-b border-stone-200/60 z-30 flex items-center justify-between px-4 flex-shrink-0">
        <span className="text-lg font-bold text-gray-900">Credly</span>
        <button
          onClick={() => setNavOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100 transition-colors"
          aria-label="Open navigation"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12h18M3 6h18M3 18h12" />
          </svg>
        </button>
      </header>

      <Sidebar
        navItems={NAV}
        email={email}
        onLogout={logout}
        isOpen={navOpen}
        onClose={() => setNavOpen(false)}
      />

      <main className="flex-1 overflow-y-auto pt-14 md:pt-0 min-w-0">
        {children}
      </main>
    </div>
  );
}
