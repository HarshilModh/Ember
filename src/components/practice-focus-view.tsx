"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { logPracticeAttempt } from "@/app/actions";
import { PomodoroTimer } from "@/components/pomodoro-timer";
import type { Attempt, Problem } from "@/db/schema";
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  Lightbulb,
  BookOpen,
  XCircle,
} from "lucide-react";

const OUTCOME_BUTTONS = [
  { value: "solved_clean" as const, label: "Solved clean", icon: CheckCircle2, cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white" },
  { value: "solved_hints" as const, label: "Needed hints", icon: Lightbulb, cls: "border-amber-500/40 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white" },
  { value: "saw_solution" as const, label: "Saw solution", icon: BookOpen, cls: "border-indigo-500/40 bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white" },
  { value: "failed" as const, label: "Failed", icon: XCircle, cls: "border-rose-500/40 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white" },
];

export function PracticeFocusView({ problem, attempts }: { problem: Problem; attempts: Attempt[] }) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [minutes, setMinutes] = useState("");
  const [pending, startTransition] = useTransition();
  const last = attempts[0];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") router.push("/practice");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  function log(outcome: (typeof OUTCOME_BUTTONS)[number]["value"]) {
    startTransition(() =>
      logPracticeAttempt(problem.id, outcome, {
        minutes: minutes ? Number(minutes) : undefined,
        notes: notes.trim() || undefined,
      }),
    );
  }

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-xl">
        <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-xl border border-line/80 relative overflow-hidden">
          <div className="mb-6 flex items-center justify-between gap-3 text-[12px] uppercase tracking-wider font-semibold text-faint">
            <div className="flex items-center gap-2">
              {problem.difficulty ? (
                <span className={`text-ink lc-${problem.difficulty}`}>{problem.difficulty}</span>
              ) : null}
              {problem.topics.length > 0 ? (
                <span className="text-faint normal-case">· {problem.topics.join(", ")}</span>
              ) : null}
            </div>
            {problem.url ? (
              <a
                href={problem.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-accent hover:underline normal-case"
              >
                <ExternalLink className="size-3.5" />
                Statement
              </a>
            ) : null}
          </div>

          <h1 className="text-pretty text-3xl font-bold tracking-tight leading-tight sm:text-4xl text-ink">
            {problem.number ? `${problem.number}. ` : ""}
            {problem.title}
          </h1>

          <div className="mt-5 rounded-2xl bg-raised/60 p-4 border border-line/50 text-[14px] leading-relaxed text-muted">
            {last ? (
              <>
                <span className="font-semibold text-ink capitalize">{last.outcome.replace("_", " ")}</span>
                {" — "}
                {last.notes || "no notes"}
                <span className="block mt-1 text-[12px] text-faint">
                  {new Date(last.attemptedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                  {last.source === "sync" ? " · synced" : ""}
                </span>
              </>
            ) : (
              "No attempts yet — this will be the first."
            )}
          </div>

          <div className="mt-6">
            <PomodoroTimer />
          </div>

          <div className="mt-6 flex gap-2">
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes for this attempt (optional)…"
              className="min-w-0 flex-1 rounded-xl border border-line/80 bg-raised px-4 py-3 text-[14px] outline-none placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent/15"
            />
            <input
              value={minutes}
              onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ""))}
              placeholder="min"
              inputMode="numeric"
              className="w-20 rounded-xl border border-line/80 bg-raised px-3 py-3 text-[14px] outline-none placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent/15"
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {OUTCOME_BUTTONS.map(({ value, label, icon: Icon, cls }) => (
              <button
                key={value}
                disabled={pending}
                onClick={() => log(value)}
                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-[13px] font-semibold transition-all active:scale-95 disabled:opacity-40 ${cls}`}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-line/60 pt-6">
            <button
              onClick={() => router.push("/practice")}
              className="flex items-center gap-1.5 rounded-xl border border-line/80 bg-raised px-4 py-2.5 text-[14px] font-medium text-muted transition-all hover:text-ink hover:border-faint"
            >
              <ArrowLeft className="size-4" />
              Back
            </button>
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded-md border border-line/80 bg-raised px-2 py-1 text-[11px] font-mono text-faint shadow-2xs">
              esc to leave
            </kbd>
          </div>
        </div>
      </div>
    </main>
  );
}
