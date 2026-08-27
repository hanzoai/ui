// @vitest-environment jsdom

/**
 * The Form pieces exist for the ACCESSIBILITY wiring, so that is what is
 * asserted — not that they render.
 *
 * Each of these is one id agreeing in three places, which is exactly the kind of
 * thing a hand-written form gets right on the day it is written and wrong on the
 * day a field is copied to make another one.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'
import { useForm } from 'react-hook-form'

import config from '../../gui-config'
import { Input } from './input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './form'

const Field = ({ error }: { error?: string }) => {
  const form = useForm({ defaultValues: { email: '' } })
  if (error) form.setError('email', { message: error })
  return (
    <Form {...form}>
      <FormField
        name="email"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </Form>
  )
}

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config as never} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

describe('a field is wired to its own label and message', () => {
  it('the control carries the id the label points at', () => {
    const m = html(<Field />)
    const id = /id="([^"]*-item)"/.exec(m)?.[1]
    expect(id).toBeTruthy()
    expect(m).toContain(`for="${id}"`)
  })

  it('with no error there is no message, and nothing describes one', () => {
    // An empty message element would reserve space that jumps when a message
    // arrives, and would leave aria-describedby pointing at a node with no text.
    const m = html(<Field />)
    expect(m).not.toContain('-message"')
    expect(m).toContain('aria-invalid="false"')
  })

  it('with an error the message renders and the control says so', () => {
    const m = html(<Field error="Invalid email." />)
    expect(m).toContain('Invalid email.')
    const msg = /id="([^"]*-message)"/.exec(m)?.[1]
    expect(msg).toBeTruthy()
    // described BY the message, and marked invalid
    expect(m).toContain(msg as string)
    expect(m).toContain('aria-invalid="true"')
  })

  it('two fields do not share an id', () => {
    // The ids come from one useId per FormItem, so a copied field gets its own.
    const m = html(
      <>
        <Field />
        <Field />
      </>,
    )
    const ids = [...m.matchAll(/id="([^"]*-item)"/g)].map((x) => x[1])
    expect(ids).toHaveLength(2)
    expect(new Set(ids).size).toBe(2)
  })
})
