import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  BookOpen,
  XCircle,
  ArrowRight,
  PieChart,
  History,
  AlertCircle,
  Play,
  Bookmark,
  TriangleAlert,
} from "lucide-react";
import { dueReviewsRanked, pinnedProblems, recentAttempts, topicBreakdown } from "@/db/queries";
import { getOwnerId } from "@/lib/auth";
import { startOfToday } from "@/lib/timezone";

export const dynamic = "force-dynamic";

const OUTCOME_META = {
  solved_clean: { label: "Solved Clean", icon: CheckCircle2, accent: "text-emerald-500" },
  solved_hints: { label: "Needed Hints", icon: Lightbulb, accent: "text-amber-500" },
  saw_solution: { label: "Saw Solution", icon: BookOpen, accent: "text-indigo-500" },
  failed: { label: "Failed", icon: XCircle, accent: "text-rose-500" },
  accepted: { label: "Accepted", icon: CheckCircle2, accent: "text-emerald-500" },
} as const;

export default async function PracticePage() {
  const ownerId = await getOwnerId();
  const [reviews, pinned, attempts, topics] = await Promise.all([
    dueReviewsRanked(ownerId, 10),
    pinnedProblems(ownerId, 10),
    recentAttempts(ownerId, 8),
    topicBreakdown(ownerId),
  ]);

  const overdueCutoff = startOfToday();

  return (
    <div className="space-y-8 animate-reveal">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-line/60 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink font-sans">
            Practice Tracker
          </h1>
          <p className="text-sm font-medium text-muted mt-1">
            Stay sharp. Review your weaknesses.
          </p>
        </div>
        {reviews.length > 0 ? (
          <Link
            href={`/practice/${reviews[0].problem.id}`}
            className="bg-accent text-white px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 hover:opacity-90 transition-all shadow-xs"
          >
            <Play className="size-3.5 fill-white" />
            Start Session
          </Link>
        ) : null}
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Due for Review (2 Cols) */}
        <section className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
              <AlertCircle className="size-5 text-rose-500" />
              Due for Review
            </h2>
          </div>

          {reviews.length > 0 ? (
            <div className="bg-surface rounded-2xl border border-line overflow-hidden shadow-2xs divide-y divide-line/60">
              {reviews.map(({ problem: prob, lastOutcome, regressed }) => {
                const overdue = prob.nextReviewAt ? prob.nextReviewAt < overdueCutoff : false;
                const lastMeta = lastOutcome ? OUTCOME_META[lastOutcome] : null;
                return (
                  <Link
                    href={`/practice/${prob.id}`}
                    key={prob.id}
                    className="p-4 hover:bg-raised/40 transition-colors flex items-center justify-between group relative overflow-hidden"
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${regressed ? "bg-rose-600" : overdue ? "bg-rose-500" : "bg-amber-500"}`} />
                    <div className="flex items-center gap-4 pl-3">
                      <span className="font-mono text-xs text-faint w-10">
                        {prob.number ? `#${prob.number}` : ""}
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-ink group-hover:text-accent transition-colors">
                          {prob.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {prob.difficulty ? (
                            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full lc-${prob.difficulty} bg-current/10`}>
                              {prob.difficulty}
                            </span>
                          ) : null}
                          {lastMeta ? (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded bg-raised border border-line/40 ${lastMeta.accent}`}>
                              last: {lastMeta.label}
                            </span>
                          ) : null}
                          {prob.pinnedForRevisit ? (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center gap-1">
                              <Bookmark className="size-2.5" />
                              pinned
                            </span>
                          ) : null}
                          {prob.topics.slice(0, 2).map((t) => (
                            <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded bg-raised text-muted border border-line/40">
                              {t}
                            </span>
                          ))}
                        </div>
                        {regressed ? (
                          <p className="mt-1.5 text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                            <TriangleAlert className="size-3" />
                            Regressed on revision — solved before, weaker now
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end">
                      <span className={`text-xs font-bold flex items-center gap-1 ${overdue ? "text-rose-500" : "text-muted"}`}>
                        {overdue && <AlertTriangle className="size-3 text-rose-500" />}
                        {overdue ? "Overdue" : "Due"}
                      </span>
                      {prob.nextReviewAt ? (
                        <span className="text-[11px] text-faint mt-0.5">
                          {prob.nextReviewAt.toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-dashed border-line bg-surface/50 text-xs text-faint italic text-center">
              Nothing due for review. Log an attempt through Claude Code (
              <span className="font-mono">log_attempt</span>) or run{" "}
              <span className="font-mono">npm run sync:leetcode</span> to get started.
            </div>
          )}
        </section>

        {/* Topic Focus */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
              <PieChart className="size-5 text-indigo-500" />
              Topic Focus
            </h2>
          </div>

          <div className="bg-surface rounded-2xl border border-line p-5 shadow-2xs flex flex-col justify-between flex-1 gap-5">
            {topics.length > 0 ? (
              <div className="space-y-4">
                {topics.slice(0, 5).map((t) => (
                  <div key={t.topic}>
                    <div className="flex justify-between items-end mb-1.5 text-xs">
                      <span className="font-semibold text-ink">{t.topic}</span>
                      <span className="text-faint font-mono">{t.struggled}/{t.total} struggled</span>
                    </div>
                    <div className="w-full bg-raised rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${t.strugglePct >= 50 ? "bg-rose-500" : t.strugglePct >= 25 ? "bg-amber-500" : "bg-emerald-500"}`}
                        style={{ width: `${Math.max(4, t.strugglePct)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-faint italic">
                Topic breakdown fills in once you have logged a few attempts.
              </p>
            )}
          </div>
        </section>

        {/* Pinned for Revisit (Full Width) */}
        {pinned.length > 0 ? (
          <section className="lg:col-span-3 flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                <Bookmark className="size-5 text-amber-500" />
                Pinned for Revisit
              </h2>
            </div>
            <div className="bg-surface rounded-2xl border border-line overflow-hidden shadow-2xs divide-y divide-line/60">
              {pinned.map((prob) => (
                <Link
                  href={`/practice/${prob.id}`}
                  key={prob.id}
                  className="p-4 hover:bg-raised/40 transition-colors flex items-center gap-4 group"
                >
                  <span className="font-mono text-xs text-faint w-10">
                    {prob.number ? `#${prob.number}` : ""}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-ink group-hover:text-accent transition-colors truncate">
                      {prob.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {prob.difficulty ? (
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full lc-${prob.difficulty} bg-current/10`}>
                          {prob.difficulty}
                        </span>
                      ) : null}
                      {prob.topics.slice(0, 2).map((t) => (
                        <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded bg-raised text-muted border border-line/40">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* Recent Attempts (Full Width Grid) */}
        <section className="lg:col-span-3 flex flex-col gap-4 mt-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
              <History className="size-5 text-accent" />
              Recent Attempts
            </h2>
          </div>

          {attempts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {attempts.map((attempt) => {
                const meta = OUTCOME_META[attempt.outcome as keyof typeof OUTCOME_META] ?? OUTCOME_META.solved_clean;
                const Icon = meta.icon;
                return (
                  <Link
                    href={`/practice/${attempt.problemId}`}
                    key={attempt.id}
                    className="bg-surface border border-line rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all relative overflow-hidden group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-1.5">
                        <Icon className={`size-4 ${meta.accent}`} />
                        <span className="text-xs font-bold text-ink">{meta.label}</span>
                        {attempt.isRevision ? (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/30">
                            Revision
                          </span>
                        ) : null}
                      </div>
                      {attempt.minutes ? (
                        <span className="font-mono text-[10px] text-faint px-2 py-0.5 bg-raised rounded-md border border-line/40">
                          {attempt.minutes}m
                        </span>
                      ) : null}
                    </div>

                    <h3 className="text-sm font-semibold text-ink truncate">
                      {attempt.number ? `#${attempt.number} ` : ""}
                      {attempt.title}
                    </h3>
                    {attempt.approach ? (
                      <p className="text-xs text-accent mt-1 leading-snug line-clamp-1">{attempt.approach}</p>
                    ) : null}
                    {attempt.notes ? (
                      <p className="text-xs text-muted mt-1 leading-snug line-clamp-2">{attempt.notes}</p>
                    ) : null}

                    <div className="mt-4 pt-3 border-t border-line/60 flex justify-between items-center text-[10px]">
                      <span className="text-faint">
                        {new Date(attempt.attemptedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                        {attempt.source === "sync" ? " · synced" : ""}
                      </span>
                      {attempt.difficulty ? (
                        <span className={`uppercase tracking-wider font-bold px-2 py-0.5 rounded-full lc-${attempt.difficulty} bg-current/10`}>
                          {attempt.difficulty}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-dashed border-line bg-surface/50 text-xs text-faint italic text-center flex items-center justify-center gap-1.5">
              No attempts logged yet.
              <ArrowRight className="size-3.5" />
              try <span className="font-mono">log_attempt</span> from Claude Code.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
