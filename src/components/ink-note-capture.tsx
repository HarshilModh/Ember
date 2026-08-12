"use client";

import { useRef, useState } from "react";
import { Eraser, Check, X } from "lucide-react";
import { encodeInkNote } from "@/lib/ink-note";
import { safeSetPointerCapture } from "@/lib/pointer";

// A fixed logical coordinate space the capture strip is normalized to,
// independent of its rendered pixel size — keeps stored notes replayable
// at any width later.
const CAPTURE_WIDTH = 600;
const CAPTURE_HEIGHT = 100;
const INK_COLOR = "#131b2e";

function pathD(points: { x: number; y: number }[]): string {
  return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
}

export function InkNoteCapture({
  onSubmit,
  onCancel,
}: {
  onSubmit: (serializedNote: string) => void;
  onCancel: () => void;
}) {
  const [paths, setPaths] = useState<string[]>([]);
  const activePointerId = useRef<number | null>(null);
  const currentPoints = useRef<{ x: number; y: number }[]>([]);
  const currentPathRef = useRef<SVGPathElement | null>(null);

  function pointFromEvent(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * CAPTURE_WIDTH,
      y: ((e.clientY - rect.top) / rect.height) * CAPTURE_HEIGHT,
    };
  }

  // This capture strip lives inside a task row, which has its own
  // pointerdown/move swipe-and-gesture handling. Without stopping
  // propagation here, that ancestor logic sees the same bubbling events,
  // and once its drag threshold trips it calls setPointerCapture on the row
  // — which retargets every later event straight to the row and starves
  // this SVG of pointermove entirely, cutting the stroke off after a point
  // or two.
  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    e.stopPropagation();
    if (activePointerId.current !== null) return;
    activePointerId.current = e.pointerId;
    safeSetPointerCapture(e.currentTarget, e.pointerId);
    currentPoints.current = [pointFromEvent(e)];
  }

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    e.stopPropagation();
    if (e.pointerId !== activePointerId.current) return;
    e.preventDefault();
    currentPoints.current.push(pointFromEvent(e));
    currentPathRef.current?.setAttribute("d", pathD(currentPoints.current));
  }

  function onPointerUp(e: React.PointerEvent<SVGSVGElement>) {
    e.stopPropagation();
    if (e.pointerId !== activePointerId.current) return;
    activePointerId.current = null;
    if (currentPoints.current.length > 1) {
      setPaths((prev) => [...prev, pathD(currentPoints.current)]);
    }
    currentPoints.current = [];
    currentPathRef.current?.setAttribute("d", "");
  }

  function handleSave() {
    if (paths.length === 0) return;
    const inner = paths
      .map((d) => `<path d="${d}" fill="none" stroke="${INK_COLOR}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`)
      .join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CAPTURE_WIDTH} ${CAPTURE_HEIGHT}">${inner}</svg>`;
    onSubmit(encodeInkNote(svg));
  }

  return (
    <div className="mt-3 space-y-2">
      <svg
        viewBox={`0 0 ${CAPTURE_WIDTH} ${CAPTURE_HEIGHT}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ touchAction: "none" }}
        className="h-[100px] w-full touch-none rounded-xl border border-line bg-raised cursor-crosshair"
      >
        {paths.map((d, i) => (
          <path key={i} d={d} fill="none" stroke={INK_COLOR} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        ))}
        <path ref={currentPathRef} fill="none" stroke={INK_COLOR} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setPaths([])}
          disabled={paths.length === 0}
          className="flex items-center gap-1 text-xs font-medium text-faint transition-colors hover:text-ink disabled:opacity-40"
        >
          <Eraser className="size-3.5" />
          Clear
        </button>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onCancel}
            title="Back to typing"
            className="grid size-8 place-items-center rounded-lg text-faint transition-colors hover:text-ink"
          >
            <X className="size-4" />
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={paths.length === 0}
            className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 active:scale-95 disabled:opacity-40"
          >
            <Check className="size-3.5" />
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
