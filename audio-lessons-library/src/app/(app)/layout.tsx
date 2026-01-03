import type { Metadata } from "next";
import Link from "next/link";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { PlayerProvider } from "@/components/player/PlayerProvider";
import { BottomPlayer } from "@/components/player/BottomPlayer";

export const metadata: Metadata = {
  title: "Audio Lessons",
  description: "Private audio lessons library",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <PlayerProvider>
        <div className="min-h-screen bg-neutral-50 text-neutral-900 pb-28">
          <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/80 backdrop-blur">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
              <Link href="/" className="font-semibold tracking-tight">
                Audio Lessons
              </Link>

              <div className="flex items-center gap-2">
                <Link
                  href="/admin"
                  className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm hover:bg-neutral-50"
                >
                  Admin
                </Link>
                <SignOutButton />
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>

          <BottomPlayer />
        </div>
      </PlayerProvider>
    </RequireAuth>
  );
}

