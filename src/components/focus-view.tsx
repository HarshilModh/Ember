"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { addLog, completeAndLeaveFocus } from "@/app/actions";
import { PomodoroTimer } from "@/components/pomodoro-timer";
import type { Log, Task } from "@/db/schema";
import { PRIORITY_COLORS, PRIORITY_LABELS, relativeDue } from "@/lib/format";
import { CheckCircle2, ArrowLeft, Send, Clock, Sparkles } from "lucide-react";

export function FocusView({ task, logs }: { task: Task; logs: Log[] }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      // The cursor sits in the note field most of the time, so Escape has to
      // work from there. It discards a half-typed note first, and only leaves
      // once there is nothing to lose.
      const el = e.target;
      if (el instanceof HTMLInputElement && el.value.trim() !== "") {
        setNote("");
        return;
      }
      router.push("/");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-xl">
        <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-xl border border-line/80 relative overflow-hidden">
          <div className="mb-6 flex items-center gap-2 text-[12px] uppercase tracking-wider font-semibold text-faint">
            <span
              className={`size-2.5 rounded-full priority-dot-${task.priority}`}
              style={{ background: PRIORITY_COLORS[task.priority] }}
            />
            <span className="text-ink">{PRIORITY_LABELS[task.priority]} priority</span>
            {task.dueAt ? <span className="text-faint">· due {relativeDue(task.dueAt)}</span> : null}
          </div>

          <h1 className="text-pretty text-3xl font-bold tracking-tight leading-tight sm:text-4xl text-ink">
            {task.title}
          </h1>

          {task.notes ? (
            <div className="mt-5 rounded-2xl bg-raised/60 p-4 border border-line/50 text-[15px] leading-relaxed text-muted whitespace-pre-wrap">
              {task.notes}
            </div>
          ) : null}

          <div className="mt-6">
            <PomodoroTimer />
          </div>

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
              placeholder="Log a note as you focus…"
              className="min-w-0 flex-1 rounded-xl border border-line/80 bg-raised px-4 py-3 text-[14px] outline-none placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent/15"
            />
            <button
              disabled={!note.trim() || pending}
              className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-3 text-[13px] font-semibold text-white transition-all enabled:hover:opacity-95 enabled:active:scale-95 disabled:opacity-40 shadow-xs"
            >
              <Send className="size-3.5" />
              <span>Log</span>
            </button>
          </form>

          {logs.length > 0 ? (
            <div className="mt-8 border-t border-line/60 pt-5">
              <h3 className="mb-3 text-[12px] font-bold uppercase tracking-wider text-faint flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-accent" />
                Session Notes Log
              </h3>
              <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {logs.map((l) => (
                  <li key={l.id} className="flex items-start gap-3 rounded-xl bg-raised/40 p-3 text-[13px] border border-line/40">
                    <time className="shrink-0 font-mono text-[11px] text-faint mt-0.5">
                      {l.createdAt.toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                    </time>
                    <span className="text-muted leading-relaxed">{l.note}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-10 flex items-center justify-between gap-3 border-t border-line/60 pt-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => startTransition(() => void completeAndLeaveFocus(task.id))}
                disabled={pending}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-[14px] font-semibold text-white transition-all active:scale-95 shadow-md disabled:opacity-50"
              >
                <CheckCircle2 className="size-4" />
                Mark done
              </button>
              <button
                onClick={() => router.push("/")}
                className="flex items-center gap-1.5 rounded-xl border border-line/80 bg-raised px-4 py-2.5 text-[14px] font-medium text-muted transition-all hover:text-ink hover:border-faint"
              >
                <ArrowLeft className="size-4" />
                Back
              </button>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded-md border border-line/80 bg-raised px-2 py-1 text-[11px] font-mono text-faint shadow-2xs">
              <Clock className="size-3" />
              esc to leave
            </kbd>
          </div>
        </div>
      </div>
    </main>
  );
}

