// @vitest-environment jsdom

/**
 * The Field family's structure and states, asserted on compiled markup.
 *
 * Imports `./field` directly rather than the backend barrel: the barrel pulls
 * the whole surface in, and a test for one component should not fail because a
 * different one's dependency moved.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from './field'
import { Density } from './density'
import { Textarea } from './textarea'
import { Box } from '../../box'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

const tag = (markup: string, slot: string) =>
  markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

describe('FieldSet / FieldLegend / FieldGroup', () => {
  it('renders a real fieldset with a legend inside it', () => {
    const markup = html(
      <FieldSet>
        <FieldLegend>Profile</FieldLegend>
        <FieldGroup>
          <Field />
        </FieldGroup>
      </FieldSet>,
    )

    expect(tag(markup, 'field-set').startsWith('<fieldset')).toBe(true)
    expect(tag(markup, 'field-legend').startsWith('<legend')).toBe(true)
    expect(tag(markup, 'field-group')).not.toBe('')
  })

  it('gives the label variant a different data-variant than the legend default', () => {
    const legend = tag(html(<FieldLegend>Section</FieldLegend>), 'field-legend')
    const label = tag(html(<FieldLegend variant="label">Section</FieldLegend>), 'field-legend')

    expect(legend).toContain('data-variant="legend"')
    expect(label).toContain('data-variant="label"')
  })
})

describe('Field', () => {
  it('is a group and records its orientation, vertical by default', () => {
    const markup = html(<Field />)
    const el = tag(markup, 'field')

    expect(el).toContain('role="group"')
    expect(el).toContain('data-orientation="vertical"')
  })

  it('records horizontal and responsive orientation on the element', () => {
    expect(tag(html(<Field orientation="horizontal" />), 'field')).toContain(
      'data-orientation="horizontal"',
    )
    expect(tag(html(<Field orientation="responsive" />), 'field')).toContain(
      'data-orientation="responsive"',
    )
  })

  it('passes data-invalid through to the element', () => {
    const markup = html(<Field data-invalid />)
    const el = tag(markup, 'field')

    expect(el).toMatch(/data-invalid="(true|)"/)
  })
})

describe('FieldContent / FieldLabel / FieldTitle', () => {
  it('wraps a label and description in FieldContent', () => {
    const markup = html(
      <FieldContent>
        <FieldTitle>Enable Touch ID</FieldTitle>
        <FieldDescription>Unlock your device faster.</FieldDescription>
      </FieldContent>,
    )

    expect(tag(markup, 'field-content')).not.toBe('')
    expect(markup).toContain('Enable Touch ID')
    expect(markup).toContain('Unlock your device faster.')
  })

  it('turns into a bordered choice card when its only child is a Field', () => {
    const plain = tag(html(<FieldLabel htmlFor="name">Full name</FieldLabel>), 'field-label')
    const card = tag(
      html(
        <FieldLabel>
          <Field orientation="horizontal">
            <FieldTitle>Subscribe</FieldTitle>
          </Field>
        </FieldLabel>,
      ),
      'field-label',
    )

    // The plain label shrinks to its content; the card runs full width and
    // grows a visible border around the nested Field.
    expect(plain).toContain('_self-flex-start')
    expect(plain).not.toContain('_btw-1px')
    expect(card).toContain('_width-')
    expect(card).toContain('_btw-1px')
  })
})

describe('FieldDescription / FieldSeparator / FieldError', () => {
  it('renders description text under the field-description slot', () => {
    const markup = html(<FieldDescription>Helper text.</FieldDescription>)

    expect(tag(markup, 'field-description')).not.toBe('')
    expect(markup).toContain('Helper text.')
  })

  it('marks whether a separator carries inline content', () => {
    const bare = tag(html(<FieldSeparator />), 'field-separator')
    const withContent = tag(html(<FieldSeparator>Or continue with</FieldSeparator>), 'field-separator')

    expect(bare).toContain('data-content="false"')
    expect(withContent).toContain('data-content="true"')
    expect(html(<FieldSeparator>Or continue with</FieldSeparator>)).toContain('Or continue with')
  })

  it('renders nothing when there is no error to show', () => {
    expect(tag(html(<FieldError />), 'field-error')).toBe('')
    expect(tag(html(<FieldError errors={[]} />), 'field-error')).toBe('')
    expect(tag(html(<FieldError errors={[undefined]} />), 'field-error')).toBe('')
  })

  it('renders a single message inline as an alert', () => {
    const markup = html(<FieldError errors={[{ message: 'Choose another username.' }]} />)
    const el = tag(markup, 'field-error')

    expect(el).toContain('role="alert"')
    expect(markup).toContain('Choose another username.')
  })

  it('renders a list when there is more than one error message', () => {
    const markup = html(
      <FieldError
        errors={[{ message: 'Too short.' }, { message: 'Must include a number.' }]}
      />,
    )

    expect(tag(markup, 'field-error-list')).not.toBe('')
    expect(markup).toContain('Too short.')
    expect(markup).toContain('Must include a number.')
    // A list message carries its own destructive color and bullet — it is not
    // a plain string ink() can wrap, so the alert frame's color never inherits.
    expect(markup).toContain('list-style-type:disc')
    expect(markup).toMatch(/color:var\(--red9\)[^>]*>Too short\./)
  })

  it('accepts Standard Schema issues the same way it accepts errors', () => {
    const markup = html(<FieldError issues={[{ message: 'Invalid email.' }]} />)

    expect(markup).toContain('Invalid email.')
  })

  it('lets children override errors entirely', () => {
    const markup = html(
      <FieldError errors={[{ message: 'ignored' }]}>Custom message</FieldError>,
    )

    expect(markup).toContain('Custom message')
    expect(markup).not.toContain('ignored')
  })
})

describe('the record density', () => {
  const compact = (node: React.ReactNode) => html(<Density value="compact">{node}</Density>)

  it('regular density draws what it always drew', () => {
    const markup = html(
      <Field>
        <FieldLabel htmlFor="n">Name</FieldLabel>
        <FieldDescription>d</FieldDescription>
      </Field>,
    )
    expect(tag(markup, 'field')).toMatch(/_gap-c-space-3/)
    expect(tag(markup, 'field-label')).toMatch(/_fs-f-size-2/)
    expect(tag(markup, 'field-description')).toMatch(/_col-quiet/)
  })

  it('compact: a 12px semibold caption in the tertiary ink, 4px above its control', () => {
    const markup = compact(
      <Field>
        <FieldLabel htmlFor="n">Name</FieldLabel>
        <FieldDescription>Shown on the record.</FieldDescription>
        <FieldError>Required.</FieldError>
      </Field>,
    )
    expect(tag(markup, 'field')).toMatch(/_gap-c-space-1/)
    const label = tag(markup, 'field-label')
    expect(label).toMatch(/_fs-f-size-1/)
    expect(label).toMatch(/_fw-600/)
    expect(label).toMatch(/_col-hint/)
    const description = tag(markup, 'field-description')
    expect(description).toMatch(/_fs-f-size-1/)
    expect(description).toMatch(/_col-hint/)
    expect(markup).toMatch(/_fs-f-size-1[^"]*_col-bad"[^>]*>Required\./)
  })
})

describe('Field invalid', () => {
  it('marks the block and hands the state to the control inside', () => {
    const markup = html(
      <Field invalid>
        <Textarea placeholder="x" />
        <FieldError>Bad.</FieldError>
      </Field>,
    )
    expect(tag(markup, 'field')).toContain('data-invalid="true"')
    const control = tag(markup, 'textarea')
    expect(control).toContain('aria-invalid="true"')
    expect(control).toMatch(/_btc-red7/)
    expect(markup).toContain('Bad.')
  })

  it('a field that says it is valid shows no error, whatever is passed', () => {
    const markup = html(
      <Field invalid={false}>
        <FieldError>Stale message.</FieldError>
      </Field>,
    )
    expect(markup).not.toContain('Stale message.')
    expect(tag(markup, 'field')).toContain('data-invalid="false"')
  })

  it('a control’s own aria-invalid wins over the field', () => {
    const markup = html(
      <Field invalid>
        <Textarea aria-invalid={false} placeholder="x" />
      </Field>,
    )
    expect(tag(markup, 'textarea')).not.toMatch(/_btc-red7/)
  })
})

describe('FieldSet / FieldLegend as props, not utility strings', () => {
  /** The class set of an element, order-free. */
  const classes = (el: string) => new Set((el.match(/class="([^"]*)"/)?.[1] ?? '').split(/\s+/).filter(Boolean))

  it('draws the frame the old `flex flex-col gap-6` Box drew, and says column', () => {
    const now = classes(tag(html(<FieldSet />), 'field-set'))
    const before = classes(
      tag(html(<Box tag="fieldset" className="flex flex-col gap-6" data-slot="field-set" />), 'field-set'),
    )
    for (const c of before) expect(now, c).toContain(c)
    // The one difference, and it is the fix: through `asChild` the Box dropped
    // `flex-col` as the stack's default, so the fieldset fell back to the
    // browser's row. The column is stated now.
    expect(now).toContain('_fd-column')
  })

  it('a legend keeps its margin, rung and weight', () => {
    for (const [variant, rung] of [['legend', 'base'], ['label', 'sm']] as const) {
      const el = tag(html(<FieldLegend variant={variant}>x</FieldLegend>), 'field-legend')
      expect(el.startsWith('<legend')).toBe(true)
      expect(el).toMatch(/_mb-12px/)
      expect(el).toContain(`font-size:var(--text-${rung})`)
      expect(el).toContain('font-weight:500')
    }
  })

  it('names no utility class at all', () => {
    const markup = html(
      <FieldSet>
        <FieldLegend>x</FieldLegend>
        <FieldError errors={[{ message: 'a' }, { message: 'b' }]} />
      </FieldSet>,
    )
    const used = [...markup.matchAll(/class="([^"]*)"/g)].flatMap((m) => m[1].split(/\s+/))
    for (const name of ['flex', 'flex-col', 'gap-6', 'gap-1', 'mb-3', 'text-sm', 'text-base', 'font-medium', 'ml-4', 'text-red9'])
      expect(used, name).not.toContain(name)
  })
})
