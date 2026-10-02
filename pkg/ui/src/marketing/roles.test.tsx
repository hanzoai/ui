// @vitest-environment jsdom

/**
 * The copy, controls and surfaces a marketing page is set in, asserted on
 * compiled markup: the element each one is, the slot it marks, and the gui
 * classes its props became. Never on computed style.
 */
import { GuiProvider } from '@hanzo/gui'
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { Link as Router } from '../backends/gui/link'
import config from '../gui-config'
import { Action, Chip, More } from './controls'
import { TextLink } from './Cta'
import { Document } from './document'
import { Pager } from './pager'
import { Pair } from './pair'
import { Run } from './run'
import { Cell, Lattice, Leaf, Lift, Reveal } from './surface'
import { Claim, Display, Eyebrow, Lede, Title } from './type'

/** The markup alone: gui writes every rule it has generated so far into a
 *  style block, so an assertion that a class is ABSENT must not read the sheet. */
const html = (node: ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  ).replace(/<style[\s\S]*?<\/style>/g, '')

describe('the copy a page is set in', () => {
  it('is the element the role is, a block of running text, marked by slot', () => {
    const out = html(
      <>
        <Eyebrow>Label</Eyebrow>
        <Display>Heading</Display>
        <Title>Section</Title>
        <Title quiet render="h3">Sub</Title>
        <Lede>Paragraph.</Lede>
        <Claim>Category.</Claim>
      </>,
    )
    expect(out).toMatch(/<p[^>]*data-slot="eyebrow"/)
    expect(out).toMatch(/<h1[^>]*data-slot="display"/)
    expect(out).toMatch(/<h2[^>]*data-slot="title"/)
    expect(out).toMatch(/<h3[^>]*data-slot="title"/)
    expect(out).toMatch(/<p[^>]*data-slot="lede"/)
    expect(out.match(/_dsp-revert-lay/g)?.length).toBeGreaterThanOrEqual(6)
    expect(out).toMatch(/_ws-inherit/)
  })

  it('a stated size is the whole size: the display ramp steps up only when none is given', () => {
    expect(html(<Display>Big</Display>)).toMatch(/_fs-_sm_/)
    expect(html(<Display fontSize="$8">Set</Display>)).not.toMatch(/_fs-_sm_/)
  })
})

describe('the controls', () => {
  it('an Action is an anchor by default, a button when asked, and `fill` is marked', () => {
    expect(html(<Action href="/x">Go</Action>)).toMatch(/<a[^>]*data-slot="action"/)
    expect(html(<Action render="button" type="button">Do</Action>)).toMatch(/<button[^>]*data-slot="action"/)
    expect(html(<Action href="/x" fill>Go</Action>)).toMatch(/data-fill=""/)
  })

  it('an internal page goes through the host router link; an external address or a file stays an anchor', () => {
    const Host = ({ href, ...p }: { href: string; children?: ReactNode }) => <a data-router="" href={href} {...p} />
    const out = html(
      <Router value={Host as never}>
        <More href="/inside">In</More>
        <More href="https://out.example">Out</More>
        <More href="/skill.md">File</More>
        <More href="/models/anthropic/claude-opus-5.5">Page</More>
      </Router>,
    )
    expect(out).toMatch(/<a data-router="" href="\/inside"/)
    expect(out).not.toMatch(/data-router="" href="https:\/\/out\.example"/)
    expect(out).toMatch(/href="https:\/\/out\.example"/)
    // A file is handed back as it is, so it is an anchor; a version in a page's name is not an extension.
    expect(out).not.toMatch(/data-router="" href="\/skill\.md"/)
    expect(out).toMatch(/href="\/skill\.md"/)
    expect(out).toMatch(/<a data-router="" href="\/models\/anthropic\/claude-opus-5\.5"/)
  })

  it('a caller-stated ink holds under the pointer, the way a value stated on the element did', () => {
    expect(html(<More href="/x">x</More>)).toMatch(/_col-0hover/)
    expect(html(<More href="/x" color="var(--foreground)">x</More>)).not.toMatch(/_col-0hover/)
  })

  it('a Chip answers the pointer only when it is a link', () => {
    expect(html(<Chip>word</Chip>)).not.toMatch(/0hover/)
    expect(html(<Chip href="/x">word</Chip>)).toMatch(/0hover/)
  })
})

describe('surfaces and marks', () => {
  it('a Leaf is a group its marks read', () => {
    const out = html(
      <Leaf href="/x">
        <Lift>name</Lift>
        <Reveal>more</Reveal>
      </Leaf>,
    )
    expect(out).toMatch(/data-slot="leaf"/)
    expect(out).toMatch(/t_group_true/)
    expect(out).toMatch(/data-slot="lift"/)
    expect(out).toMatch(/_grouptrue-hover/)
    expect(html(<Cell render="button">c</Cell>)).toMatch(/<button[^>]*data-slot="cell"/)
  })

  it('a Lattice is a decoration a screen reader skips', () => {
    const out = html(<Lattice size={24} opacity={0.04} />)
    expect(out).toMatch(/data-slot="lattice"/)
    expect(out).toMatch(/aria-hidden="true"/)
  })
})

describe('Pair, Pager, Run, Document', () => {
  it('a Pair is a grid that runs in a row from 640', () => {
    const out = html(
      <Pair>
        <span>a</span>
        <span>b</span>
      </Pair>,
    )
    expect(out).toMatch(/_dsp-grid/)
    expect(out).toMatch(/_sm_column/)
  })

  it('a Pager is one labelled button per page, the current one marked', () => {
    const out = html(<Pager count={3} index={1} onSelect={() => {}} />)
    expect(out.match(/<button/g)).toHaveLength(3)
    expect(out.match(/aria-current="true"/g)).toHaveLength(1)
    expect(out).toContain('aria-label="Go to slide 2"')
  })

  it('a Run is keyed on data-motion and carries its step', () => {
    const out = html(
      <Run step={0.31}>
        <span data-beat={1}>a</span>
      </Run>,
    )
    expect(out).toMatch(/data-motion="run"/)
    expect(out).toContain('--run-step:0.31s')
  })

  it('a Document holds authored markup under its slot', () => {
    expect(html(<Document html="<h2>Terms</h2><p>Body.</p>" />)).toContain('<div data-slot="document"><h2>Terms</h2>')
  })
})

describe('TextLink in a sentence', () => {
  it('is set in the sentence’s own face and size, as a link or as a button', () => {
    expect(html(<TextLink href="/terms">Terms</TextLink>)).toMatch(/_fs-inherit/)
    expect(html(<TextLink onPress={() => {}}>again</TextLink>)).toMatch(/<button[^>]*_fs-inherit/)
  })
})
