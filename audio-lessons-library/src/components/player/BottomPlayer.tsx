"use client";

import { usePlayer } from "@/components/player/PlayerProvider";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function BottomPlayer() {
  const player = usePlayer();
const state = player?.state;

if (!state?.lesson) return null;

const { toggle, seek, skip, setRate } = player;

  const currentTime = state.currentTime ?? 0;
  const duration = state.duration ?? 0;
  const progress = duration > 0 ? currentTime / duration : 0;
  const playbackRate = state.playbackRate ?? 1;
  const isPlaying = state.isPlaying ?? false;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-5xl px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-neutral-900">
              {state.lesson.title}
            </div>
            <div className="truncate text-xs text-neutral-600">
              {state.lesson.module_name} · Week {state.lesson.week_number}
            </div>
          </div>

          <button
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm hover:bg-neutral-50"
            onClick={() => skip(-10)}
            type="button"
          >
            -10
          </button>

          <button
            className="rounded-xl border border-neutral-200 bg-neutral-900 px-3 py-2 text-sm text-white shadow-sm hover:bg-neutral-800"
            onClick={toggle}
            type="button"
          >
            {isPlaying ? "Pause" : "Play"}
          </button>

          <button
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm hover:bg-neutral-50"
            onClick={() => skip(15)}
            type="button"
          >
            +15
          </button>

          <select
            className="rounded-xl border border-neutral-200 bg-white px-2 py-2 text-sm text-neutral-900 shadow-sm"
            value={playbackRate}
            onChange={(e) => setRate(Number(e.target.value))}
          >
            {[0.75, 1, 1.25, 1.5, 2].map((r) => (
              <option key={r} value={r}>
                {r}x
              </option>
            ))}
          </select>
        </div>

        <div className="mt-2 flex items-center gap-3">
          <div className="w-12 text-xs text-neutral-600">
            {formatTime(currentTime)}
          </div>
          <input
            className="h-2 w-full cursor-pointer"
            type="range"
            min={0}
            max={Math.max(1, Math.floor(duration || 0))}
            value={Math.floor(currentTime || 0)}
            onChange={(e) => seek(Number(e.target.value))}
          />
          <div className="w-12 text-right text-xs text-neutral-600">
            {formatTime(duration)}
          </div>
        </div>

        <div className="mt-1 h-1 w-full overflow-hidden rounded bg-neutral-200">
          <div
            className="h-full bg-neutral-900"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
