import { capability, recogniser } from "./capability.js";
import { capture, refusal } from "./mic.js";
import type { Recognition } from "./capability.js";
import type { Ear, Heard, Side, Speech } from "./types.js";

export interface ListenOptions {
  heard: Heard;
  /** The platform's transcriber. Without it the browser's recogniser is the
   *  only ear there is. */
  speech?: Speech;
  language?: string;
  /** Silence, in ms, that ends an utterance. */
  pause?: number;
  /** Which ear to try first. The platform's, unless the caller says otherwise. */
  prefer?: Side;
  scope?: unknown;
}

/** A leg reports its transport failures upward; `listen` decides what they mean. */
type Leg = ListenOptions & { refused?(error: Error): void };

const PAUSE = 900;

/** Silence, in ms, after which a recording nobody has spoken in starts over. */
const LEAD = 10_000;

/**
 * Open the microphone.
 *
 * Two legs, one ear. The platform's transcriber is the one Hanzo ships and the
 * one that improves, so it listens wherever it is configured and the browser
 * can record for it — which is every browser, not only the ones missing a
 * recogniser. The browser's own recogniser is the standby: it listens when
 * there is no platform, when this browser cannot record, when the caller asks
 * for it by name, and from the moment the platform refuses.
 *
 * Both legs hold an echo-cancelled capture stream for as long as they are open.
 * That is what makes barge-in work: without it the microphone hears the reply
 * playing out of the speakers and interrupts itself on every turn.
 */
export function listen(options: ListenOptions): Ear {
  const cap = capability(options.scope);
  const ears: Record<Side, ((leg: Leg) => Ear) | null> = {
    platform: options.speech && cap.recorder ? record : null,
    browser: cap.recognition ? recognise : null,
  };
  const ranked: Side[] = options.prefer === "browser"
    ? ["browser", "platform"]
    : ["platform", "browser"];
  const [first, standby] = ranked.filter((side) => ears[side]);
  if (!first) return deaf(options.heard);

  let ear: Ear;
  let closed = false;

  // A refusal moves the conversation onto the standby ear and says so. Without
  // the move, a refused key is a microphone that hears nothing for as long as
  // it is open; without the word, it looks exactly like one that heard nothing.
  const refused = (error: Error) => {
    const spare = closed || !standby ? null : ears[standby]!;
    options.heard.refused?.({ service: "ear", error, covered: !!spare });
    if (!spare) return;
    const previous = ear;
    ear = spare(options);
    previous.close();
    void ear.open();
  };

  ear = ears[first]!({ ...options, refused });
  return {
    open: () => ear.open(),
    close: () => {
      closed = true;
      ear.close();
    },
  };
}

/** No ear this browser can open. Say so when the microphone is asked for. */
function deaf(heard: Heard): Ear {
  return {
    async open() {
      heard.fail("unsupported");
    },
    close() {},
  };
}

/**
 * Report the live input level, 0..1, off a capture stream, for a waveform or a
 * meter. It reads the SAME stream the recogniser holds — a second getUserMedia
 * would be a second permission and a second red dot — and returns a stop that
 * tears the graph down. Silent (no report, no context) where the platform has
 * no AudioContext, so this never turns a working recogniser into a failure.
 */
function meter(stream: MediaStream, scope: unknown, report: (level: number) => void): () => void {
  const Ctx = (scope as { AudioContext?: typeof AudioContext })?.AudioContext ??
    (globalThis as { AudioContext?: typeof AudioContext }).AudioContext;
  const raf = (scope as { requestAnimationFrame?: typeof requestAnimationFrame })
    ?.requestAnimationFrame ?? globalThis.requestAnimationFrame;
  if (!Ctx || !raf) {
    return () => {};
  }
  let stopped = false;
  const context = new Ctx();
  const analyser = context.createAnalyser();
  analyser.fftSize = 512;
  context.createMediaStreamSource(stream).connect(analyser);
  const buffer = new Uint8Array(analyser.frequencyBinCount);
  const tick = () => {
    if (stopped) {
      return;
    }
    analyser.getByteTimeDomainData(buffer);
    // RMS of the waveform around the 128 midpoint → 0..1 loudness.
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      const v = (buffer[i]! - 128) / 128;
      sum += v * v;
    }
    report(Math.min(1, Math.sqrt(sum / buffer.length) * 3));
    raf(tick);
  };
  raf(tick);
  return () => {
    stopped = true;
    void context.close();
  };
}

// ── the recogniser leg ──────────────────────────────────────────────────────

