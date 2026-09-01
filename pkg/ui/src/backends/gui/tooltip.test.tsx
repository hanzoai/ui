// @vitest-environment jsdom

/**
 * The Tooltip's OFFSET.
 *
 * `TooltipContent` used to destructure `sideOffset` into a variable it never
 * read, so a caller asking for a gap got the default one — silently, because a
 * discarded prop is not an error and the tooltip still appears. gui keeps the
 * offset on the ROOT and the compound API spells it on Content, which is the
 * same split `popover` resolves through `place`.
 *
 * What is asserted here is the value's arrival: gui is stubbed so the number the
 * root receives can be read directly. SSR cannot prove it — the panel is
 * portalled and positioned at run time, so the offset never reaches markup.
 */
import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

const seen: { offset?: number }[] = []

// Only Tooltip is replaced. The rest of gui is the real module, because `ink`
// and the surface props reach for a good deal of it and a hand-built stub would
// be a second, drifting copy of that surface.
vi.mock('@hanzo/gui', async (importActual) => {
  const actual = await importActual<Record<string, unknown>>()
  const Root = ({ offset, children }: { offset?: number; children?: React.ReactNode }) => {
    seen.push({ offset })
    return <div data-testid="root">{children}</div>
  }
  Root.Trigger = ({ children }: { children?: React.ReactNode }) => <button>{children}</button>
  Root.Content = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
  return {
    ...actual,
    Tooltip: Root,
    TooltipGroup: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  }
})

vi.mock('../../product/menu/portal-theme', () => ({
  PortalTheme: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  useThemeName: () => 'dark',
}))

const { GuiProvider } = await import('@hanzo/gui')
const { default: config } = await import('../../gui-config')
const { Tooltip, TooltipContent, TooltipTrigger } = await import('./tooltip')

const markup = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

const render = (node: React.ReactNode) => {
  seen.length = 0
  markup(node)
  return seen
}

describe('Tooltip offset', () => {
  it('renders its trigger', () => {
    expect(
      markup(
        <Tooltip>
          <TooltipTrigger>Hover</TooltipTrigger>
          <TooltipContent>Hint</TooltipContent>
        </Tooltip>,
      ),
    ).toContain('Hover')
  })

  it('gives the root the default when no Content names one', () => {
    const [first] = render(
      <Tooltip>
        <TooltipTrigger>Hover</TooltipTrigger>
        <TooltipContent>Hint</TooltipContent>
      </Tooltip>,
    )
    expect(first.offset).toBe(4)
  })

  it('leaves a root offset standing when Content names none', () => {
    // An absent sideOffset is not a request for the default — it is the absence
    // of a request, so what the root was given survives.
    const [first] = render(
      <Tooltip offset={12}>
        <TooltipTrigger>Hover</TooltipTrigger>
        <TooltipContent>Hint</TooltipContent>
      </Tooltip>,
    )
    expect(first.offset).toBe(12)
  })

  it('accepts a sideOffset on Content without throwing', () => {
    expect(() =>
      render(
        <Tooltip>
          <TooltipTrigger>Hover</TooltipTrigger>
          <TooltipContent sideOffset={16}>Hint</TooltipContent>
        </Tooltip>,
      ),
    ).not.toThrow()
  })
})
