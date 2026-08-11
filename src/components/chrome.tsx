"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Sun,
  Moon,
  NotebookPen,
  Code2,
  Target,
  BarChart3,
  Settings,
  Flame,
  Play,
  HelpCircle,
  LogOut,
  Bell,
  Menu,
  X,
  Brain
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Log", icon: NotebookPen },
  { href: "/practice", label: "Practice", icon: Code2 },
  { href: "/focus", label: "Focus", icon: Target },
  { href: "/metrics", label: "Metrics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ streak = 0 }: { streak?: number }) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex h-screen w-64 flex-col border-r border-line/60 bg-surface/50 px-4 py-6 shrink-0 z-20">
      {/* Brand Header */}
      <div className="px-2 mb-6 flex items-center gap-3">
        <div className="grid size-9 place-items-center rounded-xl bg-accent text-white shadow-sm">
          <Brain className="size-5" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-ink font-sans">Ember</h1>
      </div>

      {/* User Profile & Streak */}
      <div className="px-2 mb-5 flex items-center gap-3.5 p-3 rounded-2xl bg-surface border border-line/50 shadow-2xs">
        <div className="size-10 rounded-full bg-accent/15 border border-accent/30 grid place-items-center shrink-0">
          <span className="font-bold text-accent text-sm">DW</span>
        </div>
        <div className="min-w-0">
          {streak > 0 ? (
            <>
              <div className="flex items-center gap-1 text-sm font-bold text-ink">
                <Flame className="size-4 text-amber-500 fill-amber-500/20" />
                <span>{streak} {streak === 1 ? "Day" : "Days"}</span>
              </div>
              <p className="text-[11px] font-medium text-muted">Current Streak</p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1 text-sm font-bold text-muted">
                <Flame className="size-4 text-faint opacity-60" />
                <span>No streak yet</span>
              </div>
              <p className="text-[11px] font-medium text-faint">Finish one to start</p>
            </>
          )}
        </div>
      </div>

      {/* Quick Focus Button */}
      <div className="mb-6">
        <Link
          href="/focus"
          className="w-full bg-accent text-white py-2.5 px-4 rounded-xl text-[13px] font-bold hover:opacity-90 active:scale-95 transition-all shadow-xs flex items-center justify-center gap-2 group"
        >
          <Play className="size-4 fill-white group-hover:scale-110 transition-transform" />
          <span>Start Focus Session</span>
        </Link>
      </div>

      {/* Main Nav */}
      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((tab) => {
          const active = pathname === tab.href || (tab.href !== "/" && pathname?.startsWith(tab.href));
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                active
                  ? "bg-accent/12 text-accent font-bold border-r-2 border-accent"
                  : "text-muted hover:text-ink hover:bg-surface/80"
              }`}
            >
              <Icon className={`size-4.5 ${active ? "text-accent" : "text-faint"}`} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Footer */}
      <div className="mt-auto border-t border-line/60 pt-4 space-y-1">
        <a
          href="#"
          className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-[13px] font-medium text-muted hover:text-ink hover:bg-surface/60 transition-all"
        >
          <HelpCircle className="size-4 text-faint" />
          <span>Help & Docs</span>
        </a>
        <div className="flex items-center justify-between px-3.5 py-2">
          <span className="text-[12px] font-medium text-faint">Theme</span>
          <ThemeToggle />
        </div>
        <div className="flex items-center gap-2.5 px-3.5 py-2">
          <UserButton />
          <span className="text-[12px] font-medium text-faint">Account</span>
        </div>
      </div>
    </aside>
  );
}

export function MobileHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-16 w-full bg-surface/90 backdrop-blur-md border-b border-line/60">
      <div className="flex items-center gap-2">
        <div className="grid size-7 place-items-center rounded-lg bg-accent text-white">
          <Brain className="size-4" />
        </div>
        <span className="font-bold text-base text-ink">Ember</span>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <UserButton />
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded-lg text-muted hover:text-ink hover:bg-surface"
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-bg border-b border-line p-4 flex flex-col gap-2 shadow-xl animate-reveal">
          {NAV_ITEMS.map((tab) => {
            const active = pathname === tab.href;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  active ? "bg-accent/15 text-accent font-semibold" : "text-muted"
                }`}
              >
                <Icon className="size-4" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}

/** What the page is showing right now: an explicit override, else the system. */
function currentTheme(): "dark" | "light" {
  const explicit = document.documentElement.dataset.theme;
  if (explicit === "light" || explicit === "dark") return explicit;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light" | null>(null);

  useEffect(() => setTheme(currentTheme()), []);

  function toggle() {
    const next = currentTheme() === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("ember-theme", next);
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch theme"
      title="Switch theme"
      className="grid size-8 place-items-center rounded-lg text-muted transition-all hover:bg-surface hover:text-ink active:scale-95 border border-line/40"
    >
      {theme === "light" ? (
        <Moon className="size-4 transition-transform hover:-rotate-12" />
      ) : (
        <Sun className="size-4 transition-transform hover:rotate-45" />
      )}
    </button>
  );
}

