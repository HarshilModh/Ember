"use client";

import { useState, useEffect } from "react";
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
  Sparkles,
} from "lucide-react";
import { randomQuote, type QuoteItem } from "@/lib/quotes";
import { AmbientSoundscapePlayer } from "./ambient-soundscape";
import { useFocus, PHASE_LABEL, type Phase } from "@/context/focus-context";

const PRESET_MINUTES = [10, 15, 25, 45, 60, 90];

export function PomodoroTimer({ isZen = false }: { isZen?: boolean }) {
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

  const [quote, setQuote] = useState<QuoteItem>(() => randomQuote());
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInputVal, setCustomInputVal] = useState("45");

  // Keyboard shortcuts listener for Space (Pause/Play), R (Reset), S (Skip)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        toggleSession();
      } else if (e.key === "r" || e.key === "R") {
        resetSession();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSession, resetSession]);

  const mm = String(Math.floor(Math.max(0, secondsLeft) / 60)).padStart(2, "0");
  const ss = String(Math.max(0, secondsLeft) % 60).padStart(2, "0");
  const progressRatio = totalDuration > 0 ? 1 - Math.max(0, secondsLeft) / totalDuration : 0;
  const onBreak = phase === "short_break" || phase === "long_break";

  // Session milestone counter (1..4)
  const sessionInCycle = (focusCount % 4) + 1;

  // SVG Radial Ring Calculation
  const radius = isZen ? 120 : 104;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressRatio);

  function handleSetCustomMinutes(mins: number) {
    if (isNaN(mins) || mins <= 0) return;
    setCustomTimer(mins);
    setShowCustomInput(false);
  }

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-line/80 bg-gradient-to-b from-surface via-surface/95 to-surface-container/50 p-6 sm:p-8 shadow-sm flex flex-col items-center gap-6 transition-all ${
        isZen ? "max-w-2xl mx-auto py-12" : ""
      }`}
    >
      {/* Ambient Glowing Background Orb */}
      <div
        className={`absolute -top-32 -right-32 size-72 rounded-full blur-3xl transition-all duration-1000 pointer-events-none ${
          running
            ? onBreak
              ? "bg-amber-500/20 shadow-[0_0_80px_rgba(245,158,11,0.3)]"
              : "bg-emerald-500/30 scale-125 shadow-[0_0_100px_rgba(16,185,129,0.35)]"
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
                    ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)]"
                    : "bg-line/80"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Custom Duration Presets Toolbar (When Custom Time clicked) */}
      {showCustomInput && (
        <div className="relative z-10 w-full bg-raised/90 border border-line/60 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 animate-reveal shadow-2xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-muted mr-1">Presets:</span>
            {PRESET_MINUTES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleSetCustomMinutes(m)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
                  Math.round(totalDuration / 60) === m && phase === "custom"
                    ? "bg-accent text-white border-accent shadow-xs"
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
              className="w-20 rounded-xl border border-line/80 bg-surface px-3 py-1.5 text-xs font-mono font-bold text-ink outline-none focus:border-accent"
            />
            <span className="text-xs font-bold text-faint">min</span>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-accent text-white font-bold text-xs rounded-xl hover:opacity-90 transition-all flex items-center gap-1 shadow-xs"
            >
              <Check className="size-3.5" />
              Set
            </button>
          </form>
        </div>
      )}

      {/* SVG Radial Ring & Timer Centerpiece */}
      <div className="relative z-10 grid place-items-center my-3">
        <svg
          className={`${
            isZen ? "size-72 sm:size-80" : "size-64 sm:size-72"
          } -rotate-90 transform drop-shadow-md`}
          viewBox="0 0 260 260"
        >
          {/* Outer Track Ring */}
          <circle
            cx="130"
            cy="130"
            r={radius}
            className="stroke-line/40"
            strokeWidth="12"
            fill="transparent"
          />
          {/* Glow Progress Ring */}
          <circle
            cx="130"
            cy="130"
            r={radius}
            className={`transition-all duration-1000 ease-linear ${
              onBreak
                ? "stroke-amber-500 drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                : "stroke-accent drop-shadow-[0_0_14px_rgba(16,185,129,0.5)]"
            }`}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Inner Readout */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <div className="text-6xl sm:text-7xl font-black font-mono tracking-tight text-ink tabular-nums drop-shadow-xs">
            {mm}:{ss}
          </div>
          <span className="mt-2 text-xs font-extrabold uppercase tracking-widest text-muted flex items-center gap-1.5 bg-raised/60 px-3 py-1 rounded-full border border-line/40">
            {running ? (
              <>
                <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-emerald-500">Flow Active</span>
                <span className="text-faint">({Math.round(totalDuration / 60)}m)</span>
              </>
            ) : (
              <>
                <span className="size-2 rounded-full bg-amber-500" />
                <span>Paused</span>
                <span className="text-faint">({Math.round(totalDuration / 60)}m)</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Break Quote Card */}
      {onBreak && (
        <div className="relative z-10 max-w-md text-center p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-ink flex items-center gap-2">
          <Sparkles className="size-4 text-amber-500 shrink-0" />
          <span>
            "{quote.text}" — <span className="text-muted">{quote.who}</span>
          </span>
        </div>
      )}

      {/* Main Controls Toolbar */}
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 w-full border-t border-line/40 pt-5">
        <button
          type="button"
          onClick={toggleSession}
          className={`flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-extrabold text-white transition-all active:scale-95 shadow-md ${
            running
              ? "bg-amber-600 hover:bg-amber-500"
              : "bg-accent hover:opacity-90 shadow-accent/25"
          }`}
        >
          {running ? <Pause className="size-5" /> : <Play className="size-5 fill-current ml-0.5" />}
          <span>{running ? "Pause Session" : "Start Session"}</span>
        </button>

        <button
          type="button"
          title="Reset timer (Press R)"
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

      {/* Embedded Ambient Soundscape Toolbar */}
      <div className="relative z-10 w-full pt-2">
        <AmbientSoundscapePlayer />
      </div>
    </div>
  );
}
