import { notFound } from "next/navigation";
import { FocusView } from "@/components/focus-view";
import { getTask, taskLogs } from "@/db/queries";
import { getOwnerId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function FocusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const taskId = Number(id);
  if (!Number.isInteger(taskId)) notFound();

  const ownerId = await getOwnerId();
  const task = await getTask(ownerId, taskId);
  if (!task) notFound();

  return <FocusView task={task} logs={await taskLogs(ownerId, taskId)} />;
}
