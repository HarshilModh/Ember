"use client";

import { useState, useEffect } from "react";
import {
  X,
  Sun,
  Flame,
  Zap,
  Play,
  Pause,
  RotateCcw,
  Headphones,
  Maximize2,
  Minimize2,
  Sparkles,
  CloudSun,
  Volume2,
  Quote,
  Activity,
  CheckCircle2,
  Shield,
  Radio,
} from "lucide-react";
import { soundscape, type SoundscapeType } from "@/lib/audio-synthesizer";
import { FlowVelocityBadge } from "./flow-velocity-badge";
import { type Phase, PHASE_LABEL } from "@/context/focus-context";
import { quoteOfTheDay, randomQuote, type QuoteItem } from "@/lib/quotes";
import { useWakeLock } from "@/lib/use-wake-lock";

export function IpadStandClock({
  isOpen,
  onClose,
  taskTitle,
  secondsLeft,
  totalDuration,
  running,
  phase,
  onToggleSession,
  onResetSession,
}: {
  isOpen: boolean;
  onClose: () => void;
  taskTitle?: string;
  secondsLeft: number;
  totalDuration: number;
  running: boolean;
  phase: Phase;
  onToggleSession: () => void;
  onResetSession: () => void;
}) {
  const [wallTimeStr, setWallTimeStr] = useState("");
  const [wallDateStr, setWallDateStr] = useState("");
  const [activeSound, setActiveSound] = useState<SoundscapeType | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [quote, setQuote] = useState<QuoteItem>(() => quoteOfTheDay());

  // Keep the display on while Stand Mode is open — re-acquires automatically
  // if the OS drops the lock (e.g. after a brief backgrounding).
  useWakeLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;

    function updateTime() {
      const now = new Date();
      setWallTimeStr(
        now.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
      setWallDateStr(
        now.toLocaleDateString(undefined, {
          weekday: "long",
          month: "short",
          day: "numeric",
        })
      );
    }

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  function toggleSound(type: SoundscapeType) {
    const isNowPlaying = soundscape.toggle(type);
    setActiveSound(isNowPlaying ? type : null);
  }

  function handleSpeakQuote() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`"${quote.text}" by ${quote.who}`);
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }

  function toggleFullscreen() {
    if (typeof document === "undefined") return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  }

  const mm = String(Math.floor(Math.max(0, secondsLeft) / 60)).padStart(2, "0");
  const ss = String(Math.max(0, secondsLeft) % 60).padStart(2, "0");
  const progressRatio = totalDuration > 0 ? 1 - Math.max(0, secondsLeft) / totalDuration : 0;
  const onBreak = phase === "short_break" || phase === "long_break";

  // SVG Radial Ring
  const radius = 125;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressRatio);

  return (
    <div className="fixed inset-0 z-[140] bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-10 animate-reveal select-none overflow-y-auto">
      {/* Hypnotic Glowing Ambient Aura */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[800px] rounded-full blur-[160px] pointer-events-none transition-all duration-1000 animate-pulse ${
          onBreak ? "bg-amber-500/20" : "bg-emerald-500/25"
        }`}
      />

      {/* Top Stand Header Bar */}
      <div className="relative z-10 w-full flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/30 shadow-xs flex items-center gap-2">
            <Sun className="size-4 animate-spin-slow" />
            <span>iPad Always-On StandBy</span>
          </span>

          <span
            className={`text-xs font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full border ${
              onBreak
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
            }`}
          >
            {PHASE_LABEL[phase]}
          </span>
        </div>

        {/* Ambient Weather Widget Pill */}
        <div className="hidden lg:flex items-center gap-3 bg-black/40 border border-white/15 px-4 py-1.5 rounded-full text-xs text-white/80 font-bold">
          <CloudSun className="size-4 text-amber-400" />
          <span>74°F Clear</span>
          <span className="text-white/30">•</span>
          <span className="text-emerald-400">AQI 18 Good</span>
          <span className="text-white/30">•</span>
          <span>Sunset 8:12 PM</span>
        </div>

        {/* Fullscreen & Exit Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-white/20 bg-white/10 text-xs font-bold text-white hover:bg-white/20 transition-all active:scale-95 shadow-xs"
            title="Toggle iPad Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            <span className="hidden sm:inline">{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
          </button>

          <button
            onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-white/20 bg-white/10 text-xs font-bold text-white hover:bg-white/20 transition-all active:scale-95 shadow-xs"
          >
            <X className="size-4" />
            <span>Exit</span>
          </button>
        </div>
      </div>

      {/* StandBy 3-Column Super-Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-auto max-w-7xl w-full mx-auto py-4">
        {/* 1. Left Card: Ambient Wall Clock & Flow Battery */}
        <div className="rounded-3xl border border-white/15 bg-black/50 p-6 sm:p-8 flex flex-col justify-between backdrop-blur-2xl shadow-2xl space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-white/50 flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-amber-400" />
              Live Wall Clock
            </span>
            <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
              <Flame className="size-3.5 fill-amber-400/30 animate-pulse" />
              5 Day Streak
            </span>
          </div>

          <div className="space-y-1 my-auto">
            <div className="text-6xl sm:text-7xl font-black font-mono tracking-tight text-white tabular-nums drop-shadow-md leading-none">
              {wallTimeStr}
            </div>
            <div className="text-sm font-extrabold text-emerald-400 tracking-wider uppercase pt-1">
              {wallDateStr}
            </div>
          </div>

          {/* Flow Battery Progress Gauge */}
          <div className="pt-4 border-t border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-white/70">
              <span className="flex items-center gap-1.5">
                <Zap className="size-3.5 text-emerald-400" />
                Daily Flow Battery
              </span>
              <span className="font-mono text-emerald-400">75%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-3 p-0.5 border border-white/15 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full w-[75%]" />
            </div>
          </div>
        </div>

        {/* 2. Center Card: Pomodoro Focus Timer Centerpiece */}
        <div className="rounded-3xl border border-white/15 bg-black/50 p-6 sm:p-8 flex flex-col items-center justify-between backdrop-blur-2xl shadow-2xl space-y-6">
          <div className="w-full flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
              <Zap className="size-4" />
              Focus Centerpiece
            </span>
            <FlowVelocityBadge secondsLeft={secondsLeft} totalDuration={totalDuration} />
          </div>

          {/* Radial Pomodoro Ring & Readout */}
          <div className="relative grid place-items-center my-2">
            <svg className="size-60 sm:size-64 -rotate-90 transform drop-shadow-2xl" viewBox="0 0 300 300">
              <circle
                cx="150"
                cy="150"
                r={radius}
                className="stroke-white/10"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="150"
                cy="150"
                r={radius}
                className={`transition-all duration-1000 ease-linear ${
                  onBreak
                    ? "stroke-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.7)]"
                    : "stroke-emerald-400 drop-shadow-[0_0_20px_rgba(16,185,129,0.7)]"
                }`}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            <div className="absolute flex flex-col items-center justify-center text-center">
              <div className="text-5xl font-black font-mono tracking-tight text-white tabular-nums drop-shadow-md">
                {mm}:{ss}
              </div>
              {taskTitle && (
                <p className="text-xs font-bold text-white/80 max-w-[160px] truncate mt-1">
                  {taskTitle}
                </p>
              )}
            </div>
          </div>

          {/* Stand Controls Toolbar */}
          <div className="w-full flex items-center gap-3 pt-1">
            <button
              onClick={onToggleSession}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black transition-all active:scale-95 shadow-md ${
                running
                  ? "bg-amber-500 hover:bg-amber-400 text-black"
                  : "bg-emerald-400 hover:bg-emerald-300 text-black"
              }`}
            >
              {running ? <Pause className="size-4" /> : <Play className="size-4 fill-current ml-0.5" />}
              <span>{running ? "Pause" : "Start Flow"}</span>
            </button>

            <button
              onClick={onResetSession}
              className="p-3 rounded-2xl border border-white/20 bg-white/10 text-white/80 hover:text-white transition-all active:scale-95"
              title="Reset timer"
            >
              <RotateCcw className="size-4" />
            </button>
          </div>
        </div>

        {/* 3. Right Card: Soundscape & Mindset Oracle */}
        <div className="rounded-3xl border border-white/15 bg-black/50 p-6 sm:p-8 flex flex-col justify-between backdrop-blur-2xl shadow-2xl space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
              <Radio className="size-4" />
              Soundscape & Wisdom
            </span>

            {/* Audio Spectrum Visualizer */}
            <div className="flex items-end gap-0.5 h-3">
              <span className="w-0.5 h-full bg-cyan-400 animate-pulse" />
              <span className="w-0.5 h-2/3 bg-cyan-400 animate-pulse delay-75" />
              <span className="w-0.5 h-4/5 bg-cyan-400 animate-pulse delay-150" />
            </div>
          </div>

          {/* Soundscape Track Switcher */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Soundscapes</span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: "binaural", label: "40Hz Beats" },
                { id: "rain", label: "Soft Rain" },
                { id: "ocean", label: "Pacific Ocean" },
                { id: "space", label: "Deep Space" },
              ].map((s) => {
                const active = activeSound === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleSound(s.id as SoundscapeType)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center border ${
                      active
                        ? "bg-cyan-400 text-black border-cyan-300 shadow-sm"
                        : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quote Oracle */}
          <div className="pt-3 border-t border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <Quote className="size-3" />
                Mindset Oracle
              </span>
              <button
                type="button"
                onClick={handleSpeakQuote}
                className="p-1 rounded-lg border border-white/15 bg-white/10 text-white/80 hover:text-white text-[10px] flex items-center gap-1"
              >
                <Volume2 className="size-3" />
                <span>Listen</span>
              </button>
            </div>
            <p className="text-xs font-bold text-white/90 line-clamp-2 italic">
              "{quote.text}"
            </p>
            <p className="text-[10px] text-white/50 font-semibold">— {quote.who}</p>
          </div>
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className="relative z-10 w-full flex items-center justify-between text-xs text-white/40 border-t border-white/10 pt-4 font-mono">
        <span>Ember iPadOS StandBy Pro • Wake Lock Active • Screen Never Sleeps</span>
        <span>Tap anywhere to interact</span>
      </div>
    </div>
  );
}
