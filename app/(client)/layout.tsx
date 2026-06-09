"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
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

function NoAccessScreen({
  email,
  onLogout,
}: {
  email: string | null;
  onLogout: () => void;
}) {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 max-w-md w-full p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-500 flex items-center justify-center mx-auto mb-5">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">No portal access for this account</h1>
        <p className="text-sm text-stone-500 leading-relaxed mb-1">
          {email && (
            <>
              <span className="font-medium text-gray-900">{email}</span>{" "}
            </>
          )}
          isn&apos;t linked to a client account yet.
        </p>
        <p className="text-sm text-stone-500 leading-relaxed mb-7">
          Accounts are set up by our team. If you&apos;re expecting access, reach out
          to your account manager — or use &ldquo;Talk to us&rdquo; on our homepage.
        </p>
        <button
          onClick={onLogout}
          className="w-full text-stone-500 font-medium rounded-2xl px-4 py-3 text-sm hover:bg-stone-50 transition-colors border border-stone-200"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [email,   setEmail]   = useState<string | null>(null);
  const [ready,   setReady]   = useState(false);
  const [gate,    setGate]    = useState<"loading" | "noaccess" | "ok">("loading");
  const [navOpen, setNavOpen] = useState(false);

  // Resolve the signed-in user's company. Accounts are admin-provisioned now —
  // there is no self-signup — so if no company row matches this email, the user
  // simply has no portal access. We never create a row here.
  const loadCompany = useCallback(async (userEmail: string) => {
    if (!supabase) return;
    setGate("loading");
    const { data } = await supabase
      .from("companies")
      .select("id")
      .eq("email", userEmail)
      .maybeSingle();
    setGate(data ? "ok" : "noaccess");
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

  if (gate === "noaccess") {
    return <NoAccessScreen email={email} onLogout={logout} />;
  }

  return (
    <div className="flex h-screen bg-stone-50 overflow-hidden">
      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-sm border-b border-stone-200/60 z-30 flex items-center justify-between px-4 flex-shrink-0">
        <Image src="/logo.png" alt="TicketFlow" width={1086} height={383} className="h-6 w-auto" priority />
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
