"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Zap,
  Headphones,
  Sliders,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Target,
  Flame,
  MessageSquare,
  BarChart3,
} from "lucide-react";

export function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      const onboarded = localStorage.getItem("ember_onboarded_v2");
      if (!onboarded) {
        setOpen(true);
      }
    } catch {}

    function handleReopen() {
      setStep(0);
      setOpen(true);
    }

    window.addEventListener("ember_open_onboarding", handleReopen);
    return () => window.removeEventListener("ember_open_onboarding", handleReopen);
  }, []);

  function handleClose() {
    setOpen(false);
    try {
      localStorage.setItem("ember_onboarded_v2", "true");
    } catch {}
  }

  if (!open) return null;

  const slides = [
    {
      title: "Welcome to Ember",
      badge: "High-Impact Task & Flow Command",
      icon: Sparkles,
      iconBg: "bg-emerald-500/10 text-emerald-500",
      description:
        "Ember is designed to help you organize high-impact work, enter deep flow states, and build daily momentum with zero friction.",
      highlights: [
        { icon: Target, label: "Prioritized Tasks", detail: "High, Medium, and Low priority logging" },
        { icon: Flame, label: "Daily Momentum", detail: "Real-time battery meter & 3D mindset cards" },
      ],
    },
    {
      title: "Deep Focus & Ambient Soundscapes",
      badge: "Pure Offline Web Audio",
      icon: Headphones,
      iconBg: "bg-purple-500/10 text-purple-500",
      description:
        "Isolate single tasks with our dual-ring SVG timer and 7 offline synthesized soundscapes (40Hz Binaural Beta Waves, Soft Rain, 432Hz Solfeggio Zen Bowl).",
      highlights: [
        { icon: Zap, label: "Custom Focus Timer", detail: "Presets (15m, 45m, 90m) + slider + keyboard input" },
        { icon: Sliders, label: "Persistent Dock", detail: "Focus session remains active across page navigation" },
      ],
    },
    {
      title: "Keyboard Power & AI Assistant",
      badge: "Speed & Intelligence",
      icon: MessageSquare,
      iconBg: "bg-amber-500/10 text-amber-500",
      description:
        "Control your focus zone with single-key shortcuts or integrate Claude AI via Model Context Protocol (MCP) to manage your log in natural language.",
      highlights: [
        { icon: Zap, label: "Keyboard Shortcuts", detail: "Space (Play/Pause), R (Reset), C (Custom Time), Esc (Exit)" },
        { icon: MessageSquare, label: "Claude MCP Integration", detail: "Talk to your tasks right inside Claude Desktop or Code" },
      ],
    },
    {
      title: "Practice & Weekly Heatmap",
      badge: "Mastery & Growth",
      icon: BarChart3,
      iconBg: "bg-blue-500/10 text-blue-500",
      description:
        "Track technical practice problems with spaced repetition schedules, view completion streaks, and watch your daily progress soar.",
      highlights: [
        { icon: CheckCircle2, label: "Spaced Repetition", detail: "Never forget technical topics or code patterns" },
        { icon: BarChart3, label: "Analytics & Metrics", detail: "Comprehensive breakdown of your focus output" },
      ],
    },
  ];

  const currentSlide = slides[step];
  const IconComp = currentSlide.icon;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-md p-4 animate-reveal">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-line/80 bg-surface p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Close X */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 rounded-full text-muted hover:text-ink hover:bg-raised transition-all"
        >
          <X className="size-5" />
        </button>

        {/* Slide Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-accent bg-accent/10 px-3 py-1 rounded-full border border-accent/20">
              {currentSlide.badge}
            </span>
            <span className="text-xs font-mono text-faint ml-auto">
              Step {step + 1} of {slides.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${currentSlide.iconBg}`}>
              <IconComp className="size-7" />
            </div>
            <h2 className="text-2xl font-black text-ink tracking-tight">
              {currentSlide.title}
            </h2>
          </div>

          <p className="text-sm text-muted leading-relaxed">
            {currentSlide.description}
          </p>
        </div>

        {/* Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {currentSlide.highlights.map((h, i) => {
            const HIcon = h.icon;
            return (
              <div
                key={i}
                className="p-3.5 rounded-2xl bg-raised/70 border border-line/50 space-y-1"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                  <HIcon className="size-4 text-accent" />
                  <span>{h.label}</span>
                </div>
                <p className="text-[11px] text-muted leading-snug">{h.detail}</p>
              </div>
            );
          })}
        </div>

        {/* Progress Bar Dots */}
        <div className="flex items-center justify-between pt-4 border-t border-line/50">
          <div className="flex items-center gap-1.5">
            {slides.map((_, idx) => (
              <span
                key={idx}
                className={`h-2 rounded-full transition-all ${
                  idx === step
                    ? "w-7 bg-accent"
                    : "w-2 bg-line/80 hover:bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Nav Buttons */}
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="p-2.5 rounded-2xl border border-line/80 bg-raised/80 text-ink text-xs font-bold hover:bg-raised transition-all"
              >
                <ArrowLeft className="size-4" />
              </button>
            )}

            {step < slides.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="px-5 py-2.5 rounded-2xl bg-accent text-white text-xs font-bold flex items-center gap-1.5 hover:opacity-90 transition-all shadow-xs active:scale-95"
              >
                <span>Next</span>
                <ArrowRight className="size-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-accent text-white text-xs font-extrabold flex items-center gap-1.5 hover:opacity-95 transition-all shadow-md active:scale-95"
              >
                <CheckCircle2 className="size-4" />
                <span>Launch Ember</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
