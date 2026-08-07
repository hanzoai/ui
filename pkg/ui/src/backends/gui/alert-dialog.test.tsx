// @vitest-environment jsdom

/**
 * The AlertDialog's contract, asserted on a LIVE tree. Static markup cannot
 * cover this one: the panel mounts into gui's portal host, so
 * `renderToStaticMarkup` returns a page with no dialog in it — and @hanzo/gui
 * drops an unrecognised prop with no throw and no type error, so a test that
 * only found the title text would prove nothing about the role, the labelling
 * or the buttons.
 *
 * Imports `./alert-dialog` directly rather than the backend barrel: the barrel
 * pulls the whole surface in, and a test for one component should not fail
 * because a different one's dependency moved.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './alert-dialog'

// The panel portals OUT of its host, so every query is document-wide — which
// makes a leaked tree from a FAILED assertion the next test's answer. Teardown
// is unconditional for that reason, not for tidiness.
const live: { root: Root; host: HTMLElement }[] = []

afterEach(() => {
  for (const { root, host } of live.splice(0)) {
    act(() => root.unmount())
    host.remove()
  }
})

const mount = (node: React.ReactNode) => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  live.push({ root, host })
  act(() =>
    root.render(
      <GuiProvider config={config} defaultTheme="dark">
        {node}
      </GuiProvider>,
    ),
  )
}

const find = (name: string) => document.querySelector<HTMLElement>(`[data-slot="${name}"]`)

const open = (extra: Partial<React.ComponentProps<typeof AlertDialog>> = {}) => (
  <AlertDialog open {...extra}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Reset connection</AlertDialogTitle>
        <AlertDialogDescription>This clears every local key.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Keep it</AlertDialogCancel>
        <AlertDialogAction variant="destructive">Reset</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)

describe('AlertDialog', () => {
  it('announces itself as an alert dialog named by its own title and body', () => {
    mount(open())
    const content = find('alert-dialog-content')!
    const title = find('alert-dialog-title')!
    const description = find('alert-dialog-description')!

    expect(content.getAttribute('role')).toBe('alertdialog')
    expect(content.getAttribute('aria-modal')).toBe('true')
    expect(title.id).toBeTruthy()
    expect(description.id).toBeTruthy()
    expect(content.getAttribute('aria-labelledby')).toBe(title.id)
    expect(content.getAttribute('aria-describedby')).toBe(description.id)
  })

  it('mounts its own portal, overlay, header and footer', () => {
    mount(open())

    for (const name of [
      'alert-dialog-overlay',
      'alert-dialog-content',
      'alert-dialog-header',
      'alert-dialog-footer',
    ])
      expect(find(name), name).not.toBeNull()
  })

  /**
   * The composition test, and the one that caught the defect. `Button` renders
   * a `<div role="button" tabindex="0">`, so slotting it INTO gui's close part
   * gives a control a mouse can press and a keyboard cannot: measured, a
   * `keydown` of Enter on that div does nothing at all. jsdom does not
   * implement a button's default activation behaviour, so Enter cannot be
   * asserted directly — the assertable fact is that the element is a real
   * `<button>`, which every platform activates on Enter and Space.
   */
  it('renders each choice as one real button carrying its Button variant', () => {
    mount(open())
    const action = find('alert-dialog-action')!
    const cancel = find('alert-dialog-cancel')!

    expect(action.tagName).toBe('BUTTON')
    expect(cancel.tagName).toBe('BUTTON')
    expect(action.querySelector('button')).toBeNull()
    expect(cancel.querySelector('button')).toBeNull()
    expect(action.getAttribute('data-variant')).toBe('destructive')
    expect(cancel.getAttribute('data-variant')).toBe('outline')
    // A bare <button> in a form is a submit button.
    expect(action.getAttribute('type')).toBe('button')
    expect(cancel.getAttribute('type')).toBe('button')
  })

  // gui's DialogClose hardcodes aria-label="Dialog Close", which OVERRIDES the
  // button's text: every choice, including the destructive one, was announced
  // "Dialog Close, button".
  it('lets each button be named by what it says', () => {
    mount(open())
    const action = find('alert-dialog-action')!
    const cancel = find('alert-dialog-cancel')!

    expect(action.getAttribute('aria-label')).toBeNull()
    expect(cancel.getAttribute('aria-label')).toBeNull()
    expect(action.textContent).toBe('Reset')
    expect(cancel.textContent).toBe('Keep it')
  })

  it('closes on the confirming button, and runs the caller’s handler too', () => {
    const onOpenChange = vi.fn()
    const onPress = vi.fn()
    mount(
      <AlertDialog open onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogTitle>t</AlertDialogTitle>
          <AlertDialogDescription>d</AlertDialogDescription>
          <AlertDialogAction onPress={onPress}>Reset</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>,
    )

    act(() => find('alert-dialog-action')!.click())

    expect(onPress).toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('closes on Cancel', () => {
    const onOpenChange = vi.fn()
    mount(open({ onOpenChange }))

    act(() => find('alert-dialog-cancel')!.click())

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('closes on Escape', () => {
    const onOpenChange = vi.fn()
    mount(open({ onOpenChange }))

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  // The one thing that makes this NOT a Dialog: a decision cannot be dismissed
  // by clicking next to it. If this regresses, a destructive confirm silently
  // becomes cancellable by a stray click.
  it('refuses to close on a click outside', () => {
    const onOpenChange = vi.fn()
    mount(open({ onOpenChange }))

    act(() => {
      find('alert-dialog-overlay')!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
      document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    })

    expect(onOpenChange).not.toHaveBeenCalled()
  })

  // Radix (and gui) open an alert dialog with focus on the SAFE choice, so a
  // held Enter cannot confirm a destructive action. That only works if the
  // composition kept gui's cancelRef pointed at the real DOM node.
  it('opens with focus on Cancel, not on the destructive action', () => {
    mount(open())

    expect(document.activeElement).toBe(find('alert-dialog-cancel'))
  })
})
