"use client";

import { Flame, Zap, Award, Crown, CheckCircle2 } from "lucide-react";

export function FlowVelocityBadge({
  secondsLeft,
  totalDuration,
}: {
  secondsLeft: number;
  totalDuration: number;
}) {
  const elapsedMins = Math.floor((totalDuration - secondsLeft) / 60);

  const milestones = [
    { mins: 5, label: "Ignition", icon: Flame, color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
    { mins: 15, label: "Deep State", icon: Zap, color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
    { mins: 25, label: "Flow Velocity", icon: Award, color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10" },
    { mins: 45, label: "Master Focus", icon: Crown, color: "text-purple-400 border-purple-500/30 bg-purple-500/10" },
  ];

  const achieved = milestones.filter((m) => elapsedMins >= m.mins);
  const currentBadge = achieved[achieved.length - 1];

  if (!currentBadge) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/50 text-[11px] font-mono">
        <Flame className="size-3.5" />
        <span>Warming up ({elapsedMins}m)</span>
      </div>
    );
  }

  const IconComp = currentBadge.icon;

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-black shadow-xs ${currentBadge.color}`}>
      <IconComp className="size-3.5" />
      <span>{currentBadge.label} ({elapsedMins}m)</span>
    </div>
  );
}
