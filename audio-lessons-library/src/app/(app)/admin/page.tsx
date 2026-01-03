"use client";

import React, { useMemo, useState } from "react";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import { slugify } from "@/lib/slugify";

function splitTags(input: string) {
  return input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export default function AdminPage() {
  const [moduleName, setModuleName] = useState("Brain & Behaviour");
  const [week, setWeek] = useState(1);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("personality, lecture");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const moduleSlug = useMemo(() => slugify(moduleName), [moduleName]);

  async function onUpload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus(null);

    if (!isSupabaseConfigured) {
      setError("Supabase is not configured.");
      return;
    }
    if (!file) {
      setError("Please choose an audio file.");
      return;
    }
    if (!title.trim()) {
      setError("Please enter a lesson title.");
      return;
    }

    setBusy(true);
    try {
      const supabase = getSupabaseClient();
      const id = crypto.randomUUID();
      const audioPath = `${moduleSlug}/week-${week}/lesson-${id}-${slugify(title)}.mp3`;

      setStatus("Uploading audio...");
      const { error: upErr } = await supabase.storage
        .from("audio")
        .upload(audioPath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || "audio/mpeg",
        });
      if (upErr) throw upErr;

      setStatus("Saving lesson metadata...");
      const { error: insErr } = await supabase.from("lessons").insert({
        id,
        module: moduleName,
        module_slug: moduleSlug,
        week,
        title,
        tags: splitTags(tags),
        audio_path: audioPath,
        duration_seconds: null,
      });
      if (insErr) throw insErr;

      setStatus("Done. Lesson added.");
      setTitle("");
      setFile(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="mt-1 text-sm text-neutral-400">Upload an audio file and create a lesson.</p>
      </div>

      <form onSubmit={onUpload} className="space-y-4 rounded-xl border border-neutral-800 bg-neutral-950 p-4">
        <div className="space-y-1">
          <label className="text-sm text-neutral-300">Module name</label>
          <input
            className="w-full rounded-md border border-neutral-800 bg-black px-3 py-2 text-sm"
            value={moduleName}
            onChange={(e) => setModuleName(e.target.value)}
          />
          <p className="text-xs text-neutral-500">Slug: {moduleSlug || "-"}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm text-neutral-300">Week</label>
            <input
              type="number"
              min={1}
              className="w-full rounded-md border border-neutral-800 bg-black px-3 py-2 text-sm"
              value={week}
              onChange={(e) => setWeek(Number(e.target.value))}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-neutral-300">Audio file</label>
            <input
              type="file"
              accept="audio/*"
              className="w-full rounded-md border border-neutral-800 bg-black px-3 py-2 text-sm"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-neutral-300">Lesson title</label>
          <input
            className="w-full rounded-md border border-neutral-800 bg-black px-3 py-2 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Week 1 - What is Personality?"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-neutral-300">Tags (comma separated)</label>
          <input
            className="w-full rounded-md border border-neutral-800 bg-black px-3 py-2 text-sm"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {status ? <p className="text-sm text-neutral-300">{status}</p> : null}

        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-neutral-200 disabled:opacity-60"
        >
          {busy ? "Working..." : "Upload"}
        </button>
      </form>

      <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 text-sm text-neutral-300">
        <p className="font-semibold text-neutral-100">Tip</p>
        <p className="mt-2 text-neutral-400">
          Keep your Supabase Storage bucket named <span className="text-neutral-200">audio</span> and set it to private.
          The app plays audio using signed links.
        </p>
      </div>
    </div>
  );
}
