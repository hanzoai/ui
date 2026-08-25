// @hanzo/ui/chat/pure — the conversation's decisions, with nothing attached.
//
// No @hanzo/gui, no React, no DOM, no side effects, so these load in Node, in a
// spec, and in a server component. `@hanzo/ui/chat` cannot: it is TSX behind a
// client directive.
//
//   import { sends, ready, pinned, SLACK, words } from '@hanzo/ui/chat/pure'
//
// `@hanzo/ui/product/pure` re-exports all four, because none of them is a chat
// rule and that is the entry point a non-chat surface imports them from.

// Enter, and whether a draft may go. Read `sends` before writing another one:
// the IME guard is the point.
export { ready, sends, type Mods } from './send'

// Stay-at-the-bottom, as a distance test.
export { pinned, SLACK, type Track } from './stick'

// The text of a turn whose content may be a string or the wire's parts.
export { words, type Part, type Said } from './words'
