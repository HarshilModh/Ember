import Link from "next/link";
import { ArrowLeft, Tags } from "lucide-react";
import { allTopics } from "@/db/queries";
import { getOwnerId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function TopicsPage() {
  const ownerId = await getOwnerId();
  const topics = await allTopics(ownerId);

  return (
    <div className="space-y-8 animate-reveal">
      <div className="flex items-center justify-between border-b border-line/60 pb-6">
        <div>
          <Link href="/practice" className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink mb-2">
            <ArrowLeft className="size-3.5" />
            Practice Tracker
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-ink font-sans flex items-center gap-2">
            <Tags className="size-7 text-indigo-500" />
            Patterns
          </h1>
          <p className="text-sm font-medium text-muted mt-1">Every problem, grouped by the pattern it drills.</p>
        </div>
      </div>

      {topics.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {topics.map((t) => (
            <Link
              href={`/practice/topics/${encodeURIComponent(t.topic)}`}
              key={t.topic}
              className="bg-surface border border-line rounded-2xl p-4 shadow-2xs hover:shadow-xs hover:border-accent/50 transition-all group"
            >
              <h3 className="text-sm font-semibold text-ink group-hover:text-accent transition-colors truncate">{t.topic}</h3>
              <p className="text-xs text-faint mt-1 font-mono">
                {t.count} {t.count === 1 ? "problem" : "problems"}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="p-6 rounded-2xl border border-dashed border-line bg-surface/50 text-xs text-faint italic text-center">
          No patterns tagged yet. Tag a problem's <span className="font-mono">topics</span> when logging an attempt to get started.
        </div>
      )}
    </div>
  );
}
