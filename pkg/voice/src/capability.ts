import type { Blocker, Speech } from "./types.js";

/**
 * What this browser can actually do. One pure read of the environment, in one
 * place, so that "can we?" is never answered twice with two different answers.
 */
export interface Capability {
  /** A recogniser: live partial transcripts, no round trip. Chrome, Edge, Safari. */
  recognition: boolean;
  /** A recorder: capture to a Blob for the platform to transcribe. Everywhere else. */
  recorder: boolean;
  /** The browser's own voice, for when the platform has none. */
  synthesis: boolean;
  /** getUserMedia is only exposed on a secure origin. */
  secure: boolean;
  /** Raw audio in and out: an AudioWorklet to tap the mic and a WebSocket to
   *  carry it. What the talk socket and the growing transcript need. */
  stream: boolean;
}

type Global = {
  SpeechRecognition?: unknown;
  webkitSpeechRecognition?: unknown;
  MediaRecorder?: unknown;
  speechSynthesis?: unknown;
  isSecureContext?: boolean;
  navigator?: { mediaDevices?: { getUserMedia?: unknown } };
  AudioWorkletNode?: unknown;
  WebSocket?: unknown;
};

export function capability(scope: unknown = globalThis): Capability {
  const g = (scope ?? {}) as Global;
  const media = typeof g.navigator?.mediaDevices?.getUserMedia === "function";
  return {
    recognition: !!(g.SpeechRecognition ?? g.webkitSpeechRecognition),
    recorder: typeof g.MediaRecorder === "function" && media,
    synthesis: !!g.speechSynthesis,
    // `isSecureContext` is absent in non-browser scopes; treat that as secure so
    // tests and SSR probes are not mislabelled.
    secure: g.isSecureContext !== false,
    stream: typeof g.AudioWorkletNode === "function" && typeof g.WebSocket === "function" && media,
  };
}

/**
 * Can voice run, and if not, why. The recorder leg needs the platform to
 * transcribe for it; the recogniser leg stands alone.
 */
export function blocker(cap: Capability, speech?: Speech): Blocker | null {
  if (!cap.secure) return "insecure";
  if (cap.recognition) return null;
  if (cap.recorder && speech) return null;
  return "unsupported";
}

/** Can a streaming leg — the talk socket or the growing transcript — run, and if
 *  not, why. Both need the platform; neither has a browser stand-in. */
export function streamBlocker(cap: Capability): Blocker | null {
  if (!cap.secure) return "insecure";
  return cap.stream ? null : "unsupported";
}

/** The recogniser constructor, whichever name this browser gave it. */
export function recogniser(scope: unknown = globalThis): (new () => Recognition) | null {
  const g = (scope ?? {}) as Global;
  return ((g.SpeechRecognition ?? g.webkitSpeechRecognition) as (new () => Recognition)) ?? null;
}

/**
 * The slice of the Web Speech API this package touches. The DOM lib does not
 * type the vendor-prefixed name, and typing only what we use keeps the surface
 * we depend on visible.
 */
export interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  onspeechstart?: (() => void) | null;
}

export interface RecognitionEvent {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
}
