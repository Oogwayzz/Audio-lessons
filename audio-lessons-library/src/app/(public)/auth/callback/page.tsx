"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const code = params.get("code");
  const nextPath = params.get("next") || "/";

  const [msg, setMsg] = useState("Signing you in...");

  useEffect(() => {
    async function run() {
      if (!isSupabaseConfigured) {
        setMsg("Supabase is not configured.");
        return;
      }

      const supabase = getSupabaseClient();

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setMsg(`Sign-in failed: ${error.message}`);
          return;
        }
      }

      router.replace(nextPath);
    }

    run();
  }, [code, nextPath, router]);

  return (
    <div className="mx-auto max-w-lg rounded-xl border border-neutral-800 bg-neutral-950 p-6">
      <p className="text-sm text-neutral-300">{msg}</p>
    </div>
  );
}
