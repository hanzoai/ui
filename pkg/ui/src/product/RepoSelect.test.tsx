// @vitest-environment jsdom

/**
 * RepoSelect and BranchSelect are ChipSelect with a shape: `owner/name` rows,
 * a footer that says why the list is partial, a link out that cannot run
 * script, and loaders in the host's own spelling.
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../gui-config'
import { audit } from '../../test/axe'
import { BranchSelect, branchName } from './BranchSelect'
import { RepoSelect, address, followable, type Repo, type RepoLoad } from './RepoSelect'

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

let host: HTMLDivElement
let root: Root

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
})

const mount = (ui: React.ReactNode) =>
  act(() => {
    root.render(
      <GuiProvider config={config} defaultTheme="dark">
        {ui}
      </GuiProvider>,
    )
  })

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0))
  })
}

const chip = () => host.querySelector<HTMLElement>('[data-slot="chip-select"]')!
const labels = () => [...document.querySelectorAll('[role="option"]')].map((o) => o.textContent)

const CLOUD: Repo = { owner: 'hanzo-inc', name: 'cloud', private: true, default_branch: 'main' }
const REPOS: Repo[] = [
  { owner: 'acmglobaltech', name: 'site' },
  { owner: 'activeuser', name: 'activeuser.js', full_name: 'activeuser/activeuser.js' },
  CLOUD,
]

const load: RepoLoad = async (q) => ({ repos: REPOS.filter((r) => address(r).includes(q)) })

describe('address', () => {
  it('prefers the full name the host has, else joins owner and name', () => {
    expect(address(CLOUD)).toBe('hanzo-inc/cloud')
    expect(address({ owner: 'a', name: 'b', full_name: 'A/B' })).toBe('A/B')
  })
})

describe('followable', () => {
  it('follows http(s) and a path on this origin, and nothing that could run', () => {
    expect(followable('https://github.com/apps/hanzo-platform/installations/new')).toBe(true)
    expect(followable('/platform/plugins?tab=github')).toBe(true)
    expect(followable('//evil.example/x')).toBe(false)
    expect(followable('javascript:alert(1)')).toBe(false)
    expect(followable('data:text/html,<script>')).toBe(false)
    // Browsers read a backslash as a slash and drop tabs: each of these leaves the site.
    expect(followable('/\\evil.example')).toBe(false)
    expect(followable('/\t/evil.example')).toBe(false)
    expect(followable('/ /evil.example')).toBe(false)
  })
})

describe('RepoSelect', () => {
  it('shows the short name on the chip and the whole address in the list, chosen first', async () => {
    mount(<RepoSelect value={CLOUD} onChange={() => {}} load={load} />)
    expect(chip().textContent).toBe('cloud')
    expect(chip().getAttribute('aria-label')).toBe('Repository: cloud')
    act(() => chip().click())
    await settle()
    expect(labels()).toEqual(['hanzo-inc/cloudPrivate', 'acmglobaltech/site', 'activeuser/activeuser.js'])
  })

  it('hands the host its own repository back', async () => {
    const onChange = vi.fn()
    mount(<RepoSelect value={CLOUD} onChange={onChange} load={load} />)
    act(() => chip().click())
    await settle()
    act(() => (document.querySelectorAll<HTMLElement>('[role="option"]')[1]).click())
    expect(onChange).toHaveBeenCalledWith(REPOS[0])
  })

  it('links out to troubleshoot, as a real anchor, and says nothing it was not handed', async () => {
    mount(
      <RepoSelect
        onChange={() => {}}
        load={load}
        troubleshoot={{ label: 'Troubleshoot GitHub connection', href: '/platform/plugins?tab=github' }}
      />,
    )
    act(() => chip().click())
    await settle()
    const footer = document.querySelector('[data-slot="chip-select-footer"]')!
    expect(footer.textContent).toBe('Troubleshoot GitHub connection')
    const link = footer.querySelector('a')!
    expect(link.textContent).toBe('Troubleshoot GitHub connection')
    expect(link.getAttribute('href')).toBe('/platform/plugins?tab=github')
  })

  it('filters by tab: the first lists every row, another the rows from its source', async () => {
    const rows = [
      { owner: 'hanzo', name: 'cloud', source: 'forge' },
      { owner: 'acme', name: 'site', source: 'github' },
    ]
    mount(
      <RepoSelect
        onChange={() => {}}
        load={async () => ({ repos: rows })}
        tabs={[
          { id: 'all', label: 'All' },
          { id: 'forge', label: 'Organization' },
          { id: 'github', label: 'GitHub' },
        ]}
      />,
    )
    act(() => chip().click())
    await settle()
    expect(labels()).toEqual(['hanzo/cloud', 'acme/site'])
    const github = [...document.querySelectorAll<HTMLElement>('[data-slot="chip-select-tab"]')].find((t) => t.textContent === 'GitHub')!
    act(() => github.click())
    await settle()
    expect(labels()).toEqual(['acme/site'])
    expect(github.getAttribute('aria-selected')).toBe('true')
  })

  it('pins the chosen repository only on the tab it belongs to', async () => {
    const rows = [
      { owner: 'hanzo', name: 'cloud', source: 'forge' },
      { owner: 'acme', name: 'site', source: 'github' },
    ]
    mount(
      <RepoSelect
        value={{ ...rows[0]!, full_name: 'hanzo/cloud' }}
        onChange={() => {}}
        load={async () => ({ repos: rows })}
        tabs={[
          { id: 'all', label: 'All' },
          { id: 'forge', label: 'Organization' },
          { id: 'github', label: 'GitHub' },
        ]}
      />,
    )
    act(() => chip().click())
    await settle()
    const tab = (name: string) => [...document.querySelectorAll<HTMLElement>('[data-slot="chip-select-tab"]')].find((t) => t.textContent === name)!
    act(() => tab('GitHub').click())
    await settle()
    expect(labels()).toEqual(['acme/site'])
    act(() => tab('Organization').click())
    await settle()
    expect(labels()).toEqual(['hanzo/cloud'])
    expect(document.querySelector('[role="option"]')?.getAttribute('aria-selected')).toBe('true')
  })

  it('draws no link for an address that could run script', async () => {
    mount(<RepoSelect onChange={() => {}} load={load} troubleshoot={{ label: 'Fix', href: 'javascript:alert(1)' }} />)
    act(() => chip().click())
    await settle()
    expect(document.querySelector('[data-slot="chip-select-link"]')).toBeNull()
  })

  it('shows the host connect prompt above the list', async () => {
    mount(<RepoSelect onChange={() => {}} load={load} connect={<button type="button">Connect GitHub</button>} />)
    act(() => chip().click())
    await settle()
    expect(document.querySelector('[data-slot="chip-select-cta"]')?.textContent).toBe('Connect GitHub')
  })

  it('runs the row action on the host repository', async () => {
    const onPress = vi.fn()
    mount(<RepoSelect onChange={() => {}} load={load} action={{ label: 'Add to project', onPress }} />)
    act(() => chip().click())
    await settle()
    const f = document.querySelector<HTMLInputElement>('[data-slot="chip-select-input"]')!
    act(() => {
      f.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true, cancelable: true }))
    })
    expect(onPress).toHaveBeenCalledWith(REPOS[0])
  })

  it('has no axe violations open', async () => {
    mount(
      <RepoSelect
        value={CLOUD}
        onChange={() => {}}
        load={load}
        troubleshoot={{ label: 'Troubleshoot GitHub connection', href: '/platform/plugins' }}
      />,
    )
    act(() => chip().click())
    await settle()
    expect(await audit(document.body)).toEqual([])
  })
})

describe('BranchSelect', () => {
  it('reads bare names and rows carrying a name alike', async () => {
    expect(branchName('main')).toBe('main')
    expect(branchName({ name: 'dev' })).toBe('dev')
    const calls: [string, string | null | undefined][] = []
    mount(
      <BranchSelect
        value="main"
        onChange={() => {}}
        load={async (q, after) => {
          calls.push([q, after])
          return { branches: ['admin-customer', { name: 'agentnode' }, 'main'] }
        }}
      />,
    )
    expect(chip().textContent).toBe('main')
    expect(chip().getAttribute('aria-label')).toBe('Branch: main')
    act(() => chip().click())
    await settle()
    expect(calls).toEqual([['', null]])
    expect(labels()).toEqual(['main', 'admin-customer', 'agentnode'])
    const f = document.querySelector<HTMLInputElement>('[data-slot="chip-select-input"]')!
    expect(f.getAttribute('placeholder')).toBe('Search branches…')
  })

  it('reports the chosen name', async () => {
    const onChange = vi.fn()
    mount(<BranchSelect value="main" onChange={onChange} load={async () => ({ branches: ['main', 'dev'] })} />)
    act(() => chip().click())
    await settle()
    act(() => (document.querySelectorAll<HTMLElement>('[role="option"]')[1]).click())
    expect(onChange).toHaveBeenCalledWith('dev')
  })

  it('has no axe violations open', async () => {
    mount(<BranchSelect value="main" onChange={() => {}} load={async () => ({ branches: ['main', 'dev'] })} />)
    act(() => chip().click())
    await settle()
    expect(await audit(document.body)).toEqual([])
  })
})
