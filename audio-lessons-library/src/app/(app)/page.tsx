"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import type { Lesson, UserProgress } from "@/lib/types";
import { ModuleCard } from "@/components/modules/ModuleCard";
import { LessonCard } from "@/components/lessons/LessonCard";

type ContinueItem = { lesson: Lesson; resumeAt: number };

export default function HomePage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Record<string, UserProgress>>({});
  const [continueItem, setContinueItem] = useState<ContinueItem | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        if (!isSupabaseConfigured) {
          setError("Supabase is not configured.");
          setLoading(false);
          return;
        }

        const supabase = getSupabaseClient();

        const { data: lessonsData, error: lessonsError } = await supabase
          .from("lessons")
          .select("*")
          .order("module", { ascending: true })
          .order("week", { ascending: true })
          .order("created_at", { ascending: true });

        if (lessonsError) throw lessonsError;

        const lessonsArr = (lessonsData || []) as Lesson[];
        setLessons(lessonsArr);

        const { data: progData } = await supabase
          .from("user_progress")
          .select("*")
          .order("updated_at", { ascending: false });

        const progArr = (progData || []) as UserProgress[];
        const map: Record<string, UserProgress> = {};
        for (const p of progArr) map[p.lesson_id] = p;
        setProgress(map);

        const recent = progArr.find((p) => !p.completed) || progArr[0];
        if (recent) {
          const l = lessonsArr.find((x) => x.id === recent.lesson_id);
          if (l) setContinueItem({ lesson: l, resumeAt: recent.position_seconds || 0 });
        }

        setLoading(false);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load";
        setError(message);
        setLoading(false);
      }
    }

    load();
  }, []);

  const filteredLessons = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lessons;
    return lessons.filter((l) => {
      const inTitle = l.title.toLowerCase().includes(q);
      const inTags = (l.tags || []).join(" ").toLowerCase().includes(q);
      const inModule = l.module.toLowerCase().includes(q);
      return inTitle || inTags || inModule;
    });
  }, [lessons, query]);

  const modules = useMemo(() => {
    const by: Record<string, { module: string; moduleSlug: string; weeks: Set<number>; lessons: number }> = {};
    for (const l of filteredLessons) {
      const key = l.module_slug;
      if (!by[key]) by[key] = { module: l.module, moduleSlug: l.module_slug, weeks: new Set(), lessons: 0 };
      by[key].weeks.add(l.week);
      by[key].lessons += 1;
    }
    return Object.values(by).sort((a, b) => a.module.localeCompare(b.module));
  }, [filteredLessons]);

  if (loading) {
    return <p className="text-sm text-neutral-300">Loading...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>;
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold">Library</h1>
        <p className="mt-2 text-sm text-neutral-300">
          Search lessons, open a module, or hit play and carry on where you left off.
        </p>

        <div className="mt-4">
          <input
            className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-600"
            placeholder="Search by title, module, or tag"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </section>

      {continueItem ? (
        <section>
          <h2 className="text-lg font-semibold">Continue listening</h2>
          <div className="mt-3">
            <LessonCard lesson={continueItem.lesson} resumeAt={continueItem.resumeAt} />
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="text-lg font-semibold">Modules</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {modules.map((m) => (
            <ModuleCard
              key={m.moduleSlug}
              module={m.module}
              moduleSlug={m.moduleSlug}
              weeks={m.weeks.size}
              lessons={m.lessons}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">All lessons</h2>
        <div className="mt-3 space-y-3">
          {filteredLessons.map((l) => (
            <LessonCard key={l.id} lesson={l} resumeAt={progress[l.id]?.position_seconds || 0} />
          ))}
        </div>
      </section>
    </div>
  );
}
