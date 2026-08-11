/**
 * Pure Web Audio API Synthesizer for Deep Work Ambient Soundscapes.
 * Zero external audio files, zero network latency, 100% offline & local.
 */

export type SoundscapeType =
  | "binaural"
  | "rain"
  | "space"
  | "ocean"
  | "cafe"
  | "singingbowl"
  | "pinknoise";

class SoundscapeEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private currentType: SoundscapeType = "binaural";
  private activeNodes: (AudioNode | number)[] = [];
  private gainNode: GainNode | null = null;
  private stopTimer: ReturnType<typeof setTimeout> | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
  }

  public toggle(type: SoundscapeType = "binaural"): boolean {
    this.initCtx();
    if (!this.ctx) return false;

    if (this.isPlaying && this.currentType === type) {
      this.stop();
      return false;
    }

    this.stopImmediately();
    this.currentType = type;
    this.start(type);
    return true;
  }

  public getCurrentType(): SoundscapeType {
    return this.currentType;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  private start(type: SoundscapeType) {
    if (!this.ctx) return;

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(0.15, this.ctx.currentTime);
    this.gainNode.connect(this.ctx.destination);

    switch (type) {
      case "binaural":
        this.playBinaural();
        break;
      case "rain":
        this.playRain();
        break;
      case "space":
        this.playSpace();
        break;
      case "ocean":
        this.playOcean();
        break;
      case "cafe":
        this.playCafe();
        break;
      case "singingbowl":
        this.playSingingBowl();
        break;
      case "pinknoise":
        this.playPinkNoise();
        break;
    }

    this.isPlaying = true;
  }

  private stopImmediately() {
    if (this.stopTimer) {
      clearTimeout(this.stopTimer);
      this.stopTimer = null;
    }

    this.activeNodes.forEach((node) => {
      if (typeof node === "number") {
        window.clearInterval(node);
      } else if (node && "stop" in node && typeof (node as any).stop === "function") {
        try {
          (node as any).stop();
        } catch (e) {}
      }
    });
    this.activeNodes = [];
    this.isPlaying = false;
  }

  public stop() {
    if (this.stopTimer) {
      clearTimeout(this.stopTimer);
      this.stopTimer = null;
    }

    if (this.gainNode && this.ctx) {
      this.gainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.3);
    }

    const currentNodes = [...this.activeNodes];
    this.activeNodes = [];
    this.isPlaying = false;

    this.stopTimer = setTimeout(() => {
      currentNodes.forEach((node) => {
        if (typeof node === "number") {
          window.clearInterval(node);
        } else if (node && "stop" in node && typeof (node as any).stop === "function") {
          try {
            (node as any).stop();
          } catch (e) {}
        }
      });
      this.stopTimer = null;
    }, 350);
  }

  /** 40Hz Beta Waves for Gamma/Beta Focus */
  private playBinaural() {
    if (!this.ctx || !this.gainNode) return;

    const carrierFreq = 200;
    const beatFreq = 40;

    const oscL = this.ctx.createOscillator();
    oscL.type = "sine";
    oscL.frequency.setValueAtTime(carrierFreq, this.ctx.currentTime);

    const merger = this.ctx.createChannelMerger(2);
    oscL.connect(merger, 0, 0);

    const oscR = this.ctx.createOscillator();
    oscR.type = "sine";
    oscR.frequency.setValueAtTime(carrierFreq + beatFreq, this.ctx.currentTime);
    oscR.connect(merger, 0, 1);

    merger.connect(this.gainNode);

    oscL.start();
    oscR.start();
    this.activeNodes.push(oscL, oscR);
  }

  /** White/Pink Noise Filtered Rain */
  private playRain() {
    if (!this.ctx || !this.gainNode) return;

    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1000, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.gainNode);

    whiteNoise.start();
    this.activeNodes.push(whiteNoise);
  }

  /** Deep Cosmic Ambient Drone */
  private playSpace() {
    if (!this.ctx || !this.gainNode) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();

    osc1.type = "triangle";
    osc2.type = "sine";

    osc1.frequency.setValueAtTime(55, this.ctx.currentTime);
    osc2.frequency.setValueAtTime(110, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.2, this.ctx.currentTime);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(15, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);

    osc1.connect(this.gainNode);
    osc2.connect(this.gainNode);

    osc1.start();
    osc2.start();
    lfo.start();
    this.activeNodes.push(osc1, osc2, lfo);
  }

  /** Ocean Surf Swell Waves */
  private playOcean() {
    if (!this.ctx || !this.gainNode) return;

    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(400, this.ctx.currentTime);

    // LFO for surf waves
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(300, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    noise.connect(filter);
    filter.connect(this.gainNode);

    noise.start();
    lfo.start();
    this.activeNodes.push(noise, lfo);
  }

  /** Warm Coffee Shop Ambience */
  private playCafe() {
    if (!this.ctx || !this.gainNode) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();

    osc1.type = "sine";
    osc2.type = "triangle";

    osc1.frequency.setValueAtTime(130.81, this.ctx.currentTime); // C3
    osc2.frequency.setValueAtTime(196.0, this.ctx.currentTime); // G3

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.setValueAtTime(600, this.ctx.currentTime);
    bandpass.Q.setValueAtTime(2.0, this.ctx.currentTime);

    osc1.connect(bandpass);
    osc2.connect(bandpass);
    bandpass.connect(this.gainNode);

    osc1.start();
    osc2.start();
    this.activeNodes.push(osc1, osc2);
  }

  /** Tibetan 432Hz & 528Hz Solfeggio Singing Bowl */
  private playSingingBowl() {
    if (!this.ctx || !this.gainNode) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();

    osc1.type = "sine";
    osc2.type = "sine";

    osc1.frequency.setValueAtTime(432, this.ctx.currentTime); // 432Hz Miracle Tone
    osc2.frequency.setValueAtTime(528, this.ctx.currentTime); // 528Hz Transformation Tone

    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.1, this.ctx.currentTime);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(this.gainNode.gain);

    osc1.connect(this.gainNode);
    osc2.connect(this.gainNode);

    osc1.start();
    osc2.start();
    lfo.start();
    this.activeNodes.push(osc1, osc2, lfo);
  }

  /** Pure Pink Noise Masking */
  private playPinkNoise() {
    if (!this.ctx || !this.gainNode) return;

    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11;
      b6 = white * 0.115926;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    noise.connect(this.gainNode);
    noise.start();
    this.activeNodes.push(noise);
  }
}

export const soundscape = new SoundscapeEngine();
