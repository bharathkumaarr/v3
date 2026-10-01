"use client";

const SOUND_SRC = "/justsomesounds-click-sound-432501.mp3";
const CLICK_VOLUME = 0.1;

let audioCtx: AudioContext | null = null;
let audioBuffer: AudioBuffer | null = null;
let isAudioLoading = false;
let fallbackAudio: HTMLAudioElement | null = null;
let lastPlayTimestamp = 0;

/**
 * Initializes the audio context and preloads the click audio buffer.
 * Safe to call multiple times; execution is idempotent.
 */
export function initClickAudio(): void {
  if (typeof window === "undefined") return;

  // Initialize fallback HTMLAudioElement
  if (!fallbackAudio) {
    try {
      fallbackAudio = new Audio(SOUND_SRC);
      fallbackAudio.preload = "auto";
    } catch {
      // Audio element initialization fallback
    }
  }

  // Pre-fetch and decode into Web Audio API for lowest possible latency
  if (!audioBuffer && !isAudioLoading) {
    isAudioLoading = true;
    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;

      if (AudioCtxClass) {
        if (!audioCtx) {
          audioCtx = new AudioCtxClass();
        }

        fetch(SOUND_SRC)
          .then((res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.arrayBuffer();
          })
          .then((arrayBuf) => {
            if (!audioCtx) return null;
            return audioCtx.decodeAudioData(arrayBuf);
          })
          .then((decoded) => {
            if (decoded) {
              audioBuffer = decoded;
            }
          })
          .catch(() => {
            // Silently fall back to HTMLAudioElement
          })
          .finally(() => {
            isAudioLoading = false;
          });
      }
    } catch {
      isAudioLoading = false;
    }
  }
}

/**
 * Plays the click sound instantly.
 * Uses Web Audio API if available (0ms latency, handles overlapping clicks),
 * with fallback to HTMLAudioElement.
 */
export function playClickSound(): void {
  if (typeof window === "undefined") return;

  // Prevent duplicate triggering in micro-windows (< 20ms)
  const now = performance.now();
  if (now - lastPlayTimestamp < 20) return;
  lastPlayTimestamp = now;

  // 1. Primary: Web Audio API
  if (audioCtx && audioBuffer) {
    try {
      if (audioCtx.state === "suspended") {
        void audioCtx.resume();
      }

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;

      // Master gain for subtle, gentle tactile click volume
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = CLICK_VOLUME;

      source.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      source.onended = () => {
        source.disconnect();
        gainNode.disconnect();
      };

      source.start(0);
      return;
    } catch {
      // Fall through to HTMLAudio fallback
    }
  }

  // 2. Secondary fallback: HTMLAudioElement pool / clone
  try {
    if (!fallbackAudio) {
      fallbackAudio = new Audio(SOUND_SRC);
    }
    fallbackAudio.volume = CLICK_VOLUME;

    // If not busy, play directly; otherwise clone to support fast repeated clicks
    if (fallbackAudio.paused || fallbackAudio.ended) {
      fallbackAudio.currentTime = 0;
      void fallbackAudio.play().catch(() => {});
    } else {
      const clone = fallbackAudio.cloneNode(true) as HTMLAudioElement;
      clone.volume = CLICK_VOLUME;
      void clone.play().catch(() => {});
    }
  } catch {
    // Autoplay restrictions or sound disabled in environment
  }
}
