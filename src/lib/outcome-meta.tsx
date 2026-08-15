import { CheckCircle2, Lightbulb, BookOpen, XCircle } from "lucide-react";
import type { Outcome } from "@/db/schema";

export const OUTCOME_META: Record<Outcome, { label: string; icon: typeof CheckCircle2; accent: string }> = {
  solved_clean: { label: "Solved Clean", icon: CheckCircle2, accent: "text-emerald-500" },
  solved_hints: { label: "Needed Hints", icon: Lightbulb, accent: "text-amber-500" },
  saw_solution: { label: "Saw Solution", icon: BookOpen, accent: "text-indigo-500" },
  failed: { label: "Failed", icon: XCircle, accent: "text-rose-500" },
  accepted: { label: "Accepted", icon: CheckCircle2, accent: "text-emerald-500" },
};
