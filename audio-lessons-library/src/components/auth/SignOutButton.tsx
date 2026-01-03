"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

export function SignOutButton() {
  const router = useRouter();
  const { signOut } = useAuth();

  return (
    <button
      type="button"
      className="rounded-md border border-neutral-800 px-3 py-2 text-sm hover:bg-neutral-900"
      onClick={async () => {
        await signOut();
        router.replace("/login");
      }}
    >
      Sign out
    </button>
  );
}
