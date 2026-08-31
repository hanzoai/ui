'use client'

/**
 * Persona — a face on the canvas, and what it is doing.
 *
 * A persona is not a new engine. It is a MAPPING: an emotion names a clip, the
 * clip goes to `Backdrop`'s `clips` mode, and that mode's preloaded crossfade
 * does the switching it already does — one live frame over another, never a
 * flash of black. So a mood change is a prop change, and there is exactly one
 * piece of machinery playing video in this package rather than two.
 *
 * The mapping is the whole component, and it is deliberately thin. What an
 * emotion MEANS — when a persona is listening, when it is thinking — belongs to
 * whatever is driving the conversation; a component that guessed would be
 * guessing from the one place with the least information.
 *
 * `idle` is required and every other emotion is optional, so a persona with one
 * clip is a legal persona and adding a mood is adding a file. `clip` is pure and
 * exported, which is what lets a surface preload the next mood, or test the
 * mapping, without mounting anything.
 */
import { Backdrop, type BackdropProps } from '../backdrop/Backdrop'

/** What a persona is doing. The set a conversation can actually report. */
export type Emotion =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'happy'
  | 'sad'
  | 'surprised'

/** Which clip plays for each emotion. `idle` is required: it is what plays when
 *  a persona has nothing for the emotion at hand, so there is always something
 *  on the canvas and never a gap to design around. */
export type Scenes = { idle: string } & Partial<Record<Emotion, string>>

/** The clip for this emotion, falling back to idle. */
export const clip = (scenes: Scenes, emotion: Emotion): string => scenes[emotion] ?? scenes.idle

export interface PersonaProps extends Omit<BackdropProps, 'mode' | 'clips'> {
  scenes: Scenes
  /** What the persona is doing right now. Defaults to idle. */
  emotion?: Emotion
}

export function Persona({ scenes, emotion = 'idle', ...props }: PersonaProps) {
  // One clip, so it loops itself rather than ending and handing over — a mood
  // holds until something changes it, which is what a mood is.
  return <Backdrop {...props} mode="clips" clips={[clip(scenes, emotion)]} />
}
