/**
 * @hanzo/ui/chat — the one chat shell, on @hanzo/gui primitives.
 *
 * Thread scrolls, Message presents a turn, Composer takes a draft, Sidebar
 * navigates between conversations, Header names the current one, and Code,
 * Step, Failure and Sources present the pieces of a turn.
 *
 * The markdown pipeline is the surface's and arrives as `children`: the three
 * surfaces run nine plugins, one plugin, and a regex under a bundle ceiling
 * that cannot afford a parser.
 *
 * THE PART UNION IS NOT PER-SURFACE, and this file used to say it was — which is
 * why it refused a `renderPart` callback and why every surface then wrote the
 * same switch. There is one canonical set (`MessagePart`), it is CLOSED, and
 * `Parts` is the dispatcher over it: no callback to hand in, because each arm
 * already resolves to a piece that ships here. `words`'s `Part` stays open
 * beside it — that one reads the wire, and the wire is not ours to close.
 *
 * Everything else about a turn is presentational and lives here: the code
 * frame, the step disclosure, the failure, the streaming caret.
 *
 * Props-in, callbacks-out — no transport, no store, no routing. Each component
 * spreads its residual props, and the three that own an inner part publish a
 * way through to it (`Message body`, `Thread column`, `Composer field`).
 *
 * `@hanzo/ui/chat/pure` carries `sends`, `ready`, `pinned` and `SLACK` with no
 * imports, for Node and for callers that are not chat.
 *
 * Styling is `$` tokens throughout, never literal colours, so a brand retunes
 * through its own theme and nothing here carries a mark.
 *
 * The model picker and `CopyButton` are not here — neither is chat-specific, so
 * they ship at `@hanzo/ui/models` and `@hanzo/ui/product`. Nobody hunting for a
 * copy button looks in a chat module.
 */
export { Chat, type ChatProps, type Turn } from './Chat'
export { words, type Part, type Said } from './words'
export {
  Parts,
  Piece,
  join,
  type MessagePart,
  type PartActions,
  type PartsProps,
  type PieceProps,
} from './Parts'
export { Composer, ASK, type ComposerProps } from './Composer'
export { Caret, Message, type MessageProps, type Role } from './Message'
export { Thread, type ThreadProps } from './Thread'
export { ready, sends, type Mods } from './send'
export { pinned, SLACK, type Track } from './stick'

export {
  Sidebar,
  SidebarHeader,
  SidebarIconButton,
  SidebarNewChat,
  SidebarScroll,
  SidebarSection,
  SidebarItem,
  SidebarFolder,
  SidebarUser,
  type SidebarProps,
  type SidebarHeaderProps,
  type SidebarIconButtonProps,
  type SidebarNewChatProps,
  type SidebarSectionProps,
  type SidebarItemProps,
  type SidebarFolderProps,
  type SidebarUserProps,
} from './Sidebar'

export {
  Header,
  HeaderButton,
  ShareButton,
  AsideToggle,
  Aside,
  type HeaderProps,
  type HeaderButtonProps,
  type ShareButtonProps,
  type AsideToggleProps,
  type AsideProps,
} from './Header'

export { Code, type CodeProps } from './Code'
export { Step, type StepProps, type Ran } from './Step'
export { Failure, type FailureProps } from './Failure'

export {
  Sources,
  SourceCard,
  type Source,
  type SourcesProps,
  type SourceCardProps,
} from './Sources'

/**
 * The canvas behind the conversation, and the persona on it.
 *
 * `Backdrop` lives at `@hanzo/ui/backdrop` — it is web-only and nothing about it
 * is chat-specific — and is re-exported here because a chat surface is what
 * mounts one. `Persona` is chat's own: an emotion picks a clip, and the
 * backdrop's crossfade plays it.
 */
export * from '../backdrop'
export { Persona, clip, type Emotion, type PersonaProps, type Scenes } from './Persona'
