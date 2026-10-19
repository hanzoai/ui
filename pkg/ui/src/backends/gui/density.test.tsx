// @vitest-environment jsdom

/**
 * Density is the shell's decision, and a control that names no size follows it.
 *
 * Read off the server-rendered markup: gui compiles each box to an atomic class
 * (`_minH-32px`, `_height-24px`, `_pl-c-space-2`), so the class IS the rendered size
 * and the assertion cannot be satisfied by a prop that never reached a rule.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Button } from './button'
import { Input } from './input'
import { InputGroup } from './input-group'
import { Density, fieldSize } from './density'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

/** The opening tag of the element carrying `data-slot`. */
const tag = (markup: string, slot: string) =>
  markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

describe('fieldSize', () => {
  it('a named size wins over every density', () => {
    expect(fieldSize('lg', 'compact')).toBe('lg')
    expect(fieldSize('xs', 'regular')).toBe('xs')
  })

  it('an unnamed size is the density’s', () => {
    expect(fieldSize(undefined, 'regular')).toBe('default')
    expect(fieldSize(null, 'compact')).toBe('sm')
  })
})

describe('Button under a density', () => {
  it('regular: a size-less button is the 36px default, gutter 16', () => {
    const el = tag(html(<Button>Save</Button>), 'button')
    expect(el).toContain('data-size="default"')
    expect(el).toMatch(/_minH-36px/)
    expect(el).toMatch(/_pl-c-space-4/)
  })

  it('compact: a size-less button is 32px with the 8px record gutter', () => {
    const el = tag(
      html(
        <Density value="compact">
          <Button>Update view</Button>
        </Density>,
      ),
      'button',
    )
    expect(el).toContain('data-size="sm"')
    expect(el).toMatch(/_minH-32px/)
    expect(el).toMatch(/_pl-c-space-2/)
    expect(el).not.toMatch(/_pl-c-space-3/)
  })

  it('compact: a named size keeps its own box and gutter', () => {
    const el = tag(
      html(
        <Density value="compact">
          <Button size="lg">Continue</Button>
        </Density>,
      ),
      'button',
    )
    expect(el).toContain('data-size="lg"')
    expect(el).toMatch(/_minH-40px/)
    expect(el).not.toMatch(/_pl-c-space-2\b/)
  })

  it('compact never narrows an icon button: its gutter is its width', () => {
    const el = tag(
      html(
        <Density value="compact">
          <Button size="icon-xs" aria-label="Add">
            +
          </Button>
        </Density>,
      ),
      'button',
    )
    expect(el).toMatch(/_minW-24px/)
    expect(el).toMatch(/_pl-0px/)
  })
})

describe('the record button sizes', () => {
  it.each([
    ['xs', 24],
    ['icon-xs', 24],
    ['icon-2xs', 20],
  ] as const)('%s is %ipx, and still floors at 44 under a coarse pointer', (size, px) => {
    const el = tag(html(<Button size={size}>x</Button>), 'button')
    expect(el).toMatch(new RegExp(`_minH-${px}px`))
    expect(el).toMatch(/_minH-_touchable_44px/)
  })

  it('draws a start and an end icon at the size’s glyph, around the label', () => {
    const Icon = ({ size, side }: { size?: number; side: string }) => <i data-icon={side} data-px={size} />
    const markup = html(
      <Button size="xs" startIcon={<Icon side="start" />} endIcon={<Icon side="end" size={20} />}>
        Add filter
      </Button>,
    )
    expect(markup).toMatch(/data-icon="start" data-px="14"/)
    // An icon that names its own size keeps it.
    expect(markup).toMatch(/data-icon="end" data-px="20"/)
    expect(markup.indexOf('data-icon="start"')).toBeLessThan(markup.indexOf('Add filter'))
    expect(markup.indexOf('Add filter')).toBeLessThan(markup.indexOf('data-icon="end"'))
  })

  it('subtle lowers the label to the tertiary ink, and tints a small icon child', () => {
    const Icon = ({ color }: { color?: string }) => <i data-icon data-color={color} />
    const quiet = html(
      <Button size="icon-xs" variant="ghost" emphasis="subtle" aria-label="More">
        <Icon />
      </Button>,
    )
    expect(quiet).toMatch(/data-color="\$hint"/)
    const label = html(
      <Button size="xs" variant="ghost" emphasis="subtle">
        Reset
      </Button>,
    )
    expect(label).toMatch(/_col-hint/)
  })
})

