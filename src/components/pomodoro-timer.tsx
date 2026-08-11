"use client";

import { useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Flame,
  Zap,
  Coffee,
  Sun,
  Sliders,
  Check,
} from "lucide-react";
import { randomQuote, type QuoteItem } from "@/lib/quotes";
import { AmbientSoundscapePlayer } from "./ambient-soundscape";
import { useFocus, PHASE_LABEL, type Phase } from "@/context/focus-context";

const PRESET_MINUTES = [10, 15, 25, 45, 60, 90];

export function PomodoroTimer() {
  const {
    phase,
    secondsLeft,
    totalDuration,
    running,
    focusCount,
    toggleSession,
    resetSession,
    skipPhase,
    switchPhase,
    setCustomTimer,
  } = useFocus();

  const [quote] = useState<QuoteItem>(() => randomQuote());
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInputVal, setCustomInputVal] = useState("45");

  const mm = String(Math.floor(Math.max(0, secondsLeft) / 60)).padStart(2, "0");
  const ss = String(Math.max(0, secondsLeft) % 60).padStart(2, "0");
  const progressRatio = totalDuration > 0 ? 1 - Math.max(0, secondsLeft) / totalDuration : 0;
  const onBreak = phase === "short_break" || phase === "long_break";

  // Session milestone counter (1..4)
  const sessionInCycle = (focusCount % 4) + 1;

  // SVG Radial Ring Calculation
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressRatio);

  function handleSetCustomMinutes(mins: number) {
    if (isNaN(mins) || mins <= 0) return;
    setCustomTimer(mins);
    setShowCustomInput(false);
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-line/80 bg-gradient-to-b from-surface via-surface/90 to-surface-container/40 p-6 sm:p-8 shadow-sm flex flex-col items-center gap-6">
      {/* Dynamic Background Aura */}
      <div
        className={`absolute -top-32 -right-32 size-64 rounded-full blur-3xl transition-all duration-700 pointer-events-none ${
          running
            ? onBreak
              ? "bg-amber-500/20"
              : "bg-emerald-500/25 scale-125"
            : "bg-accent/10"
        }`}
      />

      {/* Top Header: Phase Selector & Custom Time Controls */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between w-full gap-3 border-b border-line/50 pb-4">
        {/* Phase Pills */}
        <div className="flex items-center gap-1.5 bg-raised/70 p-1 rounded-2xl border border-line/40 overflow-x-auto no-scrollbar max-w-full">
          {(["focus", "short_break", "long_break"] as Phase[]).map((p) => {
            const active = phase === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => switchPhase(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 whitespace-nowrap ${
                  active
                    ? p === "focus"
                      ? "bg-accent text-white shadow-xs"
                      : "bg-amber-500 text-white shadow-xs"
                    : "text-muted hover:text-ink hover:bg-surface"
                }`}
              >
                {p === "focus" ? (
                  <Zap className="size-3.5" />
                ) : p === "short_break" ? (
                  <Coffee className="size-3.5" />
                ) : (
                  <Sun className="size-3.5" />
                )}
                <span>{PHASE_LABEL[p]}</span>
              </button>
            );
          })}

          {/* Custom Time Toggle Pill */}
          <button
            type="button"
            onClick={() => setShowCustomInput(!showCustomInput)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 whitespace-nowrap ${
              phase === "custom" || showCustomInput
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-muted hover:text-ink hover:bg-surface"
            }`}
          >
            <Sliders className="size-3.5" />
            <span>Custom Time</span>
          </button>
        </div>

        {/* Milestone Streak Dots */}
        <div className="flex items-center gap-1.5 text-xs font-bold text-muted bg-raised/50 px-3 py-1.5 rounded-xl border border-line/40 shrink-0">
          <Flame className="size-4 text-amber-500 fill-amber-500/20" />
          <span>Session {sessionInCycle}/4</span>
          <div className="flex gap-1 ml-1">
            {[1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={`size-2 rounded-full transition-all ${
                  i <= sessionInCycle
                    ? "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]"
                    : "bg-line/80"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Custom Duration Presets Toolbar (When Custom Time clicked) */}
      {showCustomInput && (
        <div className="relative z-10 w-full bg-raised/80 border border-line/60 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 animate-reveal">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-muted mr-1">Presets:</span>
            {PRESET_MINUTES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleSetCustomMinutes(m)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                  Math.round(totalDuration / 60) === m && phase === "custom"
                    ? "bg-accent text-white border-accent"
                    : "bg-surface text-ink border-line/50 hover:bg-surface-container"
                }`}
              >
                {m}m
              </button>
            ))}
          </div>

          {/* Custom Minute Direct Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSetCustomMinutes(parseInt(customInputVal, 10));
            }}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <input
              type="number"
              min="1"
              max="180"
              value={customInputVal}
              onChange={(e) => setCustomInputVal(e.target.value)}
              placeholder="Mins"
              className="w-20 rounded-xl border border-line/80 bg-surface px-3 py-1 text-xs font-mono font-bold text-ink outline-none focus:border-accent"
            />
            <span className="text-xs font-bold text-faint">min</span>
            <button
              type="submit"
              className="px-3 py-1 bg-accent text-white font-bold text-xs rounded-xl hover:opacity-90 transition-all flex items-center gap-1"
            >
              <Check className="size-3" />
              Set
            </button>
          </form>
        </div>
      )}

      {/* SVG Radial Ring & Timer Centerpiece */}
      <div className="relative z-10 grid place-items-center my-2">
        <svg className="size-64 sm:size-72 -rotate-90 transform" viewBox="0 0 240 240">
          <circle
            cx="120"
            cy="120"
            r={radius}
            className="stroke-line/40"
            strokeWidth="10"
            fill="transparent"
          />
          <circle
            cx="120"
            cy="120"
            r={radius}
            className={`transition-all duration-1000 ease-linear ${
              onBreak ? "stroke-amber-500" : "stroke-accent"
            }`}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Inner Readout */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <div className="text-5xl sm:text-6xl font-extrabold font-mono tracking-tight text-ink tabular-nums">
            {mm}:{ss}
          </div>
          <span className="mt-1 text-xs font-bold uppercase tracking-widest text-muted flex items-center gap-1">
            {running ? (
              <>
                <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                Flow Active ({Math.round(totalDuration / 60)}m)
              </>
            ) : (
              `Paused (${Math.round(totalDuration / 60)}m)`
            )}
          </span>
        </div>
      </div>

      {/* Break Quote Card */}
      {onBreak && (
        <div className="relative z-10 max-w-md text-center p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-ink">
          "{quote.text}" — <span className="text-muted">{quote.who}</span>
        </div>
      )}

      {/* Controls Bar */}
      <div className="relative z-10 flex items-center justify-center gap-3 w-full border-t border-line/40 pt-5">
        <button
          type="button"
          onClick={toggleSession}
          className={`flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-bold text-white transition-all active:scale-95 shadow-md ${
            running
              ? "bg-amber-600 hover:bg-amber-500"
              : "bg-accent hover:opacity-90 shadow-accent/20"
          }`}
        >
          {running ? <Pause className="size-5" /> : <Play className="size-5 fill-current ml-0.5" />}
          <span>{running ? "Pause Session" : "Start Session"}</span>
        </button>

        <button
          type="button"
          title="Reset timer"
          onClick={resetSession}
          className="p-3.5 rounded-2xl border border-line/80 bg-raised/70 text-muted hover:text-ink hover:bg-raised transition-all active:scale-95"
        >
          <RotateCcw className="size-5" />
        </button>

        <button
          type="button"
          title="Skip phase"
          onClick={skipPhase}
          className="p-3.5 rounded-2xl border border-line/80 bg-raised/70 text-muted hover:text-ink hover:bg-raised transition-all active:scale-95"
        >
          <SkipForward className="size-5" />
        </button>
      </div>

      {/* Embedded Ambient Soundscape Controls */}
      <div className="relative z-10 w-full pt-2">
        <AmbientSoundscapePlayer />
      </div>
    </div>
  );
}
