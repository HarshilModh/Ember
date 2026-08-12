import { attemptsInLast, completionStreak, completionsByDay, doneToday, practiceStats, weeklyRollup } from "@/db/queries";
import { Flame, CheckCircle2, Trophy, ListChecks, Target, TrendingUp, XCircle, ScrollText, Code2 } from "lucide-react";
import { getOwnerId } from "@/lib/auth";
import { isInkNote, inkNoteImageSrc } from "@/lib/ink-note";
import { AnnotationOverlay } from "@/components/annotation-overlay";

export const dynamic = "force-dynamic";

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: "bg-emerald-500",
  medium: "bg-amber-500",
  hard: "bg-rose-500",
  unknown: "bg-slate-400",
};

export default async function MetricsPage() {
  const ownerId = await getOwnerId();
  const [streak, done, week, practice, rollup, weekAttempts] = await Promise.all([
    completionStreak(ownerId),
    doneToday(ownerId),
    completionsByDay(ownerId, 7),
    practiceStats(ownerId),
    weeklyRollup(ownerId, 7),
    attemptsInLast(ownerId, 7),
  ]);

  const weekTotal = week.reduce((sum, d) => sum + d.count, 0);
  const weekMax = Math.max(1, ...week.map((d) => d.count));

  return (
    <div className="space-y-8 animate-reveal">
      {/* Header */}
      <div className="border-b border-line/60 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-ink font-sans">
          Performance Metrics
        </h1>
        <p className="text-sm font-medium text-muted mt-1">
          Track your daily deep work and practice consistency.
        </p>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface rounded-2xl border border-line p-5 shadow-2xs">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-semibold">Streak</span>
            <Flame className="size-4 text-amber-500 fill-amber-500/20" />
          </div>
          <p className="text-3xl font-bold text-ink font-sans">{streak} {streak === 1 ? "Day" : "Days"}</p>
          <p className="text-[11px] text-muted font-medium mt-1">Consecutive days with a completed task</p>
        </div>

        <div className="bg-surface rounded-2xl border border-line p-5 shadow-2xs">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-semibold">Done Today</span>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-ink font-sans">{done}</p>
          <p className="text-[11px] text-muted font-medium mt-1">Tasks completed</p>
        </div>

        <div className="bg-surface rounded-2xl border border-line p-5 shadow-2xs">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-semibold">This Week</span>
            <ListChecks className="size-4 text-indigo-500" />
          </div>
          <p className="text-3xl font-bold text-ink font-sans">{weekTotal}</p>
          <p className="text-[11px] text-muted font-medium mt-1">Tasks completed, last 7 days</p>
        </div>

        <div className="bg-surface rounded-2xl border border-line p-5 shadow-2xs">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-semibold">Problems Solved</span>
            <Trophy className="size-4 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-ink font-sans">{practice.problemsSolved}</p>
          <p className="text-[11px] text-muted font-medium mt-1">Distinct LeetCode problems</p>
        </div>
      </div>

      {/* Analytics Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface rounded-2xl border border-line p-6 shadow-2xs">
          <h2 className="text-base font-bold text-ink mb-4 flex items-center gap-2">
            <TrendingUp className="size-4 text-accent" />
            Weekly Velocity
          </h2>
          <div className="space-y-4">
            {week.map((d) => (
              <div key={d.day}>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span>{new Date(d.day + "T00:00:00").toLocaleDateString(undefined, { weekday: "short" })}</span>
                  <span className="font-mono text-muted">{d.count} {d.count === 1 ? "task" : "tasks"}</span>
                </div>
                <div className="w-full bg-raised rounded-full h-2">
                  <div
                    className="bg-accent h-2 rounded-full"
                    style={{ width: `${Math.max(4, (d.count / weekMax) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface rounded-2xl border border-line p-6 shadow-2xs">
          <h2 className="text-base font-bold text-ink mb-4 flex items-center gap-2">
            <Target className="size-4 text-emerald-500" />
            Difficulty Breakdown
          </h2>
          {practice.byDifficulty.length > 0 ? (
            <div className="space-y-4">
              {practice.byDifficulty.map((d) => (
                <div key={d.difficulty}>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className={`font-bold capitalize ${DIFFICULTY_COLOR[d.difficulty] ? "text-ink" : ""}`}>
                      {d.difficulty}
                    </span>
                    <span className="font-mono text-muted">
                      {d.attempts} {d.attempts === 1 ? "attempt" : "attempts"} ({d.accuracyPct}% clean)
                    </span>
                  </div>
                  <div className="w-full bg-raised rounded-full h-2">
                    <div
                      className={`${DIFFICULTY_COLOR[d.difficulty] ?? "bg-accent"} h-2 rounded-full`}
                      style={{ width: `${d.accuracyPct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-faint italic">
              No practice data yet — log or sync a LeetCode attempt and it will show up here.
            </p>
          )}
        </div>
      </div>

      {/* Weekly Rollup */}
      <div className="bg-surface rounded-2xl border border-line p-6 shadow-2xs">
        <h2 className="text-base font-bold text-ink mb-4 flex items-center gap-2">
          <ScrollText className="size-4 text-accent" />
          Weekly Rollup
        </h2>

        {rollup.length === 0 && weekAttempts.length === 0 ? (
          <p className="text-xs text-faint italic">
            Nothing closed out or practiced this week yet — this fills in as you go.
          </p>
        ) : (
          <div className="space-y-4">
            {rollup.map(({ task, notes }) => (
              <div key={`t-${task.id}`} className="flex gap-3">
                {task.status === "done" ? (
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="size-4 text-rose-500 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${task.status === "dropped" ? "text-muted" : "text-ink"}`}>
                    {task.title}
                  </p>
                  {notes.length > 0 ? (
                    <ul className="mt-1 space-y-1.5">
                      {notes.map((n) =>
                        isInkNote(n.note) ? (
                          <li key={n.id}>
                            <img
                              src={inkNoteImageSrc(n.note)}
                              alt="Handwritten log note"
                              className="h-10 max-w-[220px] rounded border border-line/50 bg-raised/50"
                            />
                          </li>
                        ) : (
                          <li key={n.id} className="text-xs text-muted before:content-['—_'] before:text-faint">
                            {n.note}
                          </li>
                        )
                      )}
                    </ul>
                  ) : null}
                </div>
              </div>
            ))}

            {weekAttempts.map((a) => (
              <div key={`a-${a.id}`} className="flex gap-3">
                <Code2 className="size-4 text-indigo-500 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">
                    {a.number ? `#${a.number} ` : ""}
                    {a.title}
                    <span className="ml-2 text-xs font-normal text-muted capitalize">
                      {a.outcome.replace("_", " ")}
                    </span>
                  </p>
                  {a.notes ? (
                    <p className="mt-1 text-xs text-muted before:content-['—_'] before:text-faint">{a.notes}</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnnotationOverlay />
    </div>
  );
}
