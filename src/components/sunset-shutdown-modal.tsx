"use client";

import { useState } from "react";
import { Sunset, Sparkles, X, Check, Heart, ShieldAlert, Target } from "lucide-react";

export function SunsetShutdownModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [win, setWin] = useState("");
  const [obstacle, setObstacle] = useState("");
  const [tomorrowGoal, setTomorrowGoal] = useState("");
  const [completed, setCompleted] = useState(false);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCompleted(true);
    setTimeout(() => {
      setCompleted(false);
      onClose();
    }, 1800);
  }

  return (
    <div className="fixed inset-0 z-[130] grid place-items-center bg-black/85 backdrop-blur-2xl p-4 animate-reveal">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-slate-950 p-6 sm:p-8 shadow-2xl space-y-6 text-center">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          <X className="size-5" />
        </button>

        {completed ? (
          <div className="py-12 space-y-3 animate-reveal">
            <Sunset className="size-16 text-amber-400 mx-auto animate-pulse" />
            <h2 className="text-2xl font-black text-white">Workday Shutdown Complete</h2>
            <p className="text-xs text-emerald-400 font-semibold">
              Enjoy your evening! Tomorrow's priority is ready on deck.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            <div className="text-center space-y-1">
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3.5 py-1 rounded-full border border-amber-500/30 inline-flex items-center gap-1.5 shadow-xs">
                <Sunset className="size-3.5" />
                Sunset Shutdown Ritual
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight pt-1">
                Disconnect Stress-Free
              </h2>
              <p className="text-xs text-white/60">
                2-minute evening debrief to close out today and lock in tomorrow.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Heart className="size-3.5 text-rose-400" />
                  What was your biggest win today?
                </label>
                <input
                  required
                  value={win}
                  onChange={(e) => setWin(e.target.value)}
                  placeholder="e.g. Shipped the iPad feature suite..."
                  className="w-full rounded-2xl border border-white/15 bg-black/50 px-4 py-2.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldAlert className="size-3.5 text-amber-400" />
                  What was your biggest friction/distraction?
                </label>
                <input
                  value={obstacle}
                  onChange={(e) => setObstacle(e.target.value)}
                  placeholder="e.g. Too many tab switches early on..."
                  className="w-full rounded-2xl border border-white/15 bg-black/50 px-4 py-2.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Target className="size-3.5 text-emerald-400" />
                  What is your #1 priority for tomorrow?
                </label>
                <input
                  required
                  value={tomorrowGoal}
                  onChange={(e) => setTomorrowGoal(e.target.value)}
                  placeholder="e.g. Write documentation and review PRs..."
                  className="w-full rounded-2xl border border-white/15 bg-black/50 px-4 py-2.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              <Check className="size-4" />
              <span>Complete Evening Shutdown</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
