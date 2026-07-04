/**
 * Deploy-stage pipeline domain logic — PURE, no UI, no I/O, unit-testable.
 *
 * A deploy moves through four stages: Queued → Building → Deploying → Live. This
 * maps a REAL app/deployment status string (building | deploying | live | error |
 * queued | …) onto that pipeline and decides, per stage, whether it is done /
 * active / pending / errored, plus an overall progress fraction and an honest
 * status label.
 *
 * Honesty: this never fabricates progress. The stage is derived from the real
 * status, and the caller passes the FURTHEST stage it has actually OBSERVED
 * (monotonic across polls) so an `error` marks the stage the deploy truly reached —
 * not a guess.
 */

/** The four pipeline stages, in order. */
export const PIPELINE_STAGES = ['Queued', 'Building', 'Deploying', 'Live'] as const
export type PipelineStageName = (typeof PIPELINE_STAGES)[number]

/** Canonical pipeline phase, normalized from any backend status string. */
export type PipelinePhase = 'idle' | 'queued' | 'building' | 'deploying' | 'live' | 'error'

/** Per-stage render state. */
export type StageState = 'done' | 'active' | 'error' | 'pending'

/** One stage in the rendered pipeline. */
export type PipelineStage = { name: string; state: StageState }

/** The full derived model a `Pipeline` renders from. */
export type PipelineModel = {
  phase: PipelinePhase
  /** Index (0..3) of the current stage; -1 when idle (nothing deploying). */
  activeIndex: number
  /** Reached the final stage. */
  live: boolean
  /** The deploy failed. */
  errored: boolean
  /** True while actively progressing (has a stage to animate toward). */
  inProgress: boolean
  stages: PipelineStage[]
  /** 0..1 fraction of the line filled (static progress / aria-valuenow). */
  progress: number
  /** A short, honest status label ("Building…", "Live", "Failed while deploying"). */
  label: string
}

const N = PIPELINE_STAGES.length

const QUEUED = new Set(['queued', 'queue', 'waiting', 'accepted', 'created', 'pending'])
const BUILDING = new Set(['building', 'build', 'in_progress', 'inprogress', 'compiling'])
const DEPLOYING = new Set(['deploying', 'deploy', 'rollout', 'rolling', 'releasing', 'provisioning'])
const LIVE = new Set(['live', 'ready', 'running', 'available', 'succeeded', 'success', 'active', 'healthy', 'superseded'])
const ERROR = new Set(['error', 'errored', 'failed', 'failure', 'crashed', 'canceled', 'cancelled', 'timeout'])
const IDLE = new Set(['', 'draft', 'stopped', 'paused', 'idle', 'unknown', 'none', 'new'])

/** Normalize any app/deployment status string to a canonical pipeline phase. */
export function pipelinePhase(status?: string | null): PipelinePhase {
  const s = (status ?? '').trim().toLowerCase()
  if (ERROR.has(s)) return 'error'
  if (LIVE.has(s)) return 'live'
  if (DEPLOYING.has(s)) return 'deploying'
  if (BUILDING.has(s)) return 'building'
  if (QUEUED.has(s)) return 'queued'
  if (IDLE.has(s)) return 'idle'
  return 'idle'
}

/** The stage index (0..3) a phase sits at; -1 for idle/error (error uses `furthest`). */
export function stageIndex(phase: PipelinePhase): number {
  switch (phase) {
    case 'queued':
      return 0
    case 'building':
      return 1
    case 'deploying':
      return 2
    case 'live':
      return N - 1
    default:
      return -1
  }
}

/** Terminal phases (live or error) — the poller stops here. */
export function isTerminalPhase(phase: PipelinePhase): boolean {
  return phase === 'live' || phase === 'error'
}

/** A short, honest status label for the pipeline. */
function pipelineLabel(phase: PipelinePhase, activeIndex: number, status?: string | null): string {
  switch (phase) {
    case 'live':
      return 'Live'
    case 'queued':
      return 'Queued'
    case 'building':
      return 'Building…'
    case 'deploying':
      return 'Deploying…'
    case 'error': {
      if (activeIndex <= 0) return 'Failed in queue'
      const at = PIPELINE_STAGES[Math.min(activeIndex, N - 1)].toLowerCase()
      return `Failed while ${at}`
    }
    default: {
      const s = (status ?? '').trim()
      if (!s || s.toLowerCase() === 'draft' || s.toLowerCase() === 'new') return 'Not deployed'
      return s.charAt(0).toUpperCase() + s.slice(1)
    }
  }
}

/**
 * Build the pipeline model from a status string and the FURTHEST stage index
 * observed so far (monotonic across polls; default -1 = none observed). The furthest
 * index makes an `error` mark the stage the deploy actually reached, and keeps
 * completed stages filled even if a later poll returns a transient earlier status.
 */
export function pipelineModel(status?: string | null, furthestReached = -1): PipelineModel {
  const phase = pipelinePhase(status)
  const idx = stageIndex(phase)
  const reached = Math.max(furthestReached, idx)

  const live = phase === 'live'
  const errored = phase === 'error'

  let activeIndex: number
  if (live) activeIndex = N - 1
  else if (errored) activeIndex = reached >= 0 ? Math.min(reached, N - 1) : 0
  else if (phase === 'idle') activeIndex = -1 // nothing deploying — a neutral pipeline
  else activeIndex = Math.min(reached, N - 1) // active: monotonic (never backslides)

  const stages: PipelineStage[] = PIPELINE_STAGES.map((name, i): PipelineStage => {
    if (live) return { name, state: 'done' }
    if (errored) {
      if (i < activeIndex) return { name, state: 'done' }
      if (i === activeIndex) return { name, state: 'error' }
      return { name, state: 'pending' }
    }
    if (activeIndex < 0) return { name, state: 'pending' } // idle: nothing started
    if (i < activeIndex) return { name, state: 'done' }
    if (i === activeIndex) return { name, state: 'active' }
    return { name, state: 'pending' }
  })

  const progress = live ? 1 : activeIndex < 0 ? 0 : activeIndex / (N - 1)
  const inProgress = !live && !errored && activeIndex >= 0
  const label = pipelineLabel(phase, activeIndex, status)

  return { phase, activeIndex, live, errored, inProgress, stages, progress, label }
}

/** The accent tone for a model: red on failure, green on live, else the accent. */
export function pipelineTone(model: Pick<PipelineModel, 'live' | 'errored'>, accent = '#7c5cff'): string {
  return model.errored ? '#ff5d8f' : model.live ? '#23c562' : accent
}
