/**
 * axe — the accessibility check a mounted component is held to.
 *
 * One call, one rule set: the WCAG 2.2 A/AA rules axe-core can decide from
 * markup. `color-contrast` is off because jsdom paints nothing — it cannot say
 * what colour a pixel is, and a contrast rule with no pixels reports every
 * text node as "needs review", which reads as a pass. Contrast is the
 * consumer suite's job, in a real browser.
 *
 * Test-only. Nothing in the shipped surface imports this module, so the
 * dependency on axe-core stays a dev dependency.
 */
import axe from 'axe-core'

export interface Finding {
  id: string
  impact: string | null | undefined
  nodes: string[]
}

/** The violations axe reports for `node`, reduced to what a failing assertion should print. */
export async function audit(node: Element): Promise<Finding[]> {
  const result = await axe.run(node, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
    rules: { 'color-contrast': { enabled: false } },
    resultTypes: ['violations'],
  })
  return result.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    nodes: v.nodes.map((n) => n.html),
  }))
}
