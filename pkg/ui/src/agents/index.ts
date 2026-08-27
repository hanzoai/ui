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
