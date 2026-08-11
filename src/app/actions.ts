"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { attachTags, createMcpToken, recordAttempt, revokeMcpToken } from "@/db/queries";
import { logs, tasks, type Outcome } from "@/db/schema";
import { getOwnerId } from "@/lib/auth";

function refresh() {
  revalidatePath("/", "layout");
}

export async function addTask(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const ownerId = await getOwnerId();

  const rawDue = String(formData.get("dueAt") ?? "").trim();
  const rawTags = String(formData.get("tags") ?? "").trim();
  const priority = Number(formData.get("priority") ?? 0);

  const [row] = await db
    .insert(tasks)
    .values({
      ownerId,
      title,
      notes: String(formData.get("notes") ?? "").trim() || null,
      priority: Number.isFinite(priority) ? priority : 0,
      // A bare date means the end of that day, so it is not instantly overdue.
      dueAt: rawDue ? new Date(`${rawDue}T23:59:00`) : null,
    })
    .returning();

  if (rawTags) await attachTags(ownerId, row.id, rawTags.split(/[,\s]+/));
  refresh();
}

// Every mutation below matches on (id, ownerId), never id alone — otherwise
// anyone sharing this deployment could act on rows by guessing a number.

export async function completeTask(id: number) {
  const ownerId = await getOwnerId();
  await db
    .update(tasks)
    .set({ status: "done", completedAt: new Date() })
    .where(and(eq(tasks.id, id), eq(tasks.ownerId, ownerId)));
  refresh();
}

export async function dropTask(id: number) {
  // Never deleted. Dropped tasks are the interesting ones when reviewing later.
  const ownerId = await getOwnerId();
  await db
    .update(tasks)
    .set({ status: "dropped" })
    .where(and(eq(tasks.id, id), eq(tasks.ownerId, ownerId)));
  refresh();
}

export async function reopenTask(id: number) {
  const ownerId = await getOwnerId();
  await db
    .update(tasks)
    .set({ status: "todo", completedAt: null })
    .where(and(eq(tasks.id, id), eq(tasks.ownerId, ownerId)));
  refresh();
}

export async function setPriority(id: number, priority: number) {
  const ownerId = await getOwnerId();
  await db
    .update(tasks)
    .set({ priority })
    .where(and(eq(tasks.id, id), eq(tasks.ownerId, ownerId)));
  refresh();
}

export async function addLog(taskId: number, note: string) {
  const clean = note.trim();
  if (!clean) return;
  const ownerId = await getOwnerId();
  // taskId is trusted input from a form bound to a task the owner already
  // has rendered in front of them; the ownerId on the log row is what makes
  // it theirs regardless.
  await db.insert(logs).values({ ownerId, taskId, note: clean });
  refresh();
}

/**
 * Entering focus is what marks a task as being worked on — nothing else in the
 * app sets `doing`, and picking a task to stare at is the honest signal.
 */
export async function startFocus(id: number) {
  const ownerId = await getOwnerId();
  await db
    .update(tasks)
    .set({ status: "doing" })
    .where(and(eq(tasks.id, id), eq(tasks.ownerId, ownerId)));
  refresh();
  redirect(`/focus/${id}`);
}

export async function completeAndLeaveFocus(id: number) {
  const ownerId = await getOwnerId();
  await db
    .update(tasks)
    .set({ status: "done", completedAt: new Date() })
    .where(and(eq(tasks.id, id), eq(tasks.ownerId, ownerId)));
  refresh();
  redirect("/");
}

export async function logPracticeAttempt(
  problemId: number,
  outcome: Outcome,
  opts?: { minutes?: number; notes?: string },
) {
  const ownerId = await getOwnerId();
  // recordAttempt itself matches (problemId, ownerId), so a mismatched
  // problemId throws rather than silently attaching to someone else's problem.
  await recordAttempt(ownerId, problemId, outcome, { ...opts, source: "manual" });
  revalidatePath("/practice");
  refresh();
  redirect("/practice");
}

/** Returns the plaintext once — the only time it's ever available. */
export async function generateMcpToken(label: string) {
  const ownerId = await getOwnerId();
  const result = await createMcpToken(ownerId, label);
  revalidatePath("/settings");
  return result;
}

export async function revokeToken(id: number) {
  const ownerId = await getOwnerId();
  await revokeMcpToken(ownerId, id);
  revalidatePath("/settings");
}
