"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/app/_lib/supabase";

const ADMIN_EMAIL = "admin@credly.com";

function Spinner() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function CallbackHandler() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function run() {
      const code = searchParams.get("code");

      if (!supabase) { router.replace("/"); return; }

      if (!code) {
        const { data: { session } } = await supabase.auth.getSession();
        router.replace(
          session?.user.email === ADMIN_EMAIL ? "/admin" : session ? "/dashboard" : "/"
        );
        return;
      }

      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error || !data.session) { router.replace("/"); return; }
      router.replace(data.session.user.email === ADMIN_EMAIL ? "/admin" : "/dashboard");
    }

    run();
  }, [router, searchParams]);

  return <Spinner />;
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<Spinner />}>
      <CallbackHandler />
    </Suspense>
  );
}
