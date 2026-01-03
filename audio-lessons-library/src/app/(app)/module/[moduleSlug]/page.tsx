"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import type { LessonWithProgress } from "@/lib/types";
import { LessonCard } from "@/components/lessons/LessonCard";

type Module = {
  name: string;
  slug: string;
};

export default function ModulePage() {
  const params = useParams<{ moduleSlug: string }>();
  const moduleSlug = params.moduleSlug;

  const [module, setModule] = useState<Module | null>(null);
  const [lessons, setLessons] = useState<LessonWithProgress[]>([]);
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

        const { data: moduleData, error: moduleError } = await supabase
          .from("modules")
          .select("name,slug")
          .eq("slug", moduleSlug)
          .maybeSingle();
        if (moduleError) throw moduleError;
        if (!moduleData) {
          setError("Module not found.");
          setLoading(false);
          return;
        }

        const { data: lessonsData, error: lessonsError } = await supabase
          .from("lessons")
          .select("id,title,module,module_slug,week as week_number,tags,duration_seconds,created_at")
          .eq("module_slug", moduleSlug)
          .order("week", { ascending: true })
          .order("title", { ascending: true });
        if (lessonsError) throw lessonsError;

        setModule(moduleData as Module);
        setLessons((lessonsData ?? []) as LessonWithProgress[]);
        setLoading(false);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load";
        setError(message);
        setLoading(false);
      }
    }

    load();
  }, [moduleSlug]);

  const lessonsByWeek = useMemo(() => {
    const grouped = new Map<number, LessonWithProgress[]>();
    lessons.forEach((lesson) => {
      const weekNumber = lesson.week_number ?? (lesson as { week?: number }).week;
      if (weekNumber === undefined || weekNumber === null) return;
      const current = grouped.get(weekNumber) ?? [];
      current.push(lesson);
      grouped.set(weekNumber, current);
    });
    return grouped;
  }, [lessons]);

  const sortedWeekNumbers = useMemo(
    () => Array.from(lessonsByWeek.keys()).sort((a, b) => a - b),
    [lessonsByWeek],
  );

  if (loading) return <p className="text-sm text-neutral-300">Loading...</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <p className="text-sm text-neutral-500">Module</p>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
          {module?.name ?? moduleSlug}
        </h1>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Weeks</h2>
          <p className="text-sm text-neutral-600">
            {sortedWeekNumbers.length} week{sortedWeekNumbers.length === 1 ? "" : "s"}
          </p>
        </div>

        {sortedWeekNumbers.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sortedWeekNumbers.map((weekNumber) => {
              const weekLessons = lessonsByWeek.get(weekNumber) ?? [];
              return (
                <Link
                  key={weekNumber}
                  href={`/module/${moduleSlug}/week/${weekNumber}`}
                  className="block rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="text-sm text-neutral-500">Week</div>
                  <div className="mt-1 text-xl font-semibold text-neutral-900">Week {weekNumber}</div>
                  <div className="mt-2 text-sm text-neutral-600">
                    {weekLessons.length} lesson{weekLessons.length === 1 ? "" : "s"}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : null}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Lessons</h2>
          <p className="text-sm text-neutral-600">
            {lessons.length} lesson{lessons.length === 1 ? "" : "s"}
          </p>
        </div>

        {lessons.length ? (
          <div className="grid gap-3">
            {lessons.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
            <div>No lessons found for this module.</div>
            <Link
              href="/admin"
              className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-900 shadow-sm hover:bg-neutral-50"
            >
              Go to admin
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
