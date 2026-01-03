"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { ModuleSummary, LessonWithProgress } from "@/lib/types";
import { ModuleCard } from "@/components/modules/ModuleCard";
import { LessonCard } from "@/components/lessons/LessonCard";

export default function HomePage() {
  const [modules, setModules] = useState<ModuleSummary[]>([]);
  const [lessons, setLessons] = useState<LessonWithProgress[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const {
          data: { user },
          error: userErr,
        } = await supabase.auth.getUser();
        if (userErr) throw userErr;
        if (!user) throw new Error("Not signed in");

        const { data: modData, error: modErr } = await supabase
          .from("modules")
          .select("id,name,slug,weeks_count,lessons_count")
          .order("name", { ascending: true });
        if (modErr) throw modErr;

        const { data: lessonData, error: lessonErr } = await supabase
          .from("lessons_with_progress")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (lessonErr) throw lessonErr;

        if (!ignore) {
          setModules((modData as ModuleSummary[]) ?? []);
          setLessons((lessonData as LessonWithProgress[]) ?? []);
        }
      } catch (e: any) {
        if (!ignore) setError(e?.message ?? "Failed to load");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const filteredLessons = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return lessons.filter((l) => {
      const hay = `${l.title} ${l.module_name ?? ""} week ${l.week_number ?? ""} ${(l.tags ?? []).join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query, lessons]);

  if (loading) return <p className="text-sm text-neutral-600">Loading...</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Your library</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Search by title, module, week, or tags. Keep it private, keep it simple.
            </p>
          </div>

          <div className="w-full md:max-w-sm">
            <label className="sr-only" htmlFor="search">
              Search lessons
            </label>
            <input
              id="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search lessons..."
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200"
            />
          </div>
        </div>

        {query.trim() ? (
          <div className="mt-5 space-y-3">
            <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Results ({filteredLessons.length})
            </div>
            {filteredLessons.length === 0 ? (
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                No matches. Try a shorter search.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {filteredLessons.map((lesson) => (
                  <LessonCard key={lesson.id} lesson={lesson} />
                ))}
              </div>
            )}
          </div>
        ) : null}
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Modules</h2>
          <p className="text-sm text-neutral-600">{modules.length} total</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => (
            <ModuleCard
              key={m.id}
              module={m.name}
              moduleSlug={m.slug}
              weeks={m.weeks_count}
              lessons={m.lessons_count}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
