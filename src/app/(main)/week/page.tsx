import { EmptyState, TaskList } from "@/components/task-list";
import { tagsForTasks, weekTasks } from "@/db/queries";
import { dayHeading } from "@/lib/format";
import { getOwnerId } from "@/lib/auth";
import type { Task } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function WeekPage() {
  const ownerId = await getOwnerId();
  const tasks = await weekTasks(ownerId);
  const tags = await tagsForTasks(ownerId, tasks.map((t) => t.id));

  // Grouped by due day. weekTasks() only returns rows with a due date, so the
  // non-null assertion below is safe.
  const byDay = new Map<string, Task[]>();
  for (const t of tasks) {
    const key = t.dueAt!.toDateString();
    byDay.set(key, [...(byDay.get(key) ?? []), t]);
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        title="Nothing scheduled this week."
        hint="Tasks with a due date in the next seven days show up here."
      />
    );
  }

  return (
    <div className="space-y-6">
      {[...byDay.entries()].map(([key, group]) => (
        <section key={key}>
          <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-faint">
            {dayHeading(new Date(key))}
          </h2>
          <TaskList tasks={group} tags={tags} />
        </section>
      ))}
    </div>
  );
}
