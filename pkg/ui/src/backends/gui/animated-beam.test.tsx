// @vitest-environment jsdom

/**
 * AnimatedBeam's contract: the path it draws between two boxes and redraws
 * when one of them resizes, the gradient its flowing stroke is painted from
 * and the two ends it spans, the normalised dash that stroke is drawn over,
 * and that it stays inert (an
 * empty `d`, no throw) until all three anchors are actually mounted — on the
 * server included, where there is nothing to measure.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import * as React from 'react'
import { GuiProvider, XStack, YStack, type GuiElement } from '@hanzo/gui'

import config from '../../gui-config'
import { AnimatedBeam } from './animated-beam'

type Box = { left: number; top: number; width: number; height: number }

/** Pins one element's box, the way a real layout would. */
const rect = (el: Element, box: Box) => {
  el.getBoundingClientRect = () => ({
    ...box,
    right: box.left + box.width,
    bottom: box.top + box.height,
    x: box.left,
    y: box.top,
    toJSON() {},
  })
}

/** A ResizeObserver that records what it watches and can be fired by hand. */
const observers: { fire: () => void; watched: Element[] }[] = []
beforeEach(() => {
  observers.length = 0
  globalThis.ResizeObserver = class {
    watched: Element[] = []
    constructor(cb: ResizeObserverCallback) {
      observers.push({ fire: () => cb([], this), watched: this.watched })
    }
    observe(el: Element) {
      this.watched.push(el)
    }
    unobserve() {}
    disconnect() {}
  }
})

