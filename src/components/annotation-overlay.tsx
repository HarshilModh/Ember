"use client";

import { useRef, useState } from "react";
import { PenTool, Eraser, X } from "lucide-react";
import { safeSetPointerCapture } from "@/lib/pointer";

interface Stroke {
  d: string;
  color: string;
}

const COLORS = ["#ef4444", "#10b981", "#38bdf8", "#f59e0b"];

function pathD(points: { x: number; y: number }[]): string {
  return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
}

/**
 * A freehand markup layer for report pages — circle a good week, underline a
 * streak, while you're actually looking at it. Deliberately not persisted:
 * this is for the moment of reflection, not a permanent annotation record,
 * so there is no schema change and nothing to clean up. Any pointer type
 * works once toggled on; it is an explicit opt-in mode, not a Pencil-only
 * gesture.
 */
export function AnnotationOverlay() {
  const [active, setActive] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const activePointerId = useRef<number | null>(null);
  const currentPoints = useRef<{ x: number; y: number }[]>([]);
  const currentPathRef = useRef<SVGPathElement | null>(null);

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (activePointerId.current !== null) return;
    activePointerId.current = e.pointerId;
    safeSetPointerCapture(e.currentTarget, e.pointerId);
    currentPoints.current = [{ x: e.clientX, y: e.clientY }];
  }

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (e.pointerId !== activePointerId.current) return;
    e.preventDefault();
    currentPoints.current.push({ x: e.clientX, y: e.clientY });
    currentPathRef.current?.setAttribute("d", pathD(currentPoints.current));
  }

  function onPointerUp(e: React.PointerEvent<SVGSVGElement>) {
    if (e.pointerId !== activePointerId.current) return;
    activePointerId.current = null;
    if (currentPoints.current.length > 1) {
      setStrokes((prev) => [...prev, { d: pathD(currentPoints.current), color }]);
    }
    currentPoints.current = [];
    currentPathRef.current?.setAttribute("d", "");
  }

  function close() {
    setActive(false);
    setStrokes([]);
  }

  if (!active) {
    return (
      <button
        type="button"
        onClick={() => setActive(true)}
        title="Annotate this page with Apple Pencil"
        className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-[calc(1.5rem+env(safe-area-inset-left))] z-40 grid size-12 place-items-center rounded-full border border-line bg-surface text-muted shadow-lg transition-all hover:scale-105 hover:text-accent active:scale-95"
      >
        <PenTool className="size-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[140] animate-reveal">
      <svg
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ touchAction: "none" }}
        className="absolute inset-0 h-full w-full touch-none cursor-crosshair"
      >
        {strokes.map((s, i) => (
          <path key={i} d={s.d} fill="none" stroke={s.color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        ))}
        <path ref={currentPathRef} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      <div className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-1/2 z-[141] flex -translate-x-1/2 items-center gap-2 rounded-full border border-line bg-surface/95 px-3 py-2 shadow-xl backdrop-blur-md">
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            className={`size-7 rounded-full transition-all ${color === c ? "scale-110 border-2 border-ink" : "opacity-70 hover:opacity-100"}`}
            style={{ background: c }}
          />
        ))}
        <div className="mx-1 h-6 w-px bg-line" />
        <button
          type="button"
          onClick={() => setStrokes([])}
          disabled={strokes.length === 0}
          title="Clear"
          className="grid size-9 place-items-center rounded-full text-muted transition-colors hover:text-ink disabled:opacity-30"
        >
          <Eraser className="size-4" />
        </button>
        <button
          type="button"
          onClick={close}
          title="Done annotating"
          className="grid size-9 place-items-center rounded-full bg-accent text-white transition-all hover:opacity-90 active:scale-95"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
