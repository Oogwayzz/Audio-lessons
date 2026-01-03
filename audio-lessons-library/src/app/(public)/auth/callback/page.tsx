import { Suspense } from "react";
import AuthCallbackClient from "./AuthCallbackClient";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg rounded-xl border border-neutral-800 bg-neutral-950 p-6">
          <p className="text-sm text-neutral-300">Signing you in...</p>
        </div>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}