function recognise({ heard, language, pause = PAUSE, scope }: ListenOptions): Ear {
  const Ctor = recogniser(scope);
  let stream: MediaStream | null = null;
  let engine: Recognition | null = null;
  let stopMeter: (() => void) | null = null;
  let open = false;
  let settled = "";
  let live = "";
  let armed = true;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const hold = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, pause);
  };

  const flush = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    const text = `${settled}${live}`.trim();
    settled = "";
    live = "";
    armed = true;
    if (text) heard.utterance(text);
  };

  return {
    async open() {
      if (open || !Ctor) return;
      try {
        stream = await capture(scope);
      } catch (error) {
        heard.fail(refusal(error));
        return;
      }
      if (heard.level) {
        stopMeter = meter(stream, scope, heard.level);
      }
      open = true;
      const engineNow = new Ctor();
      engine = engineNow;
      engineNow.lang = language ?? globalThis.navigator?.language ?? "en-US";
      engineNow.continuous = true;
      engineNow.interimResults = true;

      engineNow.onresult = (event) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (!result) continue;
          const text = result[0].transcript;
          if (result.isFinal) settled += text;
          else interim += text;
        }
        live = interim;
        const running = `${settled}${live}`.trim();
        if (!running) return;
        if (armed) {
          armed = false;
          heard.onset();
        }
        heard.partial(running);
        hold();
      };

      // `no-speech` is the recogniser being patient, not a failure — an open mic
      // is allowed to sit in silence. Everything else ends the session.
      engineNow.onerror = (event) => {
        const error = event?.error ?? "";
        if (error === "no-speech" || error === "aborted") return;
        if (error === "not-allowed" || error === "service-not-allowed") heard.fail("denied");
        else if (error === "audio-capture") heard.fail("absent");
      };

      // Chrome ends a continuous session on its own every so often. An open mic
      // means open, so it goes straight back on until the caller closes it.
      engineNow.onend = () => {
        if (open && engine === engineNow) {
          try {
            engineNow.start();
          } catch {
            /* already starting — the next onend will retry */
          }
        }
      };

      engineNow.start();
    },

    close() {
      if (!open) return;
      open = false;
      flush();
      stopMeter?.();
      stopMeter = null;
      engine?.abort();
      engine = null;
      stream?.getTracks().forEach((track) => track.stop());
      stream = null;
    },
  };
}

// ── the recorder leg ────────────────────────────────────────────────────────

/** The first container this browser will actually record. */
function container(scope: unknown): string | undefined {
  const Recorder = ((scope ?? globalThis) as { MediaRecorder?: typeof MediaRecorder }).MediaRecorder;
  if (!Recorder?.isTypeSupported) return undefined;
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];
  return types.find((type) => Recorder.isTypeSupported(type));
}

/**
 * The platform's ear: no word-by-word stream, so the transcript arrives whole
 * once the speaker pauses. Voice activity is read off the waveform rather than
 * from a recogniser, which is what supplies the barge-in signal here.
 */
function record({ heard, speech, language, pause = PAUSE, scope, refused }: Leg): Ear {
  let stream: MediaStream | null = null;
  let context: AudioContext | null = null;
  let recorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];
  // The recording in progress: when it began, and whether anybody spoke in it.
  let segment = { at: 0, voiced: false };
  let open = false;
  let loud = false;
  let quietAt = 0;
  let frame: ReturnType<typeof setTimeout> | null = null;
  let gone = false;

  const cut = () => {
    if (recorder?.state === "recording") recorder.stop();
  };

  const transcribe = async (audio: Blob) => {
    // A transcriber that refused is not asked again: every later turn would
    // refuse the same way, and the standby ear already has the conversation.
    if (!speech || gone || audio.size === 0) return;
    try {
      const text = (await speech.transcribe(audio, { language })).trim();
      if (!text) return;
      heard.partial(text);
      heard.utterance(text);
    } catch (error) {
      gone = true;
      refused?.(error as Error);
    }
  };

  const arm = () => {
    const type = container(scope);
    const made = new MediaRecorder(stream as MediaStream, type ? { mimeType: type } : undefined);
    const mine = { at: Date.now(), voiced: false };
    segment = mine;
    recorder = made;
    chunks = [];
    made.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    made.onstop = () => {
      const audio = new Blob(chunks, { type: made.mimeType || type || "audio/webm" });
      chunks = [];
      // Only a recording somebody spoke in is a turn. A transcriber handed
      // silence — the tail a closing mic flushes, a long wait — answers with
      // words nobody said, and each one is billed.
      if (mine.voiced) void transcribe(audio);
      if (open) arm();
    };
    made.start();
  };

  // Root-mean-square over the waveform: loud enough for long enough is speech,
  // quiet for `pause` after speech is the end of a turn.
  const watch = (analyser: AnalyserNode) => {
    const samples = new Uint8Array(analyser.fftSize);
    const tick = () => {
      if (!open) return;
      analyser.getByteTimeDomainData(samples);
      let sum = 0;
      for (const sample of samples) {
        const centred = (sample - 128) / 128;
        sum += centred * centred;
      }
      const level = Math.sqrt(sum / samples.length);
      heard.level?.(Math.min(1, level * 3));
      const now = Date.now();
      if (level > 0.04) {
        segment.voiced = true;
        if (!loud) {
          loud = true;
          heard.onset();
        }
        quietAt = now;
      } else if (loud && now - quietAt > pause) {
        loud = false;
        cut();
      } else if (!loud && !segment.voiced && now - segment.at > LEAD) {
        // Nobody has spoken: start the recording over, so the turn that does
        // come is not sent with minutes of silence in front of it.
        cut();
      }
      frame = setTimeout(tick, 100);
    };
    tick();
  };

  return {
    async open() {
      if (open) return;
      try {
        stream = await capture(scope);
      } catch (error) {
        heard.fail(refusal(error));
        return;
      }
      open = true;
      context = new AudioContext();
      // A context made outside the click may start suspended, and a suspended
      // analyser reads silence: no onset, no pause, no turn ever sent.
      void context.resume?.().catch(() => {});
      const analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      context.createMediaStreamSource(stream).connect(analyser);
      arm();
      watch(analyser);
    },

    close() {
      if (!open) return;
      open = false;
      if (frame) clearTimeout(frame);
      frame = null;
      cut();
      void context?.close();
      context = null;
      stream?.getTracks().forEach((track) => track.stop());
      stream = null;
    },
  };
}
