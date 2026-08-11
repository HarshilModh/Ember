"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

type Choice = "light" | "dark" | "system";

const OPTIONS: { value: Choice; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemePicker() {
  const [choice, setChoice] = useState<Choice | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("ember-theme");
    setChoice(stored === "light" || stored === "dark" ? stored : "system");
  }, []);

  function choose(next: Choice) {
    if (next === "system") {
      localStorage.removeItem("ember-theme");
      delete document.documentElement.dataset.theme;
    } else {
      localStorage.setItem("ember-theme", next);
      document.documentElement.dataset.theme = next;
    }
    setChoice(next);
  }

  return (
    <div className="flex items-center gap-1.5 bg-raised/60 p-1 rounded-xl border border-line/50 w-fit">
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => choose(value)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all ${
            choice === value
              ? "bg-surface text-ink border border-line/80 shadow-2xs"
              : "text-muted hover:text-ink"
          }`}
        >
          <Icon className="size-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}
