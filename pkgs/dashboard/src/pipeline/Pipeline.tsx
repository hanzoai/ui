'use client'

/**
 * Pipeline — the animated deploy-stage line. A horizontal track with N stages:
 * completed stages fill in with a check, the current stage pulses, the active leg
 * shows a flowing gradient, and a failure turns the reached stage red. Purely
 * presentational — driven by a `stages` prop (each `{ name, state }`); the consumer
 * derives those from a real status string with the pure `pipelineModel` and polls
 * to pass fresh stages. Reduced motion → a static, filled line.
 *
 * All geometry derives from the stage states, so it renders whatever pipeline the
 * caller supplies (the default four-stage deploy line, or a custom set).
 */
import { useContainerWidth } from '../charts/Charts'
import { useReducedMotion } from '../motion/hooks'
import type { PipelineStage, StageState } from './stages'
import { Text, XStack, YStack } from '@hanzo/gui'

const ACCENT = '#7c5cff'
const GREEN = '#23c562'
const RED = '#ff5d8f'
const MUTED = 'rgba(148,163,184,0.28)'

export interface PipelineProps {
  /** The stages to render, in order (derive via `pipelineModel(status).stages`). */
  stages: PipelineStage[]
  /** A short status label shown above the track (e.g. `pipelineModel(...).label`). */
  label?: string
  /** Accent tone for the filled track + active stage. Defaults by state (green live / red error / purple). */
  tone?: string
  /** Animate the active leg + pulse. Default true; reduced motion still forces static. */
  animate?: boolean
}

export function Pipeline({ stages, label, tone, animate = true }: PipelineProps) {
  const reduced = useReducedMotion()

  const n = stages.length
  const errorIdx = stages.findIndex((s) => s.state === 'error')
  const activeStateIdx = stages.findIndex((s) => s.state === 'active')
  const doneCount = stages.filter((s) => s.state === 'done').length
  const errored = errorIdx >= 0
  const live = n > 0 && doneCount === n && !errored
  const activeIndex = errored ? errorIdx : activeStateIdx >= 0 ? activeStateIdx : live ? n - 1 : -1
  const inProgress = activeStateIdx >= 0 && !errored && !live

  const accent = tone ?? (errored ? RED : live ? GREEN : ACCENT)

  return (
    <YStack gap="$3" aria-label={label ? `Deployment: ${label}` : 'Deployment pipeline'}>
      {label ? (
        <XStack items="center" gap="$2">
          <YStack width={9} height={9} rounded="$10" style={{ backgroundColor: accent }} className={animate && !reduced && inProgress ? 'hz-pipe-dot' : undefined} />
          <Text fontSize="$3" fontWeight="700" color="$color12">
            {label}
          </Text>
        </XStack>
      ) : null}
      <Track stages={stages} activeIndex={activeIndex} inProgress={inProgress} reduced={reduced || !animate} tone={accent} />
    </YStack>
  )
}

// ── The SVG track + aligned labels ───────────────────────────────────────────

