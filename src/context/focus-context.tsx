"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { soundscape, type SoundscapeType } from "@/lib/audio-synthesizer";

export type Phase = "focus" | "short_break" | "long_break" | "custom";

export const DURATIONS: Record<Phase, number> = {
  focus: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60,
  custom: 45 * 60,
};

export const PHASE_LABEL: Record<Phase, string> = {
  focus: "Deep Focus",
  short_break: "Short Break",
  long_break: "Long Break",
  custom: "Custom Focus",
};

interface ActiveTaskInfo {
  id: number;
  title: string;
  notes?: string | null;
  priority: number;
}

interface FocusContextType {
  phase: Phase;
  secondsLeft: number;
  totalDuration: number;
  running: boolean;
  focusCount: number;
  activeTask: ActiveTaskInfo | null;
  audioPlaying: boolean;
  activeAudioType: SoundscapeType;
  startSession: (task?: ActiveTaskInfo, p?: Phase) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  toggleSession: () => void;
  resetSession: () => void;
  skipPhase: () => void;
  switchPhase: (p: Phase) => void;
  setCustomTimer: (minutes: number) => void;
  setActiveTask: (task: ActiveTaskInfo | null) => void;
  toggleAudio: (type: SoundscapeType) => void;
}

const FocusContext = createContext<FocusContextType | null>(null);

const STORAGE_KEY = "ember_focus_session_v1";

interface SavedSession {
  phase: Phase;
  secondsLeft: number;
  totalDuration: number;
  running: boolean;
  lastUpdated: number;
  focusCount: number;
  activeTask: ActiveTaskInfo | null;
}

export function FocusProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>("focus");
  const [secondsLeft, setSecondsLeft] = useState(DURATIONS.focus);
  const [totalDuration, setTotalDuration] = useState(DURATIONS.focus);
  const [running, setRunning] = useState(false);
  const [focusCount, setFocusCount] = useState(0);
  const [activeTask, setActiveTaskState] = useState<ActiveTaskInfo | null>(null);

  const [audioPlaying, setAudioPlaying] = useState(false);
  const [activeAudioType, setActiveAudioType] = useState<SoundscapeType>("binaural");

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data: SavedSession = JSON.parse(raw);
        const savedPhase = data.phase || "focus";
        const savedTotal = data.totalDuration || DURATIONS[savedPhase] || DURATIONS.focus;

        setPhase(savedPhase);
        setTotalDuration(savedTotal);
        setFocusCount(data.focusCount || 0);
        setActiveTaskState(data.activeTask || null);

        if (data.running && data.lastUpdated) {
          const elapsed = Math.floor((Date.now() - data.lastUpdated) / 1000);
          const remaining = (data.secondsLeft || savedTotal) - elapsed;
          if (remaining > 0) {
            setSecondsLeft(remaining);
            setRunning(true);
          } else {
            setSecondsLeft(0);
            setRunning(false);
          }
        } else {
          setSecondsLeft(data.secondsLeft ?? savedTotal);
          setRunning(false);
        }
      }
    } catch (e) {}
  }, []);

  // Save session state & handle clock ticks
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (running) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            beep();
            let nextP: Phase = "focus";
            if (phase === "focus" || phase === "custom") {
              const newCount = focusCount + 1;
              setFocusCount(newCount);
              nextP = newCount % 4 === 0 ? "long_break" : "short_break";
            } else {
              nextP = "focus";
            }
            setPhase(nextP);
            setTotalDuration(DURATIONS[nextP]);
            setRunning(false);
            return DURATIONS[nextP];
          }
          return prev - 1;
        });
      }, 1000);
    }

    // Persist
    try {
      const stateToSave: SavedSession = {
        phase,
        secondsLeft,
        totalDuration,
        running,
        lastUpdated: Date.now(),
        focusCount,
        activeTask,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {}

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [running, phase, secondsLeft, totalDuration, focusCount, activeTask]);

  function beep() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      [660, 880, 1100].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + i * 0.15 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.15 + 0.14);
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.15);
      });
      setTimeout(() => void ctx.close(), 600);
    } catch {}
  }

  const startSession = useCallback((task?: ActiveTaskInfo, p: Phase = "focus") => {
    if (task) setActiveTaskState(task);
    const dur = DURATIONS[p];
    setPhase(p);
    setTotalDuration(dur);
    setSecondsLeft(dur);
    setRunning(true);
  }, []);

  const pauseSession = useCallback(() => {
    setRunning(false);
  }, []);

  const resumeSession = useCallback(() => {
    setRunning(true);
  }, []);

  const toggleSession = useCallback(() => {
    setRunning((r) => !r);
  }, []);

  const resetSession = useCallback(() => {
    setRunning(false);
    setSecondsLeft(totalDuration);
  }, [totalDuration]);

  const switchPhase = useCallback((p: Phase) => {
    const dur = DURATIONS[p];
    setRunning(false);
    setPhase(p);
    setTotalDuration(dur);
    setSecondsLeft(dur);
  }, []);

  const setCustomTimer = useCallback((minutes: number) => {
    const secs = Math.max(1, Math.min(180, minutes)) * 60;
    setRunning(false);
    setPhase("custom");
    setTotalDuration(secs);
    setSecondsLeft(secs);
  }, []);

  const skipPhase = useCallback(() => {
    setPhase((currentP) => {
      let nextP: Phase = "focus";
      if (currentP === "focus" || currentP === "custom") {
        setFocusCount((c) => {
          const newCount = c + 1;
          nextP = newCount % 4 === 0 ? "long_break" : "short_break";
          return newCount;
        });
      } else {
        nextP = "focus";
      }
      setTotalDuration(DURATIONS[nextP]);
      setSecondsLeft(DURATIONS[nextP]);
      return nextP;
    });
    setRunning(false);
  }, []);

  const setActiveTask = useCallback((task: ActiveTaskInfo | null) => {
    setActiveTaskState((prev) => {
      if (
        prev?.id === task?.id &&
        prev?.title === task?.title &&
        prev?.notes === task?.notes &&
        prev?.priority === task?.priority
      ) {
        return prev;
      }
      return task;
    });
  }, []);

  const toggleAudio = useCallback((type: SoundscapeType) => {
    const isNowPlaying = soundscape.toggle(type);
    setAudioPlaying(isNowPlaying);
    setActiveAudioType(type);
  }, []);

  return (
    <FocusContext.Provider
      value={{
        phase,
        secondsLeft,
        totalDuration,
        running,
        focusCount,
        activeTask,
        audioPlaying,
        activeAudioType,
        startSession,
        pauseSession,
        resumeSession,
        toggleSession,
        resetSession,
        skipPhase,
        switchPhase,
        setCustomTimer,
        setActiveTask,
        toggleAudio,
      }}
    >
      {children}
    </FocusContext.Provider>
  );
}

export function useFocus() {
  const ctx = useContext(FocusContext);
  if (!ctx) {
    throw new Error("useFocus must be used within a FocusProvider");
  }
  return ctx;
}
