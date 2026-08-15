/**
 * npm run sync:leetcode
 *
 * Pulls the last ~20 accepted submissions for LEETCODE_USERNAME from LeetCode's
 * unofficial, undocumented GraphQL API and appends them as sync attempts. This
 * is not a backfill — see the README's "Sync" section for the honest limits.
 *
 * All network calls happen before any database write, so a broken or refusing
 * endpoint (the actual fragile part of this script) fails loudly without
 * touching the database.
 */
import { findOrCreateProblem, findProblemBySlug, hasAttemptAt, recordAttempt } from "../src/db/queries";
import { sql } from "../src/db/client";

const GRAPHQL_URL = "https://leetcode.com/graphql";

const RECENT_SUBMISSIONS_QUERY = `
  query recentAcSubmissions($username: String!, $limit: Int!) {
    recentAcSubmissionList(username: $username, limit: $limit) {
      title
      titleSlug
      timestamp
    }
  }
`;

const QUESTION_QUERY = `
  query questionData($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      questionFrontendId
      difficulty
      topicTags { name }
    }
  }
`;

interface RecentSubmission {
  title: string;
  titleSlug: string;
  timestamp: string;
}

interface QuestionDetail {
  questionFrontendId: string | null;
  difficulty: string | null;
  topicTags: { name: string }[];
}

async function graphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    throw new Error(`LeetCode GraphQL request failed: ${res.status} ${res.statusText}`);
  }
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) {
    throw new Error(`LeetCode GraphQL error: ${json.errors.map((e) => e.message).join("; ")}`);
  }
  if (!json.data) throw new Error("LeetCode GraphQL returned no data — response shape may have changed.");
  return json.data;
}

let inserted = 0;
let skipped = 0;

async function main() {
  const username = process.env.LEETCODE_USERNAME?.trim();
  if (!username) throw new Error("LEETCODE_USERNAME is not set in .env — nothing to sync.");
  const ownerId = process.env.EMBER_OWNER_EMAIL?.trim();
  if (!ownerId) throw new Error("EMBER_OWNER_EMAIL is not set in .env — sync needs to know whose problems these are.");

  console.log(`Fetching recent accepted submissions for ${username}...`);
  const { recentAcSubmissionList } = await graphql<{ recentAcSubmissionList: RecentSubmission[] }>(
    RECENT_SUBMISSIONS_QUERY,
    { username, limit: 20 },
  );

  if (recentAcSubmissionList.length === 0) {
    console.log("No accepted submissions returned. Nothing to sync.");
    return;
  }

  // Resolve every new problem's details before writing anything.
  const details = new Map<string, QuestionDetail>();
  const seen = new Set<string>();
  for (const sub of recentAcSubmissionList) {
    if (seen.has(sub.titleSlug)) continue;
    seen.add(sub.titleSlug);
    if (await findProblemBySlug(ownerId, sub.titleSlug)) continue;

    console.log(`  fetching details for ${sub.titleSlug}...`);
    const { question } = await graphql<{ question: QuestionDetail | null }>(QUESTION_QUERY, {
      titleSlug: sub.titleSlug,
    });
    if (question) details.set(sub.titleSlug, question);
  }

  for (const sub of recentAcSubmissionList) {
    const attemptedAt = new Date(Number(sub.timestamp) * 1000);

    let problem = await findProblemBySlug(ownerId, sub.titleSlug);
    if (!problem) {
      const detail = details.get(sub.titleSlug);
      // Not upsertProblem directly — a problem logged manually before this
      // sync ran (e.g. via log_attempt with just a number) gets a synthetic
      // "leetcode-N" slug. Matching on number too, and upgrading that slug
      // to the real one here, is what keeps that from becoming a second row
      // with a split attempt history.
      problem = await findOrCreateProblem(ownerId, {
        slug: sub.titleSlug,
        number: detail?.questionFrontendId ? Number(detail.questionFrontendId) : null,
        title: sub.title,
        difficulty: detail?.difficulty?.toLowerCase() ?? null,
        url: `https://leetcode.com/problems/${sub.titleSlug}/`,
        topics: detail?.topicTags.map((t) => t.name) ?? [],
      });
    }

    if (await hasAttemptAt(ownerId, problem.id, attemptedAt)) {
      skipped += 1;
      continue;
    }

    await recordAttempt(ownerId, problem.id, "accepted", { source: "sync", attemptedAt });
    inserted += 1;
  }

  console.log(`Synced ${inserted} new attempt(s), skipped ${skipped} already-recorded one(s).`);
}

main()
  .then(() => sql.end())
  .catch((err) => {
    // Every network call happens before any write, so a failure this early
    // (the realistic failure mode — the endpoint is unofficial) leaves the
    // database untouched. A failure mid-write is reported honestly instead.
    const wrote = inserted > 0;
    console.error(
      wrote
        ? `Sync failed after writing ${inserted} attempt(s) — some entries may be synced, the rest were not:`
        : "Sync failed — database left untouched:",
      err instanceof Error ? err.message : err,
    );
    return sql.end().finally(() => process.exit(1));
  });
