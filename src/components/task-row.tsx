"use client";

import { useRef, useState, useTransition } from "react";
import { addLog, completeTask, dropTask, reopenTask, setPriority, startFocus } from "@/app/actions";
import { PRIORITY_COLORS, PRIORITY_LABELS, daysUntil, relativeDue } from "@/lib/format";
import type { Task } from "@/db/schema";
import { Check, X, Maximize2, FileText, RotateCcw, Clock, Tag as TagIcon, PenTool } from "lucide-react";
import { InkNoteCapture } from "./ink-note-capture";
import { safeSetPointerCapture } from "@/lib/pointer";

const SETTLE_MS = 380;
const SWIPE_THRESHOLD = 88;
const MAX_DRAG = 132;
const HOVER_PREVIEW_MS = 400;

interface DragState {
  startX: number;
  startY: number;
  pointerId: number;
  dragging: boolean;
  currentDx: number;
}

interface GestureState {
  pointerId: number;
  points: { x: number; y: number }[];
  startX: number;
  startY: number;
  committed: boolean;
}

/**
 * Classifies a Pencil stroke drawn over a row: a roughly straight,
 * mostly-horizontal line reads as a strike-through (paper-list crossing-off);
 * a stroke that visibly doubles back on itself (an X or scribble) reads as a
 * drop. Anything short, faint, or ambiguous is ignored on purpose — a false
 * positive here silently completes or drops a task.
 */
function classifyGesture(points: { x: number; y: number }[]): "strike" | "x" | null {
  if (points.length < 3) return null;

  let pathLength = 0;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
    if (i > 0) pathLength += Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y);
  }

  const bboxW = maxX - minX;
  const bboxH = maxY - minY;
  const first = points[0];
  const last = points[points.length - 1];
  const straightDist = Math.hypot(last.x - first.x, last.y - first.y);

  if (bboxW < 50 || straightDist < 10) return null; // too short to be deliberate

  const straightness = pathLength / Math.max(straightDist, 1);

  if (straightness < 1.35 && bboxH < bboxW * 0.6) return "strike";
  if (straightness > 1.6 && bboxW > 30 && bboxH > 20) return "x";
  return null;
}

