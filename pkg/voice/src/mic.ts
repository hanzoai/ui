/**
 * The microphone, shared by every leg that opens it.
 *
 * `capture` is the one permission ask and the echo-cancelled stream it returns.
 * `tap` turns that stream into raw 16 kHz pcm16, a frame at a time, for the two
 * legs that stream audio rather than record it: the talk socket (/v1/voice) and
 * the growing transcript (/v1/audio/transcript). Both speak little-endian int16,
 * mono, 16 kHz, so the conversion is written once.
 */

/** The rate both streaming endpoints take audio at. */
export const RATE = 16000;

/** The permission ask, and the echo-cancelled stream that comes back. */
export async function capture(scope: unknown): Promise<MediaStream> {
  const nav = (scope as { navigator?: Navigator })?.navigator ?? globalThis.navigator;
  return await nav.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  });
}

/** getUserMedia's DOMException names, in this package's vocabulary. */
export function refusal(error: unknown): "denied" | "absent" {
  const name = (error as { name?: string })?.name ?? "";
  return name === "NotFoundError" || name === "OverconstrainedError" ? "absent" : "denied";
}

/** A running tap. Closing it releases the audio graph and its context, not the
 *  stream. */
export interface Tap {
  /** The context the tap runs in, for a leg that also plays audio back. */
  context: AudioContext;
  close(): void;
}

/**
 * An AudioContext, made NOW. Call it inside the click that opens the mic, before
 * any await: Safari only lets a context run that was made or resumed in a user
 * gesture, and one made after the permission prompt sits suspended, taps nothing
 * and plays nothing. Resumed for the browsers that start it suspended anyway.
 */
export function audioContext(scope: unknown = globalThis): AudioContext {
  const Context = (scope as { AudioContext?: typeof AudioContext })?.AudioContext ?? globalThis.AudioContext;
  const made = new Context();
  if (made.state === "suspended") void made.resume?.().catch(() => {});
  return made;
}

// The worklet copies each render quantum out to the main thread. Inlined as a
// Blob so the package ships one module and a host serves no extra file.
const WORKLET = `registerProcessor("hanzo-tap", class extends AudioWorkletProcessor {
  process(inputs) { const c = inputs[0] && inputs[0][0]; if (c) this.port.postMessage(c.slice(0)); return true; }
});`;

/**
 * Stream `stream` as 16 kHz pcm16 in chunks of `frame` samples.
 *
 * Each sample out is the AVERAGE of the input samples it covers, not one picked
 * from among them: the average is the low-pass a plain decimation leaves out, so
 * a 48 kHz microphone does not fold its upper band down into the speech band.
 * The level (0..1) of each chunk rides with it, for a meter.
 */
export async function tap(
  stream: MediaStream,
  frame: number,
  on: (pcm: Int16Array, level: number) => void,
  scope: unknown = globalThis,
  made?: AudioContext,
): Promise<Tap> {
  const Node = (scope as { AudioWorkletNode?: typeof AudioWorkletNode })?.AudioWorkletNode ?? globalThis.AudioWorkletNode;
  const context = made ?? audioContext(scope);
  const url = URL.createObjectURL(new Blob([WORKLET], { type: "application/javascript" }));
  try {
    await context.audioWorklet.addModule(url);
  } finally {
    URL.revokeObjectURL(url);
  }
  const source = context.createMediaStreamSource(stream);
  const node = new Node(context, "hanzo-tap");
  // A node nothing pulls on is not processed, so the tap feeds a silent gain on
  // its way to the destination: the graph runs and the speakers hear nothing.
  const mute = context.createGain();
  mute.gain.value = 0;
  source.connect(node);
  node.connect(mute);
  mute.connect(context.destination);

  const step = context.sampleRate / RATE;
  const out = new Int16Array(frame);
  let filled = 0;
  let power = 0;
  let acc = 0;
  let count = 0;
  let pos = 0;
  const emit = (value: number) => {
    const v = Math.max(-1, Math.min(1, value));
    out[filled++] = v < 0 ? v * 0x8000 : v * 0x7fff;
    power += v * v;
    if (filled === frame) {
      on(out.slice(0), Math.min(1, Math.sqrt(power / frame) * 3));
      filled = 0;
      power = 0;
    }
  };
  node.port.onmessage = (event: MessageEvent<Float32Array>) => {
    for (const sample of event.data) {
      acc += sample;
      count++;
      pos += 1;
      if (pos >= step) {
        pos -= step;
        emit(acc / count);
        acc = 0;
        count = 0;
      }
    }
  };

  return {
    context,
    close() {
      node.port.onmessage = null;
      source.disconnect();
      node.disconnect();
      mute.disconnect();
      void context.close();
    },
  };
}

/** pcm16 as base64, the encoding the realtime protocol carries audio in. */
export function base64(pcm: Int16Array): string {
  const bytes = new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

/** base64 pcm16 back to samples in -1..1, for playback. */
export function samples(b64: string): Float32Array<ArrayBuffer> {
  const binary = atob(b64);
  const count = binary.length >> 1;
  const out = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const lo = binary.charCodeAt(2 * i);
    const hi = binary.charCodeAt(2 * i + 1);
    const v = (hi << 8) | lo;
    out[i] = (v & 0x8000 ? v - 0x10000 : v) / 0x8000;
  }
  return out;
}
