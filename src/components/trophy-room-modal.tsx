"use client";

import { Trophy, Award, Star, Zap, Shield, Crown, Sparkles, X } from "lucide-react";

export function TrophyRoomModal({
  isOpen,
  onClose,
  totalHours = 48.5,
}: {
  isOpen: boolean;
  onClose: () => void;
  totalHours?: number;
}) {
  if (!isOpen) return null;

  const trophies = [
    { title: "Ignition", desc: "Complete first 5-minute sprint", icon: Zap, unlocked: true },
    { title: "Deep State", desc: "Complete 10 hours of focus", icon: Shield, unlocked: true },
    { title: "Flow Architect", desc: "Complete 25 hours of focus", icon: Star, unlocked: true },
    { title: "Master Focus", desc: "Complete 50 hours of focus", icon: Crown, unlocked: totalHours >= 50 },
    { title: "Grandmaster", desc: "Complete 100 hours of focus", icon: Trophy, unlocked: totalHours >= 100 },
  ];

  const level = Math.floor(totalHours / 10) + 1;
  const nextLevelProgress = ((totalHours % 10) / 10) * 100;

  return (
    <div className="fixed inset-0 z-[130] grid place-items-center bg-black/85 backdrop-blur-2xl p-4 animate-reveal">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-slate-950 p-6 sm:p-8 shadow-2xl space-y-6 text-center">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          <X className="size-5" />
        </button>

        {/* Level Header */}
        <div className="space-y-2 pt-2">
          <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3.5 py-1 rounded-full border border-amber-500/30 inline-flex items-center gap-1.5 shadow-xs">
            <Trophy className="size-3.5" />
            RPG Focus Level
          </span>

          <h2 className="text-3xl font-black text-white tracking-tight">
            Level {level} Flow Architect
          </h2>

          <p className="text-xs text-white/60">
            {totalHours} Total Hours logged • {10 - (totalHours % 10)}h left to Level {level + 1}
          </p>

          {/* Level Progress Bar */}
          <div className="w-full bg-white/10 rounded-full h-3 p-0.5 border border-white/15 overflow-hidden mt-3">
            <div
              className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-xs"
              style={{ width: `${nextLevelProgress}%` }}
            />
          </div>
        </div>

        {/* Trophy Grid */}
        <div className="space-y-2.5 text-left pt-2">
          {trophies.map((t, i) => {
            const Icon = t.icon;
            return (
              <div
                key={i}
                className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                  t.unlocked
                    ? "bg-amber-500/10 border-amber-500/30 text-white"
                    : "bg-white/5 border-white/10 text-white/40 grayscale opacity-60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${t.unlocked ? "bg-amber-500/20 text-amber-400" : "bg-white/10 text-white/30"}`}>
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black">{t.title}</h3>
                    <p className="text-[11px] text-white/50">{t.desc}</p>
                  </div>
                </div>

                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                  t.unlocked ? "text-amber-300 border-amber-500/40 bg-amber-500/20" : "text-white/30 border-white/10"
                }`}>
                  {t.unlocked ? "Unlocked" : "Locked"}
                </span>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-white text-black text-xs font-black hover:bg-white/90"
        >
          Done
        </button>
      </div>
    </div>
  );
}
