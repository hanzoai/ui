// @vitest-environment jsdom

import type { ReactNode } from 'react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import {
  installGlobalExceptionReporter,
  reportException,
  reportFeedback,
  type FeedbackPayload,
} from './feedback'
import { FeedbackButton, FeedbackDialog } from './FeedbackButton'

const wrap = (node: ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)

const mount = (node: ReactNode) => {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() => root.render(wrap(node)))
  return {
    host,
    unmount: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('reportFeedback & reportException', () => {
  it('posts feedback payload to POST /v1/help/feedback with optional Bearer token', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = []
    const mockFetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init: init ?? {} })
      return new Response(JSON.stringify({ id: 'fb_01', status: 'received', kind: 'bug' }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      })
    })

    const res = await reportFeedback(
      {
        kind: 'bug',
        subject: 'Broken bar',
        message: 'Usage bar did not update',
        email: 'ada@hanzo.ai',
        app: 'pay',
        context: { plan: 'pro' },
      },
      { apiBase: 'https://api.hanzo.ai/', token: 'tok_abc', fetch: mockFetch as typeof fetch },
    )

    expect(res).toEqual({ id: 'fb_01', status: 'received', kind: 'bug' })
    expect(calls).toHaveLength(1)
    expect(calls[0]!.url).toBe('https://api.hanzo.ai/v1/help/feedback')
    expect(calls[0]!.init.method).toBe('POST')
    expect(calls[0]!.init.headers).toMatchObject({
      'Content-Type': 'application/json',
      Authorization: 'Bearer tok_abc',
    })
    const sent = JSON.parse(String(calls[0]!.init.body)) as FeedbackPayload
    expect(sent).toMatchObject({
      kind: 'bug',
      subject: 'Broken bar',
      message: 'Usage bar did not update',
      email: 'ada@hanzo.ai',
      app: 'pay',
      context: { plan: 'pro' },
    })
  })

  it('works anonymously without Authorization header', async () => {
    const mockFetch = vi.fn(async () =>
      new Response(JSON.stringify({ id: 'fb_anon', status: 'received', kind: 'feedback' }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      }),
    )
    const res = await reportFeedback(
      { kind: 'feedback', message: 'Love Zen!' },
      { apiBase: 'https://api.hanzo.ai', fetch: mockFetch as typeof fetch },
    )
    expect(res.id).toBe('fb_anon')
    const [, init] = mockFetch.mock.calls[0] as unknown as [string, RequestInit]
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined()
  })

  it('reportException formats stack, sends kind=exception, and never throws on network error', async () => {
    const okFetch = vi.fn(async () =>
      new Response(JSON.stringify({ id: 'ex_1', status: 'received', kind: 'exception' }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      }),
    )
    const err = new TypeError('Cannot read properties of undefined')
    const res = await reportException(err, {
      apiBase: 'https://api.hanzo.ai',
      app: 'app',
      user: 'ada',
      fetch: okFetch as typeof fetch,
    })
    expect(res?.id).toBe('ex_1')
    const sent = JSON.parse(String((okFetch.mock.calls[0] as unknown as [string, RequestInit])[1].body)) as FeedbackPayload
    expect(sent.kind).toBe('exception')
    expect(sent.app).toBe('app')
    expect(sent.user).toBe('ada')
    expect(sent.error).toContain('TypeError: Cannot read properties of undefined')
    expect(sent.stack).toContain('TypeError')

    const failingFetch = vi.fn(async () => {
      throw new Error('offline')
    })
    const quiet = await reportException(new Error('boom'), { fetch: failingFetch as typeof fetch })
    expect(quiet).toBeNull()
  })
})

