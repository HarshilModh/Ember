"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft, ArrowRight } from "lucide-react";
import { NAV_ITEMS } from "./chrome";
import { searchTasksAction, startFocus } from "@/app/actions";
import { PRIORITY_COLORS } from "@/lib/format";

interface TaskHit {
  id: number;
  title: string;
  status: string;
  priority: number;
}

type PaletteItem =
  | { kind: "nav"; href: string; label: string; icon: (typeof NAV_ITEMS)[number]["icon"] }
  | ({ kind: "task" } & TaskHit);

const DEBOUNCE_MS = 180;

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [taskHits, setTaskHits] = useState<TaskHit[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  // Global open/close shortcut, available from anywhere in the app shell.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setTaskHits([]);
    setActiveIndex(0);
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(0);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (!q) {
      setTaskHits([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        setTaskHits(await searchTasksAction(q));
      });
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open]);

  if (!open) return null;

  const navHits = NAV_ITEMS.filter((n) => n.label.toLowerCase().includes(query.trim().toLowerCase()));
  const items: PaletteItem[] = [
    ...navHits.map((n): PaletteItem => ({ kind: "nav", href: n.href, label: n.label, icon: n.icon })),
    ...taskHits.map((t): PaletteItem => ({ kind: "task", ...t })),
  ];

  function activate(index: number) {
    const item = items[index];
    if (!item) return;
    setOpen(false);
    if (item.kind === "nav") {
      router.push(item.href);
    } else {
      startTransition(() => void startFocus(item.id));
    }
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      activate(activeIndex);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex justify-center px-4 pt-[12vh] bg-black/50 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="h-fit w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl animate-reveal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-line/60 px-4 py-3">
          <Search className="size-4 shrink-0 text-faint" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Jump to a page or search tasks…"
            enterKeyHint="go"
            autoCapitalize="none"
            className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-faint"
          />
          <kbd className="kbd-shortcut">Esc</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto py-2">
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-faint">No matches.</p>
          ) : (
            items.map((item, i) => (
              <button
                key={item.kind === "nav" ? `nav-${item.href}` : `task-${item.id}`}
                type="button"
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => activate(i)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] transition-colors ${
                  i === activeIndex ? "bg-accent/12 text-accent" : "text-ink hover:bg-raised/60"
                }`}
              >
                {item.kind === "nav" ? (
                  <>
                    <item.icon className={`size-4 ${i === activeIndex ? "text-accent" : "text-faint"}`} />
                    <span className="flex-1 font-medium">{item.label}</span>
                    <ArrowRight className="size-3.5 text-faint" />
                  </>
                ) : (
                  <>
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: PRIORITY_COLORS[item.priority] }}
                    />
                    <span
                      className={`flex-1 truncate font-medium ${
                        item.status === "done" || item.status === "dropped" ? "text-muted line-through" : ""
                      }`}
                    >
                      {item.title}
                    </span>
                    <CornerDownLeft className="size-3.5 text-faint" />
                  </>
                )}
              </button>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-line/60 px-4 py-2 text-[10px] text-faint">
          <span>↑↓ navigate · Enter select</span>
          <span>
            Press <kbd className="kbd-shortcut">⌘K</kbd> anytime
          </span>
        </div>
      </div>
    </div>
  );
}
