"use client";

import { useState, useEffect } from "react";
import { X, Play, Pause, HeartPulse, CheckCircle2, Sparkles } from "lucide-react";

export function BoxBreathingModal({
  isOpen,
  onClose,
  onStartFocus,
}: {
  isOpen: boolean;
  onClose: () => void;
  onStartFocus: () => void;
}) {
  const [seconds, setSeconds] = useState(60);
  const [phase, setPhase] = useState<"inhale" | "hold1" | "exhale" | "hold2">("inhale");
  const [phaseSec, setPhaseSec] = useState(4);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!isOpen || paused) return;

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });

      setPhaseSec((pSec) => {
        if (pSec <= 1) {
          setPhase((currentP) => {
            if (currentP === "inhale") return "hold1";
            if (currentP === "hold1") return "exhale";
            if (currentP === "exhale") return "hold2";
            return "inhale";
          });
          return 4;
        }
        return pSec - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, paused]);

  if (!isOpen) return null;

  const phaseDetails = {
    inhale: {
      title: "Inhale Slowly",
      subtitle: "Breathe in deeply through your nose...",
      color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
      glow: "bg-emerald-500/25 scale-125 shadow-[0_0_80px_rgba(16,185,129,0.5)]",
      ring: "stroke-emerald-400",
    },
    hold1: {
      title: "Hold Breath",
      subtitle: "Hold your lungs full and calm...",
      color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
      glow: "bg-amber-500/25 scale-125 shadow-[0_0_80px_rgba(245,158,11,0.5)]",
      ring: "stroke-amber-400",
    },
    exhale: {
      title: "Exhale Slowly",
      subtitle: "Release all tension through your mouth...",
      color: "text-sky-400 border-sky-500/30 bg-sky-500/10",
      glow: "bg-sky-500/20 scale-90 shadow-[0_0_60px_rgba(56,189,248,0.4)]",
      ring: "stroke-sky-400",
    },
    hold2: {
      title: "Rest Empty",
      subtitle: "Pause and feel the stillness...",
      color: "text-purple-400 border-purple-500/30 bg-purple-500/10",
      glow: "bg-purple-500/20 scale-90 shadow-[0_0_60px_rgba(168,85,247,0.4)]",
      ring: "stroke-purple-400",
    },
  };

  const currentPhase = phaseDetails[phase];

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center bg-black/80 backdrop-blur-2xl p-4 animate-reveal">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-slate-950 p-6 sm:p-10 shadow-2xl text-center space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          <X className="size-5" />
        </button>

        {/* Title Header */}
        <div className="space-y-1">
          <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/30 inline-flex items-center gap-1.5 shadow-xs">
            <HeartPulse className="size-3.5" />
            Neurological Flow Prep
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight pt-2">
            60s Box Breathing
          </h2>
          <p className="text-xs text-white/60">
            Lower your heart rate and prime your mind for deep cognitive focus.
          </p>
        </div>

        {/* Hypnotic Breathing Visualizer */}
        <div className="relative grid place-items-center my-4 py-8">
          {/* Ambient Glowing Orb */}
          <div
            className={`absolute size-56 rounded-full blur-2xl transition-all duration-1000 ease-in-out ${currentPhase.glow}`}
          />

          {/* SVG Ring */}
          <svg className="relative z-10 size-64 -rotate-90 transform drop-shadow-xl" viewBox="0 0 200 200">
            <circle
              cx="100"
              cy="100"
              r="75"
              className="stroke-white/10"
              strokeWidth="6"
              fill="transparent"
            />
            <circle
              cx="100"
              cy="100"
              r="75"
              className={`transition-all duration-1000 ease-in-out ${currentPhase.ring}`}
              strokeWidth="8"
              strokeDasharray={2 * Math.PI * 75}
              strokeDashoffset={(2 * Math.PI * 75 * (4 - phaseSec)) / 4}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Inner Countdown */}
          <div className="absolute z-20 flex flex-col items-center justify-center text-center space-y-1">
            <span className="text-5xl font-black font-mono text-white tabular-nums drop-shadow-md">
              {phaseSec}s
            </span>
            <span className={`text-xs font-black uppercase tracking-widest px-3 py-0.5 rounded-full border ${currentPhase.color}`}>
              {currentPhase.title}
            </span>
          </div>
        </div>

        {/* Phase Guidance Subtitle */}
        <p className="text-sm font-semibold text-white/90 h-6">
          {currentPhase.subtitle}
        </p>

        {/* 4-Step Phase Pills */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/10">
          {[
            { id: "inhale", label: "Inhale (4s)" },
            { id: "hold1", label: "Hold (4s)" },
            { id: "exhale", label: "Exhale (4s)" },
            { id: "hold2", label: "Rest (4s)" },
          ].map((step) => {
            const active = phase === step.id;
            return (
              <div
                key={step.id}
                className={`py-2 rounded-xl text-[11px] font-extrabold transition-all text-center border ${
                  active
                    ? "bg-white text-black border-white shadow-md scale-105"
                    : "bg-white/5 text-white/50 border-white/10"
                }`}
              >
                {step.label}
              </div>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => setPaused(!paused)}
            className="p-2.5 rounded-2xl border border-white/15 bg-white/10 text-white/80 hover:text-white transition-all active:scale-95 text-xs font-bold flex items-center gap-1.5"
          >
            {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
            <span>{paused ? "Resume" : "Pause"}</span>
          </button>

          <span className="text-xs font-mono text-white/50">
            {seconds}s left
          </span>

          <button
            onClick={() => {
              onClose();
              onStartFocus();
            }}
            className="px-6 py-2.5 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-black flex items-center gap-2 transition-all shadow-md active:scale-95"
          >
            <Sparkles className="size-4" />
            <span>Launch Flow</span>
          </button>
        </div>
      </div>
    </div>
  );
}
