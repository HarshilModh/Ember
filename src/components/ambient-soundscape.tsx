"use client";

import { useState } from "react";
import { soundscape, type SoundscapeType } from "@/lib/audio-synthesizer";
import { Headphones, Volume2, VolumeX } from "lucide-react";

const SOUNDSCAPES: { id: SoundscapeType; label: string; icon: string }[] = [
  { id: "binaural", label: "40Hz Gamma Focus", icon: "🧠" },
  { id: "rain", label: "Soft Rain", icon: "🌧️" },
  { id: "ocean", label: "Ocean Waves", icon: "🌊" },
  { id: "space", label: "Space Drone", icon: "🚀" },
  { id: "singingbowl", label: "432Hz Zen Bowl", icon: "🌿" },
  { id: "cafe", label: "Warm Cafe", icon: "☕" },
  { id: "pinknoise", label: "Pink Noise", icon: "⚡" },
];

export function AmbientSoundscapePlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeType, setActiveType] = useState<SoundscapeType>("binaural");

  function handleToggle(type: SoundscapeType) {
    const nowPlaying = soundscape.toggle(type);
    setIsPlaying(nowPlaying);
    setActiveType(type);
  }

  return (
    <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-surface/80 border border-line/60 shadow-2xs backdrop-blur-md max-w-full overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-1.5 px-2 text-xs font-bold text-ink border-r border-line/50 shrink-0">
        <Headphones className={`size-4 text-accent ${isPlaying ? "animate-bounce text-emerald-500" : ""}`} />
        <span className="hidden md:inline">Focus Sound</span>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
        {SOUNDSCAPES.map((sc) => {
          const active = isPlaying && activeType === sc.id;
          return (
            <button
              key={sc.id}
              type="button"
              onClick={() => handleToggle(sc.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap active:scale-95 ${
                active
                  ? "bg-accent text-white shadow-xs"
                  : "text-muted hover:text-ink hover:bg-raised"
              }`}
            >
              <span>{sc.icon}</span>
              <span className="hidden sm:inline">{sc.label}</span>
            </button>
          );
        })}
      </div>

      {/* Animated Visualizer Equalizer */}
      {isPlaying && (
        <div className="flex items-end gap-0.5 h-3.5 px-1.5 shrink-0">
          <span className="w-0.5 bg-emerald-500 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-2" />
          <span className="w-0.5 bg-emerald-500 rounded-full animate-[pulse_0.4s_ease-in-out_infinite_100ms] h-3.5" />
          <span className="w-0.5 bg-emerald-500 rounded-full animate-[pulse_0.5s_ease-in-out_infinite_200ms] h-2.5" />
        </div>
      )}
    </div>
  );
}
