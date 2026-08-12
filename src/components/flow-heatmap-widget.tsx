"use client";

import { useMemo } from "react";
import { Sparkles, Calendar, Flame } from "lucide-react";

export function FlowHeatmapWidget({ streak = 5 }: { streak?: number }) {
  // Generate 28-day (4-week) simulated deep work intensity grid
  const days = useMemo(() => {
    const list = [];
    const now = new Date();
    for (let i = 27; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      // Give realistic hours based on day
      const dayNum = d.getDay();
      let hours = (i * 3 + dayNum * 7) % 5;
      if (dayNum === 0 || dayNum === 6) hours = Math.floor(hours / 2);
      list.push({
        date: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        hours,
      });
    }
    return list;
  }, []);

  function getIntensityBg(hours: number) {
    if (hours === 0) return "bg-raised/60 border-line/40";
    if (hours === 1) return "bg-emerald-500/25 border-emerald-500/40 text-emerald-300";
    if (hours === 2) return "bg-emerald-500/50 border-emerald-400 text-emerald-100";
    if (hours === 3) return "bg-emerald-500 border-emerald-300 text-black font-bold";
    return "bg-emerald-400 border-white text-black font-black shadow-xs animate-pulse";
  }

  return (
    <div className="rounded-3xl border border-line/80 bg-surface p-6 shadow-2xs space-y-4 hover:border-accent/40 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
            <Calendar className="size-3" />
            28-Day Flow Velocity
          </span>
        </div>

        <span className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
          <Flame className="size-3 fill-amber-500/30" />
          <span>{streak} Day Streak</span>
        </span>
      </div>

      {/* Heatmap Grid */}
      <div className="grid grid-cols-7 gap-2 pt-2">
        {days.map((item, idx) => (
          <div
            key={idx}
            title={`${item.date}: ${item.hours}h deep work`}
            className={`aspect-square rounded-xl border flex flex-col items-center justify-center p-1 text-[10px] transition-all hover:scale-110 cursor-pointer ${getIntensityBg(
              item.hours
            )}`}
          >
            <span className="font-mono text-[9px] opacity-70">{item.date.split(" ")[1]}</span>
            <span className="font-bold">{item.hours}h</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-[11px] text-faint font-semibold pt-1 border-t border-line/40">
        <span>Less Flow</span>
        <div className="flex items-center gap-1">
          <span className="size-2.5 rounded-md bg-raised border border-line/40" />
          <span className="size-2.5 rounded-md bg-emerald-500/25 border border-emerald-500/40" />
          <span className="size-2.5 rounded-md bg-emerald-500/50 border border-emerald-400" />
          <span className="size-2.5 rounded-md bg-emerald-500 border border-emerald-300" />
        </div>
        <span>More Flow</span>
      </div>
    </div>
  );
}
