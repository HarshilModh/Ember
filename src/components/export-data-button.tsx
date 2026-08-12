"use client";

import { useState, useTransition } from "react";
import { exportData } from "@/app/actions";
import { Download, Check } from "lucide-react";

export function ExportDataButton() {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function handleExport() {
    startTransition(async () => {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ember-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    });
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={pending}
      className="flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-[13px] font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
    >
      {done ? <Check className="size-3.5" /> : <Download className="size-3.5" />}
      {done ? "Downloaded" : pending ? "Exporting…" : "Export as JSON"}
    </button>
  );
}