describe('installGlobalExceptionReporter', () => {
  it('hooks error and unhandledrejection, deduplicates within window, enforces cap, and ignores self-endpoint/noise', async () => {
    const listeners = new Map<string, Set<(e: Event) => void>>()
    const target = {
      addEventListener: (type: string, fn: (e: Event) => void) => {
        if (!listeners.has(type)) listeners.set(type, new Set())
        listeners.get(type)!.add(fn)
      },
      removeEventListener: (type: string, fn: (e: Event) => void) => {
        listeners.get(type)?.delete(fn)
      },
    }
    const emit = (type: string, event: unknown) => {
      for (const fn of listeners.get(type) ?? []) fn(event as Event)
    }

    let clock = 10_000
    const mockFetch = vi.fn(async () =>
      new Response(JSON.stringify({ id: 'ex_2', status: 'received', kind: 'exception' }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const uninstall = installGlobalExceptionReporter({
      apiBase: 'https://api.hanzo.ai',
      app: 'pay',
      getUser: () => ({ user: 'ada', email: 'ada@hanzo.ai' }),
      dedupeWindowMs: 60_000,
      maxReports: 2,
      now: () => clock,
      fetch: mockFetch as typeof fetch,
      target,
    })

    // First crash reports once.
    emit('error', { error: new Error('Boom A'), message: 'Boom A', filename: 'main.js', lineno: 10, colno: 2 })
    // Same error within dedupeWindowMs is ignored.
    emit('error', { error: new Error('Boom A'), message: 'Boom A' })
    // Benign noise is ignored.
    emit('error', { message: 'ResizeObserver loop completed with undelivered notifications.' })
    emit('unhandledrejection', { reason: new DOMException('Aborted', 'AbortError') })
    // Self-endpoint error is ignored to prevent loops.
    emit('unhandledrejection', { reason: new Error('POST /v1/help/feedback failed') })

    expect(mockFetch).toHaveBeenCalledTimes(1)

    // Different rejection reports (hits maxReports = 2).
    clock += 1_000
    emit('unhandledrejection', { reason: new Error('Boom B') })
    expect(mockFetch).toHaveBeenCalledTimes(2)

    // Third distinct crash is dropped because maxReports = 2 was reached.
    clock += 120_000
    emit('error', { error: new Error('Boom C'), message: 'Boom C' })
    expect(mockFetch).toHaveBeenCalledTimes(2)

    uninstall()
    expect(listeners.get('error')?.size ?? 0).toBe(0)
    expect(listeners.get('unhandledrejection')?.size ?? 0).toBe(0)
  })
})

describe('FeedbackButton & FeedbackDialog', () => {
  it('submits a report and shows the returned reference ID', async () => {
    const onSubmit = vi.fn(async (payload: FeedbackPayload) => ({
      id: 'fb_999',
      status: 'received',
      kind: payload.kind,
    }))
    const onSubmitted = vi.fn()

    const { host, unmount } = mount(
      <FeedbackDialog
        open
        onOpenChange={() => {}}
        app="ui"
        user="ada"
        onSubmit={onSubmit}
        onSubmitted={onSubmitted}
      />,
    )

    // Pick Billing kind, enter message, click Send.
    const billingBtn = [...document.body.querySelectorAll('button')].find(
      (b) => b.getAttribute('data-kind') === 'billing',
    )!
    expect(billingBtn).toBeTruthy()
    act(() => billingBtn.click())

    const textarea = document.body.querySelector('textarea[aria-label="Message"]') as HTMLTextAreaElement
    expect(textarea).toBeTruthy()
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!
    act(() => {
      nativeSetter.call(textarea, 'Invoice PDF link returned 404')
      textarea.dispatchEvent(new Event('input', { bubbles: true }))
    })

    const sendBtn = [...document.body.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Send')!
    await act(async () => {
      sendBtn.click()
      await Promise.resolve()
    })

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'billing',
        message: 'Invoice PDF link returned 404',
        app: 'ui',
        user: 'ada',
      }),
    )
    expect(onSubmitted).toHaveBeenCalledWith({ id: 'fb_999', status: 'received', kind: 'billing' })
    expect(document.body.textContent).toContain('fb_999')
    expect(host).toBeTruthy()
    unmount()
  })

  it('renders FeedbackButton trigger', () => {
    const { host, unmount } = mount(<FeedbackButton app="app" label="Report bug" />)
    expect(host.textContent).toContain('Report bug')
    unmount()
  })
})
