import Link from "next/link";
import { AddTask } from "@/components/add-task";
import { PulseBanner } from "@/components/pulse-banner";
import { TaskList } from "@/components/task-list";
import {
  completionStreak,
  completionsByDay,
  doneTodayTasks,
  dueReviews,
  tagsForTasks,
  todayTasks,
} from "@/db/queries";
import { daysUntil, longDate, relativeDue } from "@/lib/format";
import { pulse } from "@/lib/pulse";
import { getOwnerId } from "@/lib/auth";
import { MotivationalQuote } from "@/components/motivational-quote";
import { FlowHorizonBanner } from "@/components/flow-horizon-banner";
import { Play, Code2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const ownerId = await getOwnerId();
  const tasks = await todayTasks(ownerId);
  const closedToday = await doneTodayTasks(ownerId);
  const tags = await tagsForTasks(ownerId, [...tasks, ...closedToday].map((t) => t.id));
  const reviews = await dueReviews(ownerId, 5);
  const [streak, history] = await Promise.all([completionStreak(ownerId), completionsByDay(ownerId, 14)]);

  const doingTask = tasks.find((t) => t.status === "doing");
  const overdue = tasks.filter((t) => t.dueAt && daysUntil(t.dueAt) < 0 && t.id !== doingTask?.id);
  const rest = tasks.filter((t) => !overdue.includes(t) && t.id !== doingTask?.id);
  const topTask = doingTask ?? overdue[0] ?? rest[0];

  const todayPulse = pulse({
    streak,
    doneToday: closedToday.length,
    overdue: overdue.length,
    openToday: tasks.length,
    reviewsDue: reviews.length,
    history,
  });

  return (
    <div className="space-y-8 animate-reveal pb-16 relative">
      {/* Flow Horizon Command Banner (Greeting, Battery, 3D Quote, Top Task Spotlight) */}
      <FlowHorizonBanner
        streak={streak}
        doneToday={closedToday.length}
        openToday={tasks.length}
        topTask={topTask}
      />

      {/* Context Header Pulse & Interactive Quote */}
      <section className="flex flex-col gap-4 border-b border-line/60 pb-6">
        <PulseBanner pulse={todayPulse} />
        <MotivationalQuote />
      </section>

      {/* Navigation Sub-Tabs */}
      <nav className="flex gap-6 border-b border-line/60 pb-2 text-sm font-semibold">
        <Link
          href="/"
          className="text-accent border-b-2 border-accent pb-2 font-bold"
        >
          Today
        </Link>
        <Link
          href="/week"
          className="text-muted hover:text-ink transition-colors pb-2"
        >
          This Week
        </Link>
        <Link
          href="/all"
          className="text-muted hover:text-ink transition-colors pb-2"
        >
          All
        </Link>
      </nav>

      {/* Add Task Input */}
      <AddTask dueToday />

      {/* Doing (Active Task) */}
      {doingTask ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-bold text-muted uppercase tracking-wider">
            Doing
          </h2>
          <div className="bg-surface rounded-2xl p-6 border border-line shadow-sm relative overflow-hidden group">
            <div className="absolute -top-24 -right-24 size-48 bg-accent/15 rounded-full blur-3xl" />
            <div className="flex items-start gap-4 relative z-10">
              <div className="mt-1">
                <span className="size-3 rounded-full inline-block priority-critical" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-ink">{doingTask.title}</h3>
                {doingTask.notes ? (
                  <p className="text-xs text-muted mt-1 leading-relaxed">{doingTask.notes}</p>
                ) : null}
                {doingTask.dueAt ? (
                  <span className="mt-4 inline-block text-xs font-medium text-muted">
                    due {relativeDue(doingTask.dueAt)}
                  </span>
                ) : null}
              </div>

              <Link
                href={`/focus?id=${doingTask.id}`}
                className="size-10 rounded-full bg-accent/10 flex items-center justify-center hover:bg-accent hover:text-white transition-all text-accent shadow-2xs"
              >
                <Play className="size-5 fill-current ml-0.5" />
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* Today (Due Today Tasks) */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-bold text-muted uppercase tracking-wider">
          Today
        </h2>
        {rest.length > 0 ? (
          <TaskList tasks={rest} tags={tags} />
        ) : (
          <div className="p-4 rounded-xl border border-line bg-surface/50 text-xs text-faint italic text-center">
            No remaining tasks due for today.
          </div>
        )}
      </section>

      {/* Done Today */}
      {closedToday.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-bold text-muted uppercase tracking-wider">
            Done Today
          </h2>
          <TaskList tasks={closedToday} tags={tags} />
        </section>
      ) : null}

      {/* Due For Revisit (LeetCode) */}
      {reviews.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-bold text-muted uppercase tracking-wider">
            Due For Revisit (LeetCode)
          </h2>
          <div className="flex flex-col gap-2.5">
            {reviews.map((prob) => (
              <div
                key={prob.id}
                className="flex items-center justify-between p-4 bg-surface rounded-xl border border-line hover:bg-raised/50 transition-all shadow-2xs"
              >
                <div className="flex items-center gap-3.5">
                  <Code2 className="size-5 text-muted shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-ink">
                      {prob.number ? `${prob.number}. ` : ""}
                      {prob.title}
                    </p>
                    {prob.difficulty ? (
                      <p className={`text-xs font-bold mt-0.5 lc-${prob.difficulty}`}>
                        {prob.difficulty}
                      </p>
                    ) : null}
                  </div>
                </div>
                <Link
                  href="/practice"
                  className="px-3.5 py-1.5 bg-accent/10 text-accent font-semibold text-xs rounded-lg hover:bg-accent hover:text-white transition-colors"
                >
                  Review
                </Link>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Overdue */}
      {overdue.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-bold text-rose-500 uppercase tracking-wider">
            Overdue
          </h2>
          <TaskList tasks={overdue} tags={tags} />
        </section>
      )}
    </div>
  );
}
