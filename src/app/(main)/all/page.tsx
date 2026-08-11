import { AddTask } from "@/components/add-task";
import { ClosedTasks } from "@/components/closed-tasks";
import { EmptyState, TaskList } from "@/components/task-list";
import { allOpenTasks, recentlyClosedTasks, tagsForTasks } from "@/db/queries";
import { PRIORITY_LABELS } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AllPage() {
  const [open, closed] = await Promise.all([allOpenTasks(), recentlyClosedTasks()]);
  const tags = await tagsForTasks([...open, ...closed].map((t) => t.id));

  const groups = [3, 2, 1, 0]
    .map((p) => ({ priority: p, tasks: open.filter((t) => t.priority === p) }))
    .filter((g) => g.tasks.length > 0);

  return (
    <div className="space-y-6">
      <AddTask />

      {open.length === 0 ? (
        <EmptyState title="No open tasks." hint="Everything is either done or dropped." />
      ) : null}

      {groups.map((g) => (
        <section key={g.priority}>
          <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-faint">
            {g.priority === 0 ? "Unprioritised" : PRIORITY_LABELS[g.priority]}
          </h2>
          <TaskList tasks={g.tasks} tags={tags} />
        </section>
      ))}

      <ClosedTasks tasks={closed} tags={tags} />
    </div>
  );
}
