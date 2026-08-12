"use client";

import { useState, useTransition } from "react";
import { addLog, completeTask, dropTask, reopenTask, setPriority, startFocus } from "@/app/actions";
import { PRIORITY_COLORS, PRIORITY_LABELS, daysUntil, relativeDue } from "@/lib/format";
import type { Task } from "@/db/schema";
import { Check, X, Maximize2, FileText, RotateCcw, Clock, Tag as TagIcon } from "lucide-react";

const SETTLE_MS = 380;

export function TaskRow({ task, tags = [] }: { task: Task; tags?: string[] }) {
  const [settling, setSettling] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");
  const [, startTransition] = useTransition();

  const closed = task.status === "done" || task.status === "dropped";
  const overdue = task.dueAt !== null && daysUntil(task.dueAt) < 0 && !closed;

  // Let the row finish animating before the server action pulls it out of the list
  function settleThen(fn: () => Promise<void>) {
    setSettling(true);
    setTimeout(() => startTransition(async () => void (await fn())), SETTLE_MS);
  }

  return (
    <li
      className={`group relative bg-transparent transition-colors hover:bg-raised/50 ${
        settling ? "is-settling" : "rise"
      }`}
    >
      <div className="flex items-center gap-3.5 px-4 py-3.5 sm:py-3">
        <button
          type="button"
          title={`Priority: ${PRIORITY_LABELS[task.priority]} — click to change`}
          onClick={() =>
            startTransition(() => void setPriority(task.id, (task.priority + 1) % 4))
          }
          className={`mt-1.5 size-4 sm:size-3 shrink-0 rounded-full transition-all hover:scale-125 focus:outline-none focus-ring priority-dot-${task.priority} ${task.status === "doing" ? "pulse-flame" : ""}`}
          style={{ background: PRIORITY_COLORS[task.priority] }}
        />

        <div className="min-w-0 flex-1 flex flex-col justify-center">
          <p className={`text-[15px] sm:text-[14px] font-medium leading-snug ${closed ? "text-muted line-through opacity-70" : "text-ink"}`}>
            {task.title}
          </p>

          {task.notes ? (
            <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted">{task.notes}</p>
          ) : null}

          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[12px] text-faint">
            {task.status === "doing" ? (
              <span className="rounded-full bg-accent-soft px-2 py-0.5 font-semibold text-accent">
                in progress
              </span>
            ) : null}
            {task.dueAt ? (
              <span className={`flex items-center gap-1 font-medium ${overdue ? "text-p3" : "text-faint"}`}>
                <Clock className="size-3" />
                {relativeDue(task.dueAt)}
              </span>
            ) : null}
            {tags.map((t) => (
              <span key={t} className="flex items-center gap-0.5 rounded-md bg-raised px-1.5 py-0.5 text-faint font-medium border border-line/50">
                <TagIcon className="size-2.5 text-faint/70" />
                {t}
              </span>
            ))}
          </div>

          {noteOpen ? (
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const value = note;
                setNote("");
                setNoteOpen(false);
                startTransition(() => void addLog(task.id, value));
              }}
            >
              <input
                autoFocus
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && setNoteOpen(false)}
                placeholder="Log a progress note…"
                className="min-w-0 flex-1 rounded-xl border border-line bg-raised px-3.5 py-2 text-[13px] outline-none placeholder:text-faint focus-ring"
              />
              <button className="rounded-xl bg-accent px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 active:scale-95">
                Log
              </button>
            </form>
          ) : null}
        </div>

        {/* iPad & Mobile Ergonomic Action Bar (visible on touch & hover) */}
        <div className="flex shrink-0 items-center gap-1 opacity-100 sm:opacity-0 transition-all duration-300 sm:translate-x-2 focus-within:translate-x-0 focus-within:opacity-100 group-hover:translate-x-0 group-hover:opacity-100">
          {closed ? (
            <RowButton label="Reopen" onClick={() => settleThen(() => reopenTask(task.id))}>
              <RotateCcw className="size-4 sm:size-3.5" />
            </RowButton>
          ) : (
            <>
              <RowButton label="Add a log note" onClick={() => setNoteOpen((v) => !v)}>
                <FileText className="size-4 sm:size-3.5" />
              </RowButton>
              <RowButton
                label="Focus on this"
                onClick={() => startTransition(() => void startFocus(task.id))}
              >
                <Maximize2 className="size-4 sm:size-3.5" />
              </RowButton>
              <RowButton label="Drop task" onClick={() => settleThen(() => dropTask(task.id))}>
                <X className="size-4 sm:size-3.5 text-rose-400" />
              </RowButton>
              <RowButton label="Mark done" accent onClick={() => settleThen(() => completeTask(task.id))}>
                <Check className="size-4 sm:size-3.5" />
              </RowButton>
            </>
          )}
        </div>
      </div>
    </li>
  );
}

function RowButton({
  label,
  children,
  onClick,
  accent,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`grid size-9 sm:size-7 place-items-center rounded-xl sm:rounded-lg border transition-all duration-200 active:scale-90 hover:scale-105 ${
        accent
          ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 hover:shadow-xs"
          : "border-line/60 sm:border-transparent bg-raised/40 sm:bg-transparent text-muted hover:border-line hover:text-ink hover:bg-surface hover:shadow-xs"
      }`}
    >
      {children}
    </button>
  );
}
