"use client";

import { PieChart, Clock, Tag, Sparkles } from "lucide-react";

export function TimeAuditWidget() {
  const categories = [
    { label: "Engineering / Code", hours: 4.5, percent: 45, color: "bg-emerald-400" },
    { label: "Design & UX", hours: 2.5, percent: 25, color: "bg-cyan-400" },
    { label: "Writing & Docs", hours: 1.5, percent: 15, color: "bg-amber-400" },
    { label: "Admin & Ops", hours: 1.5, percent: 15, color: "bg-purple-400" },
  ];

  return (
    <div className="rounded-3xl border border-line/80 bg-surface p-6 shadow-2xs space-y-4 hover:border-accent/40 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2.5 py-0.5 rounded-full border border-accent/20 flex items-center gap-1">
          <PieChart className="size-3" />
          Time Audit Breakdown
        </span>
        <span className="text-xs font-mono font-bold text-faint">10.0h Total Today</span>
      </div>

      {/* Stacked Percentage Bar */}
      <div className="w-full bg-raised rounded-full h-4 p-0.5 border border-line/60 flex overflow-hidden">
        {categories.map((c) => (
          <div
            key={c.label}
            className={`${c.color} h-full transition-all hover:opacity-90`}
            style={{ width: `${c.percent}%` }}
            title={`${c.label}: ${c.hours}h (${c.percent}%)`}
          />
        ))}
      </div>

      {/* Legend list */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        {categories.map((c) => (
          <div key={c.label} className="flex items-center justify-between text-xs p-2 rounded-xl bg-raised/50 border border-line/40">
            <div className="flex items-center gap-2 truncate">
              <span className={`size-2.5 rounded-full ${c.color} shrink-0`} />
              <span className="font-semibold text-ink truncate text-[11px]">{c.label}</span>
            </div>
            <span className="font-mono text-faint text-[10px] font-bold">{c.hours}h</span>
          </div>
        ))}
      </div>
    </div>
  );
}
