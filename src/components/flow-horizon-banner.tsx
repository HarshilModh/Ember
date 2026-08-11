"use client";

import { useState } from "react";
import Link from "next/link";
import { type Task } from "@/db/schema";
import { type QuoteItem, quoteOfTheDay, randomQuote } from "@/lib/quotes";
import {
  Zap,
  Flame,
  Play,
  RotateCw,
  Sparkles,
  Trophy,
  Quote,
  Target,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export function FlowHorizonBanner({
  streak,
  doneToday,
  openToday,
  topTask,
  initialQuote,
}: {
  streak: number;
  doneToday: number;
  openToday: number;
  topTask?: Task;
  initialQuote?: QuoteItem;
}) {
  const [flipped, setFlipped] = useState(false);
  const [quote, setQuote] = useState<QuoteItem>(() => initialQuote ?? quoteOfTheDay());

  // Momentum Battery percentage: done vs (done + open)
  const total = doneToday + openToday;
  const momentumPercent = total > 0 ? Math.round((doneToday / total) * 100) : 0;

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? "Good Morning"
      : hour < 18
      ? "Good Afternoon"
      : "Good Evening";

  function handleFlip() {
    setFlipped(!flipped);
    if (!flipped) {
      setQuote((prev) => randomQuote(prev));
    }
  }

  return (
    <div className="space-y-6">
      {/* Morning Spark & Momentum Battery Header Card */}
      <div className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-surface via-surface/90 to-surface-container/50 p-6 sm:p-7 shadow-sm transition-all hover:border-accent/30">
        <div className="absolute -top-24 -right-24 size-56 bg-accent/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Greeting & Streak */}
          <div className="space-y-2 max-w-lg">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-accent bg-accent/10 px-2.5 py-0.5 rounded-full border border-accent/20 flex items-center gap-1">
                <Sparkles className="size-3 text-amber-500 fill-amber-500/20" />
                <span>Daily Horizon</span>
              </span>
              <span className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                <Flame className="size-3 fill-amber-500/30 animate-pulse" />
                <span>{streak} Day Streak</span>
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
              {greeting}, Ready to Focus?
            </h2>

            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              {openToday > 0
                ? `You have ${openToday} tasks on deck today. Push your daily momentum to 100%!`
                : "All clear for today! Take a deep work practice session or add new goals."}
            </p>
          </div>

          {/* Daily Momentum Battery Gauge */}
          <div className="bg-raised/70 rounded-2xl p-4 border border-line/60 flex flex-col gap-2 min-w-[220px]">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-ink flex items-center gap-1.5">
                <Zap className="size-4 text-emerald-400 fill-emerald-400/20" />
                Daily Momentum
              </span>
              <span className="font-mono text-emerald-400">{momentumPercent}%</span>
            </div>

            {/* Battery Level Progress Bar */}
            <div className="w-full bg-surface rounded-full h-3 p-0.5 border border-line/50 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-accent h-full rounded-full transition-all duration-500 shadow-2xs"
                style={{ width: `${Math.max(momentumPercent, 6)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-faint font-semibold">
              <span>{doneToday} Done</span>
              <span>{openToday} Pending</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: 3D Mindset Card Flip + Top 1 Flow Horizon Spotlight */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. 3D Mindset Oracle Card Flip */}
        <div
          onClick={handleFlip}
          className="cursor-pointer group relative perspective-1000 min-h-[170px]"
          title="Click to flip quote oracle"
        >
          <div
            className={`relative w-full h-full rounded-3xl border border-line/80 bg-surface p-6 shadow-2xs transition-all duration-500 transform-style-3d hover:border-accent/40 ${
              flipped ? "rotate-y-180 bg-accent/5 border-accent/30" : ""
            }`}
          >
            {/* Front of Card */}
            <div className="flex flex-col justify-between h-full backface-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2.5 py-0.5 rounded-full border border-accent/20 flex items-center gap-1">
                  <Quote className="size-3" />
                  3D Mindset Card
                </span>
                <span className="text-xs font-semibold text-faint flex items-center gap-1 group-hover:text-accent transition-colors">
                  <RotateCw className="size-3.5" />
                  Tap to Flip
                </span>
              </div>

              <div className="my-3">
                <p className="text-base font-bold text-ink leading-snug line-clamp-2">
                  "{quote.text}"
                </p>
                <p className="text-xs font-semibold text-muted mt-1">— {quote.who}</p>
              </div>

              <div className="text-[11px] text-faint flex items-center gap-1 font-medium">
                <Sparkles className="size-3 text-amber-500" />
                <span>Daily mindset trigger</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Top 1 High-Impact Flow Spotlight Task */}
        {topTask ? (
          <div className="bg-surface rounded-3xl border border-line/80 p-6 shadow-2xs flex flex-col justify-between relative overflow-hidden group hover:border-accent/40 transition-all">
            <div className="absolute -top-20 -right-20 size-40 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20 flex items-center gap-1">
                  <Target className="size-3" />
                  Top Priority Flow
                </span>
                <span className="text-[11px] font-semibold text-faint">Immediate Action</span>
              </div>

              <h3 className="text-lg font-bold text-ink group-hover:text-accent transition-colors line-clamp-1">
                {topTask.title}
              </h3>
              {topTask.notes && (
                <p className="text-xs text-muted mt-1 line-clamp-2">{topTask.notes}</p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-line/40 flex items-center justify-between">
              <span className="text-xs font-semibold text-faint">Start working now</span>
              <Link
                href={`/focus?id=${topTask.id}`}
                className="bg-accent text-white px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-xs flex items-center gap-1.5"
              >
                <Play className="size-3.5 fill-current" />
                <span>Launch Flow</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-surface rounded-3xl border border-line/80 p-6 shadow-2xs flex flex-col items-center justify-center text-center gap-2">
            <CheckCircle2 className="size-8 text-emerald-400" />
            <h3 className="text-sm font-bold text-ink">No Urgent Task Pending</h3>
            <p className="text-xs text-faint">Add a task below to spotlight your next flow session.</p>
          </div>
        )}
      </div>
    </div>
  );
}
