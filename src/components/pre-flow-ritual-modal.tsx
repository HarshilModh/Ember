"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Sparkles, X, Play, Droplet, Smartphone, Wind, Mail } from "lucide-react";

export function PreFlowRitualModal({
  isOpen,
  onClose,
  onStartFlow,
}: {
  isOpen: boolean;
  onClose: () => void;
  onStartFlow: () => void;
}) {
  const [items, setItems] = useState([
    { id: 1, label: "Hydrate & Clear Workspace", icon: Droplet, checked: false },
    { id: 2, label: "Turn Phone to Do Not Disturb", icon: Smartphone, checked: false },
    { id: 3, label: "Close Email & Messaging Tabs", icon: Mail, checked: false },
    { id: 4, label: "Take 3 Deep Breathing Cycles", icon: Wind, checked: false },
  ]);

  if (!isOpen) return null;

  const allChecked = items.every((i) => i.checked);

  function toggleItem(id: number) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  }

  return (
    <div className="fixed inset-0 z-[125] grid place-items-center bg-black/80 backdrop-blur-2xl p-4 animate-reveal">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-slate-950 p-6 sm:p-8 shadow-2xl text-center space-y-6">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          <X className="size-5" />
        </button>

        <div className="space-y-1">
          <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/30 inline-flex items-center gap-1.5 shadow-xs">
            <Sparkles className="size-3.5" />
            Pre-Flow Ritual Priming
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight pt-2">
            30s Habit Stack
          </h2>
          <p className="text-xs text-white/60">
            Check off micro-rituals to scientifically prime your brain for deep focus.
          </p>
        </div>

        {/* Checklist */}
        <div className="space-y-2.5 text-left pt-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleItem(item.id)}
                className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between active:scale-95 ${
                  item.checked
                    ? "bg-emerald-500/20 border-emerald-400/50 text-white shadow-md"
                    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`size-5 ${item.checked ? "text-emerald-400" : "text-white/40"}`} />
                  <span className="text-xs font-bold">{item.label}</span>
                </div>
                {item.checked ? (
                  <CheckCircle2 className="size-5 text-emerald-400 fill-emerald-400/20" />
                ) : (
                  <Circle className="size-5 text-white/30" />
                )}
              </button>
            );
          })}
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            onClose();
            onStartFlow();
          }}
          className={`w-full py-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${
            allChecked
              ? "bg-emerald-400 text-black hover:bg-emerald-300 shadow-emerald-500/20 animate-bounce-subtle"
              : "bg-white text-black hover:bg-white/90"
          }`}
        >
          <Play className="size-4 fill-current" />
          <span>{allChecked ? "Ritual Complete ➔ Enter Flow" : "Launch Flow Now"}</span>
        </button>
      </div>
    </div>
  );
}
