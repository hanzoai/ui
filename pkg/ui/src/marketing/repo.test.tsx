// @vitest-environment jsdom

/**
 * The repository card and the small counts around it: what is drawn, what is
 * left out when the caller does not hold the figure, and what a link is.
 */
import { GuiProvider } from '@hanzo/gui'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import config from '../gui-config'
import { Counts, Faces, initials, Languages, Repo } from './repo'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>
  )

describe('Counts', () => {
  it('draws each count it is given, grouped, and none it is not', () => {
    const both = html(<Counts stars={12840} forks={3} />)
    expect(both).toContain('12,840')
    expect(both).toContain('aria-label="12,840 stars"')
    expect(both).toContain('aria-label="3 forks"')
    const stars = html(<Counts stars={7} />)
    expect(stars).toContain('data-slot="count-stars"')
    expect(stars).not.toContain('data-slot="count-forks"')
  })

  it('draws a zero, and nothing when it holds neither', () => {
    expect(html(<Counts stars={0} />)).toContain('aria-label="0 stars"')
    expect(html(<Counts />)).not.toContain('data-slot="counts"')
    expect(html(<Counts stars={Number.NaN} forks={-1} />)).not.toContain(
      'data-slot="counts"'
    )
  })
})

describe('Repo', () => {
  it('names the repository, says what it is, and carries the actions it is handed', () => {
    const out = html(
      <Repo
        name="hanzoai/engine"
        description="High performance inference"
        language="Rust"
        stars={5}
        actions={<button>Star</button>}
      />
    )
    expect(out).toContain('data-slot="repo"')
    expect(out).toContain('hanzoai/engine')
    expect(out).toContain('High performance inference')
    expect(out).toContain('Rust')
    expect(out).toContain('<button>Star</button>')
    expect(out).not.toContain('<a ')
  })

  it('is a link only when it is given somewhere to go', () => {
    const out = html(
      <Repo
        name="hanzoai/engine"
        href="https://github.com/hanzoai/engine"
        target="_blank"
        rel="noopener noreferrer"
      />
    )
    expect(out).toMatch(/<a [^>]*href="https:\/\/github.com\/hanzoai\/engine"/)
    expect(out).toContain('rel="noopener noreferrer"')
  })

  it('files the repository under a tag when it has one', () => {
    expect(html(<Repo name="a/b" tag="AI infra" />)).toContain('AI infra')
    expect(html(<Repo name="a/b" />)).not.toContain('AI infra')
  })

  it('draws no count it does not hold', () => {
    expect(html(<Repo name="a/b" />)).not.toContain('data-slot="counts"')
  })
})

describe('Languages', () => {
  it('is one bar over the sum of the shares, with each named in the legend', () => {
    const out = html(
      <Languages
        label="Languages"
        share={[
          { name: 'Rust', share: 75 },
          { name: 'Go', share: 25 },
        ]}
      />
    )
    expect(out).toContain('Rust 75.0%')
    expect(out).toContain('Go 25.0%')
    expect(out).toContain('width:75.00%')
  })

  it('leaves out a language with no share, and draws nothing with none at all', () => {
    expect(
      html(<Languages label="x" share={[{ name: 'C', share: 0 }]} />)
    ).not.toContain('data-slot="languages"')
    expect(html(<Languages label="x" share={[]} />)).not.toContain(
      'data-slot="languages"'
    )
  })
})

describe('Faces', () => {
  it('reads two initials a name, and counts the rest past the maximum', () => {
    expect(initials('Ada Lovelace')).toBe('AL')
    expect(initials('  grace  ')).toBe('G')
    const out = html(
      <Faces
        max={2}
        people={[
          { name: 'Ada Lovelace' },
          { name: 'Grace Hopper' },
          { name: 'Alan Turing' },
          { name: 'Edsger Dijkstra' },
        ]}
      />
    )
    expect(out).toContain('AL')
    expect(out).toContain('GH')
    expect(out).not.toContain('AT')
    expect(out).toContain('+2')
  })

  it('draws nothing for no one', () => {
    expect(html(<Faces people={[]} />)).not.toContain('data-slot="faces"')
  })
})
