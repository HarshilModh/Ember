"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { PenTool, X, Trash2, Undo2, Download, Eraser, Grid, Check } from "lucide-react";
import { safeSetPointerCapture } from "@/lib/pointer";

interface StrokePoint {
  x: number;
  y: number;
  pressure: number;
}

interface Stroke {
  points: StrokePoint[];
  color: string;
  width: number;
  erase: boolean;
}

const MAX_STROKES = 500;
const CANVAS_HEIGHT = 440;

export function ApplePencilScratchpad({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [color, setColor] = useState("#10b981"); // Emerald green
  const [lineWidth, setLineWidth] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const [gridBackground, setGridBackground] = useState(true);
  const [canUndo, setCanUndo] = useState(false);
  // Ghost brush preview while an iPad Pro (M2+) Pencil hovers without
  // touching down — a plain DOM overlay, not canvas ink, so it can never
  // leak into the drawing or undo stack.
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  // Vector stroke log — lets undo/redraw work at any canvas size without
  // the multi-megabyte-per-snapshot cost of ImageData at retina resolutions.
  const strokesRef = useRef<Stroke[]>([]);
  const activeStrokeRef = useRef<Stroke | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const pencilSeenRef = useRef(false);

  const redrawAll = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    // setTransform is absolute, unlike scale() — safe to call on every
    // redraw regardless of what the matrix was left at previously. (A
    // save()/scale()/restore() dance here compounds the dpr scale on every
    // call that isn't preceded by a canvas.width reset, sending strokes
    // flying off-canvas after a couple of undos.)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    for (const stroke of strokesRef.current) {
      drawStroke(ctx, stroke);
    }
  }, []);

  // Keep the canvas' backing store matched to CSS size × devicePixelRatio
  // (otherwise strokes render at half resolution on retina iPads), and
  // replay the vector log on every resize so rotating the iPad or entering
  // Split View doesn't wipe the sketch.
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const width = container.clientWidth;
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(CANVAS_HEIGHT * dpr);
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${CANVAS_HEIGHT}px`;
      const ctx = canvas!.getContext("2d");
      if (ctx) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
      redrawAll();
    }

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, [isOpen, redrawAll]);

  if (!isOpen) return null;

  function pointFromEvent(e: PointerEvent, canvas: HTMLCanvasElement): StrokePoint {
    const rect = canvas.getBoundingClientRect();
    // Pen/finger pressure defaults to 0.5 on hardware that can't report it —
    // scaling width by (0.5 + pressure) means unsupported inputs land back
    // on the plain, unscaled brush width while real Pencil pressure tapers it.
    const pressure = e.pressure > 0 ? e.pressure : 0.5;
    return { x: e.clientX - rect.left, y: e.clientY - rect.top, pressure };
  }

  function widthFor(stroke: Stroke, pressure: number) {
    const factor = Math.min(1.6, Math.max(0.5, 0.5 + pressure));
    return (stroke.erase ? stroke.width * 4 : stroke.width) * factor;
  }

  function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
    if (stroke.points.length === 0) return;
    ctx.globalCompositeOperation = stroke.erase ? "destination-out" : "source-over";
    ctx.strokeStyle = stroke.color;

    if (stroke.points.length === 1) {
      const p = stroke.points[0];
      ctx.beginPath();
      ctx.lineWidth = widthFor(stroke, p.pressure);
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + 0.01, p.y + 0.01);
      ctx.stroke();
      return;
    }

    for (let i = 1; i < stroke.points.length; i++) {
      const prev = stroke.points[i - 1];
      const cur = stroke.points[i];
      ctx.beginPath();
      ctx.lineWidth = widthFor(stroke, (prev.pressure + cur.pressure) / 2);
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(cur.x, cur.y);
      ctx.stroke();
    }
  }

  function drawSegment(ctx: CanvasRenderingContext2D, stroke: Stroke, from: StrokePoint, to: StrokePoint) {
    ctx.globalCompositeOperation = stroke.erase ? "destination-out" : "source-over";
    ctx.strokeStyle = stroke.color;
    ctx.beginPath();
    ctx.lineWidth = widthFor(stroke, (from.pressure + to.pressure) / 2);
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }

  function startDrawing(e: React.PointerEvent<HTMLCanvasElement>) {
    if (activePointerIdRef.current !== null) return; // one contact at a time
    setHoverPos(null);
    if (e.pointerType === "pen") pencilSeenRef.current = true;
    // Once the Apple Pencil has touched down, reject finger contacts as palm.
    if (e.pointerType === "touch" && pencilSeenRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    safeSetPointerCapture(canvas, e.pointerId);
    activePointerIdRef.current = e.pointerId;

    const point = pointFromEvent(e.nativeEvent, canvas);
    const stroke: Stroke = { points: [point], color, width: lineWidth, erase: isEraser };
    activeStrokeRef.current = stroke;

    const ctx = canvas.getContext("2d");
    if (ctx) drawStroke(ctx, stroke);
  }

  function draw(e: React.PointerEvent<HTMLCanvasElement>) {
    const stroke = activeStrokeRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!stroke) {
      if (e.pointerType === "pen") {
        const rect = canvas.getBoundingClientRect();
        setHoverPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
      return;
    }
    if (e.pointerId !== activePointerIdRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    e.preventDefault();

    // Pull every intermediate sample the Pencil captured this frame (up to
    // 240Hz) instead of just the latest point — otherwise fast strokes come
    // out visibly faceted.
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent];
    let last = stroke.points[stroke.points.length - 1];
    for (const evt of events) {
      const point = pointFromEvent(evt, canvas);
      drawSegment(ctx, stroke, last, point);
      stroke.points.push(point);
      last = point;
    }
  }

  function stopDrawing(e: React.PointerEvent<HTMLCanvasElement>) {
    if (e.pointerType === "pen") setHoverPos(null);
    if (e.pointerId !== activePointerIdRef.current) return;
    const canvas = canvasRef.current;
    if (canvas?.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    activePointerIdRef.current = null;

    const stroke = activeStrokeRef.current;
    activeStrokeRef.current = null;
    if (!stroke) return;

    strokesRef.current.push(stroke);
    if (strokesRef.current.length > MAX_STROKES) strokesRef.current.shift();
    setCanUndo(true);
  }

  function handleUndo() {
    strokesRef.current.pop();
    setCanUndo(strokesRef.current.length > 0);
    redrawAll();
  }

  function handleClear() {
    strokesRef.current = [];
    setCanUndo(false);
    redrawAll();
  }

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `ember-ipad-sketch-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  }

  return (
    <div className="fixed inset-0 z-[130] grid place-items-center bg-black/85 backdrop-blur-2xl p-4 animate-reveal">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-white/20 bg-slate-950 p-6 shadow-2xl space-y-4">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3.5 py-1.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5 shadow-xs">
              <PenTool className="size-4" />
              Pro Apple Pencil Studio
            </span>
          </div>

          {/* Color & Tool Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Color Swatches */}
            <div className="flex items-center gap-1.5 bg-black/50 p-1.5 rounded-full border border-white/15">
              {["#10b981", "#38bdf8", "#f59e0b", "#a855f7", "#ec4899", "#ffffff"].map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setColor(c);
                    setIsEraser(false);
                  }}
                  className={`size-9 rounded-full transition-all ${
                    color === c && !isEraser ? "scale-110 ring-2 ring-white shadow-md" : "hover:scale-110 opacity-70 hover:opacity-100"
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>

            {/* Brush Weights */}
            <div className="flex items-center gap-1 bg-black/50 p-1 rounded-2xl border border-white/15">
              {[
                { label: "Fine", width: 2 },
                { label: "Medium", width: 5 },
                { label: "Bold", width: 10 },
                { label: "Chisel", width: 20 },
              ].map((b) => (
                <button
                  key={b.width}
                  onClick={() => setLineWidth(b.width)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    lineWidth === b.width ? "bg-white text-black font-extrabold" : "text-white/60 hover:text-white"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>

            {/* Eraser */}
            <button
              onClick={() => setIsEraser(!isEraser)}
              className={`p-3 rounded-2xl border transition-all ${
                isEraser
                  ? "bg-rose-500 text-white border-rose-400 shadow-md"
                  : "border-white/15 bg-white/10 text-white/80 hover:text-white"
              }`}
              title="Eraser tool"
            >
              <Eraser className="size-4" />
            </button>

            {/* Grid Toggle */}
            <button
              onClick={() => setGridBackground(!gridBackground)}
              className={`p-3 rounded-2xl border transition-all ${
                gridBackground
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "border-white/15 bg-white/10 text-white/80"
              }`}
              title="Toggle Dot Grid Canvas"
            >
              <Grid className="size-4" />
            </button>

            {/* Undo */}
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className="p-3 rounded-2xl border border-white/15 bg-white/10 text-white/80 hover:text-white disabled:opacity-30"
              title="Undo stroke"
            >
              <Undo2 className="size-4" />
            </button>

            {/* Clear */}
            <button
              onClick={handleClear}
              className="p-3 rounded-2xl border border-white/15 bg-white/10 text-white/80 hover:text-rose-400"
              title="Clear Canvas"
            >
              <Trash2 className="size-4" />
            </button>

            {/* Export PNG */}
            <button
              onClick={handleDownload}
              className="p-3 rounded-2xl border border-emerald-400/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 font-bold text-xs flex items-center gap-1.5"
              title="Export sketch to PNG"
            >
              <Download className="size-4" />
              <span className="hidden sm:inline">Export PNG</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-3 rounded-2xl border border-white/20 bg-white/10 text-white hover:bg-white/20"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Drawing Canvas Container */}
        <div
          ref={containerRef}
          className={`relative w-full rounded-2xl border border-white/15 overflow-hidden touch-none ${
            gridBackground
              ? "bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] bg-slate-950"
              : "bg-slate-950"
          }`}
        >
          <canvas
            ref={canvasRef}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerCancel={stopDrawing}
            onPointerLeave={stopDrawing}
            style={{ touchAction: "none" }}
            className="w-full h-[440px] cursor-crosshair"
          />
          {hoverPos ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute rounded-full border-2"
              style={{
                left: hoverPos.x,
                top: hoverPos.y,
                width: isEraser ? lineWidth * 4 : lineWidth,
                height: isEraser ? lineWidth * 4 : lineWidth,
                transform: "translate(-50%, -50%)",
                borderColor: isEraser ? "#f43f5e" : color,
                background: isEraser ? "transparent" : `${color}33`,
              }}
            />
          ) : null}
        </div>

        <div className="flex items-center justify-between text-xs text-white/50 font-mono">
          <span>Pro Apple Pencil studio: pressure-sensitive ink, palm rejection, and retina PNG export active.</span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-white text-black font-black text-xs hover:bg-white/90 active:scale-95 transition-all shadow-md"
          >
            Done Sketching
          </button>
        </div>
      </div>
    </div>
  );
}
