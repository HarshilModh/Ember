"use client";

import { useState } from "react";
import type { Task } from "@/db/schema";
import { TaskList } from "./task-list";
import { ChevronRight } from "lucide-react";

/** Replaces a separate Done tab — collapsed by default so All stays scannable. */
export function ClosedTasks({ tasks, tags }: { tasks: Task[]; tags: Map<number, string[]> }) {
  const [open, setOpen] = useState(false);

  if (tasks.length === 0) return null;

  const done = tasks.filter((t) => t.status === "done").length;
  const dropped = tasks.length - done;
  const summary = [
    done > 0 ? `${done} done` : null,
    dropped > 0 ? `${dropped} dropped` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <section className="border-t border-line/70 pt-5 mt-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl border border-line/60 bg-raised/40 px-3.5 py-2.5 text-[12px] font-semibold tracking-wide text-faint transition-all hover:bg-raised/80 hover:text-muted"
      >
        <div className="flex items-center gap-2">
          <ChevronRight className={`size-4 transition-transform duration-200 ${open ? "rotate-90 text-accent" : ""}`} />
          <span className="uppercase font-bold tracking-wider">Recently closed</span>
        </div>
        <span className="rounded-full bg-surface px-2.5 py-0.5 font-medium normal-case tracking-normal border border-line/50 text-faint">
          {summary}
        </span>
      </button>

      {open ? (
        <div className="mt-3.5 rise">
          <TaskList tasks={tasks} tags={tags} />
        </div>
      ) : null}
    </section>
  );
}

