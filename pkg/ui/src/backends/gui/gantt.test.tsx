// @vitest-environment jsdom

/**
 * Renders through the real `GuiProvider`, asserted on `data-slot` markers and
 * the compiled fill width — never on text alone, since @hanzo/gui drops an
 * unrecognised prop with no throw.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Gantt } from './gantt'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

const tasks = [
  { id: '1', name: 'Project Planning', start: new Date(2024, 0, 1), end: new Date(2024, 0, 15), progress: 100 },
  { id: '2', name: 'Design Phase', start: new Date(2024, 0, 10), end: new Date(2024, 1, 5), progress: 75 },
  { id: '3', name: 'Testing', start: new Date(2024, 3, 15), end: new Date(2024, 4, 15) },
]

describe('Gantt', () => {
  it('says there are no tasks when given none', () => {
    const markup = html(<Gantt />)

    expect(markup).toContain('data-slot="gantt"')
    expect(markup).toContain('data-slot="gantt-empty"')
    expect(markup).toContain('No tasks available')
    expect(markup).not.toContain('data-slot="gantt-task"')
  })

  it('renders one row per task, each with its own track and fill', () => {
    const markup = html(<Gantt tasks={tasks} />)

    expect([...markup.matchAll(/data-slot="gantt-task"/g)]).toHaveLength(3)
    expect([...markup.matchAll(/data-slot="gantt-track"/g)]).toHaveLength(3)
    expect(markup).toContain('Project Planning')
    expect(markup).toContain('Design Phase')
    expect(markup).toContain('100%')
    expect(markup).toContain('75%')
    // A task with no `progress` still renders a row and reads as 0%, not NaN.
    expect(markup).toContain('0%')
    expect(markup).not.toContain('NaN')
  })

  it('clamps an out-of-range progress to 0–100 before it reaches the label', () => {
    const over = html(
      <Gantt
        tasks={[{ id: 'over', name: 'Over', start: new Date(2024, 0, 1), end: new Date(2024, 0, 2), progress: 140 }]}
      />,
    )
    const under = html(
      <Gantt
        tasks={[{ id: 'under', name: 'Under', start: new Date(2024, 0, 1), end: new Date(2024, 0, 2), progress: -20 }]}
      />,
    )

    expect(over).toContain('>100%<')
    expect(over).not.toContain('140%')
    expect(under).toContain('>0%<')
    expect(under).not.toContain('-20%')
  })

  it('renders the start and end dates for a task', () => {
    const markup = html(<Gantt tasks={[tasks[0]]} />)

    expect(markup).toContain(tasks[0].start.toLocaleDateString())
    expect(markup).toContain(tasks[0].end.toLocaleDateString())
  })
})
