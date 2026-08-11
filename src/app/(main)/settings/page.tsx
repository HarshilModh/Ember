import { ThemePicker } from "@/components/theme-picker";
import { TokenManager } from "@/components/token-manager";
import { listMcpTokens } from "@/db/queries";
import { getOwnerId } from "@/lib/auth";
import { Code2, Keyboard, Palette, Radio } from "lucide-react";

export const dynamic = "force-dynamic";

const SHORTCUTS = [
  { keys: "N or /", does: "Focus the add-task field" },
  { keys: "Esc", does: "In focus mode: clear a half-typed note, then leave" },
  { keys: "Enter", does: "Submit the add-task or log-note form" },
];

export default async function SettingsPage() {
  const leetcodeUser = process.env.LEETCODE_USERNAME?.trim();
  const ownerId = await getOwnerId();
  const tokens = await listMcpTokens(ownerId);

  return (
    <div className="space-y-8 animate-reveal max-w-2xl">
      <div className="border-b border-line/60 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-ink font-sans">Settings</h1>
        <p className="text-sm font-medium text-muted mt-1">
          Signed in as <span className="font-medium text-ink">{ownerId}</span>.
        </p>
      </div>

      <section className="bg-surface rounded-2xl border border-line p-6 shadow-2xs space-y-3">
        <h2 className="text-sm font-bold text-ink flex items-center gap-2">
          <Radio className="size-4 text-accent" />
          Remote MCP access
        </h2>
        <p className="text-xs text-muted">
          Lets Claude talk to Ember directly over the internet — no local process to run. Generate a
          token, then on the other end: <code className="text-[11px] bg-raised px-1.5 py-0.5 rounded border border-line/50">claude mcp add --transport http ember &lt;this site&gt;/api/mcp --header &quot;Authorization: Bearer &lt;token&gt;&quot;</code>.
          Revoking a token cuts that access off immediately.
        </p>
        <TokenManager tokens={tokens} />
      </section>

      <section className="bg-surface rounded-2xl border border-line p-6 shadow-2xs space-y-3">
        <h2 className="text-sm font-bold text-ink flex items-center gap-2">
          <Palette className="size-4 text-accent" />
          Appearance
        </h2>
        <ThemePicker />
      </section>

      <section className="bg-surface rounded-2xl border border-line p-6 shadow-2xs space-y-3">
        <h2 className="text-sm font-bold text-ink flex items-center gap-2">
          <Code2 className="size-4 text-accent" />
          LeetCode sync
        </h2>
        {leetcodeUser ? (
          <p className="text-xs text-muted">
            Configured for{" "}
            <span className="font-mono font-semibold text-ink">{leetcodeUser}</span>. Run{" "}
            <code className="text-[11px] bg-raised px-1.5 py-0.5 rounded border border-line/50">
              npm run sync:leetcode
            </code>{" "}
            to pull recent accepted submissions.
          </p>
        ) : (
          <p className="text-xs text-faint">
            Not configured. Set <code className="text-[11px] bg-raised px-1.5 py-0.5 rounded border border-line/50">LEETCODE_USERNAME</code> in{" "}
            <code className="text-[11px] bg-raised px-1.5 py-0.5 rounded border border-line/50">.env</code> to enable{" "}
            <code className="text-[11px] bg-raised px-1.5 py-0.5 rounded border border-line/50">npm run sync:leetcode</code>. Manual
            logging still works through the <span className="font-mono">log_attempt</span> MCP tool.
          </p>
        )}
      </section>

      <section className="bg-surface rounded-2xl border border-line p-6 shadow-2xs space-y-3">
        <h2 className="text-sm font-bold text-ink flex items-center gap-2">
          <Keyboard className="size-4 text-accent" />
          Keyboard shortcuts
        </h2>
        <div className="divide-y divide-line/50">
          {SHORTCUTS.map((s) => (
            <div key={s.keys} className="flex items-center justify-between py-2 text-xs">
              <span className="text-muted">{s.does}</span>
              <kbd className="font-mono text-[11px] bg-raised px-2 py-1 rounded border border-line/50 text-ink">
                {s.keys}
              </kbd>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
