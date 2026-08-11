"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, SkipForward } from "lucide-react";
import { randomQuote } from "@/lib/quotes";

type Phase = "focus" | "short_break" | "long_break";

const DURATIONS: Record<Phase, number> = {
  focus: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60,
};

const PHASE_LABEL: Record<Phase, string> = {
  focus: "Focus",
  short_break: "Short Break",
  long_break: "Long Break",
};

/** Every 4th focus session earns the long break, standard Pomodoro cadence. */
function nextPhase(current: Phase, completedFocusCount: number): Phase {
  if (current !== "focus") return "focus";
  return (completedFocusCount + 1) % 4 === 0 ? "long_break" : "short_break";
}

/** Two-tone beep via Web Audio — no asset file, no autoplay-permission dance. */
function beep() {
  try {
    const AudioCtx = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    [660, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + i * 0.18 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.18 + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.18);
    });
    setTimeout(() => ctx.close(), 500);
  } catch {
    // Audio can fail to init in some contexts (no output device, etc.) — silent is fine.
  }
}

export function PomodoroTimer() {
  const [phase, setPhase] = useState<Phase>("focus");
  const [secondsLeft, setSecondsLeft] = useState(DURATIONS.focus);
  const [running, setRunning] = useState(false);
  const [focusCount, setFocusCount] = useState(0);
  const [quote, setQuote] = useState(() => randomQuote());
  const focusCountRef = useRef(focusCount);
  focusCountRef.current = focusCount;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (secondsLeft > 0) return;
    beep();
    setPhase((current) => {
      const wasFocus = current === "focus";
      const next = nextPhase(current, focusCountRef.current);
      if (wasFocus) setFocusCount((c) => c + 1);
      if (next !== "focus") setQuote(randomQuote());
      setSecondsLeft(DURATIONS[next]);
      return next;
    });
    setRunning(false);
  }, [secondsLeft]);

  function toggle() {
    setRunning((r) => !r);
  }

  function reset() {
    setRunning(false);
    setSecondsLeft(DURATIONS[phase]);
  }

  function skip() {
    const next = nextPhase(phase, focusCount);
    if (phase === "focus") setFocusCount((c) => c + 1);
    if (next !== "focus") setQuote(randomQuote());
    setPhase(next);
    setSecondsLeft(DURATIONS[next]);
    setRunning(false);
  }

  const mm = String(Math.floor(Math.max(0, secondsLeft) / 60)).padStart(2, "0");
  const ss = String(Math.max(0, secondsLeft) % 60).padStart(2, "0");
  const pct = 100 - (secondsLeft / DURATIONS[phase]) * 100;
  const onBreak = phase !== "focus";
  // Which slot (1-4) in the current 4-session cycle this phase belongs to.
  const sessionInCycle = phase === "focus" ? (focusCount % 4) + 1 : ((focusCount - 1 + 4) % 4) + 1;

  return (
    <div className="rounded-2xl border border-line/60 bg-raised/40 p-5 flex flex-col items-center gap-3">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-faint">
        <span className={onBreak ? "text-accent" : "text-p3"}>{PHASE_LABEL[phase]}</span>
        <span>· session {sessionInCycle}/4</span>
      </div>

      <div className="text-5xl font-mono font-bold tabular-nums text-ink">
        {mm}:{ss}
      </div>

      <div className="w-full h-1.5 bg-line/50 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${onBreak ? "bg-accent" : "bg-p3"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {onBreak ? (
        <p className="text-xs italic text-muted text-center leading-relaxed px-2">
          "{quote.text}" — <span className="not-italic font-medium text-faint">{quote.who}</span>
        </p>
      ) : null}

      <div className="flex items-center gap-2 mt-1">
        <button
          type="button"
          onClick={toggle}
          className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-[13px] font-semibold text-white transition-all hover:opacity-90 active:scale-95"
        >
          {running ? <Pause className="size-3.5" /> : <Play className="size-3.5 fill-current" />}
          {running ? "Pause" : "Start"}
        </button>
        <button
          type="button"
          title="Reset this phase"
          onClick={reset}
          className="grid size-9 place-items-center rounded-xl border border-line/60 text-muted transition-all hover:text-ink hover:border-faint active:scale-95"
        >
          <RotateCcw className="size-3.5" />
        </button>
        <button
          type="button"
          title="Skip to next phase"
          onClick={skip}
          className="grid size-9 place-items-center rounded-xl border border-line/60 text-muted transition-all hover:text-ink hover:border-faint active:scale-95"
        >
          <SkipForward className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
