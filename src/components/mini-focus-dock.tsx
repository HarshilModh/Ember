"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFocus, DURATIONS, PHASE_LABEL } from "@/context/focus-context";
import { Play, Pause, Maximize2, Zap, Coffee } from "lucide-react";

export function MiniFocusDock() {
  const pathname = usePathname();
  const { phase, secondsLeft, running, activeTask, toggleSession } = useFocus();

  // Only render on non-focus pages when session has started or is running
  const isFocusPage = pathname?.startsWith("/focus");
  const isSessionStarted = running || secondsLeft < DURATIONS[phase];

  if (isFocusPage || !isSessionStarted) return null;

  const mm = String(Math.floor(Math.max(0, secondsLeft) / 60)).padStart(2, "0");
  const ss = String(Math.max(0, secondsLeft) % 60).padStart(2, "0");
  const onBreak = phase !== "focus";

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-reveal">
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-surface/90 border border-accent/30 shadow-xl backdrop-blur-xl group hover:border-accent transition-all">
        {/* Pulsing Status Dot */}
        <div className="flex items-center gap-2">
          {onBreak ? (
            <Coffee className="size-4 text-amber-500" />
          ) : (
            <Zap className={`size-4 ${running ? "text-emerald-500 animate-pulse" : "text-muted"}`} />
          )}
          <span className="font-mono font-extrabold text-sm text-ink tabular-nums">
            {mm}:{ss}
          </span>
        </div>

        {/* Task Title / Phase */}
        <div className="hidden sm:flex flex-col max-w-[200px] truncate border-l border-line/60 pl-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-accent truncate">
            {PHASE_LABEL[phase]}
          </span>
          <span className="text-xs font-semibold text-ink truncate">
            {activeTask?.title || "Focus Session"}
          </span>
        </div>

        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={toggleSession}
          title={running ? "Pause" : "Resume"}
          className="p-1.5 rounded-full bg-accent text-white hover:opacity-90 active:scale-95 transition-all shadow-xs"
        >
          {running ? <Pause className="size-3.5" /> : <Play className="size-3.5 fill-current ml-0.5" />}
        </button>

        {/* Expand HUD Link */}
        <Link
          href={activeTask?.id ? `/focus?id=${activeTask.id}` : "/focus"}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-raised text-xs font-bold text-ink hover:bg-accent/15 hover:text-accent transition-all"
        >
          <span>Expand</span>
          <Maximize2 className="size-3 text-accent" />
        </Link>
      </div>
    </div>
  );
}
