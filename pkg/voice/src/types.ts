/**
 * The vocabulary. Everything else in this package is one of these four things:
 * a state, a blocker, an ear, a mouth.
 */

/**
 * What the machine is doing.
 *
 * `listening` and `speaking` are not exclusive in the world — the mic stays
 * open while the reply plays, which is what makes barge-in possible — but they
 * are exclusive as a *report*, and `speaking` is the one worth reporting.
 */
export type State = "idle" | "listening" | "speaking";

/**
 * Why voice cannot run here. `null` means it can.
 *
 * These are the only honest answers: the page is not on a secure origin, the
 * browser has neither a recogniser nor a recorder, the user said no, or there
 * is no microphone attached.
 */
export type Blocker = "insecure" | "unsupported" | "denied" | "absent";

/** One sentence a person can act on, for every blocker. */
export const REASON: Record<Blocker, string> = {
  insecure: "Voice needs a secure (https) connection. Type your message instead.",
  unsupported: "This browser can't capture audio. Type your message instead.",
  denied: "Microphone access was blocked. Allow it in your browser settings, or type instead.",
  absent: "No microphone found. Plug one in, or type your message instead.",
};

/**
 * Who does the listening or the talking: the platform's speech service, or the
 * browser's own recogniser and voice.
 */
export type Side = "platform" | "browser";

/**
 * The platform's speech service refused, and this conversation will not ask it
 * again.
 *
 * The browser stands in where it can, so a refusal rarely ends a conversation —
 * but it is never silent. An unfunded or unrecognised key sounds exactly like a
 * working one unless something says otherwise.
 */
export interface Refusal {
  /** Which half refused: the ear that transcribes, the mouth that reads aloud,
   *  or the talk socket that does both. */
  service: "ear" | "mouth" | "talk";
  /** What it said. */
  error: Error;
  /** Whether the browser could stand in. False means that half is over: no
   *  transcript, or no spoken reply. */
  covered: boolean;
}

/** One sentence a person can act on, for a refusal that was covered and one that was not. */
export const REFUSED: Record<"covered" | "lost", string> = {
  covered: "Hanzo speech is unavailable — this browser is standing in.",
  lost: "Hanzo speech is unavailable.",
};

/**
 * The platform's speech services, injected.
 *
 * Each surface authenticates differently — hanzo.app holds an IAM session,
 * hanzo.chat proxies through its own server — so this package never owns a
 * credential. It is handed two functions and knows nothing else about the wire.
 */
export interface Speech {
  /** Audio in, text out. */
  transcribe(audio: Blob, options: { language?: string; signal?: AbortSignal }): Promise<string>;
  /** Text in, audio out, in the named voice or the transport's own. Omit and
   *  the browser's own voice reads the reply. */
  speak?(text: string, options: { signal?: AbortSignal; voice?: string }): Promise<Blob>;
  /** A transcript that grows as audio is pushed into it. Omit and there is no
   *  live transcript; the per-utterance ear still works. */
  stream?(options: { language?: string; signal?: AbortSignal }): Promise<Stream>;
}

/** What a growing transcript holds after a push: the settled text, the tail
 *  still being decoded, and the seconds of audio it has been given. */
export interface Said {
  text: string;
  pending: string;
  seconds: number;
}

/** One open growing transcript. Push 16 kHz pcm16 as it is heard, one push at a
 *  time; close to settle the tail. */
export interface Stream {
  /** How much audio each push should carry, in ms. */
  chunk: number;
  /** The seconds of audio one transcript accepts before it must be closed. */
  limit: number;
  /** The most one push may carry, in bytes. */
  most: number;
  push(pcm: Int16Array): Promise<Said>;
  close(): Promise<Said>;
}

/** What the ear reports back while it is open. */
export interface Heard {
  /** The running transcript, as it is heard. Put it in the composer. */
  partial(text: string): void;
  /** The speaker paused: one finished utterance. Send it. */
  utterance(text: string): void;
  /** Voice detected. The barge-in signal — fires before any transcript. */
  onset(): void;
  /** The ear cannot continue. */
  fail(reason: Blocker): void;
  /** The platform's transcriber refused. Reported once per conversation. */
  refused?(refusal: Refusal): void;
  /** The live input level, 0..1, while the mic is open — for a meter or a
   *  waveform. Optional: a caller that does not draw one costs nothing. */
  level?(value: number): void;
}

/** An open microphone. Opening is async because permission is. */
export interface Ear {
  open(): Promise<void>;
  /** Close, flushing whatever was heard as a final utterance. */
  close(): void;
}

/** A voice that reads replies aloud. */
export interface Mouth {
  /** Read `text` aloud, in `voice` — the platform's voice id — where given. */
  say(text: string, voice?: string): Promise<void>;
  /** Stop mid-word. Idempotent. */
  hush(): void;
}
