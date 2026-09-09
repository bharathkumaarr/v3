import { pageCurlConfig } from "./page-curl-config";

type MotionPhase = "idle" | "hover" | "drag" | "commit" | "settling";

/**
 * Motion-driven paper acoustics for the page curl.
 *
 * No sample files: everything is filtered noise through the Web Audio API, so there is
 * nothing to fetch and nothing to license. A continuous rustle loop tracks how fast the
 * fold is moving; short bursts fire on grab, snap-back, and a committed turn.
 *
 * AudioContext may only resume after a user gesture. Call `unlock` from the first press
 * and ignore everything until it has succeeded.
 */
export class PaperAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private rustleGain: GainNode | null = null;
  private rustleFilter: BiquadFilterNode | null = null;
  private rustleSource: AudioBufferSourceNode | null = null;
  private noise: AudioBuffer | null = null;

  private enabled = true;
  private unlocked = false;
  private lastCrinkleAt = 0;
  private lastHoverAt = 0;
  private lastSpeed = 0;
  private smoothedGain = 0;

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.silence();
  }

  /** Must run inside a pointer/keyboard handler so the browser allows the context. */
  unlock(): void {
    if (!this.enabled || typeof window === "undefined") return;

    const ctx = this.ensureContext();
    if (!ctx) return;

    if (ctx.state === "suspended") void ctx.resume();
    this.unlocked = true;
    this.ensureRustle();
  }

  /**
   * Drive the continuous rustle from fold speed (px/s of crease travel).
   *
   * Called every animation frame while the loop is awake. Cheap: only writes gains and
   * a filter frequency; never allocates.
   */
  setMotion(speedPxPerSec: number, phase: MotionPhase): void {
    if (!this.ready()) return;

    const { audio } = pageCurlConfig;
    const speed = Math.abs(speedPxPerSec);
    const moving =
      phase === "drag" || phase === "commit" || phase === "hover" || phase === "settling";

    // Idle proximity lifts are nearly silent; drag and commit carry the real sound.
    const phaseScale =
      phase === "drag" || phase === "commit"
        ? 1
        : phase === "settling"
          ? 0.55
          : phase === "hover"
            ? 0.22
            : 0;

    const normalised = Math.min(1, speed / audio.fullSpeed);
    const target =
      moving && phaseScale > 0
        ? Math.pow(normalised, 0.72) * audio.rustleVolume * phaseScale
        : 0;

    // Attack follows the hand; release trails a little so a stop does not click off.
    const blend = target > this.smoothedGain ? 0.38 : 0.14;
    this.smoothedGain += (target - this.smoothedGain) * blend;

    const now = this.ctx!.currentTime;
    this.rustleGain!.gain.setTargetAtTime(Math.max(this.smoothedGain, 0.0001), now, 0.04);

    // Faster motion brightens the paper; slow motion stays duller.
    const bright = 1100 + normalised * 2600;
    this.rustleFilter!.frequency.setTargetAtTime(bright, now, 0.05);

    // A sudden jerk throws a short crinkle on top of the continuous bed.
    const jerk = Math.abs(speed - this.lastSpeed);
    this.lastSpeed = speed;

    if (
      (phase === "drag" || phase === "commit") &&
      jerk > audio.crinkleJerk &&
      speed > audio.crinkleMinSpeed
    ) {
      this.crinkle(0.35 + Math.min(0.65, jerk / (audio.fullSpeed * 1.4)));
    }
  }

  grab(): void {
    if (!this.ready()) return;
    this.crinkle(0.55);
    this.tap(1800, 0.018, 0.045);
  }

  /** Soft lift when the pointer first enters the corner. */
  hoverLift(): void {
    if (!this.ready()) return;
    const now = performance.now();
    if (now - this.lastHoverAt < 700) return;
    this.lastHoverAt = now;
    this.crinkle(0.22);
  }

  /** Sheet settling back after a cancelled drag. */
  snapBack(): void {
    if (!this.ready()) return;
    this.crinkle(0.4);
    this.flutter(0.028, 0.28);
  }

  /** Momentum carrying the page through the rest of the turn. */
  commit(progress: number): void {
    if (!this.ready()) return;
    this.flutter(0.04 + progress * 0.03, 0.42 + progress * 0.18);
    this.crinkle(0.7);
  }

  /** Short whoosh for the CSS fallback path. */
  turn(): void {
    if (!this.ready()) return;
    this.flutter(0.045, 0.38);
    this.crinkle(0.5);
  }

  dispose(): void {
    this.silence();
    try {
      this.rustleSource?.stop();
    } catch {
      // Already stopped.
    }
    this.rustleSource = null;
    this.rustleGain = null;
    this.rustleFilter = null;
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
    this.noise = null;
    this.unlocked = false;
  }

  private ready(): boolean {
    return (
      this.enabled &&
      this.unlocked &&
      this.ctx != null &&
      this.ctx.state === "running" &&
      document.visibilityState !== "hidden"
    );
  }

  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    if (typeof window === "undefined") return null;

    const Ctx =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return null;

    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = pageCurlConfig.audio.masterVolume;
    this.master.connect(this.ctx.destination);
    this.noise = makePinkNoise(this.ctx, 1.6);
    return this.ctx;
  }

  private ensureRustle(): void {
    if (!this.ctx || !this.master || !this.noise || this.rustleSource) return;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1600;
    filter.Q.value = 0.55;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.0001;

    const source = this.ctx.createBufferSource();
    source.buffer = this.noise;
    source.loop = true;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);

    source.start();
    this.rustleSource = source;
    this.rustleFilter = filter;
    this.rustleGain = gain;
  }

  private silence(): void {
    this.smoothedGain = 0;
    this.lastSpeed = 0;
    if (!this.rustleGain || !this.ctx) return;
    this.rustleGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.rustleGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.03);
  }

  private crinkle(intensity: number): void {
    if (!this.ctx || !this.master || !this.noise) return;

    const now = performance.now();
    if (now - this.lastCrinkleAt < pageCurlConfig.audio.crinkleCooldownMs) return;
    this.lastCrinkleAt = now;

    const { audio } = pageCurlConfig;
    const t = this.ctx.currentTime;
    const duration = 0.05 + intensity * 0.09;

    const source = this.ctx.createBufferSource();
    source.buffer = this.noise;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1400 + intensity * 2800;
    filter.Q.value = 0.85;

    const gain = this.ctx.createGain();
    const peak = audio.crinkleVolume * (0.35 + intensity * 0.65);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start(t);
    source.stop(t + duration + 0.02);
  }

  /** Soft mid-frequency tap used for the initial grab. */
  private tap(hz: number, volume: number, duration: number): void {
    if (!this.ctx || !this.master) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(hz, t);
    osc.frequency.exponentialRampToValueAtTime(hz * 0.55, t + duration);

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = hz;
    filter.Q.value = 1.2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  /** Longer descending rustle for a turn or snap-back. */
  private flutter(volume: number, duration: number): void {
    if (!this.ctx || !this.master || !this.noise) return;

    const t = this.ctx.currentTime;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noise;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(3200, t);
    filter.frequency.exponentialRampToValueAtTime(700, t + duration);
    filter.Q.value = 0.7;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start(t);
    source.stop(t + duration + 0.04);
  }
}

/** Pink-ish noise: white noise rolled off toward the highs the way paper grain is. */
function makePinkNoise(ctx: AudioContext, seconds: number): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;

  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    b6 = white * 0.115926;
    data[i] = pink * 0.11;
  }

  return buffer;
}
