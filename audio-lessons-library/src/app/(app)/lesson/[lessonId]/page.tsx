"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import type { Lesson, UserProgress } from "@/lib/types";
import { usePlayer } from "@/components/player/PlayerProvider";

export default function LessonPage() {
  const params = useParams<{ lessonId: string }>();
  const lessonId = params.lessonId;

  const { play } = usePlayer();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
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

        const { data: lessonData, error: le } = await supabase
          .from("lessons")
          .select("*")
          .eq("id", lessonId)
          .single();
        if (le) throw le;
        setLesson(lessonData as Lesson);

        const { data: progData } = await supabase
          .from("user_progress")
          .select("*")
          .eq("lesson_id", lessonId)
          .maybeSingle();
        if (progData) setProgress(progData as UserProgress);

        setLoading(false);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load";
        setError(message);
        setLoading(false);
      }
    }

    load();
  }, [lessonId]);

  const resumeAt = useMemo(() => {
    if (!progress || progress.completed) return 0;
    return Math.max(0, Math.floor(progress.position_seconds || 0));
  }, [progress]);

  if (loading) return <p className="text-sm text-neutral-300">Loading...</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!lesson) return <p className="text-sm text-neutral-400">Lesson not found.</p>;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm text-neutral-400">
          <Link className="underline" href={`/module/${lesson.module_slug}`}>
            {lesson.module}
          </Link>
          <span className="text-neutral-600"> / </span>
          <Link className="underline" href={`/module/${lesson.module_slug}/week/${lesson.week}`}>
            Week {lesson.week}
          </Link>
        </p>

        <h1 className="text-2xl font-semibold">{lesson.title}</h1>

        <div className="flex flex-wrap gap-2">
          {(lesson.tags || []).map((t) => (
            <span
              key={t}
              className="rounded-full border border-neutral-800 px-3 py-1 text-xs text-neutral-300"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-neutral-200"
          onClick={() => play(lesson, { startAt: 0 })}
        >
          Play from start
        </button>

        {resumeAt > 0 ? (
          <button
            type="button"
            className="rounded-lg border border-neutral-800 px-4 py-2 text-sm hover:bg-neutral-900"
            onClick={() => play(lesson, { startAt: resumeAt })}
          >
            Resume from {Math.floor(resumeAt / 60)}:{String(resumeAt % 60).padStart(2, "0")}
          </button>
        ) : null}
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 text-sm text-neutral-300">
        <p className="font-semibold text-neutral-100">Audio file</p>
        <p className="mt-2 break-all text-neutral-400">{lesson.audio_path}</p>
        <p className="mt-2 text-xs text-neutral-500">
          This app plays private audio using short-lived signed links from Supabase Storage.
        </p>
      </div>
    </div>
  );
}
