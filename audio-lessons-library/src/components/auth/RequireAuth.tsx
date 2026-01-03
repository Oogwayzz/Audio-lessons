"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const { isReady, user } = useAuth();

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    if (!isReady) return;
    if (!user) {
      const next = encodeURIComponent(path || "/");
      router.replace(`/login?next=${next}`);
    }
  }, [isReady, user, router, path]);

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <h1 className="text-xl font-semibold">Supabase not configured</h1>
        <p className="mt-2 text-sm text-neutral-300">
          Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart.
        </p>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <p className="text-sm text-neutral-300">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
