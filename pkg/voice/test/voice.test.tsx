import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Speech, VoiceOptions } from "../src/index.js";

// A live conversation is a fact about the PAGE — it survives the composer
// remounting, which is the whole point. So each case gets a fresh module, the
// way each case gets a fresh page.
type Api = typeof import("../src/index.js");
let api: Api;
type Machine = ReturnType<Api["useVoice"]>;

// ── a browser we can drive ──────────────────────────────────────────────────

class Fake {
  static live: Fake | null = null;
  lang = "";
  continuous = false;
  interimResults = false;
  started = 0;
  aborted = 0;
  onresult: ((event: unknown) => void) | null = null;
  onerror: ((event: { error?: string }) => void) | null = null;
  onend: (() => void) | null = null;

  constructor() {
    Fake.live = this;
  }
  start() {
    this.started++;
  }
  stop() {
    this.onend?.();
  }
  abort() {
    this.aborted++;
  }

  /** Feed the recogniser a phrase, the way a real one reports it. */
  hear(text: string, final = false) {
    this.onresult?.({
      resultIndex: 0,
      results: [{ isFinal: final, 0: { transcript: text } }],
    });
  }
}

/** The platform's leg: a recorder, and a waveform we can shout into. */
class Tape {
  static live: Tape | null = null;
  static isTypeSupported = () => true;
  state = "inactive";
  mimeType = "audio/webm";
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;

  constructor() {
    Tape.live = this;
  }
  start() {
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
    this.ondataavailable?.({ data: new Blob(["audio"]) });
    this.onstop?.();
  }
}

/** 128 is silence; anything further from it is somebody talking. */
let loudness = 128;

class Sound {
  createAnalyser() {
    return {
      fftSize: 1024,
      frequencyBinCount: 512,
      getByteTimeDomainData: (buffer: Uint8Array) => buffer.fill(loudness),
    };
  }
  createMediaStreamSource() {
    return { connect: () => {} };
  }
  close() {}
}

const tracks = { stop: vi.fn() };
let grant: () => Promise<unknown>;

function browser() {
  grant = async () => ({ getTracks: () => [tracks] });
  loudness = 128;
  Tape.live = null;
  // Each case decides for itself whether this browser has a voice of its own.
  delete (globalThis as Record<string, unknown>).speechSynthesis;
  delete (globalThis as Record<string, unknown>).SpeechSynthesisUtterance;
  Object.assign(globalThis, {
    SpeechRecognition: Fake,
    MediaRecorder: Tape,
    AudioContext: Sound,
    isSecureContext: true,
    Audio: class {
      paused = true;
      src = "";
      loaded = 0;
      onended: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor() {
        (globalThis as Record<string, unknown>).playing = this;
      }
      load() {
        this.loaded++;
      }
      async play() {
        /* plays until paused or ended */
        this.paused = false;
      }
      pause() {
        this.paused = true;
      }
      /** The sentence plays out to its last word. */
      end() {
        this.paused = true;
        this.onended?.();
      }
    },
  });
  Object.defineProperty(globalThis.navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia: () => grant() },
  });
  URL.createObjectURL = () => "blob:turn";
  URL.revokeObjectURL = () => undefined;
}

const playing = () =>
  (globalThis as Record<string, unknown>).playing as {
    paused: boolean;
    src: string;
    loaded: number;
    end(): void;
  };

/** Give this browser a voice of its own, and collect what it reads aloud. */
function synthesis(): string[] {
  const said: string[] = [];
  Object.assign(globalThis, {
    speechSynthesis: {
      speak: (line: { text: string; onend?: () => void }) => {
        said.push(line.text);
        line.onend?.();
      },
      cancel: () => {},
    },
    SpeechSynthesisUtterance: class {
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(public text: string) {}
    },
  });
  return said;
}

// ── the harness: a composer with a mic ──────────────────────────────────────

function Composer(props: VoiceOptions & { onReady?: (v: Machine) => void }) {
  const voice = api.useVoice(props);
  props.onReady?.(voice);
  return <api.Voice voice={voice} />;
}

async function mic() {
  await act(async () => {
    screen.getByRole("button").click();
  });
}

