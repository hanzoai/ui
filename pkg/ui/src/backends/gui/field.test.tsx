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
