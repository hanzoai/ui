// @vitest-environment jsdom

/**
 * The bar mounts.
 *
 * That is a smaller claim than it sounds and it is the one worth making here: a
 * build, a typecheck and a pack all pass on a component that throws on first
 * paint, and every prop this file passes is a gui token or a gui shorthand that
 * only the runtime resolves. `Missing theme.` and a mistyped shorthand both land
 * here and nowhere else.
 *
 * WHAT IT CANNOT SEE: the rows. Palette's content lives inside a Dialog, and a
 * portalled panel does not appear in static markup — `src/backends/gui/render.test.tsx`
 * records the same limit for every dialog, popover, menu and select in the
 * library, and this package ships no DOM-mounting renderer to get past it.
 *
 * So the rule the rows follow is pinned where it is a pure function instead:
 * `match.test.ts` covers the safe/unsafe split, the empty query and the per-group
 * cap over the same values. Between them the component is exercised and the
 * behaviour is proven; neither is asked to do the other's job.
 */
import { renderToStaticMarkup } from "react-dom/server"
import { GuiProvider } from "@hanzo/gui"
import { describe, expect, it } from "vitest"

import config from "../gui-config"
import { Palette } from "./Palette"
import type { Op } from "./match"

const ops: Op[] = [
  { id: "nav:dashboard", group: "Navigate to", label: "Dashboard" },
  {
    id: "get_v1_projects",
    group: "projects",
    label: "list",
    method: "GET",
    hint: "List your projects",
  },
  { id: "post_v1_platform_rollback", group: "platform", label: "apps-rollback", method: "POST" },
]

const mount = (props: Partial<Parameters<typeof Palette>[0]> = {}) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      <Palette open onOpenChange={() => {}} ops={ops} onRun={() => {}} {...props} />
    </GuiProvider>
  )

describe("Palette", () => {
  it("mounts open, closed, searched, and with a right-hand panel", () => {
    expect(() => mount()).not.toThrow()
    expect(() => mount({ open: false })).not.toThrow()
    expect(() => mount({ search: "platform apps" })).not.toThrow()
    expect(() => mount({ children: "the preview", footer: "↵ to run" })).not.toThrow()
  })

  // The list it is handed in production is the whole fleet. Mounting is where an
  // unbounded render would show up as a hang rather than a failure, so the size
  // that motivated the cap is the size this mounts.
  it("mounts the whole fleet's worth of commands", () => {
    const fleet: Op[] = Array.from({ length: 2400 }, (_, i) => ({
      id: `get_v1_projects_${i}`,
      group: "projects",
      label: `list-${i}`,
      method: "GET",
    }))
    expect(() => mount({ ops: fleet, search: "list" })).not.toThrow()
  })
})
