"use client";

import { useState } from "react";
import { Sliders, Activity, Radio } from "lucide-react";
import { soundscape } from "@/lib/audio-synthesizer";

export function FrequencyTunerWidget() {
  const [freq, setFreq] = useState(40);
  const [playing, setPlaying] = useState(false);

  const bands = [
    { label: "Alpha (7.83Hz)", val: 8, desc: "Schumann Resonance • Creative Flow" },
    { label: "Beta (14Hz)", val: 14, desc: "Active Thinking • Fast Execution" },
    { label: "Gamma (40Hz)", val: 40, desc: "Peak Focus • Deep Problem Solving" },
  ];

  function toggleAudio(val: number) {
    setFreq(val);
    const nowPlaying = soundscape.toggle("binaural");
    setPlaying(nowPlaying);
  }

  return (
    <div className="rounded-3xl border border-line/80 bg-surface p-6 shadow-2xs space-y-4 hover:border-accent/40 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20 flex items-center gap-1">
          <Activity className="size-3" />
          Binaural Frequency Tuner
        </span>
        <span className="text-xs font-mono font-bold text-cyan-400">{freq}Hz Active</span>
      </div>

      {/* Preset Frequencies */}
      <div className="space-y-2">
        {bands.map((b) => {
          const active = freq === b.val && playing;
          return (
            <button
              key={b.val}
              type="button"
              onClick={() => toggleAudio(b.val)}
              className={`w-full p-3 rounded-2xl border transition-all flex items-center justify-between active:scale-95 text-left ${
                active
                  ? "bg-cyan-500/20 border-cyan-400 text-ink shadow-sm"
                  : "bg-raised/40 border-line/50 text-muted hover:border-line hover:text-ink"
              }`}
            >
              <div>
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <Radio className={`size-3.5 ${active ? "text-cyan-400 animate-pulse" : "text-faint"}`} />
                  <span>{b.label}</span>
                </div>
                <p className="text-[10px] text-faint mt-0.5">{b.desc}</p>
              </div>

              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                active ? "bg-cyan-400 text-black border-cyan-300" : "bg-surface border-line text-faint"
              }`}>
                {active ? "Playing" : "Tune"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
