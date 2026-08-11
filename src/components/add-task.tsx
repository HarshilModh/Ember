"use client";

import { useEffect, useRef, useState } from "react";
import { addTask } from "@/app/actions";
import { PRIORITY_COLORS, PRIORITY_LABELS, toLocalInput } from "@/lib/format";
import { Plus, Calendar, Tag, AlignLeft, Sparkles } from "lucide-react";

/**
 * `dueToday` is set on the Today view: adding a task while looking at today
 * means it is for today, and without it the new row silently fails to appear.
 */
export function AddTask({ dueToday = false }: { dueToday?: boolean }) {
  const [open, setOpen] = useState(false);
  const [priority, setPriority] = useState(0);
  const [defaultDue] = useState(() => (dueToday ? toLocalInput(new Date()) : ""));
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (
        (e.key === "n" || e.key === "N" || e.key === "/") &&
        !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        await addTask(fd);
        formRef.current?.reset();
        setPriority(0);
        setOpen(false);
      }}
      className="bg-surface rounded-xl border border-line p-2 shadow-xs transition-all focus-within:focus-ring"
    >
      <div className="flex items-center gap-2.5 px-2 py-1">
        <div className="grid size-7 place-items-center rounded-xl bg-accent-soft text-accent shrink-0">
          <Sparkles className="size-4" />
        </div>
        <input
          ref={inputRef}
          name="title"
          required
          placeholder="Add a new task…"
          onFocus={() => setOpen(true)}
          className="min-w-0 flex-1 bg-transparent py-1.5 text-[15px] outline-none placeholder:text-faint font-medium"
        />
        <div className="hidden sm:flex items-center gap-1 mr-2 opacity-70">
          <span className="kbd-shortcut">N</span>
          <span className="text-[10px] font-medium text-faint">or</span>
          <span className="kbd-shortcut">/</span>
        </div>
        <input type="hidden" name="priority" value={priority} />
        <button className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-[13px] font-semibold text-white shadow-xs transition-all duration-300 hover:shadow-[0_0_16px_rgba(124,115,246,0.4)] active:scale-95">
          <Plus className="size-4" />
          <span>Add</span>
        </button>
      </div>

      {open ? (
        <div className="animate-reveal mt-2.5 flex flex-wrap items-center gap-2 border-t border-line/60 px-2 pb-1.5 pt-3">
          <div className="flex items-center gap-1.5 bg-raised/60 p-1 rounded-xl border border-line/50">
            {PRIORITY_LABELS.map((label, i) => (
              <button
                key={label}
                type="button"
                title={label}
                onClick={() => setPriority(i)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] capitalize font-medium transition-all ${
                  priority === i
                    ? "bg-surface text-ink border border-line/80 shadow-2xs"
                    : "text-muted hover:text-ink"
                }`}
              >
                <span
                  className={`size-2 rounded-full priority-dot-${i}`}
                  style={{ background: PRIORITY_COLORS[i] }}
                />
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-line/60 bg-raised/50 px-2.5 py-1 text-[12px] text-muted">
            <Calendar className="size-3.5 text-faint" />
            <input
              type="date"
              name="dueAt"
              defaultValue={defaultDue}
              className="bg-transparent text-muted outline-none"
            />
          </div>

          <div className="flex min-w-36 flex-1 items-center gap-1.5 rounded-xl border border-line/60 bg-raised/50 px-2.5 py-1 text-[12px]">
            <Tag className="size-3.5 text-faint shrink-0" />
            <input
              name="tags"
              placeholder="tags (comma separated)"
              className="w-full bg-transparent outline-none placeholder:text-faint"
            />
          </div>

          <div className="flex min-w-36 flex-1 items-center gap-1.5 rounded-xl border border-line/60 bg-raised/50 px-2.5 py-1 text-[12px]">
            <AlignLeft className="size-3.5 text-faint shrink-0" />
            <input
              name="notes"
              placeholder="additional notes"
              className="w-full bg-transparent outline-none placeholder:text-faint"
            />
          </div>
        </div>
      ) : null}
    </form>
  );
}

