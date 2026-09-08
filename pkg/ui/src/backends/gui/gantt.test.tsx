// @vitest-environment jsdom

/**
 * Gantt renders a placeholder with no tasks, and one row per task otherwise —
 * asserted on the compiled markup, since gui drops unrecognised props with no
 * throw and no type error.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Gantt, type GanttTask } from './gantt'

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)

const html = (node: React.ReactNode) => renderToStaticMarkup(wrap(node))

const tasks: GanttTask[] = [
  { id: '1', name: 'Project Planning', start: new Date(2024, 0, 1), end: new Date(2024, 0, 15), progress: 100 },
  { id: '2', name: 'Design Phase', start: new Date(2024, 0, 10), end: new Date(2024, 1, 5), progress: 75 },
  { id: '3', name: 'Testing', start: new Date(2024, 3, 15), end: new Date(2024, 4, 15) },
]

const tag = (markup: string, slot: string) =>
  markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

describe('Gantt', () => {
  it('shows a placeholder when there are no tasks', () => {
    const markup = html(<Gantt />)

    expect(tag(markup, 'gantt')).not.toBe('')
    expect(tag(markup, 'gantt-empty')).not.toBe('')
    expect(markup).toContain('No tasks available')
    expect(markup).not.toContain('data-slot="gantt-task"')
  })

  it('renders one row per task, in order', () => {
    const markup = html(<Gantt tasks={tasks} />)
    const rows = [...markup.matchAll(/<[a-z0-9]+[^>]*data-slot="gantt-task"[^>]*>/g)]

    expect(rows).toHaveLength(3)
    expect(markup.indexOf('Project Planning')).toBeLessThan(markup.indexOf('Design Phase'))
    expect(markup.indexOf('Design Phase')).toBeLessThan(markup.indexOf('Testing'))
  })

  it('reports each task’s progress, and defaults a missing one to 0%', () => {
    const markup = html(<Gantt tasks={tasks} />)
    const rows = markup.split('data-slot="gantt-task"').slice(1)

    expect(rows[0]).toContain('data-progress="100"')
    expect(rows[0]).toContain('100%')
    expect(rows[1]).toContain('data-progress="75"')
    expect(rows[1]).toContain('75%')
    expect(rows[2]).toContain('data-progress="0"')
    expect(rows[2]).toContain('0%')
  })

  it('clamps an out-of-range progress into 0–100', () => {
    const over = html(<Gantt tasks={[{ id: '1', name: 'Over', start: new Date(), end: new Date(), progress: 140 }]} />)
    const under = html(<Gantt tasks={[{ id: '1', name: 'Under', start: new Date(), end: new Date(), progress: -20 }]} />)

    expect(over).toContain('data-progress="100"')
    expect(under).toContain('data-progress="0"')
  })

  it('prints each task’s start and end date', () => {
    const markup = html(
      <Gantt tasks={[{ id: '1', name: 'One', start: new Date(2024, 0, 1), end: new Date(2024, 0, 15), progress: 50 }]} />,
    )

    expect(markup).toContain(new Date(2024, 0, 1).toLocaleDateString())
    expect(markup).toContain(new Date(2024, 0, 15).toLocaleDateString())
  })
})
