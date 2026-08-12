"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { getFocusSession, saveFocusSession } from "@/db/queries";
import { tasks } from "@/db/schema";
import { getOwnerId } from "@/lib/auth";
import type { Phase } from "@/context/focus-context";

export interface RemoteFocusState {
  phase: Phase;
  running: boolean;
  secondsLeft: number;
  totalDuration: number;
  focusCount: number;
  activeTask: { id: number; title: string; notes: string | null; priority: number } | null;
  updatedAt: number;
}

/**
 * Polled by every signed-in device running the FocusProvider so a session
 * started on one (mac) shows up on the others (ipad) without a page reload.
 * Joins the task fresh rather than trusting a cached title/notes snapshot,
 * so an edit made mid-session is reflected everywhere too.
 */
export async function fetchFocusSession(): Promise<RemoteFocusState | null> {
  const ownerId = await getOwnerId();
  const row = await getFocusSession(ownerId);
  if (!row) return null;

  let activeTask: RemoteFocusState["activeTask"] = null;
  if (row.activeTaskId) {
    const [t] = await db.select().from(tasks).where(eq(tasks.id, row.activeTaskId)).limit(1);
    if (t) activeTask = { id: t.id, title: t.title, notes: t.notes, priority: t.priority };
  }

  return {
    phase: row.phase as Phase,
    running: row.running,
    secondsLeft: row.secondsLeft,
    totalDuration: row.totalDuration,
    focusCount: row.focusCount,
    activeTask,
    updatedAt: row.updatedAt.getTime(),
  };
}

export async function pushFocusSession(input: {
  phase: Phase;
  running: boolean;
  secondsLeft: number;
  totalDuration: number;
  focusCount: number;
  activeTaskId: number | null;
}): Promise<number> {
  const ownerId = await getOwnerId();
  const row = await saveFocusSession(ownerId, input);
  return row.updatedAt.getTime();
}
