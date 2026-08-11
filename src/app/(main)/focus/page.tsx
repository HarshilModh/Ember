import { FocusView } from "@/components/focus-view";
import { allOpenTasks, taskLogs } from "@/db/queries";
import { getOwnerId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function FocusPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const ownerId = await getOwnerId();
  const tasks = await allOpenTasks(ownerId);
  const selectedId = id ? parseInt(id, 10) : tasks[0]?.id;
  const activeTask = tasks.find((t) => t.id === selectedId) ?? tasks[0];

  if (!activeTask) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-center">
        <h1 className="text-xl font-bold text-ink">No Open Tasks</h1>
        <p className="mt-2 text-sm text-faint">Add a task first to start a focus session.</p>
      </div>
    );
  }

  const logs = await taskLogs(ownerId, activeTask.id);

  return <FocusView task={activeTask} logs={logs} />;
}