function Track({ stages, activeIndex, inProgress, reduced, tone }: { stages: PipelineStage[]; activeIndex: number; inProgress: boolean; reduced: boolean; tone: string }) {
  const { ref, w } = useContainerWidth()
  const n = stages.length
  const H = 60
  const padX = 24
  const trackY = 28
  const usable = Math.max(1, w - padX * 2)
  const x = (i: number) => padX + (n <= 1 ? 0 : (i / (n - 1)) * usable)

  const fillTo = activeIndex < 0 ? x(0) : x(activeIndex)
  const flowing = !reduced && inProgress && activeIndex >= 0 && activeIndex < n - 1
  const flowStart = x(Math.max(0, activeIndex))
  const flowEnd = x(Math.min(activeIndex + 1, n - 1))

  return (
    <div ref={ref} style={{ width: '100%' }}>
      {w > 0 ? (
        <>
          <svg width={w} height={H} style={{ display: 'block', overflow: 'visible' }} role="presentation">
            <defs>
              <linearGradient id="hz-pipe-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={tone} stopOpacity="0.15" />
                <stop offset="50%" stopColor={tone} stopOpacity="1" />
                <stop offset="100%" stopColor={tone} stopOpacity="0.15" />
              </linearGradient>
            </defs>

            {/* base track */}
            <line x1={x(0)} y1={trackY} x2={x(n - 1)} y2={trackY} stroke={MUTED} strokeWidth={4} strokeLinecap="round" />

            {/* filled (completed) track */}
            {fillTo > x(0) ? <line x1={x(0)} y1={trackY} x2={fillTo} y2={trackY} stroke={tone} strokeWidth={4} strokeLinecap="round" /> : null}

            {/* flowing gradient on the active leg */}
            {flowing ? (
              <line x1={flowStart} y1={trackY} x2={flowEnd} y2={trackY} stroke="url(#hz-pipe-grad)" strokeWidth={4} strokeLinecap="round" className="hz-pipe-flow" />
            ) : null}

            {/* stages */}
            {stages.map((st, i) => (
              <Stage key={st.name} cx={x(i)} cy={trackY} state={st.state} tone={tone} reduced={reduced} />
            ))}
          </svg>

          {/* labels aligned under each stage */}
          <div style={{ position: 'relative', width: w, height: 30, marginTop: 2 }}>
            {stages.map((st, i) => (
              <div
                key={st.name}
                style={{
                  position: 'absolute',
                  left: x(i),
                  transform: i === 0 ? 'translateX(0)' : i === n - 1 ? 'translateX(-100%)' : 'translateX(-50%)',
                  textAlign: i === 0 ? 'left' : i === n - 1 ? 'right' : 'center',
                  maxWidth: 110,
                }}
              >
                <StageLabel name={st.name} state={st.state} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{ height: H + 30 }} />
      )}
    </div>
  )
}

function StageLabel({ name, state }: { name: string; state: StageState }) {
  const sub = state === 'active' ? 'in progress' : state === 'error' ? 'failed' : state === 'done' ? 'done' : ''
  return (
    <YStack gap="$0.5">
      <Text fontSize="$1" fontWeight={state === 'active' || state === 'error' ? '800' : '600'} color={state === 'pending' ? '$color9' : '$color12'} numberOfLines={1}>
        {name}
      </Text>
      <Text fontSize="$1" style={state === 'error' ? { color: RED } : undefined} color={state === 'error' ? undefined : '$color10'}>
        {sub || ' '}
      </Text>
    </YStack>
  )
}

function Stage({ cx, cy, state, tone, reduced }: { cx: number; cy: number; state: StageState; tone: string; reduced: boolean }) {
  const r = 11
  if (state === 'done') {
    return (
      <g>
        <circle cx={cx} cy={cy} r={r} fill={tone} />
        <path d={`M${cx - 4.5},${cy + 0.5} L${cx - 1.5},${cy + 3.5} L${cx + 4.5},${cy - 3.5}`} fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    )
  }
  if (state === 'error') {
    return (
      <g>
        <circle cx={cx} cy={cy} r={r} fill={RED} />
        <path d={`M${cx - 3.5},${cy - 3.5} L${cx + 3.5},${cy + 3.5} M${cx + 3.5},${cy - 3.5} L${cx - 3.5},${cy + 3.5}`} stroke="#fff" strokeWidth={2} strokeLinecap="round" />
      </g>
    )
  }
  if (state === 'active') {
    return (
      <g>
        {!reduced ? <circle cx={cx} cy={cy} r={r} fill={tone} className="hz-pipe-pulse" /> : null}
        <circle cx={cx} cy={cy} r={r} fill="var(--color2, #14161a)" stroke={tone} strokeWidth={3} />
        <circle cx={cx} cy={cy} r={4} fill={tone} />
      </g>
    )
  }
  // pending
  return <circle cx={cx} cy={cy} r={r} fill="var(--color2, #14161a)" stroke={MUTED} strokeWidth={2} />
}
