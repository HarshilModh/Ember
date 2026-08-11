import type { Task } from "@/db/schema";
import { TaskRow } from "./task-row";
import { CheckCircle2 } from "lucide-react";

export function TaskList({ tasks, tags }: { tasks: Task[]; tags: Map<number, string[]> }) {
  return (
    <ul className="rounded-xl border border-line bg-surface shadow-xs divide-y divide-line/60 overflow-hidden">
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} tags={tags.get(task.id) ?? []} />
      ))}
    </ul>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line/80 bg-raised/30 px-6 py-12 text-center shadow-2xs">
      <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent shadow-xs pulse-flame">
        <CheckCircle2 className="size-6 text-accent/80" />
      </div>
      <p className="text-[15px] font-semibold text-ink">{title}</p>
      {hint ? <p className="mt-1 text-[13px] text-faint max-w-sm mx-auto">{hint}</p> : null}
    </div>
  );
}

