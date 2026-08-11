"use client";

import { Sparkles } from "lucide-react";

export function RelaunchTourButton() {
  function handleTrigger() {
    window.dispatchEvent(new CustomEvent("ember_open_onboarding"));
  }

  return (
    <button
      type="button"
      onClick={handleTrigger}
      className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-accent text-white font-extrabold text-xs shadow-md hover:opacity-95 transition-all active:scale-95 shrink-0"
    >
      <Sparkles className="size-4 animate-spin-slow" />
      <span>Re-launch Welcome Tour</span>
    </button>
  );
}
