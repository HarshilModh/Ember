"use client";

import { useState, useTransition } from "react";
import { generateMcpToken, revokeToken } from "@/app/actions";
import type { McpToken } from "@/db/schema";
import { Copy, Check, KeyRound, Trash2, ShieldAlert } from "lucide-react";

export function TokenManager({ tokens }: { tokens: McpToken[] }) {
  const [label, setLabel] = useState("");
  const [freshToken, setFreshToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  function generate() {
    const value = label.trim() || "Unnamed token";
    startTransition(async () => {
      const { token } = await generateMcpToken(value);
      setFreshToken(token);
      setLabel("");
      setCopied(false);
    });
  }

  function copy() {
    if (!freshToken) return;
    navigator.clipboard.writeText(freshToken);
    setCopied(true);
  }

  return (
    <div className="space-y-3">
      {freshToken ? (
        <div className="rounded-xl border border-accent/40 bg-accent-soft p-3.5 space-y-2">
          <p className="text-xs font-semibold text-ink flex items-center gap-1.5">
            <ShieldAlert className="size-3.5 text-accent" />
            Copy this now — it won't be shown again
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 min-w-0 text-[11px] bg-raised px-2.5 py-1.5 rounded-lg border border-line/50 text-ink overflow-x-auto whitespace-nowrap">
              {freshToken}
            </code>
            <button
              type="button"
              onClick={copy}
              className="shrink-0 flex items-center gap-1 rounded-lg bg-accent px-2.5 py-1.5 text-[11px] font-semibold text-white hover:opacity-90 transition-all"
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={`What's this for? (e.g. "my laptop")`}
          className="min-w-0 flex-1 rounded-xl border border-line bg-raised px-3 py-2 text-[13px] outline-none placeholder:text-faint focus-ring"
        />
        <button
          type="button"
          disabled={pending}
          onClick={generate}
          className="flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-[13px] font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
        >
          <KeyRound className="size-3.5" />
          Generate
        </button>
      </div>

      {tokens.length > 0 ? (
        <div className="divide-y divide-line/50 border-t border-line/50 pt-1">
          {tokens.map((t) => (
            <div key={t.id} className="flex items-center justify-between py-2 text-xs">
              <div>
                <span className="font-medium text-ink">{t.label}</span>
                <span className="ml-2 text-faint">
                  created {new Date(t.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                  {t.lastUsedAt
                    ? ` · last used ${new Date(t.lastUsedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`
                    : " · never used"}
                </span>
              </div>
              <button
                type="button"
                title="Revoke"
                onClick={() => startTransition(() => revokeToken(t.id))}
                className="grid size-7 place-items-center rounded-lg text-faint hover:text-rose-500 hover:bg-rose-500/10 transition-all"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-faint italic">No tokens yet — generate one to connect a remote Claude.</p>
      )}
    </div>
  );
}
