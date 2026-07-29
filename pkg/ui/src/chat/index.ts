/**
 * @hanzo/ui/chat — the one chat shell, on @hanzo/gui primitives.
 *
 * Shell only: Thread scrolls, Message presents a turn, Composer takes a draft,
 * Sidebar navigates between conversations, Header names the current one, Code
 * and Sources present the two pieces of a turn every surface renders the same
 * way. Content rendering (markdown, tool calls) stays with the surface — they
 * disagree on the pipeline, and none of it is presentational.
 *
 * Everything is props-in, callbacks-out: no transport, no store, no routing, no
 * active-id resolution. The same components serve a live conversation, a shared
 * read-only transcript and a test fixture.
 *
 * Styling is `$` tokens throughout, never literal colours, so each brand retunes
 * through its own theme and nothing here carries a Hanzo mark — which is what
 * lets the same shell ship on Lux and Zoo surfaces without leaking a brand.
 *
 * The model picker is not here: it already ships at `@hanzo/ui/models`, and it
 * is not chat-specific.
 */
export { Composer, ASK, type ComposerProps } from './Composer'
export { Message, type MessageProps, type Role } from './Message'
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

export { Code, CopyButton, type CodeProps, type CopyButtonProps } from './Code'

export {
  Sources,
  SourceChip,
  type Source,
  type SourcesProps,
  type SourceChipProps,
} from './Sources'