export function TaskRow({ task, tags = [] }: { task: Task; tags?: string[] }) {
  const [settling, setSettling] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteMode, setNoteMode] = useState<"type" | "ink">("type");
  const [note, setNote] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [, startTransition] = useTransition();

  const dragRef = useRef<DragState | null>(null);
  const gestureRef = useRef<GestureState | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const dropIndicatorRef = useRef<HTMLSpanElement | null>(null);
  const doneIndicatorRef = useRef<HTMLSpanElement | null>(null);
  const gesturePathRef = useRef<SVGPathElement | null>(null);

  const closed = task.status === "done" || task.status === "dropped";
  const overdue = task.dueAt !== null && daysUntil(task.dueAt) < 0 && !closed;

  // Let the row finish animating before the server action pulls it out of the list
  function settleThen(fn: () => Promise<void>) {
    setSettling(true);
    setTimeout(() => startTransition(async () => void (await fn())), SETTLE_MS);
  }

  function applyDragStyles(dx: number) {
    if (wrapperRef.current) wrapperRef.current.style.transform = dx ? `translateX(${dx}px)` : "";
    if (dropIndicatorRef.current) dropIndicatorRef.current.style.opacity = String(Math.min(1, Math.max(0, -dx / SWIPE_THRESHOLD)));
    if (doneIndicatorRef.current) doneIndicatorRef.current.style.opacity = String(Math.min(1, Math.max(0, dx / SWIPE_THRESHOLD)));
  }

  function updateGesturePath() {
    const g = gestureRef.current;
    const path = gesturePathRef.current;
    if (!g || !path) return;
    path.setAttribute("d", g.points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" "));
  }

  function clearGesture(fade: boolean) {
    gestureRef.current = null;
    const path = gesturePathRef.current;
    if (!path) return;
    if (fade) {
      path.style.transition = "opacity 250ms ease";
      path.style.opacity = "0";
      setTimeout(() => {
        path.setAttribute("d", "");
        path.style.transition = "";
        path.style.opacity = "0.55";
      }, 260);
    } else {
      path.setAttribute("d", "");
    }
  }

  function clearHoverPreview() {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = null;
    setPreviewOpen(false);
  }

  // Swipe-to-complete / swipe-to-drop for touch (a native iPad list idiom);
  // strike-through / X for Pencil; hover-to-preview for a hovering Pencil tip
  // (iPad Pro M2+). Mouse users get the always-visible action bar instead.
  function onPointerDown(e: React.PointerEvent<HTMLLIElement>) {
    if (e.pointerType === "mouse") return;
    clearHoverPreview();

    if (e.pointerType === "pen") {
      const rect = e.currentTarget.getBoundingClientRect();
      gestureRef.current = {
        pointerId: e.pointerId,
        points: [{ x: e.clientX - rect.left, y: e.clientY - rect.top }],
        startX: e.clientX,
        startY: e.clientY,
        committed: false,
      };
      return;
    }

    if (closed) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, pointerId: e.pointerId, dragging: false, currentDx: 0 };
  }

  function onPointerMove(e: React.PointerEvent<HTMLLIElement>) {
    const g = gestureRef.current;
    if (g && g.pointerId === e.pointerId) {
      const rect = e.currentTarget.getBoundingClientRect();
      const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };

      if (!g.committed) {
        // Same early direction check the touch swipe below makes, because
        // iPadOS locks a touch/pen session into native scrolling within the
        // first ~10px of movement — deciding any later than that can't
        // reclaim it. The ratio is looser than swipe's so a diagonal X
        // stroke still commits, but a mostly-vertical drag (someone just
        // trying to scroll the list with the Pencil) is released untouched.
        const dx = e.clientX - g.startX;
        const dy = e.clientY - g.startY;
        if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 0.6) {
          g.committed = true;
          safeSetPointerCapture(e.currentTarget, e.pointerId);
        } else if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx) * 1.4) {
          gestureRef.current = null; // clearly a scroll — hand off entirely
          return;
        } else {
          g.points.push(point); // still ambiguous, keep sampling quietly
          return;
        }
      }

      e.preventDefault();
      g.points.push(point);
      updateGesturePath();
      return;
    }

    // A hovering Pencil (no button down, no active gesture/drag) previews
    // the full notes after a brief pause — not on the first move, so simply
    // passing over the row while writing elsewhere doesn't flash it open.
    if (e.pointerType === "pen" && e.pressure === 0 && !dragRef.current) {
      if (!task.notes) return;
      if (!hoverTimerRef.current && !previewOpen) {
        hoverTimerRef.current = setTimeout(() => setPreviewOpen(true), HOVER_PREVIEW_MS);
      }
      return;
    }

    const st = dragRef.current;
    if (!st || st.pointerId !== e.pointerId) return;
    const dx = e.clientX - st.startX;
    const dy = e.clientY - st.startY;

    if (!st.dragging) {
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.3) {
        st.dragging = true;
        setIsDragging(true);
        safeSetPointerCapture(e.currentTarget, e.pointerId);
      } else if (Math.abs(dy) > 10) {
        dragRef.current = null; // vertical intent — hand off to native scroll
      }
      return;
    }

    e.preventDefault();
    st.currentDx = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, dx));
    applyDragStyles(st.currentDx);
  }

  function endDrag(e: React.PointerEvent<HTMLLIElement>) {
    const g = gestureRef.current;
    if (g && g.pointerId === e.pointerId) {
      if (g.committed && e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      const outcome = classifyGesture(g.points);
      if (outcome === "strike") {
        clearGesture(false);
        settleThen(() => (closed ? reopenTask(task.id) : completeTask(task.id)));
      } else if (outcome === "x" && !closed) {
        clearGesture(false);
        settleThen(() => dropTask(task.id));
      } else {
        clearGesture(true);
      }
      return;
    }

    const st = dragRef.current;
    if (!st?.dragging) {
      dragRef.current = null;
      return;
    }
    if (e.currentTarget.hasPointerCapture(st.pointerId)) e.currentTarget.releasePointerCapture(st.pointerId);
    setIsDragging(false);
    applyDragStyles(0);

    if (st.currentDx > SWIPE_THRESHOLD) {
      settleThen(() => completeTask(task.id));
    } else if (st.currentDx < -SWIPE_THRESHOLD) {
      settleThen(() => dropTask(task.id));
    }
    dragRef.current = null;
  }

  // Magic Keyboard equivalent of the touch swipe: Space completes/reopens,
  // Delete drops. Guarded to the row itself so Space typed into the note
  // input above doesn't get hijacked.
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return;
    if (e.key === " ") {
      e.preventDefault();
      settleThen(() => (closed ? reopenTask(task.id) : completeTask(task.id)));
    } else if (e.key === "Delete" && !closed) {
      e.preventDefault();
      settleThen(() => dropTask(task.id));
    }
  }

  function onDragStart(e: React.DragEvent<HTMLDivElement>) {
    e.dataTransfer.setData("text/plain", task.title);
    e.dataTransfer.effectAllowed = "copy";
  }

  return (
    <li
      className={`group relative touch-pan-y ${settling ? "is-settling" : "rise"}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={clearHoverPreview}
    >
      {!closed ? (
        <div className="absolute inset-0 flex items-center justify-between px-6" aria-hidden="true">
          <span ref={dropIndicatorRef} className="flex items-center gap-1.5 text-xs font-bold text-rose-500 opacity-0">
            <X className="size-4" />
            Drop
          </span>
          <span ref={doneIndicatorRef} className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 opacity-0">
            <Check className="size-4" />
            Done
          </span>
        </div>
      ) : null}

      {/* Pencil gesture ink — a live trace of a strike-through/X in progress */}
      <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full" aria-hidden="true">
        <path ref={gesturePathRef} fill="none" stroke="var(--ink)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" opacity={0.55} />
      </svg>

      {previewOpen && task.notes ? (
        <div className="absolute inset-x-3 top-full z-20 mt-1 animate-reveal rounded-xl border border-line bg-surface p-3 text-[13px] leading-relaxed text-ink shadow-xl">
          {task.notes}
        </div>
      ) : null}

      <div
        ref={wrapperRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        draggable
        onDragStart={onDragStart}
        aria-label={`${task.title}. Space to ${closed ? "reopen" : "complete"}, Delete to drop.`}
        className="relative select-none bg-surface transition-colors focus:focus-ring sm:pointer-fine:hover:bg-raised/50"
        style={{ transition: isDragging ? "none" : "transform 220ms cubic-bezier(0.16,1,0.3,1)" }}
      >
        <div className="flex items-center gap-3.5 px-4 py-3.5 sm:pointer-fine:py-3">
          <button
            type="button"
            title={`Priority: ${PRIORITY_LABELS[task.priority]} — click to change`}
            onClick={() =>
              startTransition(() => void setPriority(task.id, (task.priority + 1) % 4))
            }
            className={`mt-1.5 size-4 sm:pointer-fine:size-3 shrink-0 rounded-full transition-all hover:scale-125 focus:outline-none focus-ring priority-dot-${task.priority} ${task.status === "doing" ? "pulse-flame" : ""}`}
            style={{ background: PRIORITY_COLORS[task.priority] }}
          />

          <div className="min-w-0 flex-1 flex flex-col justify-center">
            <p className={`select-text text-[15px] sm:text-[14px] font-medium leading-snug ${closed ? "text-muted line-through opacity-70" : "text-ink"}`}>
              {task.title}
            </p>

            {task.notes ? (
              <p className="select-text mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted">{task.notes}</p>
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

            {noteOpen && noteMode === "ink" ? (
              <InkNoteCapture
                onCancel={() => setNoteMode("type")}
                onSubmit={(serializedNote) => {
                  setNoteMode("type");
                  setNoteOpen(false);
                  startTransition(() => void addLog(task.id, serializedNote));
                }}
              />
            ) : null}

            {noteOpen && noteMode === "type" ? (
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
                  enterKeyHint="send"
                  autoCapitalize="sentences"
                  className="min-w-0 flex-1 rounded-xl border border-line bg-raised px-3.5 py-2 text-[13px] outline-none placeholder:text-faint focus-ring"
                />
                <button
                  type="button"
                  title="Write with Apple Pencil instead"
                  onClick={() => setNoteMode("ink")}
                  className="grid size-9 shrink-0 place-items-center rounded-xl border border-line/60 bg-raised/40 text-muted transition-all hover:border-line hover:text-ink"
                >
                  <PenTool className="size-4" />
                </button>
                <button className="rounded-xl bg-accent px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 active:scale-95">
                  Log
                </button>
              </form>
            ) : null}
          </div>

          {/* Action bar: always visible on touch/pen, hover-reveal only for mouse/trackpad */}
          <div className="flex shrink-0 items-center gap-1 opacity-100 translate-x-0 transition-all duration-300 sm:pointer-fine:opacity-0 sm:pointer-fine:translate-x-2 focus-within:opacity-100 focus-within:translate-x-0 sm:pointer-fine:group-hover:translate-x-0 sm:pointer-fine:group-hover:opacity-100">
            {closed ? (
              <RowButton label="Reopen" onClick={() => settleThen(() => reopenTask(task.id))}>
                <RotateCcw className="size-4 sm:pointer-fine:size-3.5" />
              </RowButton>
            ) : (
              <>
                <RowButton
                  label="Add a log note"
                  onClick={() => {
                    setNoteOpen((v) => !v);
                    setNoteMode("type");
                  }}
                >
                  <FileText className="size-4 sm:pointer-fine:size-3.5" />
                </RowButton>
                <RowButton
                  label="Focus on this"
                  onClick={() => startTransition(() => void startFocus(task.id))}
                >
                  <Maximize2 className="size-4 sm:pointer-fine:size-3.5" />
                </RowButton>
                <RowButton label="Drop task" onClick={() => settleThen(() => dropTask(task.id))}>
                  <X className="size-4 sm:pointer-fine:size-3.5 text-rose-400" />
                </RowButton>
                <RowButton label="Mark done" accent onClick={() => settleThen(() => completeTask(task.id))}>
                  <Check className="size-4 sm:pointer-fine:size-3.5" />
                </RowButton>
              </>
            )}
          </div>
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
      className={`grid size-9 sm:pointer-fine:size-7 place-items-center rounded-xl sm:pointer-fine:rounded-lg border transition-all duration-200 active:scale-90 hover:scale-105 ${
        accent
          ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 hover:shadow-xs"
          : "border-line/60 sm:pointer-fine:border-transparent bg-raised/40 sm:pointer-fine:bg-transparent text-muted hover:border-line hover:text-ink hover:bg-surface hover:shadow-xs"
      }`}
    >
      {children}
    </button>
  );
}