const mount = () => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  return {
    host,
    render: (node: React.ReactNode) => act(() => root.render(node)),
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

const flowOf = (host: Element) => host.querySelector<SVGPathElement>('[data-slot="animated-beam-flow"]')!
const baseOf = (host: Element) => host.querySelector<SVGPathElement>('[data-slot="animated-beam"] path')!
/** The two ends the gradient runs between, as the svg carries them. */
const span = (host: Element) => {
  const gradient = host.querySelector('linearGradient')!
  return ['x1', 'y1', 'x2', 'y2'].map((a) => gradient.getAttribute(a))
}

/** Three plain boxes and a beam between two of them, every box pinned at commit. */
const Plain = ({ container, from, to }: { container: Box; from: Box; to: Box }) => {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const fromRef = React.useRef<HTMLDivElement>(null)
  const toRef = React.useRef<HTMLDivElement>(null)
  const pin = (ref: React.RefObject<HTMLDivElement | null>, box: Box) => (el: HTMLDivElement | null) => {
    ref.current = el
    if (el) rect(el, box)
  }
  return (
    <div ref={pin(containerRef, container)}>
      <div ref={pin(fromRef, from)} />
      <div ref={pin(toRef, to)} />
      <AnimatedBeam containerRef={containerRef} fromRef={fromRef} toRef={toRef} />
    </div>
  )
}

/** The same beam anchored to gui stacks, under the real provider. */
const Stacks = () => {
  const containerRef = React.useRef<GuiElement>(null)
  const fromRef = React.useRef<GuiElement>(null)
  const toRef = React.useRef<GuiElement>(null)
  return (
    <GuiProvider config={config} defaultTheme="dark">
      <XStack ref={containerRef}>
        <YStack ref={fromRef} />
        <YStack ref={toRef} />
        <AnimatedBeam containerRef={containerRef} fromRef={fromRef} toRef={toRef} />
      </XStack>
    </GuiProvider>
  )
}

describe('AnimatedBeam', () => {
  it('renders on the server as an empty svg, keyframe hoisted beside it', () => {
    const markup = renderToStaticMarkup(
      <GuiProvider config={config} defaultTheme="dark">
        <AnimatedBeam />
      </GuiProvider>,
    )
    expect(markup).toMatch(/<svg[^>]*data-slot="animated-beam"/)
    expect(markup).toMatch(/<path[^>]*data-slot="animated-beam-flow"[^>]*d=""/)
    expect(markup).toMatch(/<style[^>]*>[^<]*@keyframes beam-draw\b/)
  })

  it('draws nothing until container, from and to are all mounted', () => {
    const { render, cleanup, host } = mount()
    const containerRef = React.createRef<HTMLDivElement>()
    const fromRef = React.createRef<HTMLDivElement>()

    render(
      <div ref={containerRef}>
        <div ref={fromRef} />
        <AnimatedBeam containerRef={containerRef} fromRef={fromRef} />
      </div>,
    )

    expect(baseOf(host).getAttribute('d')).toBe('')
    expect(flowOf(host).getAttribute('d')).toBe('')
    expect(observers).toHaveLength(0)
    cleanup()
  })

  it('draws a quadratic curve between the two boxes, relative to the container', () => {
    const { render, cleanup, host } = mount()
    render(
      <Plain
        container={{ left: 100, top: 50, width: 400, height: 200 }}
        from={{ left: 100, top: 140, width: 20, height: 20 }}
        to={{ left: 480, top: 140, width: 20, height: 20 }}
      />,
    )

    // from (10,100) → to (390,100) in container space; control at the midpoint, 50 above.
    expect(baseOf(host).getAttribute('d')).toBe('M 10 100 Q 200 50 390 100')
    expect(flowOf(host).getAttribute('d')).toBe('M 10 100 Q 200 50 390 100')
    expect(span(host)).toEqual(['10', '100', '390', '100'])
    cleanup()
  })

  it('spans the gradient from one end to the other, so a vertical beam still paints', () => {
    const { render, cleanup, host } = mount()
    render(
      <Plain
        container={{ left: 0, top: 0, width: 200, height: 300 }}
        from={{ left: 90, top: 0, width: 20, height: 20 }}
        to={{ left: 90, top: 280, width: 20, height: 20 }}
      />,
    )

    // Both ends and the control point share x=100: the curve's box has no
    // width, which a bounding-box gradient would leave unpainted.
    expect(flowOf(host).getAttribute('d')).toBe('M 100 10 Q 100 -40 100 290')
    expect(host.querySelector('linearGradient')!.getAttribute('gradientUnits')).toBe('userSpaceOnUse')
    expect(span(host)).toEqual(['100', '10', '100', '290'])
    cleanup()
  })

  it('watches all three boxes and redraws when one of them changes', () => {
    const { render, cleanup, host } = mount()
    render(
      <Plain
        container={{ left: 0, top: 0, width: 400, height: 200 }}
        from={{ left: 0, top: 90, width: 20, height: 20 }}
        to={{ left: 380, top: 90, width: 20, height: 20 }}
      />,
    )
    const [observer] = observers
    const container = host.firstElementChild!
    const [from, to] = container.children

    expect(observer.watched).toEqual([container, from, to])

    rect(to, { left: 380, top: 170, width: 20, height: 20 })
    act(() => observer.fire())
    expect(flowOf(host).getAttribute('d')).toBe('M 10 100 Q 200 50 390 180')

    rect(container, { left: 0, top: 0, width: 800, height: 200 })
    act(() => observer.fire())
    expect(flowOf(host).getAttribute('d')).toBe('M 10 100 Q 200 50 390 180')
    cleanup()
  })

  it('measures gui stacks as anchors the same as plain elements', () => {
    const { render, cleanup, host } = mount()
    render(<Stacks />)
    const [observer] = observers
    const container = host.querySelector('[data-slot="animated-beam"]')!.parentElement!
    const [from, to] = container.children

    expect(observer.watched).toEqual([container, from, to])

    rect(container, { left: 0, top: 0, width: 300, height: 100 })
    rect(from, { left: 0, top: 40, width: 20, height: 20 })
    rect(to, { left: 280, top: 0, width: 20, height: 20 })
    act(() => observer.fire())
    expect(flowOf(host).getAttribute('d')).toBe('M 10 50 Q 150 -40 290 10')
    cleanup()
  })

  it('wires the flowing stroke to a linear gradient built from the two colors', () => {
    const { render, cleanup, host } = mount()
    render(<AnimatedBeam gradientStartColor="#111111" gradientStopColor="#222222" />)

    const svg = host.querySelector('[data-slot="animated-beam"]')!
    const stops = [...svg.querySelectorAll('stop')]
    const gradientId = svg.querySelector('linearGradient')!.getAttribute('id')

    expect(flowOf(host).getAttribute('stroke')).toBe(`url(#${gradientId})`)
    expect(stops).toHaveLength(2)
    expect(stops[0].getAttribute('stop-color')).toBe('#111111')
    expect(stops[1].getAttribute('stop-color')).toBe('#222222')
    cleanup()
  })

  it('gives every beam its own gradient', () => {
    const { render, cleanup, host } = mount()
    render(
      <>
        <AnimatedBeam />
        <AnimatedBeam />
      </>,
    )
    const ids = [...host.querySelectorAll('linearGradient')].map((g) => g.getAttribute('id'))
    expect(new Set(ids).size).toBe(2)
    cleanup()
  })

  it('paints the base stroke from pathColor/pathWidth, dim and always visible', () => {
    const { render, cleanup, host } = mount()
    render(<AnimatedBeam pathColor="tomato" pathWidth={4} />)

    const base = baseOf(host)
    expect(base.getAttribute('stroke')).toBe('tomato')
    expect(base.getAttribute('stroke-width')).toBe('4')
    expect(base.getAttribute('stroke-opacity')).toBe('0.2')
    expect(base.style.animationName).toBe('')
    expect(base.hasAttribute('stroke-dasharray')).toBe(false)
    cleanup()
  })

  it('draws the flowing stroke over one normalised unit, on duration and delay, hidden until its first pass', () => {
    const { render, cleanup, host } = mount()
    render(<AnimatedBeam duration={5} delay={1.5} pathWidth={3} />)

    const flow = flowOf(host)
    expect(flow.getAttribute('pathLength')).toBe('1')
    expect(flow.getAttribute('stroke-dasharray')).toBe('1')
    expect(flow.getAttribute('stroke-width')).toBe('3')
    expect(flow.style.animationName).toBe('beam-draw')
    expect(flow.style.animationDuration).toBe('5s')
    expect(flow.style.animationDelay).toBe('1.5s')
    expect(flow.style.animationIterationCount).toBe('infinite')
    expect(flow.style.animationFillMode).toBe('backwards')
    cleanup()
  })

  it('hoists the keyframe the flowing stroke names, once for any number of beams', () => {
    const { render, cleanup } = mount()
    render(
      <>
        <AnimatedBeam />
        <AnimatedBeam />
      </>,
    )
    const sheets = [...document.querySelectorAll('style')].filter((s) => s.textContent?.includes('beam-draw'))
    expect(sheets).toHaveLength(1)
    expect(sheets[0].textContent).toMatch(/@keyframes beam-draw\b/)
    expect(sheets[0].textContent).toMatch(/prefers-reduced-motion: reduce/)
    cleanup()
  })

  it('lays the svg over the whole container, bow showing, out of the way of pointer events', () => {
    const { render, cleanup, host } = mount()
    render(<AnimatedBeam />)

    const svg = host.querySelector<SVGSVGElement>('[data-slot="animated-beam"]')!
    expect(svg.style.position).toBe('absolute')
    expect(svg.style.inset).toBe('0px')
    expect(svg.style.width).toBe('100%')
    expect(svg.style.height).toBe('100%')
    expect(svg.style.overflow).toBe('visible')
    expect(svg.style.pointerEvents).toBe('none')
    cleanup()
  })

  it('lets a caller override its placement through style', () => {
    const { render, cleanup, host } = mount()
    render(<AnimatedBeam style={{ zIndex: 3, pointerEvents: 'auto' }} />)

    const svg = host.querySelector<SVGSVGElement>('[data-slot="animated-beam"]')!
    expect(svg.style.position).toBe('absolute')
    expect(svg.style.zIndex).toBe('3')
    expect(svg.style.pointerEvents).toBe('auto')
    cleanup()
  })
})
