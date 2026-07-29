/**
 * @hanzo/ui/chat — the one chat shell, on @hanzo/gui primitives.
 *
 * Shell only: Thread scrolls, Message presents a turn, Composer takes a draft.
 * Content rendering (markdown, tool calls, citations) stays with the surface —
 * they disagree on the pipeline, and none of it is presentational.
 *
 * The model picker is not here: it already ships at `@hanzo/ui/models`, and it
 * is not chat-specific.
 */
export { Composer, type ComposerProps } from './Composer'
export { Message, type MessageProps, type Role } from './Message'
export { Thread, type ThreadProps } from './Thread'
export { ready, sends, type Mods } from './send'
export { pinned, SLACK, type Track } from './stick'
