import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg rounded-xl border border-neutral-800 bg-neutral-950 p-6">
          <p className="text-sm text-neutral-300">Loading...</p>
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
