import { notFound } from "next/navigation";
import { PracticeFocusView } from "@/components/practice-focus-view";
import { getProblem, problemAttempts } from "@/db/queries";

export const dynamic = "force-dynamic";

export default async function PracticeFocusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const problemId = Number(id);
  if (!Number.isInteger(problemId)) notFound();

  const problem = await getProblem(problemId);
  if (!problem) notFound();

  return <PracticeFocusView problem={problem} attempts={await problemAttempts(problemId)} />;
}
