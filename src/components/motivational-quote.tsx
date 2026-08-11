"use client";

import { useState, useEffect } from "react";
import { QUOTES, quoteOfTheDay, randomQuote, type QuoteItem } from "@/lib/quotes";
import {
  Quote,
  RefreshCw,
  Copy,
  Check,
  Sparkles,
  Volume2,
  VolumeX,
  Heart,
  Zap,
  Target,
  Brain,
  Shield,
  Layers,
} from "lucide-react";

const CATEGORIES = [
  { name: "All", icon: Layers },
  { name: "Focus", icon: Zap },
  { name: "Systems", icon: Target },
  { name: "Mastery", icon: Brain },
  { name: "Mindset", icon: Shield },
] as const;

export function MotivationalQuote({ initialQuote }: { initialQuote?: QuoteItem }) {
  const [quote, setQuote] = useState<QuoteItem>(() => initialQuote ?? quoteOfTheDay());
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [animating, setAnimating] = useState(false);

  // Clean up speech synthesis if active when quote changes or unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [quote]);

  function handleShuffle(categoryFilter?: string) {
    const filter = categoryFilter ?? activeCategory;
    setAnimating(true);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }

    setTimeout(() => {
      let pool = QUOTES;
      if (filter !== "All") {
        pool = QUOTES.filter((q) => q.category === filter);
      }
      if (pool.length === 0) pool = QUOTES;

      const next = pool[Math.floor(Math.random() * pool.length)];
      setQuote(next);
      setLiked(false);
      setAnimating(false);
    }, 180);
  }

  function handleCategoryChange(catName: string) {
    setActiveCategory(catName);
    handleShuffle(catName);
  }

  function handleCopy() {
    const textToCopy = `"${quote.text}" — ${quote.who}`;
    void navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function toggleSpeech() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`${quote.text}. By ${quote.who}`);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  }

  const initials = quote.who
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="relative group overflow-hidden rounded-3xl border border-line/80 bg-gradient-to-br from-surface via-surface/90 to-surface-container/40 p-6 shadow-sm transition-all hover:border-accent/40">
      {/* Background Glows & Watermark */}
      <div className="absolute -top-24 -right-24 size-56 bg-accent/15 rounded-full blur-3xl group-hover:bg-accent/25 transition-all pointer-events-none" />
      <Quote className="absolute -bottom-6 -right-4 size-32 text-accent/5 fill-current pointer-events-none select-none" />

      {/* Top Bar: Categories & Meta */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-line/50 pb-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const selected = activeCategory === cat.name;
            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => handleCategoryChange(cat.name)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all whitespace-nowrap active:scale-95 ${
                  selected
                    ? "bg-accent text-white shadow-xs"
                    : "bg-raised/70 text-muted hover:text-ink hover:bg-raised border border-line/40"
                }`}
              >
                <Icon className="size-3" />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Right Badge */}
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2.5 py-1 rounded-full border border-accent/20">
          <Sparkles className="size-3 text-amber-500 fill-amber-500/20" />
          <span>Deep Work Spark</span>
        </div>
      </div>

      {/* Main Quote Content */}
      <div className="relative z-10 flex items-start gap-4">
        {/* Author Avatar Badge */}
        <div className="size-11 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30 grid place-items-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
          <span className="font-bold font-mono text-accent text-sm">{initials}</span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Quote Text with Kinetic Reveal */}
          <p
            className={`text-base sm:text-lg font-bold text-ink leading-snug tracking-tight transition-all duration-200 ${
              animating ? "opacity-0 translate-y-2 scale-[0.99]" : "opacity-100 translate-y-0 scale-100"
            }`}
          >
            "{quote.text}"
          </p>

          {/* Author Citation */}
          <div
            className={`mt-2.5 flex items-center gap-2 text-xs font-semibold text-muted transition-all duration-200 ${
              animating ? "opacity-0" : "opacity-100"
            }`}
          >
            <span className="text-accent font-bold">—</span>
            <span className="text-ink font-bold">{quote.who}</span>
            {quote.category && (
              <span className="text-[10px] text-faint font-medium px-2 py-0.5 rounded-md bg-raised border border-line/40">
                {quote.category}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Bar: Action Toolbar */}
      <div className="relative z-10 mt-5 pt-3 border-t border-line/40 flex items-center justify-between text-xs">
        <span className="text-[11px] text-faint font-medium flex items-center gap-1">
          <span>Click shuffle for fresh mindset triggers</span>
        </span>

        <div className="flex items-center gap-1">
          {/* Read Aloud Button */}
          <button
            type="button"
            onClick={toggleSpeech}
            title={speaking ? "Stop reading" : "Read quote aloud"}
            className={`p-2 rounded-xl transition-all active:scale-95 flex items-center gap-1.5 text-xs font-semibold ${
              speaking
                ? "bg-accent text-white shadow-xs animate-pulse"
                : "text-muted hover:text-ink hover:bg-raised"
            }`}
          >
            {speaking ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            <span className="hidden sm:inline">{speaking ? "Stop" : "Listen"}</span>
          </button>

          {/* Like Button */}
          <button
            type="button"
            onClick={() => setLiked(!liked)}
            title="Bookmark quote"
            className={`p-2 rounded-xl transition-all active:scale-95 ${
              liked ? "text-rose-500 bg-rose-500/10" : "text-muted hover:text-ink hover:bg-raised"
            }`}
          >
            <Heart className={`size-4 ${liked ? "fill-current" : ""}`} />
          </button>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            title="Copy quote to clipboard"
            className="p-2 rounded-xl text-muted hover:text-ink hover:bg-raised transition-all active:scale-95"
          >
            {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
          </button>

          {/* Shuffle Button */}
          <button
            type="button"
            onClick={() => handleShuffle()}
            title="Shuffle quote"
            className="p-2 rounded-xl bg-accent/10 text-accent font-semibold hover:bg-accent hover:text-white transition-all active:scale-95 flex items-center gap-1.5"
          >
            <RefreshCw className={`size-4 ${animating ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Shuffle</span>
          </button>
        </div>
      </div>
    </div>
  );
}
