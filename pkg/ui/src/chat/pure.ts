// @hanzo/ui/chat/pure — the conversation's decisions, without the conversation.
//
// Every module here is a function over values: no @hanzo/gui, no React, no DOM,
// no side effects. Same shape and same reason as `@hanzo/ui/product/pure`, and
// the reason is measured — `import('@hanzo/ui/chat')` in Node dies on
// `SyntaxError: Unexpected token 'typeof'`, so a script, a Playwright spec or a
// server-side caller could not reach these at all. They had to stand up a
// browser to ask whether Enter sends.
//
//   import { sends, ready, pinned, SLACK } from '@hanzo/ui/chat/pure'
//
// These are not chat rules and the chat-shaped import was hiding that. Of the
// fifteen files in hanzo.app that import `sends`, TEN are not chat: a repo-URL
// field, two project renames, the SQL editor, the file explorer, the SEO tab,
// the workspace menu, the console prompt, an uploader and the command palette.
// "Does this keystroke commit this field" is the same question wherever a field
// takes Enter. `@hanzo/ui/product/pure` re-exports all four for exactly that
// reader — the one who is not writing chat and would never look here.
//
// It is the same mistake `CopyButton` made, recorded in this module's own
// barrel: a general thing reachable only through a chat-shaped door gets
// rewritten by everyone who does not think to open that door. hanzo/chat had
// THREE Enter rules, and two of them (`AnswerComposer`, `SelectionAsk`) tested
// `Enter && !shiftKey` straight off the event — so Enter-to-accept an IME
// candidate submitted a half-typed word for Japanese, Chinese and Korean
// writers. `sends` had the fix from the day it was written and nobody could
// reach it.

// Enter, and whether a draft may go. The IME guard is the whole point; read
// `sends` before writing another one.
export { ready, sends, type Mods } from './send'

// Stay-at-the-bottom, as a distance test. The fleet's one answer to "am I at
// the bottom", which had five: 50px twice, 97%-of-height, an
// IntersectionObserver at a 0.85 ratio, and on one thread nothing at all.
export { pinned, SLACK, type Track } from './stick'
