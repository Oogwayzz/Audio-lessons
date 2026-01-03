"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import type { Lesson } from "@/lib/types";
import { LessonCard } from "@/components/lessons/LessonCard";

export default function WeekPage() {
  const params = useParams<{ moduleSlug: string; weekNumber: string }>();
  const moduleSlug = params.moduleSlug;
  const weekNumber = Number(params.weekNumber);

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [moduleName, setModuleName] = useState<string>(moduleSlug);
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
        const { data, error: e } = await supabase
          .from("lessons")
          .select("*")
          .eq("module_slug", moduleSlug)
          .eq("week", weekNumber)
          .order("created_at", { ascending: true });
        if (e) throw e;
        const arr = (data || []) as Lesson[];
        setLessons(arr);
        if (arr[0]?.module) setModuleName(arr[0].module);
        setLoading(false);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load";
        setError(message);
        setLoading(false);
      }
    }

    load();
  }, [moduleSlug, weekNumber]);

  if (loading) return <p className="text-sm text-neutral-300">Loading...</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-neutral-400">{moduleName}</p>
        <h1 className="text-2xl font-semibold">Week {weekNumber}</h1>
      </div>

      <div className="grid gap-4">
        {lessons.map((l) => (
          <LessonCard key={l.id} lesson={l} />
        ))}
      </div>

      {lessons.length === 0 ? (
        <p className="text-sm text-neutral-400">No lessons found for this week.</p>
      ) : null}
    </div>
  );
}
