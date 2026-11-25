// @vitest-environment jsdom
import { createElement } from "react"
import { createRoot } from "react-dom/client"
import { act } from "react"
import { describe, expect, it, vi } from "vitest"

import {
  AgentSidebar,
  DESKTOP_ICONS,
  DesktopToolbar,
  HANZO_MARK_BLOCKS,
  HANZO_MARK_PATHS,
  HANZO_MARK_SHADE,
  HANZO_MARK_VIEWBOX,
  mountAgentSidebar,
  mountDesktopToolbar,
  renderDesktopIconSvg,
  renderHanzoMarkSvg,
} from "./index"

describe("@hanzo/ui canonical desktop toolbar, icons & agent sidebar", () => {
  it("exports official 7-path @hanzo/logo mark and crisp 16px/1.5-stroke Lucide icons", () => {
    expect(HANZO_MARK_VIEWBOX).toBe("0 0 67 67")
    expect(HANZO_MARK_BLOCKS).toHaveLength(5)
    expect(HANZO_MARK_SHADE).toHaveLength(2)
    expect(HANZO_MARK_PATHS).toHaveLength(7)

    const markSvg = renderHanzoMarkSvg({ size: 30 })
    expect(markSvg).toContain('viewBox="0 0 67 67"')
    expect(markSvg).toContain('width="30"')
    for (const block of HANZO_MARK_BLOCKS) {
      expect(markSvg).toContain(block)
    }

    const requiredIcons = [
      "menu",
      "panelLeft",
      "panelRight",
      "panelBottom",
      "chevronLeft",
      "chevronRight",
      "search",
      "compass",
      "globe",
      "terminal",
      "squareTerminal",
      "blocks",
      "grid2x2Plus",
      "windowMinimize",
      "windowMaximize",
      "windowRestore",
      "windowClose",
    ] as const

    for (const icon of requiredIcons) {
      expect(DESKTOP_ICONS[icon]).toBeTruthy()
      const svg = renderDesktopIconSvg(icon)
      expect(svg).toContain("<svg")
    }
    expect(renderDesktopIconSvg("panelLeft")).toContain('width="16"')
    expect(renderDesktopIconSvg("panelLeft")).toContain('stroke-width="1.5"')
  })

  it("renders byte-identical toolbar DOM in pure mountDesktopToolbar and React <DesktopToolbar />", () => {
    const pureHost = document.createElement("div")
    const onTogglePanel = vi.fn()
    const onOpenCommandPalette = vi.fn()
    const onMenuAction = vi.fn()

    const mounted = mountDesktopToolbar(pureHost, {
      projectName: "hanzo / cloud",
      leftSidebarOpen: true,
      rightSidebarOpen: false,
      isMac: false,
      onTogglePanel,
      onOpenCommandPalette,
      onMenuAction,
    })

    const reactContainer = document.createElement("div")
    document.body.appendChild(reactContainer)
    const root = createRoot(reactContainer)
    act(() => {
      root.render(
        createElement(DesktopToolbar, {
          projectName: "hanzo / cloud",
          leftSidebarOpen: true,
          rightSidebarOpen: false,
          isMac: false,
        }),
      )
    })

    const reactInner = reactContainer.querySelector('[data-slot="desktop-toolbar-react-root"]')
    expect(reactInner?.innerHTML).toBe(pureHost.innerHTML)

    // Verify aria-pressed and interactions
    const leftBtn = pureHost.querySelector<HTMLButtonElement>('[data-panel="left"]')
    const rightBtn = pureHost.querySelector<HTMLButtonElement>('[data-panel="right"]')
    expect(leftBtn?.getAttribute("aria-pressed")).toBe("true")
    expect(rightBtn?.getAttribute("aria-pressed")).toBe("false")

    rightBtn?.click()
    expect(onTogglePanel).toHaveBeenCalledWith("right", true)
    expect(rightBtn?.getAttribute("aria-pressed")).toBe("true")

    // Verify F-menu popover
    const menuTrigger = pureHost.querySelector<HTMLButtonElement>('[data-action="menu"]')
    const menuPop = pureHost.querySelector<HTMLElement>('[data-slot="desktop-app-menu"]')
    expect(menuPop?.hidden).toBe(true)
    menuTrigger?.click()
    expect(menuPop?.hidden).toBe(false)

    const newThreadItem = pureHost.querySelector<HTMLButtonElement>('[data-menu-id="new-thread"]')
    newThreadItem?.click()
    expect(onMenuAction).toHaveBeenCalledWith("new-thread")
    expect(menuPop?.hidden).toBe(true)

    // Verify Ctrl+K shortcut
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))
    expect(onOpenCommandPalette).toHaveBeenCalledTimes(1)

    act(() => root.unmount())
    reactContainer.remove()
    mounted.destroy()
  })

  it("mounts AgentSidebar with 7-path logo empty state, tool approvals, diffs, and 16px composer", () => {
    const host = document.createElement("div")
    document.body.appendChild(host)
    const onSend = vi.fn()
    const onApproveToolCall = vi.fn()
    const onApplyDiff = vi.fn()

    const sidebar = mountAgentSidebar(host, {
      threads: [{ id: "t1", title: "Refactor auth middleware", updatedAtLabel: "2m" }],
      onSend,
      onApproveToolCall,
      onApplyDiff,
    })

    expect(host.textContent).toContain("New thread")
    expect(host.textContent).toContain("Build what’s next.")
    expect(host.textContent).toContain("zen6-coder ⌄")
    expect(host.textContent).toContain("Fast ⌄")
    expect(host.textContent).toContain("Auto ⌄")

    // Click suggestion pill -> populates composer textarea
    const suggestBtn = host.querySelector<HTMLButtonElement>("[data-suggest-prompt]")
    suggestBtn?.click()
    const textarea = host.querySelector<HTMLTextAreaElement>('[data-slot="agent-prompt"]')
    expect(textarea?.value).toBe("Explain project architecture")

    // Send prompt
    host.querySelector<HTMLButtonElement>('[data-action="send"]')?.click()
    expect(onSend).toHaveBeenCalledWith("Explain project architecture", {
      model: "zen6-coder",
      effort: "Fast",
      mode: "Auto",
    })

    // Stream assistant response with tool approval & inline diff
    sidebar.update({
      title: "Architecture review",
      messages: [
        { id: "m1", role: "user", content: "Explain project architecture" },
        {
          id: "m2",
          role: "assistant",
          content: "Inspecting workspace packages…",
          streaming: true,
          toolCalls: [
            {
              id: "tc-1",
              title: "Run test suite",
              commandOrArgs: "pnpm test",
              status: "pending_approval",
            },
          ],
          diffs: [
            {
              id: "diff-1",
              filePath: "src/config.ts",
              lines: ["-  model: 'legacy'", "+  model: 'zen6-coder'"],
            },
          ],
        },
      ],
    })

    expect(host.querySelector<HTMLElement>('[data-slot="agent-empty"]')?.hidden).toBe(true)
    expect(host.querySelector<HTMLElement>('[data-slot="agent-messages"]')?.hidden).toBe(false)

    host.querySelector<HTMLButtonElement>('[data-approve-tool="tc-1"]')?.click()
    expect(onApproveToolCall).toHaveBeenCalledWith("tc-1")

    host.querySelector<HTMLButtonElement>('[data-apply-diff="diff-1"]')?.click()
    expect(onApplyDiff).toHaveBeenCalledWith("diff-1", "src/config.ts")

    // React <AgentSidebar /> wrapper mounts identically
    const reactHost = document.createElement("div")
    document.body.appendChild(reactHost)
    const root = createRoot(reactHost)
    act(() => {
      root.render(createElement(AgentSidebar, { model: "zen6-coder" }))
    })
    expect(reactHost.querySelector('[data-slot="agent-sidebar"]')).not.toBeNull()

    act(() => root.unmount())
    reactHost.remove()
    sidebar.destroy()
    host.remove()
  })
})
