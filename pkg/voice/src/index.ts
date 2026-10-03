// @hanzo/voice — one spoken conversation, shared by every Hanzo composer.
//
// A machine (`useVoice`) and the button that draws it (`<Voice/>`). The machine
// owns the microphone, the turn-taking and the reply; the surface owns the
// chrome and the submit path. Nothing here knows what a chat message is.

export { useVoice } from "./voice.js";
export type { Voice as VoiceMachine, VoiceOptions } from "./voice.js";

export { dictation, useDictation } from "./dictation.js";

export { Voice } from "./control.js";
export type { Machine, VoiceProps } from "./control.js";

export { talk, useTalk } from "./talk.js";
export type { Talk, TalkConfig, Talked, TalkMachine, TalkOptions } from "./talk.js";

export { transcript, useTranscript } from "./transcript.js";
export type { Live, Transcribed, TranscriptMachine, TranscriptOptions } from "./transcript.js";

export { speech, SpeechError } from "./transport.js";
export type { SpeechConfig } from "./transport.js";

export { capability, blocker, streamBlocker } from "./capability.js";
export type { Capability } from "./capability.js";

export { listen } from "./listen.js";
export type { ListenOptions } from "./listen.js";

export { mouth } from "./speak.js";
export type { MouthOptions } from "./speak.js";

export { REASON, REFUSED, SPENT, refused } from "./types.js";
export type { State, Blocker, Side, Refusal, Speech, Ear, Mouth, Heard, Said, Stream } from "./types.js";
