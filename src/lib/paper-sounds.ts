"use client";

type PaperAudio = {
  playCrinkle: (intensity?: number) => void;
  playRustle: (volume?: number) => void;
  startAmbient: () => void;
  stopAmbient: () => void;
  dispose: () => void;
};

let sharedAudio: PaperAudio | null = null;

function getContext() {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  return new Ctx();
}

function createNoiseBuffer(ctx: AudioContext, seconds = 0.12) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    const t = i / length;
    data[i] = (Math.random() * 2 - 1) * (1 - t * 0.85);
  }

  return buffer;
}

export function getPaperAudio(): PaperAudio {
  if (sharedAudio) return sharedAudio;

  let ctx: AudioContext | null = null;
  let ambientTimer: ReturnType<typeof setInterval> | null = null;

  const ensure = () => {
    if (!ctx) ctx = getContext();
    if (ctx?.state === "suspended") void ctx.resume();
    return ctx;
  };

  const playCrinkle = (intensity = 0.5) => {
    const audio = ensure();
    if (!audio) return;

    const source = audio.createBufferSource();
    source.buffer = createNoiseBuffer(audio, 0.08 + intensity * 0.08);

    const filter = audio.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 900 + intensity * 2200;
    filter.Q.value = 0.7;

    const gain = audio.createGain();
    gain.gain.value = 0.015 + intensity * 0.035;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(audio.destination);
    source.start();
  };

  const playRustle = (volume = 0.04) => {
    const audio = ensure();
    if (!audio) return;

    const source = audio.createBufferSource();
    source.buffer = createNoiseBuffer(audio, 0.18);

    const filter = audio.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 400;

    const gain = audio.createGain();
    gain.gain.setValueAtTime(0.0001, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(volume, audio.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.22);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(audio.destination);
    source.start();
  };

  const startAmbient = () => {
    if (ambientTimer) return;
    ambientTimer = setInterval(() => {
      if (Math.random() > 0.55) playRustle(0.012);
    }, 9000);
  };

  const stopAmbient = () => {
    if (ambientTimer) clearInterval(ambientTimer);
    ambientTimer = null;
  };

  const dispose = () => {
    stopAmbient();
    void ctx?.close();
    ctx = null;
    sharedAudio = null;
  };

  sharedAudio = { playCrinkle, playRustle, startAmbient, stopAmbient, dispose };
  return sharedAudio;
}
