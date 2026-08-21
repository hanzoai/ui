/**
 * @hanzo/ui/chat — the one chat shell, on @hanzo/gui primitives.
 *
 * Thread scrolls, Message presents a turn, Composer takes a draft, Sidebar
 * navigates between conversations, Header names the current one, and Code,
 * Step, Failure and Sources present the pieces of a turn.
 *
 * The markdown pipeline is the surface's and arrives as `children`: the three
 * surfaces run nine plugins, one plugin, and a regex under a bundle ceiling
 * that cannot afford a parser. There is no `renderPart` prop for the same
 * reason — the part union is per-surface too, so a callback here would take a
 * Part type matching nobody's.
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
