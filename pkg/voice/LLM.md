# @hanzo/voice

One spoken conversation, shared by every Hanzo composer. See `README.md` for the
API; this file carries only what the source cannot say for itself.

- `src/voice.ts` is the machine, `src/control.tsx` is the button. The caller owns
  the machine because it needs `say()`; the button only draws it. There is no
  second copy of this state anywhere.
- `onUtterance` MUST be wired to the surface's existing submit path, or the
  composer dictates through `useDictation` (`src/dictation.ts`) and the person
  sends. Voice is a way of typing, not a second way of sending. Dictation that
  sets the field to each utterance loses every sentence but the last.
- Listening has two legs (`src/listen.ts`). `listen()` ranks them and opens the
  first that exists: the platform's (record + `/v1/audio/transcriptions`) unless
  the caller passes `prefer: "browser"`. Until 0.1.6 the rank was
  `cap.recognition ? recogniser : recorder`, which meant Chrome, Edge and Safari
  — almost everybody — never reached Hanzo's transcriber no matter how the
  surface was configured. `prefer` is a property of the caller's configuration,
  not an env flag; there is exactly one place the choice is made.
- The platform legs give up on first refusal and the browser takes over from
  that moment (`gone` in `src/listen.ts` and `src/speak.ts`): every later turn
  would refuse identically, one round trip at a time. `listen()` decides whether
  a standby exists and publishes `Refusal.covered`; the legs only report the
  transport error upward.
- A refusal is REPORTED — `onRefusal`, `voice.refusal`, the button's label and
  `data-refusal`. Silently standing in is the failure shape this package is most
  exposed to: a browser voice reading a reply sounds exactly like a funded key,
  and the only other symptom is a bill that reads zero.
- Both legs hold an echo-cancelled `getUserMedia` stream while open. That is the
  only thing keeping barge-in from firing on the reply's own audio.
- `live` in `src/voice.ts` is module state ON PURPOSE: an open microphone is a
  fact about the page, and a composer remount (the `/c/new` -> `/c/<id>` swap a
  chat surface performs on its FIRST turn) must not end the conversation.
  Measured on hanzo.chat: that navigation replaces the composer's DOM node and
  aborts the recogniser. Tests therefore `vi.resetModules()` per case — a fresh
  module is a fresh page.
- The platform mouth keeps the browser mouth BEHIND it (`src/speak.ts`): a
  refused or unfunded speech service degrades the VOICE, never the conversation.
  Measured 2026-07-26: api.hanzo.ai/v1/audio/* resolves its caller through IAM —
  an hk- accessKey passes (402 on balance), an sk- gateway key and a hanzo.id
  `aud: hanzo-app` bearer are both 401. hanzo.app's proxy is wired and correct;
  it upgrades to the platform voice the day the gateway accepts that audience.
- `speech()` defaults name Hanzo's own models: `zen-scribe` listens,
  `zen-voice-mini` reads, in `af_heart`. Voices are the service's own ids, and
  our clients send those ids, never the OpenAI names the server aliases.
- The recorder leg sends a recording only if somebody spoke in it, and starts a
  silent one over after `LEAD`. A transcriber handed silence returns invented
  words ("Thank you."), and a closing mic always flushes a tail.
- The platform mouth makes and `load()`s its one `<audio>` when `mouth()` is
  called. `useVoice` calls it inside the mic click; a surface reading a reply
  on a click calls it inside that click. Safari refuses sound from an element
  first touched after the gesture, and a refused `play()` is otherwise silent.
- Consumers: `hanzoai/chat` (`client/src/components/Chat/Input/Mic.tsx`) and
  `hanzoai/app` (`components/editor/ask-ai/mic.ts` + the console bar and the
  landing composer). All four local mics were deleted on adoption.
- Published from `hanzoai/ui` (`pkg/voice`) by the monorepo's publish lane, which
  reads `NPM_TOKEN` from KMS like every other `@hanzo/*` package here. Bump the
  patch in `package.json` and push `main`; nothing is published by hand.
- **Talk mode is `useTalk`, on `/v1/voice`** (`src/talk.ts`): the OpenAI realtime
  wire served by the ai plane. The bearer goes on `POST /v1/voice/session` and
  the socket URL carries only the one-use ticket it answers; the socket speaks
  subprotocol `realtime`. Mic up as 16 kHz pcm16 in 100 ms `input_audio_buffer
  .append` messages, reply down as 24 kHz pcm16 `response.audio.delta` with
  `response.audio_transcript.delta` beside it. Turn-taking is the SERVER's:
  `input_audio_buffer.speech_started` is the barge-in, and the client only stops
  playback on it. An `error` event is one turn's, not the conversation's; a
  socket the server closes is a refusal.
- **The live transcript is `useTranscript`, on `/v1/audio/transcript`**
  (`src/transcript.ts`, `speech().stream`): POST opens, POST to the id carries
  raw pcm16, DELETE settles. The endpoint admits ONE push at a time, so audio
  heard during a push queues and rides the next (up to `max_bytes`). A
  transcript takes `max_seconds` of audio; at five seconds short it is closed
  and the next opened, and what it settled stays in front. `settled` is text
  that will not change; `partial` is everything, tail included.
- A failed push is not a refusal (`backoff` in `src/transcript.ts`). A 429 (one
  that names no spent allowance), a 5xx or a dropped connection is a wait: the
  same push goes again after `Retry-After` (`SpeechError.retry`, ms) or a
  doubling backoff, while new audio queues behind it, so nothing is dropped or
  reordered. 402, 403 and every other 4xx refuse at once; so does a failure
  streak, or a queue, older than `RETRY_WINDOW` (60 s, the gateway's rate
  window). Closing delivers the queue before the DELETE.
- A 429 the client gives up on is worded as a limit, never an outage:
  `refused()` reads "Today's Hanzo dictation limit is reached. It resets at
  <time>", the time from `Retry-After` (or the seconds the message names, since
  the header is only readable cross-origin where the edge exposes it), counted
  from `SpeechError.at`. A surface draws `refused(refusal)`, never a fixed
  `REFUSED` string, or a limit reads as "unavailable".
- The streaming legs make their AudioContext (`audioContext`) at the top of
  `open()`, before the first await, so it is made inside the click: Safari runs
  only a context made or resumed in a gesture, and one made after the permission
  prompt taps and plays nothing.
- `src/mic.ts` is the one microphone: `capture` (the permission ask), `tap`
  (an inlined AudioWorklet averaging the context rate down to 16 kHz pcm16 — the
  average is the low-pass a plain decimation lacks) and the base64 codec. The
  tap feeds a zero gain into the destination because an unpulled node is not
  processed.
- `<Voice/>` draws any machine with `state/open/level/blocked/reason/refusal/
  toggle` (`Machine` in `src/control.tsx`), and `says` relabels it, so a
  dictation mic, a talk button and a transcript toggle are one control.
- **The visitor's lane is `speech({ public: true })`**: `transcribe` alone, POSTed
  to `/v1/audio/transcriptions/public` with no credential (`credentials: "omit"`,
  no Authorization or X-Org-Id even when a token is given). The ai plane holds it to
  60 s of audio and a day per visitor; the recorder leg sends a recording at
  `LONGEST` (55 s) even mid-sentence, so no upload passes the minute. A spent day
  is `SpeechError` code `public_allowance_spent`, and `refused()` names it (`SPENT`)
  instead of the generic `REFUSED` note.
- The mic that is pressed takes the conversation (`toggle` makes its composer the owner): a page composer and the shell footer bar mount together, and the words go where the click was, not to whichever mounted last.