describe('Input under a density', () => {
  it('regular: 36 high on the 14px rung', () => {
    const el = tag(html(<Input placeholder="x" />), 'input')
    expect(el).toMatch(/_height-36px/)
  })

  it('compact: 32 high, on the panel ground', () => {
    const el = tag(
      html(
        <Density value="compact">
          <Input placeholder="x" />
        </Density>,
      ),
      'input',
    )
    expect(el).toMatch(/_height-32px/)
    expect(el).toMatch(/_bg-panel/)
  })

  it('an invalid field draws the error edge', () => {
    const el = tag(html(<Input size="sm" aria-invalid placeholder="x" />), 'input')
    expect(el).toMatch(/_btc-red7/)
  })
})

describe('InputGroup', () => {
  it('the group is the box; the field inside it is bare text', () => {
    const markup = html(
      <InputGroup size="sm" start={<i data-mark />}>
        <Input placeholder="Search" />
      </InputGroup>,
    )
    const group = tag(markup, 'input-group')
    expect(group).toMatch(/_height-32px/)
    expect(group).toMatch(/_btw-1px/)
    const field = tag(markup, 'input')
    expect(field).toMatch(/_btw-0px/)
    expect(field).toMatch(/_height-30px/)
    // The start element sits in the row, before the field.
    expect(markup.indexOf('data-slot="input-group-start"')).toBeLessThan(markup.indexOf('data-slot="input"'))
  })

  it('a field inside takes the group’s size, not its own', () => {
    const markup = html(
      <InputGroup size="xs">
        <Input size="lg" placeholder="x" />
      </InputGroup>,
    )
    expect(tag(markup, 'input')).toMatch(/_height-22px/)
  })
})

describe('Input inside a Field', () => {
  it('takes the field’s stated validity: the error edge, and aria-invalid for assistive tech', async () => {
    const { Field } = await import('./field')
    const el = tag(
      html(
        <Field invalid>
          <Input size="sm" placeholder="x" />
        </Field>,
      ),
      'input',
    )
    expect(el).toMatch(/_btc-red7/)
    expect(el).toContain('aria-invalid="true"')
  })

  it('its own aria-invalid="false" outranks the field', async () => {
    const { Field } = await import('./field')
    const el = tag(
      html(
        <Field invalid>
          <Input size="sm" placeholder="x" aria-invalid={false} />
        </Field>,
      ),
      'input',
    )
    expect(el).not.toMatch(/_btc-red7/)
  })
})

describe('Button shortcut', () => {
  it('draws the keys after the label as the quiet button hint, spoken once', () => {
    const markup = html(
      <Button size="sm" shortcut={['Mod', 'Enter']}>
        Update view
      </Button>,
    )
    expect(markup).toMatch(/data-slot="shortcut"[^>]*data-variant="button"|data-variant="button"[^>]*data-slot="shortcut"/)
    expect(markup.indexOf('Update view')).toBeLessThan(markup.indexOf('data-slot="shortcut"'))
    // The server answers "other" for the platform, so Mod is Control here.
    expect(markup).toMatch(/aria-label="Control \+ Enter"/)
  })

  it('a sequence takes the join label it is given', () => {
    const markup = html(
      <Button shortcut={[['G'], ['P']]} shortcutJoinLabel="puis">
        Personnes
      </Button>,
    )
    expect(markup).toMatch(/aria-label="G puis P"/)
  })

  it('no shortcut, no hint', () => {
    expect(html(<Button>Save</Button>)).not.toContain('data-slot="shortcut"')
  })
})
