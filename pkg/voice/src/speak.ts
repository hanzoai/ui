import { capability } from "./capability.js";
import type { Mouth, Refusal, Speech } from "./types.js";

export interface MouthOptions {
  /** The platform's voice. Without it the browser reads the reply. */
  speech?: Speech;
  /** The browser voice, by `speechSynthesis` name. Read fresh per sentence:
   *  the browser loads its voice list asynchronously and the user can change
   *  the pick mid-conversation. */
  voice?: () => string | undefined;
  /** The platform refused. Told once, with whether the browser stood in. */
  refused?: (refusal: Refusal) => void;
  scope?: unknown;
}

/**
 * The voice that reads a reply aloud.
 *
 * The platform's voice when there is one, the browser's when there is not —
 * and "there is not" includes "it refused". A speech service that 401s, runs
 * out of credit or times out must not turn a conversation mute, so the browser
 * voice waits behind the platform one and takes the sentence rather than
 * dropping it. It also says so: standing in silently makes a dead key sound
 * exactly like a live one, and nobody goes looking for a bill that reads zero.
 *
 * Both answer `hush()` the same way and both resolve `say()` when the last word
 * has played, which is what lets the caller treat "it is talking" as one state
 * regardless of who is doing the talking.
 */
export function mouth(options: MouthOptions = {}): Mouth {
  const scope = options.scope ?? globalThis;
  const fallback = browser(scope, options.voice);
  return options.speech?.speak
    ? platform(options.speech, scope, fallback, options.refused)
    : fallback;
}

function platform(
  speech: Speech,
  scope: unknown,
  fallback: Mouth,
  refused?: (refusal: Refusal) => void,
): Mouth {
  // ONE element for the mouth's whole life, made and loaded HERE — inside the
  // click that asked for a voice, when there is one. Safari plays sound only
  // through an element touched inside a gesture; made after the speech request
  // resolves, the reply to a click is refused as autoplay and nothing is heard.
  const Sound = (scope as { Audio?: typeof Audio })?.Audio ?? globalThis.Audio;
  const sound: HTMLAudioElement | null = Sound ? new Sound() : null;
  sound?.load?.();
  let source: string | null = null;
  let turn: AbortController | null = null;
  let settle: (() => void) | null = null;
  let gone = false;

  const clear = () => {
    sound?.pause();
    if (source) URL.revokeObjectURL(source);
    source = null;
    // A stopped sentence is a finished one: whoever awaits `say` moves on.
    settle?.();
    settle = null;
  };

  return {
    async say(text, voice) {
      this.hush();
      // A voice that refused is not asked again: every later sentence would
      // refuse the same way, at the cost of a round trip each.
      if (gone || !sound) return await fallback.say(text);
      const control = new AbortController();
      turn = control;
      let audio: Blob;
      try {
        audio = await speech.speak!(text, { signal: control.signal, voice });
      } catch (error) {
        // An interrupted turn is not a refusal: it was meant to stop.
        if (control.signal.aborted) return;
        gone = true;
        refused?.({
          service: "mouth",
          error: error as Error,
          covered: capability(scope).synthesis,
        });
        await fallback.say(text);
        return;
      }
      if (control.signal.aborted) return;
      const url = URL.createObjectURL(audio);
      source = url;
      sound.src = url;
      await new Promise<void>((resolve) => {
        settle = resolve;
        sound.onended = () => resolve();
        sound.onerror = () => resolve();
        void sound.play().catch(() => resolve());
      });
      if (source === url) clear();
    },

    hush() {
      turn?.abort();
      turn = null;
      clear();
      fallback.hush();
    },
  };
}

function browser(scope: unknown, chosen?: () => string | undefined): Mouth {
  const synth = (scope as { speechSynthesis?: SpeechSynthesis })?.speechSynthesis;
  const Utterance =
    (scope as { SpeechSynthesisUtterance?: typeof SpeechSynthesisUtterance })
      ?.SpeechSynthesisUtterance ?? globalThis.SpeechSynthesisUtterance;

  return {
    async say(text) {
      if (!synth || !Utterance) return;
      synth.cancel();
      const line = new Utterance(text);
      const name = chosen?.();
      if (name) {
        const match = synth.getVoices().find((v) => v.name === name);
        if (match) line.voice = match;
      }
      await new Promise<void>((resolve) => {
        line.onend = () => resolve();
        line.onerror = () => resolve();
        synth.speak(line);
      });
    },

    hush() {
      synth?.cancel();
    },
  };
}
