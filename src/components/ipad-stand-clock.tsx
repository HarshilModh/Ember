"use client";

import { useState, useEffect } from "react";
import { X, Sun, Moon, Flame, Zap, Volume2 } from "lucide-react";

export function IpadStandClock({
  isOpen,
  onClose,
  taskTitle,
}: {
  isOpen: boolean;
  onClose: () => void;
  taskTitle?: string;
}) {
  const [timeStr, setTimeStr] = useState("");
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    function updateTime() {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setDateStr(
        now.toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        })
      );
    }

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[140] bg-black text-white flex flex-col items-center justify-between p-8 sm:p-14 animate-reveal select-none">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3.5 py-1.5 rounded-full border border-emerald-500/30">
          <Sun className="size-4 animate-spin-slow" />
          <span>iPad Always-On Desk Stand Mode</span>
        </div>

        <button
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-white/20 bg-white/10 text-xs font-bold text-white hover:bg-white/20 transition-all active:scale-95"
        >
          <X className="size-4" />
          <span>Exit Clock</span>
        </button>
      </div>

      {/* Giant Clock Readout Centerpiece */}
      <div className="flex flex-col items-center justify-center text-center space-y-4 my-auto">
        <div className="text-8xl sm:text-9xl md:text-[13rem] font-black font-mono tracking-tight text-white tabular-nums drop-shadow-[0_0_50px_rgba(16,185,129,0.3)] leading-none">
          {timeStr}
        </div>
        <div className="text-xl sm:text-2xl font-extrabold text-white/70 tracking-widest uppercase">
          {dateStr}
        </div>

        {taskTitle && (
          <div className="mt-6 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-5 py-2 rounded-full text-emerald-400 text-sm font-bold">
            <Zap className="size-4" />
            <span>Active Goal: {taskTitle}</span>
          </div>
        )}
      </div>

      {/* Bottom Footer Info */}
      <div className="w-full flex items-center justify-between text-xs text-white/40 border-t border-white/10 pt-4 font-mono">
        <span>Ember Ambient Desk Stand</span>
        <span>Tap anywhere to interact</span>
      </div>
    </div>
  );
}
