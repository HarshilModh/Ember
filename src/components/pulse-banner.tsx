import Link from "next/link";
import type { Pulse, PulseTone } from "@/lib/pulse";

const TONE: Record<PulseTone, { value: string; glow: string; rule: string }> = {
  urgent: { value: "text-p3", glow: "bg-p3/15", rule: "bg-p3" },
  warn: { value: "text-p2", glow: "bg-p2/15", rule: "bg-p2" },
  good: { value: "text-accent", glow: "bg-accent/15", rule: "bg-accent" },
  neutral: { value: "text-muted", glow: "bg-accent/10", rule: "bg-line" },
};

export function PulseBanner({ pulse }: { pulse: Pulse }) {
  const tone = TONE[pulse.tone];

  // No number to show means the quote fallback: give the text the whole card
  // rather than leaving a hole where the figure would sit.
  if (!pulse.value) {
    return (
      <div className="relative flex items-stretch gap-4 overflow-hidden rounded-2xl border border-line bg-surface p-5 shadow-2xs">
        <span className={`w-0.5 shrink-0 rounded-full ${tone.rule}`} />
        <div className="min-w-0">
          <p className="text-base font-medium leading-snug text-ink">{pulse.headline}</p>
          <p className="mt-1.5 text-xs font-semibold tracking-wide text-faint">
            {pulse.detail}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex items-center gap-5 overflow-hidden rounded-2xl border border-line bg-surface p-5 shadow-2xs">
      <div className={`absolute -top-24 -right-24 size-48 rounded-full blur-3xl ${tone.glow}`} />

      <div className="relative z-10 flex shrink-0 flex-col items-center px-1">
        <span className={`text-4xl font-bold leading-none tabular-nums ${tone.value}`}>
          {pulse.value}
        </span>
        <span className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-faint">
          {pulse.unit}
        </span>
      </div>

      <span className="relative z-10 h-10 w-px shrink-0 bg-line" />

      <div className="relative z-10 min-w-0 flex-1">
        <p className="text-sm font-bold text-ink">{pulse.headline}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">{pulse.detail}</p>
      </div>

      {pulse.action ? (
        <Link
          href={pulse.action.href}
          className="relative z-10 shrink-0 rounded-lg bg-accent/10 px-3.5 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent hover:text-white"
        >
          {pulse.action.label}
        </Link>
      ) : null}
    </div>
  );
}
