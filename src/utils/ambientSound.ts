// Procedural Felt-Piano & Museum Hall Reverb Engine using Web Audio API
// Zero external audio dependencies; warm, calm, nostalgic D-major / B-minor progression.

class MuseumAmbientEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;
  private timerId: number | null = null;
  private stepIndex = 0;
  private cycleCount = 0;
  private isPlaying = false;
  private isDucked = false;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.0001;

      // Warm tape-style low-pass filter to remove any digital harshness
      const masterFilter = this.ctx.createBiquadFilter();
      masterFilter.type = 'lowpass';
      masterFilter.frequency.value = 2100;
      masterFilter.Q.value = 0.4;

      this.dryGain = this.ctx.createGain();
      this.dryGain.gain.value = 0.55;

      this.wetGain = this.ctx.createGain();
      this.wetGain.gain.value = 0.65;

      const convolver = this.ctx.createConvolver();
      convolver.buffer = this.createHallImpulse(this.ctx, 3.6, 2.4);

      this.dryGain.connect(masterFilter);
      this.wetGain.connect(convolver);
      convolver.connect(masterFilter);

      masterFilter.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  private createHallImpulse(
    ctx: AudioContext,
    durationSec: number,
    decay: number
  ): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * durationSec);
    const impulse = ctx.createBuffer(2, length, sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < length; i++) {
        const t = i / length;
        const env = Math.pow(1 - t, decay);
        // Gentle early fade-in to avoid sharp impulse click
        const pre = Math.min(1, i / (sampleRate * 0.035));
        const white = (Math.random() * 2 - 1) * env * pre;
        // One-pole low-pass inside reverb tail for warm wooden hall character
        lp = lp * 0.72 + white * 0.28;
        data[i] = lp;
      }
    }
    return impulse;
  }

  private playFeltNote(
    freq: number,
    delaySec: number,
    durationSec: number,
    velocity: number
  ) {
    if (!this.ctx || !this.dryGain || !this.wetGain) return;
    const now = this.ctx.currentTime + delaySec;

    // Fundamental sine + warm soft triangle harmonic
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq, now);
    osc2.detune.setValueAtTime((Math.random() - 0.5) * 3.5, now);

    const noteFilter = this.ctx.createBiquadFilter();
    noteFilter.type = 'lowpass';
    noteFilter.frequency.setValueAtTime(1150, now);
    noteFilter.frequency.exponentialRampToValueAtTime(280, now + durationSec * 0.85);

    const noteGain = this.ctx.createGain();
    const peak = Math.max(0.01, Math.min(0.24, velocity));
    noteGain.gain.setValueAtTime(0.0001, now);
    // Soft felt hammer attack (~28ms)
    noteGain.gain.linearRampToValueAtTime(peak, now + 0.028);
    // Long natural piano string decay
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    const mix2 = this.ctx.createGain();
    mix2.gain.value = 0.24;

    osc1.connect(noteFilter);
    osc2.connect(mix2);
    mix2.connect(noteFilter);

    noteFilter.connect(noteGain);
    noteGain.connect(this.dryGain);
    noteGain.connect(this.wetGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + durationSec + 0.08);
    osc2.stop(now + durationSec + 0.08);
  }

  private scheduleNextPhrase() {
    if (!this.isPlaying || !this.ctx) return;

    // Touching, reflective progression in D Major / B Minor:
    // Bm9 -> Gmaj9 -> Dmaj9 -> Asus4/A6
    const phrases: {
      bass: number;
      chords: number[];
      melody: { freq: number; beatOffset: number; dur: number; vel: number }[];
    }[] = [
      {
        // Bm9: B2 (123.47), F#3 (185.00), D4 (293.66)
        bass: 123.47,
        chords: [185.0, 220.0, 293.66],
        melody: [
          { freq: 369.99, beatOffset: 1.1, dur: 2.8, vel: 0.14 }, // F#4
          { freq: 329.63, beatOffset: 2.5, dur: 2.4, vel: 0.11 }, // E4
          { freq: 293.66, beatOffset: 3.6, dur: 3.0, vel: 0.13 }, // D4
        ],
      },
      {
        // Gmaj9: G2 (98.00), D3 (146.83), B3 (246.94)
        bass: 98.0,
        chords: [146.83, 185.0, 246.94],
        melody: [
          { freq: 293.66, beatOffset: 1.0, dur: 3.0, vel: 0.13 }, // D4
          { freq: 246.94, beatOffset: 2.4, dur: 2.5, vel: 0.11 }, // B3
          { freq: 220.0, beatOffset: 3.6, dur: 3.2, vel: 0.12 }, // A3
        ],
      },
      {
        // Dmaj9: D3 (146.83), A3 (220.00), E4 (329.63)
        bass: 146.83,
        chords: [220.0, 293.66, 329.63],
        melody: [
          { freq: 369.99, beatOffset: 0.9, dur: 2.8, vel: 0.14 }, // F#4
          { freq: 440.0, beatOffset: 2.3, dur: 3.1, vel: 0.12 }, // A4
          { freq: 369.99, beatOffset: 3.6, dur: 3.2, vel: 0.11 }, // F#4
        ],
      },
      {
        // Asus4 -> A6: A2 (110.00), E3 (164.81), B3 (246.94)
        bass: 110.0,
        chords: [164.81, 220.0, 246.94],
        melody: [
          { freq: 293.66, beatOffset: 1.0, dur: 2.6, vel: 0.13 }, // D4
          { freq: 277.18, beatOffset: 2.4, dur: 3.0, vel: 0.12 }, // C#4
          { freq: 329.63, beatOffset: 3.7, dur: 3.4, vel: 0.1 }, // E4
        ],
      },
    ];

    const phrase = phrases[this.stepIndex % phrases.length];
    const isAltCycle = this.cycleCount % 2 === 1;

    // Gentle bass & rolling arpeggio accompaniment
    this.playFeltNote(phrase.bass, 0.05, 4.8, 0.15);
    phrase.chords.forEach((freq, i) => {
      const stagger = 0.35 + i * 0.42 + (Math.random() - 0.5) * 0.04;
      this.playFeltNote(freq, stagger, 4.0, 0.085);
    });

    // Sparse reflective upper melody
    phrase.melody.forEach((m, i) => {
      if (isAltCycle && i === 1 && this.stepIndex % 2 === 1) {
        // Occasional gentle octave shimmer on alternate loops
        this.playFeltNote(m.freq * 2, m.beatOffset * 0.95, m.dur * 0.9, m.vel * 0.48);
      } else {
        this.playFeltNote(m.freq, m.beatOffset * 0.95, m.dur, m.vel);
      }
    });

    this.stepIndex++;
    if (this.stepIndex % phrases.length === 0) {
      this.cycleCount++;
    }

    // 4.9 seconds per bar for unhurried, meditative museum breathing room
    this.timerId = window.setTimeout(() => {
      this.scheduleNextPhrase();
    }, 4900);
  }

  public async start(): Promise<boolean> {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return false;

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    if (this.isPlaying) return true;
    this.isPlaying = true;

    const now = ctx.currentTime;
    const targetGain = this.isDucked ? 0.12 : 0.72;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(
      Math.max(0.0001, this.masterGain.gain.value),
      now
    );
    this.masterGain.gain.exponentialRampToValueAtTime(targetGain, now + 1.6);

    this.scheduleNextPhrase();
    return true;
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(
        Math.max(0.0001, this.masterGain.gain.value),
        now
      );
      this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
    }
  }

  public setDucked(ducked: boolean) {
    this.isDucked = ducked;
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const target = ducked ? 0.04 : 0.72;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(
      Math.max(0.0001, this.masterGain.gain.value),
      now
    );
    this.masterGain.gain.exponentialRampToValueAtTime(target, now + 0.7);
  }

  public getPlaying(): boolean {
    return this.isPlaying;
  }
}

export const museumAmbient = new MuseumAmbientEngine();
