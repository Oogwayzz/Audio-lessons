"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabaseClient";

type Module = {
  id: string;
  name: string;
  slug: string;
};

type Lesson = {
  id: string;
  title: string;
  week_number: number | null;
  module_slug: string;
};

type ModuleClientProps = {
  moduleSlug: string;
};

export default function ModuleClient({ moduleSlug }: ModuleClientProps) {
  const [module, setModule] = useState<Module | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadModuleAndLessons() {
      if (!isSupabaseConfigured) {
        setError(`Supabase is not configured while loading module "${moduleSlug}".`);
        setLoading(false);
        return;
      }

      try {
        const supabase = getSupabaseClient();

        const { data: moduleData, error: moduleError } = await supabase
          .from("modules")
          .select("id,name,slug")
          .eq("slug", moduleSlug)
          .maybeSingle();

        if (moduleError) {
          setError(`Error loading module "${moduleSlug}": ${moduleError.message}`);
          setLoading(false);
          return;
        }

        if (!moduleData) {
          setError(`No module found for slug "${moduleSlug}".`);
          setLoading(false);
          return;
        }

        const { data: lessonsData, error: lessonsError } = await supabase
          .from("lessons")
          .select("id,title,week_number:week,module_slug")
          .eq("module_slug", moduleSlug)
          .order("week", { ascending: true })
          .order("title", { ascending: true });

        if (lessonsError) {
          setError(`Error loading lessons for "${moduleSlug}": ${lessonsError.message}`);
          setLoading(false);
          return;
        }

        setModule(moduleData as Module);
        setLessons((lessonsData ?? []) as Lesson[]);
        setLoading(false);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(`Unexpected error for module "${moduleSlug}": ${message}`);
        setLoading(false);
      }
    }

    loadModuleAndLessons();
  }, [moduleSlug]);

  const lessonsByWeek = useMemo(() => {
    const grouped = new Map<number, Lesson[]>();
    lessons.forEach((lesson) => {
      if (lesson.week_number === null || lesson.week_number === undefined) return;
      const current = grouped.get(lesson.week_number) ?? [];
      current.push(lesson);
      grouped.set(lesson.week_number, current);
    });
    return grouped;
  }, [lessons]);

  const weekNumbers = useMemo(
    () => Array.from(lessonsByWeek.keys()).sort((a, b) => a - b),
    [lessonsByWeek],
  );

  if (loading) {
    return <p className="text-sm text-neutral-500">Loading module...</p>;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        {error}
      </div>
    );
  }

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
            {weekNumbers.length} week{weekNumbers.length === 1 ? "" : "s"}
          </p>
        </div>

        {weekNumbers.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {weekNumbers.map((weekNumber) => (
              <Link
                key={weekNumber}
                href={`/module/${moduleSlug}/week/${weekNumber}`}
                className="block rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="text-sm text-neutral-500">Week</div>
                <div className="mt-1 text-xl font-semibold text-neutral-900">Week {weekNumber}</div>
                <div className="mt-2 text-sm text-neutral-600">
                  {(lessonsByWeek.get(weekNumber) ?? []).length} lesson
                  {(lessonsByWeek.get(weekNumber) ?? []).length === 1 ? "" : "s"}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-600">No weeks found for this module.</p>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Lessons</h2>
          <p className="text-sm text-neutral-600">
            {lessons.length} lesson{lessons.length === 1 ? "" : "s"}
          </p>
        </div>

        {lessons.length ? (
          <div className="space-y-2">
            {lessons.map((lesson) => (
              <Link
                key={lesson.id}
                href={`/lesson/${lesson.id}`}
                className="block rounded-xl border border-neutral-200 bg-white px-4 py-3 text-neutral-900 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="text-sm text-neutral-500">
                  Week {lesson.week_number ?? "Unknown"} · {lesson.module_slug}
                </div>
                <div className="text-lg font-semibold">{lesson.title}</div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-600">No lessons found for this module.</p>
        )}
      </section>
    </div>
  );
}
