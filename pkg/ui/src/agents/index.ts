/**
 * @hanzo/ui/agents — the agents working view, on @hanzo/gui primitives.
 *
 * `AgentBoard` shows what is running, grouped by project and nested by fan-out;
 * `Transcript` shows what one run has done; `Steer` reaches a run mid-flight;
 * `Screen` watches one that has something to look at; `MemberRow` draws an
 * agent, a bot or a person with the kind legible.
 *
 * Props-in, callbacks-out — no transport, no store, no routing, and no import
 * of `@hanzo/ai` anywhere in the module. The data belongs to the surface, which
 * is what lets hanzo.ai, a channel workspace and the desktop compose the same
 * five components over three different ways of fetching.
 *
 * The two pure helpers ship beside the components because both are decisions a
 * surface would otherwise make differently each time: `nest` builds the tree a
 * board draws from the flat list an API answers with, and `fold` joins a
 * token-per-event stream into readable blocks.
 *
 * The composer is not here — a draft box is not agent-specific, so it stays at
 * `@hanzo/ui/chat` and this module composes it.
 */
export {
  AgentBoard,
  RunRow,
  nest,
  type AgentBoardProps,
  type Run,
  type RunRowProps,
  type RunStatus,
} from './Board'

export { Transcript, fold, type Block, type TranscriptProps, type Turn } from './Transcript'

export {
  MemberRow,
  Steer,
  type Command,
  type MemberKind,
  type MemberRowProps,
  type SteerProps,
} from './Steer'

export { Screen, type ScreenKind, type ScreenProps, type Ticket } from './Screen'

export {
  ProgressBlock,
  steps,
  type Event,
  type ProgressBlockProps,
  type Step,
  type StepKind,
} from './Progress'

export {
  ArtifactCard,
  ChannelHeader,
  OrgRail,
  Pane,
  SystemLine,
  type ArtifactCardProps,
  type ArtifactKind,
  type ChannelHeaderProps,
  type Org,
  type OrgRailProps,
  type PaneProps,
  type PaneTab,
  type SystemLineProps,
} from './Pane'

export {
  SwarmBar,
  type AgentDescriptor,
  type SwarmBarProps,
} from './SwarmBar'

export {
  MCPHub,
  type MCPServerInfo,
  type MCPHubProps,
} from './MCPHub'

export {
  DiffViewer,
  type DiffViewerProps,
} from './DiffViewer'

export {
  LiveVoiceCall,
  type LiveVoiceCallProps,
} from './LiveVoiceCall'

export {
  ChannelNotes,
  type ChannelNotesProps,
} from './ChannelNotes'

export {
  ChannelMembers,
  type ChannelMember,
  type ChannelMembersProps,
} from './ChannelMembers'

export {
  ThemeCustomizer,
  type ThemeConfig,
  type ThemeCustomizerProps,
} from './ThemeCustomizer'

export {
  ShortcutsSheet,
  type ShortcutItem,
  type ShortcutsSheetProps,
} from './ShortcutsSheet'

export {
  DirectoryModal,
  type DirectoryItem,
  type DirectoryModalProps,
  type DirectoryTab,
} from './DirectoryModal'

export {
  DriveViewer,
  type DriveViewerProps,
  type StorageBucket,
  type StorageEntry,
} from './DriveViewer'

export {
  TerminalViewer,
  type TerminalTab,
  type TerminalViewerProps,
} from './TerminalViewer'

/**
 * The builder's workspace — ported from build-v2's editor (MIT, derived from
 * OSW Studio and DeepSite; see NOTICE). The frame and its bar (`Workspace`,
 * `Views`, `ProjectChip`, `PageSelect`), the work (`PreviewFrame`, `FileTree`,
 * `FileTabs`), the dock (`Console`), and the chat column's own pieces
 * (`ModeSelect`, `Suggestions`, `Attachments`, `Feedback`) — which compose with
 * `@hanzo/ui/chat`'s `Thread`, `Message` and `Composer` rather than repeat them.
 *
 * `tree`, `log` and `bridge` are the pure halves: the file listing and its keys,
 * the console's lines and height, and the origin-checked preview protocol.
 */
export {
  Workspace,
  Views,
  ProjectChip,
  VIEWS,
  CHAT,
  DEVICES,
  CONTROL,
  type WorkspaceProps,
  type View,
  type ViewsProps,
  type ProjectChipProps,
} from './Workspace'

export {
  ModeSelect,
  PageSelect,
  type Option,
  type ModeSelectProps,
  type PageSelectProps,
} from './Choice'

export { FileTree, glyph, type FileTreeProps } from './FileTree'

export { FileTabs, type FileTabsProps, type OpenFile } from './FileTabs'

export {
  PreviewFrame,
  PHONE,
  type PreviewFrameProps,
  type PreviewHandle,
} from './PreviewFrame'

export { Console, type ConsoleProps, type ConsoleTab } from './Console'

export { Suggestions, SUGGESTIONS, type SuggestionsProps } from './Suggestions'

export { Attachments, type Attachment, type AttachmentsProps } from './Attachments'

export { Feedback, type FeedbackProps, type Verdict } from './Feedback'

export {
  ancestors,
  base,
  dir,
  filter,
  group,
  language,
  put,
  rows,
  sort,
  step,
  type Entry,
  type Listing,
  type Move,
  type Row,
} from './tree'

export { cap, count, level, split, HEAD, LIMIT, OPEN, type Level, type Line } from './log'

export {
  accept,
  script,
  web,
  type FrameCommand,
  type FrameEvent,
  type Picked,
  type Rect,
} from './bridge'