/** One spoken turn on the platform leg: a phrase, then the pause that ends it. */
async function turn() {
  await act(async () => {
    loudness = 200;
    vi.advanceTimersByTime(200);
    loudness = 128;
    vi.advanceTimersByTime(1_500);
    await Promise.resolve();
  });
}

describe("a spoken conversation", () => {
  beforeEach(async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    Fake.live = null;
    browser();
    vi.resetModules();
    api = await import("../src/index.js");
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("does not claim to be listening while the browser is still asking", async () => {
    let allow!: (stream: unknown) => void;
    grant = () => new Promise((resolve) => (allow = resolve));
    let voice!: Machine;
    render(<Composer onUtterance={() => {}} onReady={(v) => (voice = v)} />);

    await mic();
    // The user asked for it, so the control is pressed — but a permission
    // prompt is not a live microphone.
    expect(voice.open).toBe(true);
    expect(voice.state).toBe("idle");

    await act(async () => {
      allow({ getTracks: () => [tracks] });
    });
    expect(voice.state).toBe("listening");
  });

  it("streams the partial transcript into the composer while it is being heard", async () => {
    const onPartial = vi.fn();
    const onUtterance = vi.fn();
    render(<Composer onPartial={onPartial} onUtterance={onUtterance} />);

    await mic();
    act(() => Fake.live!.hear("book me a"));

    expect(onPartial).toHaveBeenLastCalledWith("book me a");
    // Nothing is sent until the speaker pauses.
    expect(onUtterance).not.toHaveBeenCalled();
  });

  it("sends one turn through the composer's submit path when the speaker pauses", async () => {
    const onUtterance = vi.fn();
    render(<Composer onUtterance={onUtterance} />);

    await mic();
    act(() => Fake.live!.hear("what is the weather", true));
    await act(async () => {
      vi.advanceTimersByTime(1_000);
    });

    expect(onUtterance).toHaveBeenCalledTimes(1);
    expect(onUtterance).toHaveBeenCalledWith("what is the weather");
    // The mic stays open — this is a conversation, not a keypress.
    expect(screen.getByRole("button").getAttribute("aria-pressed")).toBe("true");
  });

  it("submits exactly once when stopped mid-phrase, and never again after", async () => {
    const onUtterance = vi.fn();
    render(<Composer onUtterance={onUtterance} />);

    await mic();
    act(() => Fake.live!.hear("ship it", true));
    // Stop before the pause elapses: the phrase in hand goes now, on the stop —
    // not 900ms later, and not twice.
    await mic();
    expect(onUtterance).toHaveBeenCalledTimes(1);
    expect(onUtterance).toHaveBeenCalledWith("ship it");

    await act(async () => {
      vi.advanceTimersByTime(5_000);
    });
    expect(onUtterance).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button").getAttribute("aria-pressed")).toBe("false");
  });

  it("keeps the conversation across the remount that sending a turn causes", async () => {
    const onUtterance = vi.fn();
    // A chat surface swaps /c/new for /c/<id> on the first turn, which remounts
    // the composer. The user did not hang up.
    const view = render(<Composer onUtterance={onUtterance} />);
    await mic();
    expect(screen.getByRole("button").getAttribute("aria-pressed")).toBe("true");

    view.unmount();
    let voice!: Machine;
    render(<Composer onUtterance={onUtterance} onReady={(v) => (voice = v)} />);
    await act(async () => {
      await Promise.resolve();
    });

    expect(voice.open).toBe(true);
    expect(voice.state).toBe("listening");

    // And the reopened ear is a real one: the next turn still lands.
    act(() => Fake.live!.hear("carry on", true));
    await act(async () => {
      vi.advanceTimersByTime(1_000);
    });
    expect(onUtterance).toHaveBeenCalledWith("carry on");
  });

  it("stays closed on a fresh page — only a click opens the microphone", async () => {
    let voice!: Machine;
    render(<Composer onUtterance={() => {}} onReady={(v) => (voice = v)} />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(voice.open).toBe(false);
    expect(voice.state).toBe("idle");
  });


  it("is ONE conversation no matter how many composers draw a mic", async () => {
    // Two composers mounted at once — the exact shape behind "the voice will
    // not stop": the old machine gave each its own ear, and the visible button
    // only closed its own.
    let a!: Machine;
    let b!: Machine;
    render(
      <>
        <Composer onUtterance={() => {}} onReady={(v) => (a = v)} />
        <Composer onUtterance={() => {}} onReady={(v) => (b = v)} />
      </>,
    );

    const [first, second] = screen.getAllByRole("button");
    await act(async () => {
      first!.click();
    });
    expect(a.open).toBe(true);
    expect(b.open).toBe(true);
    const ear = Fake.live!;

    // Ending it from the OTHER mic ends the one conversation.
    await act(async () => {
      second!.click();
    });
    expect(a.open).toBe(false);
    expect(b.open).toBe(false);
    expect(ear.aborted).toBeGreaterThan(0);
  });

  
  it("hands the turns to the composer whose mic was pressed, not the one mounted last", async () => {
    const page = vi.fn();
    const footer = vi.fn();
    render(
      <>
        <Composer onUtterance={page} />
        <Composer onUtterance={footer} />
      </>,
    );

    const [mine] = screen.getAllByRole("button");
    await act(async () => {
      mine!.click();
    });
    act(() => Fake.live!.hear("into the page's field", true));
    await act(async () => {
      vi.advanceTimersByTime(1_000);
    });
    expect(page).toHaveBeenCalledWith("into the page's field");
    expect(footer).not.toHaveBeenCalled();
  });

  it("takes the microphone with it when the last composer leaves", async () => {
    // A mic with no surface to receive an utterance is an unstoppable mic.
    const view = render(<Composer onUtterance={() => {}} />);
    await mic();
    const ear = Fake.live!;

    await act(async () => {
      view.unmount();
    });
    expect(ear.aborted).toBeGreaterThan(0);
    expect(tracks.stop).toHaveBeenCalled();
  });

  it("drops the phrase in hand when the composer goes away", async () => {
    const onUtterance = vi.fn();
    const view = render(<Composer onUtterance={onUtterance} />);

    await mic();
    act(() => Fake.live!.hear("never mind", true));
    await act(async () => {
      view.unmount();
      vi.advanceTimersByTime(5_000);
    });

    expect(onUtterance).not.toHaveBeenCalled();
  });

  it("stops the reply and takes a new turn when spoken over", async () => {
    const speech: Speech = {
      transcribe: async () => "",
      speak: async () => new Blob(["audio"]),
    };
    let voice!: Machine;
    render(<Composer onUtterance={() => {}} speech={speech} onReady={(v) => (voice = v)} />);

    await mic();
    await act(async () => {
      void voice.say("Here is what I found.");
    });
    expect(voice.state).toBe("speaking");
    expect(playing().paused).toBe(false);

    await act(async () => {
      loudness = 200;
      vi.advanceTimersByTime(200);
    });

    expect(playing().paused).toBe(true);
    expect(voice.state).toBe("listening");
  });

  it("reads each sentence in the voice it names, and resolves when it has played", async () => {
    const speak = vi.fn(async () => new Blob(["audio"]));
    let voice!: Machine;
    render(
      <Composer
        onUtterance={() => {}}
        speech={{ transcribe: async () => "", speak }}
        onReady={(v) => (voice = v)}
      />,
    );

    await mic();
    let said!: Promise<boolean>;
    await act(async () => {
      said = voice.say("Feynman here.", "am_puck");
    });
    expect(speak).toHaveBeenLastCalledWith("Feynman here.", expect.objectContaining({ voice: "am_puck" }));
    expect(playing().src).toBe("blob:turn");
    expect(voice.state).toBe("speaking");

    let played: boolean | undefined;
    await act(async () => {
      playing().end();
      played = await said;
    });
    expect(played).toBe(true);
    expect(voice.state).toBe("listening");
  });

  it("tells a reply read in parts that it was spoken over, so the next part is not read", async () => {
    const speak = vi.fn(async () => new Blob(["audio"]));
    let voice!: Machine;
    render(
      <Composer
        onUtterance={() => {}}
        speech={{ transcribe: async () => "", speak }}
        onReady={(v) => (voice = v)}
      />,
    );

    await mic();
    let first!: Promise<boolean>;
    await act(async () => {
      first = voice.say("Feynman: one thing first.", "am_puck");
    });
    await act(async () => {
      loudness = 200;
      vi.advanceTimersByTime(200);
    });
    expect(await first).toBe(false);
    expect(voice.state).toBe("listening");

    // Outside a conversation nothing is read, and the caller is told so.
    await mic();
    expect(await voice.say("Einstein: and another.", "bm_george")).toBe(false);
    expect(speak).toHaveBeenCalledTimes(1);
  });

  it("finishes a sentence that is stopped, so whoever waits on it moves on", async () => {
    const speech: Speech = { transcribe: async () => "", speak: async () => new Blob(["audio"]) };
    const lips = api.mouth({ speech });
    let done = false;
    await act(async () => {
      void lips.say("A long answer.").then(() => (done = true));
    });
    expect(playing().paused).toBe(false);

    await act(async () => {
      lips.hush();
    });
    expect(playing().paused).toBe(true);
    expect(done).toBe(true);
  });

  it("loads its player when it is made — inside the click — not after the reply arrives", () => {
    // Safari plays only through an element touched inside a gesture; the reply
    // arrives after a round trip, long after the click that asked for it.
    api.mouth({ speech: { transcribe: async () => "", speak: async () => new Blob(["audio"]) } });
    expect(playing().loaded).toBe(1);
  });

  it("reads the reply in the browser's voice when the platform refuses, and says so", async () => {
    const said = synthesis();
    const speech: Speech = {
      transcribe: async () => "",
      // What a 401 from an unfunded or unrecognised caller looks like here.
      speak: vi.fn(async () => {
        throw new Error("Speech failed (401)");
      }),
    };
    const onRefusal = vi.fn();
    let voice!: Machine;
    render(
      <Composer
        onUtterance={() => {}}
        speech={speech}
        onRefusal={onRefusal}
        onReady={(v) => (voice = v)}
      />,
    );

    await mic();
    await act(async () => {
      await voice.say("The platform is out of credit.");
    });

    // Not mute, and not stuck mid-turn.
    expect(said).toEqual(["The platform is out of credit."]);
    expect(voice.state).toBe("listening");

    // And not silent about it: a browser standing in for a refused service
    // sounds exactly like a service that worked.
    expect(onRefusal).toHaveBeenCalledWith(
      expect.objectContaining({ service: "mouth", covered: true }),
    );
    expect(voice.refusal!.error.message).toMatch(/401/);
    expect(screen.getByRole("button").getAttribute("aria-label")).toMatch(
      /Hanzo speech is unavailable — this browser is standing in\./,
    );

    // A voice that refused is not asked again — the browser has the rest.
    await act(async () => {
      await voice.say("And the next sentence.");
    });
    expect(said).toHaveLength(2);
    expect(speech.speak).toHaveBeenCalledTimes(1);
    expect(onRefusal).toHaveBeenCalledTimes(1);
  });

  it("says the reply was lost when this browser has no voice to stand in", async () => {
    const speech: Speech = {
      transcribe: async () => "",
      speak: async () => {
        throw new Error("Speech failed (402)");
      },
    };
    const onRefusal = vi.fn();
    let voice!: Machine;
    render(
      <Composer
        onUtterance={() => {}}
        speech={speech}
        onRefusal={onRefusal}
        onReady={(v) => (voice = v)}
      />,
    );

    await mic();
    await act(async () => {
      await voice.say("Nobody will hear this.");
    });

    expect(onRefusal).toHaveBeenCalledWith(
      expect.objectContaining({ service: "mouth", covered: false }),
    );
    expect(screen.getByRole("button").getAttribute("aria-label")).toMatch(
      /Hanzo speech is unavailable\.$/,
    );
    expect(voice.state).toBe("listening");
  });

  it("keeps quiet outside a conversation — a typed turn is not read aloud", async () => {
    const speak = vi.fn(async () => new Blob(["audio"]));
    let voice!: Machine;
    render(
      <Composer
        onUtterance={() => {}}
        speech={{ transcribe: async () => "", speak }}
        onReady={(v) => (voice = v)}
      />,
    );

    await act(async () => {
      await voice.say("A typed answer.");
    });

    expect(speak).not.toHaveBeenCalled();
    expect(voice.state).toBe("idle");
  });

  it("degrades to the typed composer, with the reason, when the mic is refused", async () => {
    const onUtterance = vi.fn();
    grant = async () => {
      throw Object.assign(new Error("no"), { name: "NotAllowedError" });
    };
    let voice!: Machine;
    render(<Composer onUtterance={onUtterance} onReady={(v) => (voice = v)} />);

    await mic();

    expect(voice.blocked).toBe("denied");
    expect(voice.reason).toMatch(/Microphone access was blocked/);
    expect(voice.state).toBe("idle");
    expect(onUtterance).not.toHaveBeenCalled();

    // The button is still there, wearing the reason. Never a dead control.
    const button = screen.getByRole("button");
    expect(button).toHaveProperty("disabled", true);
    expect(button.getAttribute("aria-label")).toMatch(/Microphone access was blocked/);
  });

  it("says so when there is no microphone at all", async () => {
    grant = async () => {
      throw Object.assign(new Error("none"), { name: "NotFoundError" });
    };
    let voice!: Machine;
    render(<Composer onUtterance={() => {}} onReady={(v) => (voice = v)} />);

    await mic();

    expect(voice.blocked).toBe("absent");
    expect(voice.reason).toMatch(/No microphone found/);
  });

  // ── which ear ─────────────────────────────────────────────────────────────
  // Every browser in this block HAS a recogniser — it is the Chrome/Edge/Safari
  // case, which is almost everybody. Whether Hanzo's own transcriber is ever
  // reached is decided here and nowhere else.

  it("transcribes through the platform even where the browser has a recogniser", async () => {
    const transcribe = vi.fn(async () => "book me a table");
    const speech: Speech = { transcribe };
    const onUtterance = vi.fn();
    const onLevel = vi.fn();
    render(<Composer speech={speech} onUtterance={onUtterance} onLevel={onLevel} />);

    await mic();
    await turn();

    expect(transcribe).toHaveBeenCalledTimes(1);
    expect(onUtterance).toHaveBeenCalledWith("book me a table");
    // The browser's recogniser was never even built.
    expect(Fake.live).toBeNull();
    // And the waveform still moves, which is the only thing the recorder leg
    // used not to report.
    expect(onLevel.mock.calls.some(([value]) => (value as number) > 0)).toBe(true);
  });

  it("never sends a recording nobody spoke in — not the tail a closing mic flushes", async () => {
    const transcribe = vi.fn(async () => "Thank you.");
    const onUtterance = vi.fn();
    render(<Composer speech={{ transcribe }} onUtterance={onUtterance} />);

    await mic();
    await turn();
    expect(transcribe).toHaveBeenCalledTimes(1);

    // Silence after the turn, then the mic is closed: the flushed tail is not a turn.
    await act(async () => {
      vi.advanceTimersByTime(3_000);
    });
    await mic();
    expect(transcribe).toHaveBeenCalledTimes(1);
    expect(onUtterance).toHaveBeenCalledTimes(1);
  });

  it("starts a silent recording over, so a late turn is not sent behind minutes of silence", async () => {
    const transcribe = vi.fn(async () => "finally");
    const onUtterance = vi.fn();
    render(<Composer speech={{ transcribe }} onUtterance={onUtterance} />);

    await mic();
    const first = Tape.live;
    await act(async () => {
      vi.advanceTimersByTime(11_000);
    });
    // The quiet recording was dropped and a fresh one is running.
    expect(Tape.live).not.toBe(first);
    expect(Tape.live!.state).toBe("recording");
    expect(transcribe).not.toHaveBeenCalled();

    await turn();
    expect(transcribe).toHaveBeenCalledTimes(1);
    expect(onUtterance).toHaveBeenCalledWith("finally");
  });

  it("sends a recording at the longest it runs while somebody keeps talking, and keeps listening", async () => {
    const transcribe = vi.fn(async () => "a long thought");
    render(<Composer speech={{ transcribe }} onUtterance={() => {}} />);

    await mic();
    const first = Tape.live;
    await act(async () => {
      loudness = 200;
      vi.advanceTimersByTime(56_000);
      await Promise.resolve();
    });
    // Never a pause, and still one upload under the minute the visitor's lane takes.
    expect(transcribe).toHaveBeenCalledTimes(1);
    expect(Tape.live).not.toBe(first);
    expect(Tape.live!.state).toBe("recording");
    loudness = 128;
  });

  it("names a spent free day, and lets the browser carry on", async () => {
    const transcribe = vi.fn(async () => {
      throw new api.SpeechError("Transcription failed (429)", 429, "public_allowance_spent");
    });
    const onUtterance = vi.fn();
    render(<Composer speech={{ transcribe }} onUtterance={onUtterance} />);

    await mic();
    await turn();

    expect(screen.getByRole("button").getAttribute("aria-label")).toMatch(
      /Today's free Hanzo dictation is used — this browser is standing in\./,
    );
    act(() => Fake.live!.hear("still heard", true));
    await act(async () => {
      vi.advanceTimersByTime(1_000);
    });
    expect(onUtterance).toHaveBeenCalledWith("still heard");
  });

  it("listens with the browser's recogniser when the caller asks for it by name", async () => {
    const transcribe = vi.fn(async () => "never asked");
    const speech: Speech = { transcribe };
    const onUtterance = vi.fn();
    render(<Composer speech={speech} prefer="browser" onUtterance={onUtterance} />);

    await mic();
    act(() => Fake.live!.hear("type this", true));
    await act(async () => {
      vi.advanceTimersByTime(1_000);
    });

    expect(onUtterance).toHaveBeenCalledWith("type this");
    expect(transcribe).not.toHaveBeenCalled();
  });

  it("listens with the browser's recogniser when no platform is configured", async () => {
    const onUtterance = vi.fn();
    render(<Composer onUtterance={onUtterance} />);

    await mic();
    act(() => Fake.live!.hear("offline", true));
    await act(async () => {
      vi.advanceTimersByTime(1_000);
    });

    expect(onUtterance).toHaveBeenCalledWith("offline");
    expect(Tape.live).toBeNull();
  });

  it("hands the conversation to the browser, and says so, when the platform refuses", async () => {
    const transcribe = vi.fn(async () => {
      throw new Error("Transcription failed (401)");
    });
    const speech: Speech = { transcribe };
    const onRefusal = vi.fn();
    const onUtterance = vi.fn();
    let voice!: Machine;
    render(
      <Composer
        speech={speech}
        onUtterance={onUtterance}
        onRefusal={onRefusal}
        onReady={(v) => (voice = v)}
      />,
    );

    await mic();
    await turn();

    expect(onRefusal).toHaveBeenCalledWith(
      expect.objectContaining({ service: "ear", covered: true }),
    );
    expect(voice.refusal!.error.message).toMatch(/401/);
    expect(screen.getByRole("button").getAttribute("aria-label")).toMatch(
      /Hanzo speech is unavailable/,
    );

    // A refused transcriber is not asked again, not even with the phrase left
    // in hand when its leg closes.
    expect(transcribe).toHaveBeenCalledTimes(1);

    // The conversation carries on in the browser's ear rather than going deaf.
    act(() => Fake.live!.hear("carry on", true));
    await act(async () => {
      vi.advanceTimersByTime(1_000);
    });
    expect(onUtterance).toHaveBeenCalledWith("carry on");
  });

  it("says voice is over when the platform refuses and nothing can stand in", async () => {
    // Firefox: a recorder and no recogniser. Nothing behind the platform ear.
    delete (globalThis as Record<string, unknown>).SpeechRecognition;
    const speech: Speech = {
      transcribe: async () => {
        throw new Error("Transcription failed (401)");
      },
    };
    const onRefusal = vi.fn();
    render(<Composer speech={speech} onUtterance={() => {}} onRefusal={onRefusal} />);

    await mic();
    await turn();

    expect(onRefusal).toHaveBeenCalledWith(
      expect.objectContaining({ service: "ear", covered: false }),
    );
  });
});
