# @hanzo/voice

Bidirectional voice for a composer. One machine, one button, shared by
hanzo.chat and hanzo.app.

Click the mic and the microphone stays open: the transcript streams into the
composer as it is heard, each pause sends a turn through the composer's own
submit path, and the reply is read back aloud. Speak over the reply and it stops
so you can take the next turn. Click again to end the conversation.

```bash
npm i @hanzo/voice
```

## Use

The caller keeps the machine — it needs `say` to read the reply — and the button
only draws it.

```tsx
import { Voice, useVoice, speech } from "@hanzo/voice";

const platform = speech({ token: () => iam.getValidAccessToken() });

function Composer() {
  const [text, setText] = useState("");
  const voice = useVoice({
    speech: platform,
    onPartial: setText,                 // heard so far — show it
    onUtterance: (said) => submit(said), // the EXISTING submit path
  });

  // Read the reply back, but only inside a conversation.
  useEffect(() => { if (done) void voice.say(reply); }, [done]);

  return (
    <form onSubmit={...}>
      <textarea value={text} onChange={...} />
      <Voice voice={voice} className="my-composer-icon" />
    </form>
  );
}
```

`onUtterance` is deliberately the composer's existing submit. Voice is a way of
typing, never a second way of sending.

A composer that should only DICTATE — the person reads it back and sends —
spreads `useDictation` instead. Each utterance lands after what the field held,
so a pause never replaces the sentence before it:

```tsx
const voice = useVoice({ speech: platform, ...useDictation(text, setText) });
```

A conversation belongs to the page, not to the component drawing it. Sending the
first turn is exactly what makes a chat surface swap `/c/new` for `/c/<id>`,
remounting the composer — so the machine picks the microphone back up on the
other side. Only a click ends a conversation. A fresh page load always starts
closed.

## What it uses

The platform's own speech services — `POST /v1/audio/transcriptions` and
`POST /v1/audio/speech` on the Hanzo gateway, both OpenAI-compatible and metered.
`speech()` builds that transport; a surface that fronts those paths with its own
proxy passes its own `baseUrl` and nothing else changes.

Hanzo's own transcriber listens wherever it is configured and the browser can
record for it — every browser, not only the ones missing a recogniser. The
browser's own recogniser is the standby:

| | Listens with | Live partials |
| --- | --- | --- |
| `speech` supplied (the default) | Hanzo's `/v1/audio/transcriptions` | the phrase arrives whole |
| no `speech`, or `prefer: "browser"` | the built-in recogniser | yes, word by word |
| Hanzo's transcriber refused | the built-in recogniser, from that moment | yes, word by word |

Replies are read by the Hanzo voice when `speech.speak` is supplied, and by the
browser's own voice when it is not — and "is not" includes "refused".

Both legs hold an echo-cancelled capture stream for as long as they are open.
Without it the microphone hears the reply coming out of the speakers and
interrupts itself on every turn.

## When it refuses

A refused service is never swallowed. A 401, an empty balance or a timeout puts
the browser behind the microphone or behind the reply, and puts a `refusal` on
the machine at the same moment:

```ts
voice.refusal // { service: "ear" | "mouth", error, covered } | null
```

`covered` is whether the browser could stand in. `<Voice/>` wears the sentence
in its label and marks itself `data-refusal`; a surface drawing its own button
reads `voice.refusal` or takes `onRefusal`. Standing in quietly would make a
dead key sound exactly like a live one, and nobody goes looking for a bill that
reads zero.

## When it can't

`voice.blocked` is one of `insecure`, `unsupported`, `denied`, `absent`, and
`voice.reason` is a sentence a person can act on. The button stays put, disabled,
wearing that reason — the composer still types. A control that quietly
disappears teaches the user nothing.

## Talk mode

A hands-free conversation on Hanzo's realtime socket, `/v1/voice`: the
microphone streams up, the reply streams back as audio with its words beside
it, and talking over the reply stops it. The server decides when a turn ends.

```tsx
import { Voice, useTalk } from "@hanzo/voice";

const talk = useTalk({ token: () => iam.getValidAccessToken(), onDone: (reply) => log(reply) });
<Voice voice={talk} says={{ idle: "Start a conversation" }} />;
// talk.reply — the words being spoken
```

## Live transcript

Text that grows as people speak, on `/v1/audio/transcript`. `onSettled` gets
each piece once it will not change; `onPartial` gets everything, tail included.

```tsx
import { Voice, speech, useTranscript } from "@hanzo/voice";

const live = useTranscript({ speech: speech({ token }), onSettled: (text) => note(text), onPartial: setCaption });
<Voice voice={live} says={{ idle: "Transcribe", listening: "Transcribing — click to stop" }} />;
```

## API

- `useVoice({ onUtterance, onPartial?, onLevel?, speech?, prefer?, onRefusal?, voice?, language?, pause? })`
  → the machine: `state` (`idle` | `listening` | `speaking`), `open`, `blocked`,
  `reason`, `refusal`, `toggle()`, `say(text, voice?)` (resolves `true` when the
  sentence played out, `false` when it was spoken over or hushed), `hush()`. `open` is the user's
  intent, true from the click; `state` is what is actually happening, and it does
  not say `listening` until the microphone really is. The button reads
  `aria-pressed` off the first and `data-state` off the second.
- `useDictation(value, setValue)` → `{ onPartial, onUtterance }` that append
  each utterance to a controlled field; `dictation(read, write)` is the same for
  a field React does not hold.
- `<Voice voice={...} className? disabled? children? says? />` — the button, for
  any of the three machines. Unstyled by design; supply the chrome.
- `useTalk({ token?, baseUrl?, org?, onReply?, onDone?, onError? })` → talk mode:
  the machine plus `reply`.
- `useTranscript({ speech, language?, onPartial?, onSettled? })` → a live
  transcript machine.
- `speech({ baseUrl?, token?, ear?, voice?, fetch? })` — the platform transport.
  `ear` defaults to `zen-scribe`; `voice` to `{ model: "zen-voice-mini", name:
  "af_heart", format: "mp3" }`. Voice names are the speech service's own ids
  (`af_heart`, `am_michael`, `bf_emma`, `bm_george`, …); `say(text, voice)`
  names one for a single sentence.
- `listen`, `mouth`, `capability`, `blocker` — the pieces, if you want them.

Apache-2.0 · [hanzo.ai](https://hanzo.ai)
