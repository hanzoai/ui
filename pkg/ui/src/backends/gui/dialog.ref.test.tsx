// @vitest-environment jsdom

/**
 * A ref to a dialog's content does NOT reach the DOM, and this test asserts
 * that — on purpose.
 *
 * The assertions here are WRONG the way a refusal is wrong: they describe a
 * defect rather than a design, so the day @hanzo/gui delivers the ref this file
 * goes red, and red is the signal to delete it and drop `forwardRef` back into
 * `dialog.tsx`. A comment cannot fail; this can.
 *
 * WHERE IT BREAKS, measured rather than reasoned. gui's `DialogContentImpl` has
 * two branches and only one attaches the composed ref: the `DialogContentFrame`
 * that writes `role="dialog"`, against an adapt/portal-item path that attaches
 * none. `role="dialog"` IS in the document here — so the ref-attaching branch
 * ran and the ref still never arrived. It is lost between `DialogContent`'s
 * `.styleable` wrapper and that frame, inside gui, on BOTH 8.1.0 (what this
 * package ships and dev-pins) and 8.2.0.
 *
 * WHY IT IS NOT WORTH PAPERING OVER HERE. Adding `forwardRef` to
 * `@hanzo/ui`'s DialogContent forwards into a component that discards it, which
 * produces a wrapper that looks fixed, typechecks, renders, and delivers
 * nothing — strictly worse than the honest gap, because the next person stops
 * looking. The fix is one edit in gui's dialog package.
 *
 * WHAT IT COSTS TODAY: any consumer whose behaviour is a DOM measurement on the
 * content — drag, snap, transform reads, getBoundingClientRect — silently
 * no-ops. It does not crash and does not fail a build; it just never moves.
 *
 * THE CONTROL IS THE POINT. A bare gui stack in the identical harness DOES
 * deliver a node, so a zero here is a fact about Dialog and not about jsdom,
 * the provider, or the way this file passes a callback ref.
 *
 * IGNORE THE RENDER WARNING, and do not spend an hour on it as I nearly did.
 * The run emits React's "there was an error during concurrent rendering but
 * React was able to recover by instead synchronously rendering the entire
 * root", and vitest reports it as an unhandled error with the fair warning that
 * it "might cause false positive tests" — which is alarming here, because a
 * broken render is exactly the other thing that would produce zero calls.
 * Measured per test: it fires in ALL THREE, the CONTROL INCLUDED, and the
 * control still delivers its node. So it is ambient to mounting `<Hanzo>` and
 * cannot be what separates the control from the dialog.
 */
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Dialog as GuiDialog, YStack } from '@hanzo/gui'

import { Hanzo } from '../../root'
import { Dialog, DialogContent } from './dialog'

/** Callback refs, because a callback records the CALL — an object ref cannot
 *  tell "never attached" from "attached and detached". */
const calls = (bucket: unknown[]) => (el: unknown) => void bucket.push(el)

describe('a ref to dialog content', () => {
  it('CONTROL: a bare gui stack delivers a real DOM node', () => {
    const got: unknown[] = []
    render(
      <Hanzo>
        <YStack ref={calls(got) as never} />
      </Hanzo>,
    )
    expect(got.filter(Boolean).length, 'the control fired').toBeGreaterThan(0)
    expect(got.find(Boolean)).toBeInstanceOf(HTMLElement)
  })

  it("gui's own Dialog.Content mounts its frame and delivers NO ref", () => {
    const got: unknown[] = []
    render(
      <Hanzo>
        <GuiDialog modal open>
          <GuiDialog.Portal>
            <GuiDialog.Content ref={calls(got) as never}>
              <YStack data-probe="gui" />
            </GuiDialog.Content>
          </GuiDialog.Portal>
        </GuiDialog>
      </Hanzo>,
    )

    // The content really is on screen — without this, a zero below would be the
    // correct answer for a dialog that never opened, and would read the same.
    expect(document.querySelectorAll('[data-probe="gui"]').length).toBeGreaterThan(0)
    // And it is the ref-attaching branch: role="dialog" is DialogContentFrame's.
    expect(document.querySelectorAll('[role="dialog"]').length).toBeGreaterThan(0)

    // THE DEFECT. Not one call — not even the `null` a detach would deliver.
    expect(got.length, 'DELETE THIS FILE when gui starts delivering the ref').toBe(0)
  })

  it("@hanzo/ui's DialogContent inherits it", () => {
    const got: unknown[] = []
    render(
      <Hanzo>
        <Dialog open>
          <DialogContent ref={calls(got) as never}>
            <YStack data-probe="ui" />
          </DialogContent>
        </Dialog>
      </Hanzo>,
    )

    expect(document.querySelectorAll('[data-probe="ui"]').length).toBeGreaterThan(0)
    expect(got.length, 'inherited from gui — fix there, not here').toBe(0)
  })
})
