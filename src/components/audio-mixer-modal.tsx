"use client";

import { useState } from "react";
import { soundscape, type SoundscapeType } from "@/lib/audio-synthesizer";
import { Sliders, X, Volume2, Headphones } from "lucide-react";

const TRACKS: { id: SoundscapeType; label: string; icon: string; desc: string }[] = [
  { id: "binaural", label: "40Hz Gamma Beta Focus", icon: "🧠", desc: "Neuro-entrainment frequency" },
  { id: "rain", label: "Soft Rainstorm", icon: "🌧️", desc: "Filtered white/pink precipitation" },
  { id: "ocean", label: "Pacific Ocean Waves", icon: "🌊", desc: "Low-frequency surf swell" },
  { id: "space", label: "Deep Space Drone", icon: "🚀", desc: "Sub-harmonic cosmic synth" },
  { id: "singingbowl", label: "432Hz/528Hz Solfeggio", icon: "🌿", desc: "Tibetan zen singing bowl" },
  { id: "cafe", label: "Warm Coffee Shop", icon: "☕", desc: "Acoustic room resonance" },
  { id: "pinknoise", label: "Pure Pink Noise", icon: "⚡", desc: "Smooth white-noise masking" },
];

export function AudioMixerModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [activeTrack, setActiveTrack] = useState<SoundscapeType>("binaural");
  const [isPlaying, setIsPlaying] = useState(false);

  if (!isOpen) return null;

  function handleToggleTrack(t: SoundscapeType) {
    const nowPlaying = soundscape.toggle(t);
    setActiveTrack(t);
    setIsPlaying(nowPlaying);
  }

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center bg-black/70 backdrop-blur-xl p-4 animate-reveal">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-slate-950 p-6 sm:p-8 shadow-2xl text-white space-y-6">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          <X className="size-5" />
        </button>

        {/* Title */}
        <div className="space-y-1">
          <span className="text-[11px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30 inline-flex items-center gap-1.5">
            <Headphones className="size-3.5" />
            Pure Offline Audio Synthesizer
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight pt-2">
            Soundscape Studio
          </h2>
          <p className="text-xs text-white/60">
            100% offline Web Audio API soundscapes. No external audio files or downloads.
          </p>
        </div>

        {/* Tracks List */}
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {TRACKS.map((t) => {
            const active = isPlaying && activeTrack === t.id;
            return (
              <div
                key={t.id}
                onClick={() => handleToggleTrack(t.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  active
                    ? "bg-white/15 border-emerald-400/50 shadow-md scale-[1.01]"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl p-2 rounded-xl bg-black/40 border border-white/10">
                    {t.icon}
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <span>{t.label}</span>
                      {active && (
                        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          Active
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-white/50">{t.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Volume2 className={`size-4 ${active ? "text-emerald-400 animate-pulse" : "text-white/40"}`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
