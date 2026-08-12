"use client";

import { useState } from "react";
import { useFocus, PHASE_LABEL, type Phase } from "@/context/focus-context";
import { soundscape, type SoundscapeType } from "@/lib/audio-synthesizer";
import { randomQuote, type QuoteItem } from "@/lib/quotes";
import type { Task, Log } from "@/db/schema";
import { addLog, completeAndLeaveFocus } from "@/app/actions";
import { BoxBreathingModal } from "./box-breathing-modal";
import { AudioMixerModal } from "./audio-mixer-modal";
import { FlowVelocityBadge } from "./flow-velocity-badge";
import { ApplePencilScratchpad } from "./apple-pencil-scratchpad";
import { IpadStandClock } from "./ipad-stand-clock";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  X,
  Send,
  CheckCircle2,
  Sliders,
  Sparkles,
  Flame,
  Compass,
  HeartPulse,
  Headphones,
  PenTool,
  Sun,
} from "lucide-react";

export type WorldTheme = "mint" | "frost" | "sunset" | "velvet";

const WORLDS: {
  id: WorldTheme;
  label: string;
  icon: string;
  sound: SoundscapeType;
  bgClass: string;
  glow: string;
  stroke: string;
  textClass: string;
  badgeClass: string;
  dockClass: string;
}[] = [
  {
    id: "mint",
    label: "Ember Mint",
    icon: "🌿",
    sound: "binaural",
    bgClass: "bg-emerald-950/95 text-emerald-50",
    glow: "rgba(16, 185, 129, 0.25)",
    stroke: "stroke-emerald-400 drop-shadow-[0_0_18px_rgba(16,185,129,0.6)]",
    textClass: "text-emerald-400",
    badgeClass: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10",
    dockClass: "bg-emerald-950/80 border-emerald-500/30 text-emerald-100",
  },
  {
    id: "frost",
    label: "Nordic Frost",
    icon: "❄️",
    sound: "ocean",
    bgClass: "bg-slate-950 text-sky-50",
    glow: "rgba(56, 189, 248, 0.25)",
    stroke: "stroke-sky-400 drop-shadow-[0_0_18px_rgba(56,189,248,0.6)]",
    textClass: "text-sky-400",
    badgeClass: "text-sky-300 border-sky-500/30 bg-sky-500/10",
    dockClass: "bg-slate-900/80 border-sky-500/30 text-sky-100",
  },
  {
    id: "sunset",
    label: "Warm Sunset",
    icon: "🌅",
    sound: "singingbowl",
    bgClass: "bg-stone-950 text-amber-50",
    glow: "rgba(245, 158, 11, 0.25)",
    stroke: "stroke-amber-400 drop-shadow-[0_0_18px_rgba(245,158,11,0.6)]",
    textClass: "text-amber-400",
    badgeClass: "text-amber-300 border-amber-500/30 bg-amber-500/10",
    dockClass: "bg-stone-900/80 border-amber-500/30 text-amber-100",
  },
  {
    id: "velvet",
    label: "Midnight Velvet",
    icon: "🔮",
    sound: "rain",
    bgClass: "bg-gray-950 text-purple-50",
    glow: "rgba(168, 85, 247, 0.25)",
    stroke: "stroke-purple-400 drop-shadow-[0_0_18px_rgba(168,85,247,0.6)]",
    textClass: "text-purple-400",
    badgeClass: "text-purple-300 border-purple-500/30 bg-purple-500/10",
    dockClass: "bg-gray-900/80 border-purple-500/30 text-purple-100",
  },
];

const PRESET_MINUTES = [10, 15, 25, 45, 60, 90];

