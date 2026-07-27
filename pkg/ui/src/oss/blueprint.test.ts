import { describe, it, expect } from 'vitest'

import { parseBlueprint } from './blueprint'
import { normalizeOssApps, blueprintBase, logoUrl, ownerRepo, hasDeploySource } from './catalog'

describe('parseBlueprint — what a deploy actually provisions', () => {
  it('reads services, images and ports from a real compose file', () => {
    const yaml = [
      "version: '3.8'",
      'services:',
      '  web:',
      '    image: nginx:1.27-alpine',
      '    ports:',
      '      - "8080:80"',
      '      - "443:443"',
      '    environment:',
      '      - APP_URL=https://example.com',
      '      - SECRET_KEY=changeme',
      '  db:',
      '    image: postgres:16',
      '    environment:',
      '      - POSTGRES_PASSWORD=pw',
      'volumes:',
      '  pgdata:',
    ].join('\n')
    const bp = parseBlueprint(yaml)
    expect(bp.services.map((s) => s.name)).toEqual(['web', 'db'])
    expect(bp.services[0].image).toBe('nginx:1.27-alpine')
    expect(bp.services[0].ports).toEqual(['8080:80', '443:443'])
    expect(bp.services[1].image).toBe('postgres:16')
    // KEYS only — the values are routinely secrets and must never be surfaced.
    expect(bp.env).toEqual(['APP_URL', 'POSTGRES_PASSWORD', 'SECRET_KEY'])
  })

  it('stops at the end of the services block (a trailing top-level key is not a service)', () => {
    const bp = parseBlueprint(['services:', '  app:', '    image: a:1', 'networks:', '  default:'].join('\n'))
    expect(bp.services.map((s) => s.name)).toEqual(['app'])
  })

  it('marks a build-from-source service as having no image rather than guessing one', () => {
    const bp = parseBlueprint(['services:', '  app:', '    build: .'].join('\n'))
    expect(bp.services).toEqual([{ name: 'app', ports: [] }])
  })

  it('is total on input it cannot read — empty, junk, or no services block', () => {
    for (const input of ['', 'not yaml at all', '{[garbage', 'version: "3"']) {
      expect(parseBlueprint(input)).toEqual({ services: [], env: [] })
    }
  })
})

describe('catalog — one shape for every surface', () => {
  it('normalizes rows, drops the unusable, and de-dupes by id', () => {
    const apps = normalizeOssApps([
      { id: 'n8n', name: 'n8n', description: ' Automate ', tags: ['automation', ''], links: { github: 'https://github.com/n8n-io/n8n' } },
      { id: 'n8n', name: 'n8n duplicate' },
      { name: 'no id — dropped' },
      { id: 'bare' },
    ])
    expect(apps.map((a) => a.id)).toEqual(['n8n', 'bare'])
    expect(apps[0].description).toBe('Automate')
    expect(apps[0].tags).toEqual(['automation'])
    // A missing version is rendered as the catalog's own convention, not invented.
    expect(apps[1].version).toBe('latest')
    // A row with no name falls back to its id rather than rendering blank.
    expect(apps[1].name).toBe('bare')
  })

  it('accepts a wrapped payload as well as a bare array', () => {
    expect(normalizeOssApps({ data: [{ id: 'a', name: 'A' }] }).map((a) => a.id)).toEqual(['a'])
    expect(normalizeOssApps(null)).toEqual([])
  })

  it('builds asset URLs that survive a hostile id', () => {
    expect(blueprintBase('https://cdn.example.com/', 'a b/../c')).toBe(
      'https://cdn.example.com/blueprints/a%20b%2F..%2Fc',
    )
    const [app] = normalizeOssApps([{ id: 'n8n', name: 'n8n', logo: 'logo.svg' }])
    expect(logoUrl('https://cdn.example.com', app)).toBe('https://cdn.example.com/blueprints/n8n/logo.svg')
  })

  it('returns no logo URL when the row carries none (so a surface shows its monogram)', () => {
    const [app] = normalizeOssApps([{ id: 'x', name: 'X' }])
    expect(logoUrl('https://cdn.example.com', app)).toBeNull()
  })

  it('derives the maker identity from the repo, and only from a real one', () => {
    expect(ownerRepo('https://github.com/n8n-io/n8n.git')).toBe('n8n-io/n8n')
    expect(ownerRepo('https://gitlab.com/a/b')).toBeNull()
    expect(ownerRepo(undefined)).toBeNull()
  })

  it('treats only an app with buildable source as one-click deployable', () => {
    const [withRepo] = normalizeOssApps([{ id: 'a', name: 'A', links: { github: 'https://github.com/o/r' } }])
    const [without] = normalizeOssApps([{ id: 'b', name: 'B', links: { website: 'https://x.dev' } }])
    expect(hasDeploySource(withRepo)).toBe(true)
    expect(hasDeploySource(without)).toBe(false)
  })
})
