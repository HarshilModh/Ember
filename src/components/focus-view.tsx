"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { addLog, completeAndLeaveFocus } from "@/app/actions";
import { PomodoroTimer } from "@/components/pomodoro-timer";
import { FlowSanctuary } from "@/components/flow-sanctuary";
import type { Log, Task } from "@/db/schema";
import { PRIORITY_COLORS, PRIORITY_LABELS, relativeDue } from "@/lib/format";
import { useFocus } from "@/context/focus-context";
import {
  CheckCircle2,
  ArrowLeft,
  Send,
  Compass,
  Terminal,
  FileText,
  Sparkles,
} from "lucide-react";

export function FocusView({ task, logs }: { task: Task; logs: Log[] }) {
  const router = useRouter();
  const { setActiveTask } = useFocus();
  const [note, setNote] = useState("");
  const [inSanctuary, setInSanctuary] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (task) {
      setActiveTask({
        id: task.id,
        title: task.title,
        notes: task.notes,
        priority: task.priority,
      });
    }
  }, [task.id, task.title, task.notes, task.priority, setActiveTask]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      const el = e.target;
      if (el instanceof HTMLInputElement && el.value.trim() !== "") {
        setNote("");
        return;
      }
      if (inSanctuary) {
        setInSanctuary(false);
        return;
      }
      router.push("/");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, inSanctuary]);

  return (
    <>
      {/* Brand-New Immersive Flow Sanctuary Portal */}
      {inSanctuary && (
        <FlowSanctuary
          task={task}
          logs={logs}
          onClose={() => setInSanctuary(false)}
        />
      )}

      {/* Standard Focus View */}
      <main className="grid min-h-dvh place-items-center px-4 py-8 sm:px-6 animate-reveal">
        <div className="w-full max-w-2xl space-y-6">
          {/* Navigation Toolbar */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl border border-line/80 bg-surface/80 text-xs font-bold text-muted hover:text-ink hover:border-accent/40 transition-all active:scale-95 shadow-2xs backdrop-blur-md"
            >
              <ArrowLeft className="size-4 text-accent" />
              <span>Leave Session</span>
            </button>

            <div className="flex items-center gap-2">
              {/* Flow Sanctuary Mode Toggle */}
              <button
                onClick={() => setInSanctuary(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 text-xs font-extrabold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all active:scale-95 shadow-2xs"
                title="Enter Flow Sanctuary World Experience"
              >
                <Compass className="size-4 animate-spin-slow" />
                <span>Flow Sanctuary</span>
              </button>

              <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                Focus Zone
              </span>
            </div>
          </div>

          {/* Main Task Context Card */}
          <div className="relative overflow-hidden rounded-3xl border border-line/80 bg-surface p-6 sm:p-8 shadow-sm">
            <div className="absolute -top-24 -right-24 size-48 bg-accent/15 rounded-full blur-3xl pointer-events-none" />

            {/* Priority & Due Badge */}
            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-raised border border-line/50 text-ink">
                <span
                  className={`size-2 rounded-full priority-dot-${task.priority}`}
                  style={{ background: PRIORITY_COLORS[task.priority] }}
                />
                {PRIORITY_LABELS[task.priority]} Priority
              </span>
              {task.dueAt && (
                <span className="text-faint font-medium">due {relativeDue(task.dueAt)}</span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug text-ink">
              {task.title}
            </h1>

            {task.notes && (
              <div className="mt-4 rounded-2xl bg-raised/70 p-4 border border-line/50 text-xs sm:text-sm leading-relaxed text-muted whitespace-pre-wrap flex items-start gap-2.5">
                <FileText className="size-4 text-accent shrink-0 mt-0.5" />
                <div>{task.notes}</div>
              </div>
            )}

            {/* Circular SVG Pomodoro Timer & Audio HUD */}
            <div className="mt-6">
              <PomodoroTimer isZen={false} />
            </div>

            {/* Real-time Note Logger */}
            <form
              className="mt-8 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const value = note;
                setNote("");
                startTransition(() => void addLog(task.id, value));
              }}
            >
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Record a thought, snippet, or milestone as you focus… (Enter to log)"
                className="min-w-0 flex-1 rounded-2xl border border-line/80 bg-raised px-4 py-3 text-xs sm:text-sm outline-none placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all"
              />
              <button
                disabled={!note.trim() || pending}
                className="flex items-center gap-1.5 rounded-2xl bg-accent px-5 py-3 text-xs sm:text-sm font-bold text-white transition-all enabled:hover:opacity-95 enabled:active:scale-95 disabled:opacity-40 shadow-xs"
              >
                <Send className="size-4" />
                <span>Log</span>
              </button>
            </form>

            {/* Session Notes Stream (Terminal Style) */}
            {logs.length > 0 && (
              <div className="mt-8 border-t border-line/60 pt-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-faint flex items-center gap-1.5">
                  <Terminal className="size-3.5 text-accent" />
                  Session Real-time Stream ({logs.length})
                </h3>
                <ul className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {logs.map((l) => (
                    <li
                      key={l.id}
                      className="flex items-start gap-3 rounded-2xl bg-raised/60 p-3 text-xs border border-line/40 shadow-2xs font-mono"
                    >
                      <time className="shrink-0 text-[10px] text-accent bg-accent/10 px-2 py-0.5 rounded-md border border-accent/20 font-bold">
                        {l.createdAt.toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                      <span className="text-ink leading-relaxed font-sans font-semibold">{l.note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Bottom Toolbar & Shortcuts */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line/60 pt-6">
              <button
                onClick={() => startTransition(() => void completeAndLeaveFocus(task.id))}
                disabled={pending}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-accent hover:opacity-90 px-6 py-3.5 text-sm font-bold text-white transition-all active:scale-95 shadow-md disabled:opacity-50"
              >
                <CheckCircle2 className="size-5" />
                <span>Complete Task & Log Victory</span>
              </button>

              <div className="flex items-center gap-2 text-[11px] font-mono text-faint">
                <kbd className="rounded-md border border-line/80 bg-raised px-2 py-1 shadow-2xs">
                  Space
                </kbd>
                <span>Play/Pause</span>
                <kbd className="rounded-md border border-line/80 bg-raised px-2 py-1 shadow-2xs ml-1">
                  Esc
                </kbd>
                <span>Exit</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
