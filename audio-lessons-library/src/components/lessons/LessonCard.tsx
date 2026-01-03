"use client";

import { usePlayer } from "@/components/player/PlayerProvider";
import type { Lesson, LessonWithProgress } from "@/lib/types";
import Link from "next/link";

function fmtTime(seconds?: number | null) {
  const s = Math.max(0, Math.floor(seconds ?? 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function LessonCard({
  lesson,
  resumeAt: resumeAtOverride,
}: {
  lesson: LessonWithProgress | Lesson;
  resumeAt?: number;
}) {
  const { play } = usePlayer();

  const moduleName = "module_name" in lesson ? lesson.module_name : lesson.module;
  const weekNumber = "week_number" in lesson ? lesson.week_number : lesson.week;
  const duration = "duration_seconds" in lesson ? lesson.duration_seconds ?? null : null;
  const resumeAt =
    typeof resumeAtOverride === "number"
      ? resumeAtOverride
      : "resume_seconds" in lesson
        ? lesson.resume_seconds ?? 0
        : 0;
  const tags = lesson.tags ?? [];
  const pct =
    duration && duration > 0 ? Math.min(1, Math.max(0, resumeAt / duration)) : 0;

  return (
    <div className="group rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/lesson/${lesson.id}`}
            className="block truncate text-base font-semibold tracking-tight text-neutral-900 hover:underline"
          >
            {lesson.title}
          </Link>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-600">
            <span className="truncate">{moduleName}</span>
            <span className="text-neutral-300">•</span>
            <span>Week {weekNumber}</span>
            {duration ? (
              <>
                <span className="text-neutral-300">•</span>
                <span>{fmtTime(duration)}</span>
              </>
            ) : null}
          </div>

          {tags?.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.slice(0, 4).map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-700"
                >
                  {t}
                </span>
              ))}
              {tags.length > 4 ? (
                <span className="text-xs text-neutral-500">+{tags.length - 4}</span>
              ) : null}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => play(lesson, { startAt: resumeAt })}
          className="shrink-0 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm hover:bg-neutral-50"
        >
          Play
        </button>
      </div>

      {duration ? (
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
            <div
              className="h-full bg-neutral-900"
              style={{ width: `${pct * 100}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-xs text-neutral-500">
            <span>{resumeAt ? `Resume at ${fmtTime(resumeAt)}` : "Not started"}</span>
            <span>{fmtTime(duration)}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
