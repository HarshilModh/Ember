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
  ShieldAlert,
  Settings,
} from "lucide-react";
import { getOwnerId } from "@/lib/auth";

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
      {/* Page Header */}
      <header className="border-b border-line/60 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-ink font-sans">
          Welcome to Tasklog
        </h1>
        <p className="text-base font-medium text-muted mt-2">
          We're here to help you find your flow and get things done, one step at a time.
        </p>
      </header>

      {/* Quick Start Section: How do I start? */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-ink tracking-tight flex items-center gap-2">
          <HelpCircle className="size-5 text-accent" />
          How do I start?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Step 1 */}
          <div className="bg-surface p-6 rounded-2xl border border-line shadow-2xs flex flex-col items-center text-center hover:border-accent/40 transition-all group">
            <div className="size-12 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-4 group-hover:scale-110 transition-transform">
              <PlusCircle className="size-7" />
            </div>
            <h3 className="text-base font-bold text-ink mb-2">1. Add a Task</h3>
            <p className="text-xs text-muted leading-relaxed">
              Just type what's on your mind. No complex forms, just your intentions.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-surface p-6 rounded-2xl border border-line shadow-2xs flex flex-col items-center text-center hover:border-accent/40 transition-all group">
            <div className="size-12 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-4 group-hover:scale-110 transition-transform">
              <Target className="size-7" />
            </div>
            <h3 className="text-base font-bold text-ink mb-2">2. Get in the Zone</h3>
            <p className="text-xs text-muted leading-relaxed">
              Pick your most important task and hit play to clear away distractions.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-surface p-6 rounded-2xl border border-line shadow-2xs flex flex-col items-center text-center hover:border-accent/40 transition-all group">
            <div className="size-12 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-4 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="size-7" />
            </div>
            <h3 className="text-base font-bold text-ink mb-2">3. Finish & Reflect</h3>
            <p className="text-xs text-muted leading-relaxed">
              Mark it done and see your progress grow. You're doing great!
            </p>
          </div>
        </div>
      </section>

      {/* Pro Tip / MCP Integration Section */}
      <section className="bg-accent/5 rounded-2xl p-6 border border-accent/20 shadow-2xs relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="size-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent shrink-0 mt-0.5">
            <MessageSquare className="size-5" />
          </div>
          <div className="space-y-2 flex-1">
            <h3 className="text-base font-bold text-ink">
              Pro Tip: Talk to your tasks
            </h3>
            <p className="text-sm text-muted leading-relaxed">
              Did you know you can update your list just by talking to Claude? It's like having a personal assistant for your deep work.
            </p>

            <div className="mt-4 p-4 bg-surface rounded-xl border border-line space-y-2">
              <p className="text-xs font-semibold text-ink">Easiest way — nothing to install</p>
              <p className="text-xs text-muted">
                Generate a token on the <Link href="/settings" className="text-accent hover:underline">Settings</Link> page,
                then give this to Claude:
              </p>
              <pre className="text-[11px] bg-raised p-3 rounded-lg border border-line/60 overflow-x-auto font-mono text-ink whitespace-pre-wrap break-all select-all">
{`claude mcp add --transport http ember ${origin}/api/mcp \\
  --header "Authorization: Bearer <token from Settings>"`}
              </pre>
              <p className="text-[11px] text-faint">
                Every person gets their own token and only ever sees their own tasks through it. Revoke it
                from Settings any time to cut access off immediately.
              </p>
            </div>

            <details className="group mt-3 pt-2 border-t border-accent/15">
              <summary className="cursor-pointer text-accent font-semibold text-xs flex items-center gap-1 hover:underline select-none">
                <span>Advanced: run it locally instead</span>
                <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
              </summary>
              <div className="mt-3 p-4 bg-surface rounded-xl border border-line space-y-3">
                <p className="text-xs text-muted">
                  Needs a copy of this project's code and Node installed. Only worth it if you specifically
                  want the connection running on your own machine rather than over the internet:
                </p>
                <pre className="text-[11px] bg-raised p-3 rounded-lg border border-line/60 overflow-x-auto font-mono text-ink whitespace-pre-wrap break-all select-all">
{`claude mcp add ember -s user \\
  -e "DATABASE_URL=${databaseUrl || "<your-database-url>"}" \\
  -e "EMBER_OWNER_EMAIL=${ownerId}" \\
  -- node ${mcpPath}`}
                </pre>
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* Tab Overview Section */}
      <section className="bg-surface rounded-2xl border border-line p-6 shadow-2xs space-y-4">
        <h2 className="text-lg font-bold text-ink tracking-tight flex items-center gap-2">
          <BookOpen className="size-5 text-accent" />
          Tab Guide
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-raised/50 border border-line/50 space-y-1">
            <div className="font-bold text-ink text-sm flex items-center gap-1.5">
              <BookOpen className="size-4 text-accent" />
              Log
            </div>
            <p className="text-muted leading-relaxed">
              Your primary to-do list. View items by "Today", spread out in "This Week", or see everything in "All".
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-raised/50 border border-line/50 space-y-1">
            <div className="font-bold text-ink text-sm flex items-center gap-1.5">
              <Target className="size-4 text-accent" />
              Focus
            </div>
            <p className="text-muted leading-relaxed">
              Isolate a single task with an active timer and session notes log. Press <kbd className="font-mono text-[10px] bg-surface px-1 py-0.5 rounded border border-line">Esc</kbd> to leave anytime.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-raised/50 border border-line/50 space-y-1">
            <div className="font-bold text-ink text-sm flex items-center gap-1.5">
              <Code2 className="size-4 text-accent" />
              Practice
            </div>
            <p className="text-muted leading-relaxed">
              Spaced repetition tracker for LeetCode and technical practice problems to review before forgetting them.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-raised/50 border border-line/50 space-y-1">
            <div className="font-bold text-ink text-sm flex items-center gap-1.5">
              <BarChart3 className="size-4 text-accent" />
              Metrics
            </div>
            <p className="text-muted leading-relaxed">
              Detailed performance metrics, daily completion streaks, focus time totals, and topic mastery.
            </p>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-ink tracking-tight flex items-center gap-2">
          <Sparkles className="size-5 text-accent" />
          Frequently Asked Questions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-surface p-5 rounded-2xl border border-line shadow-2xs space-y-2">
            <h3 className="text-sm font-bold text-ink">Where does my work go?</h3>
            <p className="text-xs text-muted leading-relaxed">
              Everything is saved in your personal Log—a simple, chronological timeline of your achievements stored securely in your database.
            </p>
          </div>

          <div className="bg-surface p-5 rounded-2xl border border-line shadow-2xs space-y-2">
            <h3 className="text-sm font-bold text-ink">How do I stay motivated?</h3>
            <p className="text-xs text-muted leading-relaxed">
              Check your 'Metrics' tab to see your daily streaks and focus trends. Consistency is the key to mastery.
            </p>
          </div>

          <div className="bg-surface p-5 rounded-2xl border border-line shadow-2xs space-y-2">
            <h3 className="text-sm font-bold text-ink">Is my data multi-user & private?</h3>
            <p className="text-xs text-muted leading-relaxed">
              Yes! Each invited account gets a completely isolated, private task log automatically tied to their account email.
            </p>
          </div>

          <div className="bg-surface p-5 rounded-2xl border border-line shadow-2xs space-y-2">
            <h3 className="text-sm font-bold text-ink">How do keyboard shortcuts work?</h3>
            <p className="text-xs text-muted leading-relaxed">
              Press <kbd className="font-mono text-[10px] bg-raised px-1 py-0.5 rounded border border-line">N</kbd> or <kbd className="font-mono text-[10px] bg-raised px-1 py-0.5 rounded border border-line">/</kbd> anywhere to focus the add-task field. Press <kbd className="font-mono text-[10px] bg-raised px-1 py-0.5 rounded border border-line">Esc</kbd> in Focus mode to exit.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
