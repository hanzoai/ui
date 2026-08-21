/**
 * @hanzo/ui/chat — the one chat shell, on @hanzo/gui primitives.
 *
 * Shell only: Thread scrolls, Message presents a turn, Composer takes a draft,
 * Sidebar navigates between conversations, Header names the current one, and
 * Code, Step, Failure and Sources present the pieces of a turn every surface
 * renders the same way.
 *
 * This file used to end that sentence with "Content rendering (markdown, tool
 * calls) stays with the surface — they disagree on the pipeline, and none of it
 * is presentational." Half of that was right and the half that was wrong cost
 * nine hand-drawn copies. Re-decided by reading what the three surfaces
 * actually render:
 *
 *   MARKDOWN STAYS OUT, and not as a preference. hanzo/chat runs seven remark
 *   plugins and two rehype plugins (`Content/Markdown.tsx:42-65`, including
 *   katex and highlight.js over a 35-language subset); hanzo.app runs
 *   remark-gfm and nothing else (`markdown-renderer/index.tsx:107`); the
 *   extension parses markdown with eighty lines of regex and no dependency at
 *   all (`answer/markdown.ts`) because `newtab.js` measures 485.9 KB against a
 *   500 KB ceiling that fails the build (`scripts/check-bundle-budgets.mjs:29`)
 *   and its MV3 policy is `script-src 'self'`. Fourteen kilobytes of headroom
 *   is not a pipeline disagreement to be reconciled; it is a surface that
 *   cannot afford a parser. So the pipeline is the surface's, and `children` is
 *   how it arrives — which is also why there is no `renderPart` prop: the part
 *   UNION is per-surface too (twelve item types in the app's
 *   `chat-panel/index.tsx` `TurnDisplay`, eight in chat's `Content/Part.tsx`,
 *   none in the extension), so a callback here would need a Part type that
 *   matches nobody's. The surface maps its own parts and passes nodes.
 *
 *   THE REST OF IT WAS ALWAYS PRESENTATIONAL. A code block with a language
 *   label and a copy control, a collapsible step with a state mark, a failure
 *   with a retry, a streaming caret — every surface draws these and no two draw
 *   them alike. `Step` alone replaces nine copies across two repos. What is
 *   inside each of them is still `children`; the frame, the header, the mark
 *   and the disclosure are here.
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
 *
 * `CopyButton` is not here either, for the same reason and after the same
 * mistake: it lived in `Code.tsx`, so the only way to reach it was
 * `@hanzo/ui/chat`, and no one hunting for a copy button looks in a chat module.
 * Six surfaces wrote their own instead. It now ships at `@hanzo/ui/product`;
 * `Code` imports it from there.
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
  SourceChip,
  type Source,
  type SourcesProps,
  type SourceChipProps,
} from './Sources'