export function FlowSanctuary({
  task,
  logs,
  onClose,
}: {
  task: Task;
  logs: Log[];
  onClose: () => void;
}) {
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
    toggleAudio,
  } = useFocus();

  const [world, setWorld] = useState<WorldTheme>("mint");
  const [showCustomSlider, setShowCustomSlider] = useState(false);
  const [showLogInput, setShowLogInput] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [showAudioStudio, setShowAudioStudio] = useState(false);
  const [showScratchpad, setShowScratchpad] = useState(false);
  const [showDeskClock, setShowDeskClock] = useState(false);

  const [customInputVal, setCustomInputVal] = useState(
    String(Math.round(totalDuration / 60)) || "25"
  );
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);

  const activeWorld = WORLDS.find((w) => w.id === world) || WORLDS[0];

  function handleSelectWorld(w: (typeof WORLDS)[0]) {
    setWorld(w.id);
    toggleAudio(w.sound);
  }

  function handleApplyMinutes(mins: number) {
    if (isNaN(mins) || mins <= 0) return;
    const clamped = Math.min(180, Math.max(1, mins));
    setCustomTimer(clamped);
    setCustomInputVal(String(clamped));
  }

  const mm = String(Math.floor(Math.max(0, secondsLeft) / 60)).padStart(2, "0");
  const ss = String(Math.max(0, secondsLeft) % 60).padStart(2, "0");
  const progressRatio = totalDuration > 0 ? 1 - Math.max(0, secondsLeft) / totalDuration : 0;
  const onBreak = phase === "short_break" || phase === "long_break";

  // Session milestone counter (1..4)
  const sessionInCycle = (focusCount % 4) + 1;

  // SVG Radial Ring Calculation
  const radius = 135;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressRatio);

  return (
    <>
      {/* Box Breathing Warm-up Modal */}
      <BoxBreathingModal
        isOpen={showBreathing}
        onClose={() => setShowBreathing(false)}
        onStartFocus={() => {
          if (!running) toggleSession();
        }}
      />

      {/* Audio Soundscape Studio Modal */}
      <AudioMixerModal
        isOpen={showAudioStudio}
        onClose={() => setShowAudioStudio(false)}
      />

      {/* Apple Pencil & Touch Scratchpad Drawer */}
      <ApplePencilScratchpad
        isOpen={showScratchpad}
        onClose={() => setShowScratchpad(false)}
      />

      {/* iPad Desk Stand Always-On Clock Mode */}
      <IpadStandClock
        isOpen={showDeskClock}
        onClose={() => setShowDeskClock(false)}
        taskTitle={task.title}
      />

      <div
        className={`fixed inset-0 z-[100] ${activeWorld.bgClass} backdrop-blur-3xl overflow-y-auto flex flex-col items-center justify-between p-6 sm:p-10 animate-reveal transition-colors duration-700 select-none`}
      >
        {/* Soft Ambient Background Glow Orb */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[650px] rounded-full blur-[140px] pointer-events-none transition-all duration-1000 animate-pulse"
          style={{ background: activeWorld.glow }}
        />

        {/* Top Floating Glass Header Bar */}
        <div className="relative z-10 w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 pb-4">
          {/* Sanctuary Title & Task Name */}
          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full border flex items-center gap-1.5 shadow-xs ${activeWorld.badgeClass}`}
            >
              <Compass className="size-4 animate-spin-slow" />
              Flow Sanctuary
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-white truncate max-w-md drop-shadow-xs">
              {task.title}
            </h2>
          </div>

          {/* World Theme Selector Pills */}
          <div className="flex items-center gap-1 bg-black/30 p-1.5 rounded-2xl border border-white/15 overflow-x-auto no-scrollbar max-w-full backdrop-blur-md">
            {WORLDS.map((w) => {
              const active = world === w.id;
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => handleSelectWorld(w)}
                  className={`px-3 py-2 min-h-[44px] rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 whitespace-nowrap active:scale-95 ${
                    active
                      ? "bg-white text-black shadow-md scale-105"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <span>{w.icon}</span>
                  <span>{w.label}</span>
                </button>
              );
            })}
          </div>

          {/* Exit Button */}
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-2xl border border-white/20 bg-white/10 text-xs font-bold text-white hover:bg-white/20 transition-all active:scale-95 shadow-2xs backdrop-blur-md"
            title="Exit Flow Sanctuary (Esc)"
          >
            <X className="size-4" />
            <span>Exit</span>
            <kbd className="hidden sm:inline bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-mono">
              Esc
            </kbd>
          </button>
        </div>

        {/* Centerpiece Hero Radial Timer */}
        <div className="relative z-10 grid place-items-center my-6">
          <svg className="size-80 sm:size-96 -rotate-90 transform drop-shadow-2xl" viewBox="0 0 300 300">
            {/* Outer Track Ring */}
            <circle
              cx="150"
              cy="150"
              r={radius}
              className="stroke-white/15"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Glow Progress Ring */}
            <circle
              cx="150"
              cy="150"
              r={radius}
              className={`transition-all duration-1000 ease-linear ${
                onBreak
                  ? "stroke-amber-400 drop-shadow-[0_0_16px_rgba(245,158,11,0.6)]"
                  : activeWorld.stroke
              }`}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Inner Digital Readout & Real-time Flow Velocity Milestone */}
          <div className="absolute flex flex-col items-center justify-center text-center space-y-2">
            <div className="text-7xl sm:text-8xl font-black font-mono tracking-tight text-white tabular-nums drop-shadow-md">
              {mm}:{ss}
            </div>

            {/* Real-time Flow Velocity Milestone Badge */}
            <FlowVelocityBadge secondsLeft={secondsLeft} totalDuration={totalDuration} />
          </div>
        </div>

        {/* Optional Custom Slider / Duration Panel (Toggled from Dock) */}
        {showCustomSlider && (
          <div className="relative z-10 w-full max-w-lg bg-black/60 border border-white/20 rounded-3xl p-5 flex flex-col gap-4 animate-reveal backdrop-blur-xl shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-white flex items-center gap-1.5">
                <Sliders className="size-4 text-emerald-400" />
                Adjust Custom Duration
              </span>
              <span className={`font-mono text-xs font-bold px-3 py-1 rounded-full border ${activeWorld.badgeClass}`}>
                {customInputVal} Minutes
              </span>
            </div>

            {/* Smooth Range Slider */}
            <div className="space-y-2">
              <input
                type="range"
                min="5"
                max="120"
                step="5"
                value={customInputVal}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomInputVal(val);
                  handleApplyMinutes(parseInt(val, 10));
                }}
                className="accent-range cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono font-bold text-white/50 px-0.5">
                <span>5m</span>
                <span>15m</span>
                <span>30m</span>
                <span>45m</span>
                <span>60m</span>
                <span>90m</span>
                <span>120m</span>
              </div>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-white/10">
              <span className="text-[11px] font-bold text-white/60 mr-1">Presets:</span>
              {PRESET_MINUTES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setCustomInputVal(String(m));
                    handleApplyMinutes(m);
                  }}
                  className={`px-3 py-2 min-h-[44px] rounded-xl text-xs font-bold transition-all border ${
                    Math.round(totalDuration / 60) === m && phase === "custom"
                      ? "bg-white text-black border-white shadow-xs"
                      : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Note Input Drawer (Toggled from Dock) */}
        {showLogInput && (
          <form
            className="relative z-10 w-full max-w-lg flex gap-2 animate-reveal"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!note.trim()) return;
              const val = note;
              setNote("");
              setPending(true);
              await addLog(task.id, val);
              setPending(false);
              setShowLogInput(false);
            }}
          >
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Record a thought or milestone in Flow Sanctuary..."
              className="min-w-0 flex-1 rounded-2xl border border-white/20 bg-black/60 px-4 py-3 text-xs sm:text-sm text-white placeholder:text-white/40 outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all backdrop-blur-xl"
            />
            <button
              disabled={!note.trim() || pending}
              className="flex items-center gap-1.5 rounded-2xl bg-white text-black px-5 py-3 text-xs sm:text-sm font-extrabold transition-all enabled:hover:bg-white/90 enabled:active:scale-95 disabled:opacity-40 shadow-sm"
            >
              <Send className="size-4" />
              <span>Log</span>
            </button>
          </form>
        )}

        {/* Bottom Floating Control Dock (iPad Ergonomic 44px+ Touch Targets) */}
        <div className={`relative z-10 w-full max-w-3xl ${activeWorld.dockClass} rounded-3xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-2.5 shadow-2xl backdrop-blur-2xl`}>
          {/* Play/Pause Button */}
          <button
            type="button"
            onClick={toggleSession}
            className={`flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-2xl text-xs font-black transition-all active:scale-95 shadow-md ${
              running
                ? "bg-amber-500 hover:bg-amber-400 text-black"
                : "bg-emerald-400 hover:bg-emerald-300 text-black"
            }`}
          >
            {running ? <Pause className="size-4" /> : <Play className="size-4 fill-current ml-0.5" />}
            <span>{running ? "Pause" : "Start Flow"}</span>
          </button>

          {/* Apple Pencil Scratchpad Trigger */}
          <button
            type="button"
            onClick={() => setShowScratchpad(true)}
            className="p-3 min-h-[44px] rounded-xl border border-white/15 bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-all active:scale-95 flex items-center gap-1 text-xs font-bold"
            title="Apple Pencil Scratchpad"
          >
            <PenTool className="size-4 text-emerald-400" />
            <span className="hidden sm:inline">Scratchpad</span>
          </button>

          {/* iPad Desk Stand Clock Mode Trigger */}
          <button
            type="button"
            onClick={() => setShowDeskClock(true)}
            className="p-3 min-h-[44px] rounded-xl border border-white/15 bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-all active:scale-95 flex items-center gap-1 text-xs font-bold"
            title="Always-On iPad Stand Clock"
          >
            <Sun className="size-4 text-amber-400" />
            <span className="hidden sm:inline">Stand Mode</span>
          </button>

          {/* Box Breathing Warm-up Trigger */}
          <button
            type="button"
            onClick={() => setShowBreathing(true)}
            className="p-3 min-h-[44px] rounded-xl border border-emerald-400/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-all active:scale-95 flex items-center gap-1 text-xs font-bold"
            title="60s Box Breathing Warm-up"
          >
            <HeartPulse className="size-4" />
          </button>

          {/* Soundscape Studio Trigger */}
          <button
            type="button"
            onClick={() => setShowAudioStudio(true)}
            className="p-3 min-h-[44px] rounded-xl border border-white/15 bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-all active:scale-95"
            title="Soundscape Audio Studio"
          >
            <Headphones className="size-4" />
          </button>

          {/* Reset & Skip */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              title="Reset timer (R)"
              onClick={resetSession}
              className="p-3 min-h-[44px] rounded-xl border border-white/15 bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-all active:scale-95"
            >
              <RotateCcw className="size-4" />
            </button>

            <button
              type="button"
              title="Skip phase"
              onClick={skipPhase}
              className="p-3 min-h-[44px] rounded-xl border border-white/15 bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-all active:scale-95"
            >
              <SkipForward className="size-4" />
            </button>
          </div>

          {/* Custom Duration Toggle */}
          <button
            type="button"
            onClick={() => setShowCustomSlider(!showCustomSlider)}
            className={`p-3 min-h-[44px] rounded-xl border transition-all active:scale-95 ${
              showCustomSlider
                ? "bg-white text-black border-white"
                : "border-white/15 bg-white/10 text-white/80 hover:text-white hover:bg-white/20"
            }`}
            title="Custom Duration Slider (C)"
          >
            <Sliders className="size-4" />
          </button>

          {/* Complete Task & Leave */}
          <button
            onClick={async () => {
              setPending(true);
              await completeAndLeaveFocus(task.id);
              onClose();
            }}
            disabled={pending}
            className="flex items-center gap-1.5 px-4 py-3 min-h-[44px] rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black text-xs font-black hover:opacity-90 transition-all active:scale-95 shadow-sm"
          >
            <CheckCircle2 className="size-4" />
            <span className="hidden sm:inline">Victory</span>
          </button>
        </div>
      </div>
    </>
  );
}
