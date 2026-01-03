"use client";

import React, { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isSupabaseConfigured, getSupabaseClient } from "@/lib/supabaseClient";

export default function LoginClient() {
  const router = useRouter();
  const params = useSearchParams();
  const nextPath = params.get("next") || "/";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const redirectTo = useMemo(() => {
    if (typeof window === "undefined") return "";
    const origin = window.location.origin;
    // After clicking the magic link, Supabase redirects here.
    // The callback page exchanges the code for a session.
    return `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
  }, [nextPath]);

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-neutral-800 bg-neutral-950 p-6">
        <h1 className="text-lg font-semibold">Supabase not configured</h1>
        <p className="mt-2 text-sm text-neutral-300">
          Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart.
        </p>
      </div>
    );
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      setStatus("error");
      setError(error.message);
      return;
    }

    setStatus("sent");
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="mt-2 text-sm text-neutral-300">
        Enter your email. You will get a magic link. Open it on this device to sign in.
      </p>

      <form onSubmit={sendMagicLink} className="mt-6 rounded-xl border border-neutral-800 bg-neutral-950 p-6">
        <label className="block text-sm text-neutral-300">Email</label>
        <input
          className="mt-2 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-600"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="you@example.com"
          required
        />

        <button
          type="submit"
          className="mt-4 w-full rounded-md border border-neutral-800 px-3 py-2 text-sm hover:bg-neutral-900 disabled:opacity-60"
          disabled={status === "sending"}
        >
          {status === "sending" ? "Sending..." : "Send magic link"}
        </button>

        {status === "sent" ? (
          <p className="mt-3 text-sm text-neutral-300">
            Sent. Check your inbox. If you do not see it, check spam. Keep this page open.
          </p>
        ) : null}

        {status === "error" && error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
      </form>

      <button
        type="button"
        className="mt-4 text-sm text-neutral-300 hover:text-neutral-100"
        onClick={() => router.push("/")}
      >
        Go back
      </button>
    </div>
  );
}
