import { headers } from "next/headers";
import Link from "next/link";
import {
  PlusCircle,
  Target,
  CheckCircle2,
  MessageSquare,
  ChevronDown,
  BookOpen,
  Code2,
  BarChart3,
  Sparkles,
  HelpCircle,
  Flame,
  Terminal,
  Zap,
  Headphones,
  Keyboard,
  PenTool,
} from "lucide-react";
import { getOwnerId } from "@/lib/auth";
import { RelaunchTourButton } from "@/components/relaunch-tour-button";

export const dynamic = "force-dynamic";

export default async function HelpPage() {
  const ownerId = await getOwnerId();
  const databaseUrl = process.env.DATABASE_URL ?? "";
  const mcpPath = "/absolute/path/to/this/project/mcp/dist/server.mjs";
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const origin = `${host.includes("localhost") ? "http" : "https"}://${host}`;

  return (
    <div className="space-y-10 animate-reveal max-w-4xl pb-16">
      {/* Page Header Banner */}
      <header className="relative overflow-hidden rounded-3xl border border-line/80 bg-gradient-to-b from-surface via-surface/90 to-surface-container/40 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-accent">
            <Sparkles className="size-4" />
            <span>Ember Help & Knowledge Base</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-ink">
            Master Deep Work with Ember
          </h1>
          <p className="text-sm font-medium text-muted leading-relaxed">
            Welcome! Here is everything you need to know about Ember's high-impact workflow, offline audio focus soundscapes, and keyboard shortcuts.
          </p>
        </div>

        {/* Re-launch Onboarding Button */}
        <RelaunchTourButton />
      </header>

      {/* Quick Start Guide */}
      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-ink tracking-tight flex items-center gap-2">
          <HelpCircle className="size-5 text-accent" />
          The 3-Step Flow Workflow
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Step 1 */}
          <div className="bg-surface p-6 rounded-3xl border border-line shadow-2xs flex flex-col items-center text-center hover:border-accent/40 transition-all group">
            <div className="size-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-4 group-hover:scale-110 transition-transform">
              <PlusCircle className="size-6" />
            </div>
            <h3 className="text-base font-bold text-ink mb-1.5">1. Log Intentions</h3>
            <p className="text-xs text-muted leading-relaxed">
              Capture your tasks with priority tags (High, Medium, Low). No friction, just pure clarity.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-surface p-6 rounded-3xl border border-line shadow-2xs flex flex-col items-center text-center hover:border-accent/40 transition-all group">
            <div className="size-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 mb-4 group-hover:scale-110 transition-transform">
              <Target className="size-6" />
            </div>
            <h3 className="text-base font-bold text-ink mb-1.5">2. Enter Focus Zone</h3>
            <p className="text-xs text-muted leading-relaxed">
              Launch a Focus Session with offline synthesized audio (40Hz Beta Waves, Rain, Solfeggio 432Hz).
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-surface p-6 rounded-3xl border border-line shadow-2xs flex flex-col items-center text-center hover:border-accent/40 transition-all group">
            <div className="size-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="size-6" />
            </div>
            <h3 className="text-base font-bold text-ink mb-1.5">3. Complete & Log Victory</h3>
            <p className="text-xs text-muted leading-relaxed">
              Mark tasks done to boost your Daily Momentum battery and build your weekly completion streak.
            </p>
          </div>
        </div>
      </section>

      {/* Keyboard Shortcuts Cheat Sheet */}
      <section className="bg-surface rounded-3xl border border-line/80 p-6 sm:p-8 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink tracking-tight flex items-center gap-2">
            <Keyboard className="size-5 text-accent" />
            Keyboard Shortcut Cheat Sheet
          </h2>
          <span className="text-xs font-mono text-faint">Instant Control</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-raised/60 border border-line/50 flex items-center justify-between">
            <span className="font-semibold text-ink">Play / Pause Focus Session</span>
            <kbd className="rounded-md border border-line/80 bg-surface px-2 py-1 font-mono text-[11px] font-bold text-ink">
              Space
            </kbd>
          </div>

          <div className="p-3.5 rounded-2xl bg-raised/60 border border-line/50 flex items-center justify-between">
            <span className="font-semibold text-ink">Reset Focus Timer</span>
            <kbd className="rounded-md border border-line/80 bg-surface px-2 py-1 font-mono text-[11px] font-bold text-ink">
              R
            </kbd>
          </div>

          <div className="p-3.5 rounded-2xl bg-raised/60 border border-line/50 flex items-center justify-between">
            <span className="font-semibold text-ink">Custom Time Keyboard Input</span>
            <kbd className="rounded-md border border-line/80 bg-surface px-2 py-1 font-mono text-[11px] font-bold text-ink">
              C
            </kbd>
          </div>

          <div className="p-3.5 rounded-2xl bg-raised/60 border border-line/50 flex items-center justify-between">
            <span className="font-semibold text-ink">Exit Focus / Zen Mode</span>
            <kbd className="rounded-md border border-line/80 bg-surface px-2 py-1 font-mono text-[11px] font-bold text-ink">
              Esc
            </kbd>
          </div>

          <div className="p-3.5 rounded-2xl bg-raised/60 border border-line/50 flex items-center justify-between">
            <span className="font-semibold text-ink">Focus Add Task Input</span>
            <div className="flex gap-1">
              <kbd className="rounded-md border border-line/80 bg-surface px-2 py-1 font-mono text-[11px] font-bold text-ink">
                N
              </kbd>
              <kbd className="rounded-md border border-line/80 bg-surface px-2 py-1 font-mono text-[11px] font-bold text-ink">
                /
              </kbd>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-raised/60 border border-line/50 flex items-center justify-between">
            <span className="font-semibold text-ink">Submit Real-time Note</span>
            <kbd className="rounded-md border border-line/80 bg-surface px-2 py-1 font-mono text-[11px] font-bold text-ink">
              Enter
            </kbd>
          </div>
        </div>
      </section>

      {/* Apple Pencil */}
      <section className="bg-surface rounded-3xl border border-line/80 p-6 sm:p-8 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink tracking-tight flex items-center gap-2">
            <PenTool className="size-5 text-accent" />
            Apple Pencil on iPad
          </h2>
          <span className="text-xs font-mono text-faint">Beyond typing</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-raised/60 border border-line/50 space-y-1">
            <p className="font-semibold text-ink">Handwriting works everywhere, already</p>
            <p className="text-muted leading-relaxed">
              Every text field — task title, tags, notes, log notes — is a plain input, so iOS Scribble
              converts your handwriting to text automatically. Nothing to turn on.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-raised/60 border border-line/50 space-y-1">
            <p className="font-semibold text-ink">Cross a task off like paper</p>
            <p className="text-muted leading-relaxed">
              Draw a line through a task row to complete it (or reopen it if it's already closed). Draw
              an X to drop it. Same two actions as the swipe gesture, drawn instead of swiped.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-raised/60 border border-line/50 space-y-1">
            <p className="font-semibold text-ink">Hover to peek (iPad Pro, M2 and later)</p>
            <p className="text-muted leading-relaxed">
              Hold the Pencil just above a task that has notes, without touching down, and the full note
              pops up — no need to open it to read past what's shown on the row.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-raised/60 border border-line/50 space-y-1">
            <p className="font-semibold text-ink">Draw a log note instead of typing one</p>
            <p className="text-muted leading-relaxed">
              Open a task's note composer and tap the pen icon to switch to a small ink strip — good for
              a quick sketch or a note that's faster drawn than typed.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-raised/60 border border-line/50 space-y-1 sm:col-span-2">
            <p className="font-semibold text-ink">Mark up Metrics and This Week</p>
            <p className="text-muted leading-relaxed">
              The pen button in the bottom-left corner of those pages opens a freehand overlay — circle a
              good day, underline a streak. It's for the moment of looking, not saved anywhere, and clears
              when you close it.
            </p>
          </div>
        </div>
      </section>

      {/* Pro Tip / Claude AI MCP Integration Section */}
      <section className="bg-accent/5 rounded-3xl p-6 sm:p-8 border border-accent/20 shadow-2xs relative overflow-hidden space-y-4">
        <div className="flex items-start gap-4">
          <div className="size-10 rounded-2xl bg-accent/20 flex items-center justify-center text-accent shrink-0 mt-0.5">
            <MessageSquare className="size-5" />
          </div>
          <div className="space-y-2 flex-1">
            <h3 className="text-base font-extrabold text-ink">
              AI Power: Talk to your tasks via Claude (MCP)
            </h3>
            <p className="text-sm text-muted leading-relaxed">
              Connect Claude Desktop or Claude Code directly to Ember via Model Context Protocol (MCP) to manage tasks using natural voice or text conversations.
            </p>

            <div className="mt-4 p-4 bg-surface rounded-2xl border border-line space-y-3">
              <p className="text-xs font-semibold text-ink">Easiest Setup — HTTP Remote</p>
              <p className="text-xs text-muted">
                Generate an API token on the{" "}
                <Link href="/settings" className="text-accent hover:underline font-bold">
                  Settings
                </Link>{" "}
                page. Then run this in Claude Code:
              </p>

              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-ink uppercase tracking-wide">Claude Code Command</p>
                <pre className="text-[11px] bg-raised p-3 rounded-xl border border-line/60 overflow-x-auto font-mono text-ink whitespace-pre-wrap break-all select-all">
{`claude mcp add --transport http ember ${origin}/api/mcp \\
  --header "Authorization: Bearer <token from Settings>"`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tab Overview Guide */}
      <section className="bg-surface rounded-3xl border border-line p-6 sm:p-8 shadow-2xs space-y-4">
        <h2 className="text-lg font-extrabold text-ink tracking-tight flex items-center gap-2">
          <BookOpen className="size-5 text-accent" />
          App Navigation Guide
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-raised/50 border border-line/50 space-y-1.5">
            <div className="font-bold text-ink text-sm flex items-center gap-1.5">
              <BookOpen className="size-4 text-accent" />
              Task Log
            </div>
            <p className="text-muted leading-relaxed">
              Your central task log. Filter by "Today", spread out in "This Week", or review completed items in "All".
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-raised/50 border border-line/50 space-y-1.5">
            <div className="font-bold text-ink text-sm flex items-center gap-1.5">
              <Target className="size-4 text-purple-500" />
              Focus Mode
            </div>
            <p className="text-muted leading-relaxed">
              Isolate single tasks with dual-ring Pomodoro timer, 7 offline audio soundscapes, Zen View, and session stream logs.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-raised/50 border border-line/50 space-y-1.5">
            <div className="font-bold text-ink text-sm flex items-center gap-1.5">
              <Code2 className="size-4 text-emerald-500" />
              Practice Tracker
            </div>
            <p className="text-muted leading-relaxed">
              Spaced repetition problem logger for LeetCode and technical topics so you review concepts before forgetting them.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-raised/50 border border-line/50 space-y-1.5">
            <div className="font-bold text-ink text-sm flex items-center gap-1.5">
              <BarChart3 className="size-4 text-amber-500" />
              Metrics & Trends
            </div>
            <p className="text-muted leading-relaxed">
              Analyze daily momentum battery streaks, focus duration totals, and subject mastery over time.
            </p>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-ink tracking-tight flex items-center gap-2">
          <Sparkles className="size-5 text-accent" />
          Frequently Asked Questions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-surface p-5 rounded-2xl border border-line shadow-2xs space-y-2">
            <h3 className="text-sm font-bold text-ink">Does audio work offline?</h3>
            <p className="text-xs text-muted leading-relaxed">
              Yes! All 7 focus soundscapes are 100% locally synthesized using pure Web Audio API oscillator nodes. Zero external audio downloads required.
            </p>
          </div>

          <div className="bg-surface p-5 rounded-2xl border border-line shadow-2xs space-y-2">
            <h3 className="text-sm font-bold text-ink">What happens if I change pages during focus?</h3>
            <p className="text-xs text-muted leading-relaxed">
              Your focus session and soundscapes continue running uninterrupted! A persistent floating Mini Focus HUD appears at the bottom of the screen.
            </p>
          </div>

          <div className="bg-surface p-5 rounded-2xl border border-line shadow-2xs space-y-2">
            <h3 className="text-sm font-bold text-ink">Is my task data private?</h3>
            <p className="text-xs text-muted leading-relaxed">
              Yes! Each user account gets a completely isolated, private database scope automatically tied to their account authentication token.
            </p>
          </div>

          <div className="bg-surface p-5 rounded-2xl border border-line shadow-2xs space-y-2">
            <h3 className="text-sm font-bold text-ink">How do I trigger custom focus times?</h3>
            <p className="text-xs text-muted leading-relaxed">
              Click "Custom Time" (or press <kbd className="font-mono text-[10px] bg-raised px-1 py-0.5 rounded border border-line">C</kbd>) in Focus Mode to open the keyboard type-in box or drag the smooth range slider.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
