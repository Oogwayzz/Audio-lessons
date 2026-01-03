"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import type { Lesson } from "@/lib/types";
import { useAuth } from "@/components/auth/AuthProvider";

type PlayerState = {
  lesson: Lesson | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  play: (lesson: Lesson, opts?: { startAt?: number }) => Promise<void>;
  playLesson: (lessonId: string) => Promise<void>;
  toggle: () => void;
  seek: (timeSeconds: number) => void;
  skip: (deltaSeconds: number) => void;
  setRate: (rate: number) => void;
};

const PlayerContext = createContext<PlayerState | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Create the audio element once.
  useEffect(() => {
    const a = new Audio();
    a.preload = "metadata";
    audioRef.current = a;

    const onTime = () => setCurrentTime(a.currentTime || 0);
    const onMeta = () => setDuration(a.duration || 0);
    const onEnd = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnd);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);

    return () => {
      a.pause();
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnd);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
    };
  }, []);

  // Keep playback rate in sync.
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  const loadSignedUrl = useCallback(async (audioPath: string) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.storage.from("audio").createSignedUrl(audioPath, 60 * 60);
    if (error || !data?.signedUrl) {
      throw new Error(error?.message || "Failed to create signed URL");
    }
    return data.signedUrl;
  }, []);

  const fetchSavedPosition = useCallback(async (lessonId: string) => {
    if (!user || !isSupabaseConfigured) return 0;
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("user_progress")
      .select("position_seconds, completed")
      .eq("lesson_id", lessonId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) return 0;
    if (!data) return 0;
    if (data.completed) return 0;
    return Number(data.position_seconds || 0);
  }, [user]);

  const play = useCallback(
    async (nextLesson: Lesson, opts?: { startAt?: number }) => {
      if (!audioRef.current) return;
      if (!isSupabaseConfigured) return;

      const a = audioRef.current;

      // If switching lesson, hard stop first.
      a.pause();

      const signedUrl = await loadSignedUrl(nextLesson.audio_path);
      a.src = signedUrl;
      a.load();

      setLesson(nextLesson);

      const startAt =
        typeof opts?.startAt === "number" ? opts.startAt : await fetchSavedPosition(nextLesson.id);

      // Wait a tick so metadata load begins.
      await new Promise((r) => setTimeout(r, 50));

      try {
        if (!Number.isNaN(startAt) && startAt > 0) a.currentTime = startAt;
      } catch {
        // Some browsers block setting currentTime before metadata is ready.
      }

      await a.play();
    },
    [fetchSavedPosition, loadSignedUrl]
  );

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (!lesson) return;
    if (a.paused) a.play();
    else a.pause();
  }, [lesson]);

  const playLesson = useCallback(
    async (lessonId: string) => {
      if (!isSupabaseConfigured) return;
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.from("lessons").select("*").eq("id", lessonId).single();
      if (error || !data) return;

      await play(data as Lesson);
    },
    [play]
  );

  const seek = useCallback((timeSeconds: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, timeSeconds);
  }, []);

  const skip = useCallback((deltaSeconds: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, (a.currentTime || 0) + deltaSeconds);
  }, []);

  const setRate = useCallback((rate: number) => {
    setPlaybackRate(rate);
  }, []);

  // Save progress at most every 10 seconds while playing.
  useEffect(() => {
    if (!user || !lesson || !isSupabaseConfigured) return;
    const a = audioRef.current;
    if (!a) return;

    const supabase = getSupabaseClient();
    let timer: number | null = null;

    const tick = async () => {
      if (!lesson) return;
      if (a.paused) return;

      const pos = Math.floor(a.currentTime || 0);
      const dur = Math.floor(a.duration || 0);
      const completed = dur > 0 ? pos >= Math.max(0, dur - 3) : false;

      await supabase
        .from("user_progress")
        .upsert(
          {
            user_id: user.id,
            lesson_id: lesson.id,
            position_seconds: pos,
            completed,
          },
          { onConflict: "user_id,lesson_id" }
        );
    };

    timer = window.setInterval(() => {
      tick();
    }, 10_000);

    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [user, lesson]);

  const value = useMemo<PlayerState>(
    () => ({
      lesson,
      isPlaying,
      currentTime,
      duration,
      playbackRate,
      play,
      playLesson,
      toggle,
      seek,
      skip,
      setRate,
    }),
    [lesson, isPlaying, currentTime, duration, playbackRate, play, playLesson, toggle, seek, skip, setRate]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
