/**
 * Web Audio API procedural sound synthesizer for Just Short.
 * Synthesizes natural, atmospheric audio feedback:
 * footsteps, pole plant, flex tension, vault release swoosh, wind, landing impact, sliding, campfire crackle, victory.
 */

import { SurfaceType } from '../types/game';

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private flexOscillator: OscillatorNode | null = null;
  private flexGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private campfireGain: GainNode | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.ctx) {
      this.stopFlexSound();
      if (this.windGain) this.windGain.gain.value = 0;
      if (this.campfireGain) this.campfireGain.gain.value = 0;
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // --- Footsteps ---
  public playFootstep(surface: 'rock' | 'snow' | 'ice') {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (surface === 'snow') {
      // Soft crunch (noise + low tone)
      const bufferSize = this.ctx.sampleRate * 0.08;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1200;
      filter.Q.value = 1.2;

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.2, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(t);
    } else if (surface === 'ice') {
      // High slick tap
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800 + Math.random() * 200, t);
      osc.frequency.exponentialRampToValueAtTime(200, t + 0.04);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.04);
    } else {
      // Rock thud
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140 + Math.random() * 40, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.06);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.06);
    }
  }

  // --- Pole Plant ---
  public playPolePlant() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Solid click/thud + flex bend cue
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.09);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  // --- Dynamic Flex Tension Hum ---
  public startFlexSound() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || this.flexOscillator) return;

    try {
      this.flexOscillator = this.ctx.createOscillator();
      this.flexGain = this.ctx.createGain();

      this.flexOscillator.type = 'sine';
      this.flexOscillator.frequency.value = 180;
      this.flexGain.gain.value = 0.05;

      this.flexOscillator.connect(this.flexGain);
      this.flexGain.connect(this.ctx.destination);
      this.flexOscillator.start();
    } catch {
      // Ignore audio init errors
    }
  }

  public updateFlexTension(strainFraction: number) {
    if (this.isMuted || !this.ctx || !this.flexOscillator || !this.flexGain) return;
    // Frequency rises from 160Hz up to 480Hz as pole flexes
    const freq = 160 + Math.min(1.0, strainFraction) * 320;
    const volume = 0.05 + Math.min(1.0, strainFraction) * 0.25;
    this.flexOscillator.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.03);
    this.flexGain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.03);
  }

  public stopFlexSound() {
    if (this.flexOscillator) {
      try {
        this.flexOscillator.stop();
        this.flexOscillator.disconnect();
      } catch {
        // Safe tear down
      }
      this.flexOscillator = null;
      this.flexGain = null;
    }
  }

  // --- Vault Launch Swoosh ---
  public playVaultRelease(speed: number) {
    if (this.isMuted) return;
    this.stopFlexSound();
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const normSpeed = Math.min(1.5, Math.max(0.4, speed / 400));

    // Pitch sweep up (elastic unbend snap)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200 * normSpeed, t);
    osc.frequency.exponentialRampToValueAtTime(650 * normSpeed, t + 0.18);

    gain.gain.setValueAtTime(0.35 * normSpeed, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  // --- Landing Impact ---
  public playLanding(verticalSpeed: number, surface: SurfaceType) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const impactScale = Math.min(1.0, Math.max(0.2, verticalSpeed / 700));

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(100 + impactScale * 80, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.12 * impactScale);

    gain.gain.setValueAtTime(0.4 * impactScale, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12 * impactScale);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  // --- Checkpoint / Victory Chime ---
  public playCheckpoint() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880]; // A major arpeggio
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const noteOsc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      noteOsc.type = 'sine';
      noteOsc.frequency.setValueAtTime(freq, t + idx * 0.08);

      noteGain.gain.setValueAtTime(0.25, t + idx * 0.08);
      noteGain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.35);

      noteOsc.connect(noteGain);
      noteGain.connect(this.ctx.destination);
      noteOsc.start(t + idx * 0.08);
      noteOsc.stop(t + idx * 0.08 + 0.35);
    });
  }

  // --- Fall / Respawn Sound ---
  public playFallSound() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(350, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.4);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.4);
  }
}

export const sounds = new SoundManager();
