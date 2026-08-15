import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, TriangleAlert, Bookmark } from "lucide-react";
import { problemsByTopic } from "@/db/queries";
import { getOwnerId } from "@/lib/auth";
import { OUTCOME_META } from "@/lib/outcome-meta";

export const dynamic = "force-dynamic";

export default async function TopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic: rawTopic } = await params;
  const topic = decodeURIComponent(rawTopic);
  if (!topic.trim()) notFound();

  const ownerId = await getOwnerId();
  const rows = await problemsByTopic(ownerId, topic);

  return (
    <div className="space-y-8 animate-reveal">
      <div className="border-b border-line/60 pb-6">
        <Link href="/practice/topics" className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink mb-2">
          <ArrowLeft className="size-3.5" />
          Patterns
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-ink font-sans">{topic}</h1>
        <p className="text-sm font-medium text-muted mt-1">
          {rows.length} {rows.length === 1 ? "problem" : "problems"} tagged with this pattern.
        </p>
      </div>

      {rows.length > 0 ? (
        <div className="bg-surface rounded-2xl border border-line overflow-hidden shadow-2xs divide-y divide-line/60">
          {rows.map(({ problem: p, lastOutcome, attemptCount, regressed }) => {
            const lastMeta = lastOutcome ? OUTCOME_META[lastOutcome] : null;
            return (
              <Link
                href={`/practice/${p.id}`}
                key={p.id}
                className="p-4 hover:bg-raised/40 transition-colors flex items-center justify-between group relative overflow-hidden"
              >
                {regressed ? <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-600" /> : null}
                <div className="flex items-center gap-4 pl-3">
                  <span className="font-mono text-xs text-faint w-10">{p.number ? `#${p.number}` : ""}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-ink group-hover:text-accent transition-colors">{p.title}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {p.difficulty ? (
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full lc-${p.difficulty} bg-current/10`}>
                          {p.difficulty}
                        </span>
                      ) : null}
                      {p.pinnedForRevisit ? (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center gap-1">
                          <Bookmark className="size-2.5" />
                          pinned
                        </span>
                      ) : null}
                      {p.topics
                        .filter((t) => t.toLowerCase() !== topic.toLowerCase())
                        .slice(0, 2)
                        .map((t) => (
                          <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded bg-raised text-muted border border-line/40">
                            {t}
                          </span>
                        ))}
                    </div>
                    {regressed ? (
                      <p className="mt-1.5 text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                        <TriangleAlert className="size-3" />
                        Regressed on revision
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="text-right">
                  {lastMeta ? (
                    <span className={`text-xs font-bold ${lastMeta.accent}`}>{lastMeta.label}</span>
                  ) : (
                    <span className="text-xs font-medium text-faint">Never attempted</span>
                  )}
                  {attemptCount > 0 ? (
                    <span className="block text-[11px] text-faint mt-0.5 font-mono">
                      {attemptCount} attempt{attemptCount === 1 ? "" : "s"}
                    </span>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="p-6 rounded-2xl border border-dashed border-line bg-surface/50 text-xs text-faint italic text-center">
          No problems tagged &ldquo;{topic}&rdquo;.
        </div>
      )}
    </div>
  );
}
