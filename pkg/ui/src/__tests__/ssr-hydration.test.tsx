// @vitest-environment jsdom

import { act } from 'react'
import { hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import * as core from '../core'
import * as tokens from '../core/tokens'
import { Gallery, Phone } from '../gallery'
import * as grid from '../grid'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Hanzo,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Toggle,
  cn,
} from '../index'
import { Repo } from '../marketing'
import * as pure from '../product/pure'

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

const mem = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => void mem.set(k, String(v)),
    removeItem: (k: string) => void mem.delete(k),
    clear: () => mem.clear(),
    key: (i: number) => [...mem.keys()][i] ?? null,
    get length() {
      return mem.size
    },
  } satisfies Storage,
})

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

beforeAll(() => {
  const marker = document.createElement('style')
  marker.textContent = ':root{--hanzo-ui-styles:1}'
  document.head.appendChild(marker)
})

const roots: Root[] = []

afterEach(() => {
  while (roots.length) {
    const root = roots.pop()!
    act(() => root.unmount())
  }
  localStorage.clear()
  document.documentElement.removeAttribute('style')
  document.documentElement.removeAttribute('class')
  document.documentElement.removeAttribute('data-scheme')
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

const formatCalls = (calls: unknown[][]) =>
  calls.map((args) => args.map((arg) => String(arg)).join(' '))

function hydrateAndVerify(element: React.ReactNode) {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const recoverable: unknown[] = []
  const errors: unknown[][] = []
  const warnings: unknown[][] = []

  const errSpy = vi.spyOn(console, 'error').mockImplementation((...args) => {
    errors.push(args)
  })
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation((...args) => {
    warnings.push(args)
  })

  try {
    const html = renderToString(element)
    expect(html.length).toBeGreaterThan(0)

    const host = document.createElement('div')
    host.innerHTML = html
    document.body.appendChild(host)

    act(() => {
      const root = hydrateRoot(host, element, {
        onRecoverableError: (err) => recoverable.push(err),
      })
      roots.push(root)
    })

    return { host, recoverable, errors, warnings }
  } finally {
    errSpy.mockRestore()
    warnSpy.mockRestore()
  }
}

describe('React 19 SSR hydration and public subpath surfaces', () => {
  it('resolves named and subpath exports without undefined members', () => {
    expect(typeof Hanzo).toBe('function')
    expect(typeof cn).toBe('function')
    expect(cn('a', false && 'b', 'c')).toBe('a c')
    expect(typeof Gallery).toBe('function')
    expect(typeof Phone).toBe('function')
    expect(typeof core.cn).toBe('function')
    expect(core.FONT_SANS_VAR).toBe('--font-sans')
    expect(pure.pages(1, 5)).toEqual([1, 2, 3, 4, 5])
    expect(pure.tone('past_due')).toBe('stopped')
    expect(Object.keys(tokens.radius).length).toBeGreaterThan(0)
    expect(grid.Grid).toBeDefined()
    expect(grid.Cell).toBeDefined()
  })

  for (const theme of ['dark', 'light'] as const) {
    it(`SSR renders full Gallery in ${theme} theme with zero React errors`, () => {
      const errors: unknown[][] = []
      const warnings: unknown[][] = []
      const errSpy = vi.spyOn(console, 'error').mockImplementation((...args) => {
        errors.push(args)
      })
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation((...args) => {
        warnings.push(args)
      })

      let html = ''
      try {
        html = renderToString(
          <Hanzo theme={theme}>
            <Gallery />
          </Hanzo>,
        )
      } finally {
        errSpy.mockRestore()
        warnSpy.mockRestore()
      }

      expect(html.length).toBeGreaterThan(1000)
      expect(formatCalls(errors), `console.error calls in ${theme}`).toEqual([])
      expect(formatCalls(warnings), `console.warn calls in ${theme}`).toEqual([])
      expect(html).toContain('data-gallery="button"')
      expect(html).toContain('data-slot="card"')
    })

    it(`hydrates modal-free component surface in ${theme} theme cleanly`, () => {
      const { host, recoverable, errors, warnings } = hydrateAndVerify(
        <Hanzo theme={theme}>
          <grid.Grid cols={2}>
            <grid.Cell>
              <Card>
                <CardHeader>
                  <CardTitle>SSR Check ({theme})</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge>Ready</Badge>
                  <Input placeholder="API key" />
                  <Button>Submit</Button>
                  <Toggle>Mute</Toggle>
                  <Tabs defaultValue="overview">
                    <TabsList>
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                    </TabsList>
                    <TabsContent value="overview">Tab body</TabsContent>
                  </Tabs>
                  <Collapsible>
                    <CollapsibleTrigger>Details</CollapsibleTrigger>
                    <CollapsibleContent>Hidden details</CollapsibleContent>
                  </Collapsible>
                  <Repo name="hanzoai/ui" href="https://hanzo.ai" stars={100} />
                </CardContent>
              </Card>
            </grid.Cell>
          </grid.Grid>
        </Hanzo>,
      )

      expect(recoverable, `recoverable errors in ${theme}`).toEqual([])
      expect(formatCalls(errors), `console.error calls in ${theme}`).toEqual([])
      expect(formatCalls(warnings), `console.warn calls in ${theme}`).toEqual([])
      expect(host.querySelector('[data-slot="card"]')).not.toBeNull()
      expect(host.querySelector('[data-slot="button"]')?.textContent).toContain('Submit')
      expect(host.querySelector('[data-slot="repo"]')).not.toBeNull()
    })
  }

  it('hydrates Phone layout from @hanzo/ui/gallery with zero errors', () => {
    const { host, recoverable, errors, warnings } = hydrateAndVerify(
      <Hanzo theme="dark">
        <Phone />
      </Hanzo>,
    )

    expect(recoverable).toEqual([])
    expect(formatCalls(errors)).toEqual([])
    expect(formatCalls(warnings)).toEqual([])
    expect(host.querySelector('[data-phone="demo"]')).not.toBeNull()
  })
})
