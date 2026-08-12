"use client";

import { useRef, useState, useEffect } from "react";
import { PenTool, X, Trash2, Undo2, Download, Check } from "lucide-react";

export function ApplePencilScratchpad({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#10b981"); // Emerald green
  const [lineWidth, setLineWidth] = useState(3);
  const [history, setHistory] = useState<ImageData[]>([]);

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = canvas.parentElement?.clientWidth || 700;
    canvas.height = 420;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
  }, [isOpen]);

  if (!isOpen) return null;

  function startDrawing(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Save history for undo
    setHistory((prev) => [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)]);

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  }

  function stopDrawing() {
    setIsDrawing(false);
  }

  function handleUndo() {
    const canvas = canvasRef.current;
    if (!canvas || history.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const lastState = history[history.length - 1];
    ctx.putImageData(lastState, 0, 0);
    setHistory((prev) => prev.slice(0, prev.length - 1));
  }

  function handleClear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  return (
    <div className="fixed inset-0 z-[130] grid place-items-center bg-black/80 backdrop-blur-2xl p-4 animate-reveal">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/20 bg-slate-950 p-6 shadow-2xl space-y-4">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
              <PenTool className="size-3.5" />
              Apple Pencil & Touch Scratchpad
            </span>
          </div>

          {/* Color & Tool Picker */}
          <div className="flex items-center gap-3">
            {/* Color Swatches */}
            <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-full border border-white/10">
              {["#10b981", "#38bdf8", "#f59e0b", "#ec4899", "#ffffff"].map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`size-6 rounded-full transition-transform ${
                    color === c ? "scale-125 ring-2 ring-white" : "hover:scale-110"
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>

            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              className="p-2 rounded-xl border border-white/15 bg-white/10 text-white/80 hover:text-white disabled:opacity-30"
              title="Undo stroke"
            >
              <Undo2 className="size-4" />
            </button>

            <button
              onClick={handleClear}
              className="p-2 rounded-xl border border-white/15 bg-white/10 text-white/80 hover:text-rose-400"
              title="Clear Scratchpad"
            >
              <Trash2 className="size-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/20"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Drawing Canvas Container */}
        <div className="relative w-full rounded-2xl border border-white/15 bg-black/60 overflow-hidden touch-none">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-[420px] cursor-crosshair"
          />
        </div>

        <div className="flex items-center justify-between text-xs text-white/50 font-mono">
          <span>Use Apple Pencil or finger to sketch thoughts, math, or diagrams.</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white text-black font-extrabold text-xs hover:bg-white/90"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
