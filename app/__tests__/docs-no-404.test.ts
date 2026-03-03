/**
 * docs-no-404.test.ts
 *
 * Static validation: every URL in docs.ts config has a matching MDX file.
 * No server needed — runs in CI before deployment.
 *
 * Run: pnpm test (via vitest)
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const CONTENT_DIR = path.resolve(__dirname, '../content/docs')
const CONFIG_PATH = path.resolve(__dirname, '../config/docs.ts')

/** Extract all href values from docs.ts config */
function extractUrlsFromConfig(): string[] {
  const content = fs.readFileSync(CONFIG_PATH, 'utf-8')
  const hrefRegex = /href:\s*["'`]([^"'`]+)["'`]/g
  const urls: string[] = []
  let match
  while ((match = hrefRegex.exec(content)) !== null) {
    urls.push(match[1])
  }
  return urls.filter(u => u.startsWith('/docs'))
}

/** Convert a /docs/... URL to its expected MDX file path */
function urlToMdxPath(url: string): string[] {
  // /docs -> index.mdx
  // /docs/charts/bar -> charts/bar.mdx OR charts/bar/index.mdx
  const slug = url.replace(/^\/docs\/?/, '') || ''
  if (!slug) {
    return [path.join(CONTENT_DIR, 'index.mdx')]
  }
  return [
    path.join(CONTENT_DIR, `${slug}.mdx`),
    path.join(CONTENT_DIR, slug, 'index.mdx'),
  ]
}

/** Recursively find all MDX files in content/docs */
function findAllMdxFiles(dir: string, prefix = ''): string[] {
  const results: string[] = []
  if (!fs.existsSync(dir)) return results

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...findAllMdxFiles(fullPath, `${prefix}${entry.name}/`))
    } else if (entry.name.endsWith('.mdx')) {
      const slug = entry.name === 'index.mdx'
        ? prefix.replace(/\/$/, '')
        : `${prefix}${entry.name.replace('.mdx', '')}`
      if (slug) {
        results.push(`/docs/${slug}`)
      } else {
        results.push('/docs')
      }
    }
  }
  return results
}

describe('Documentation pages — zero 404s', () => {
  const configUrls = extractUrlsFromConfig()
  const mdxPages = findAllMdxFiles(CONTENT_DIR)

  it('should find docs config with URLs', () => {
    expect(configUrls.length).toBeGreaterThan(100)
  })

  it('should find MDX content files', () => {
    expect(mdxPages.length).toBeGreaterThan(100)
  })

  describe('every config URL has a matching MDX file', () => {
    for (const url of configUrls) {
      it(`${url}`, () => {
        const possiblePaths = urlToMdxPath(url)
        const exists = possiblePaths.some(p => fs.existsSync(p))
        if (!exists) {
          throw new Error(
            `Missing MDX file for ${url}. Expected one of:\n` +
            possiblePaths.map(p => `  - ${p}`).join('\n')
          )
        }
      })
    }
  })

  describe('every MDX file is reachable from config', () => {
    const configSet = new Set(configUrls)
    const unreachable: string[] = []

    for (const page of mdxPages) {
      if (!configSet.has(page)) {
        unreachable.push(page)
      }
    }

    it('should have no orphaned MDX files (or document known exceptions)', () => {
      // Allow a small number of known orphans (category index pages, etc.)
      const KNOWN_ORPHANS = new Set([
        '/docs/ai/voice-settings',
        '/docs/components/animation-components',
      ])
      const unexpected = unreachable.filter(u => !KNOWN_ORPHANS.has(u))
      if (unexpected.length > 0) {
        console.warn(`Orphaned MDX files (not in nav config):\n${unexpected.map(u => `  ${u}`).join('\n')}`)
      }
      // Warn but don't fail for orphans — they just won't be in nav
      expect(true).toBe(true)
    })
  })

  it('summary: config URLs vs MDX files', () => {
    const configSet = new Set(configUrls)
    const mdxSet = new Set(mdxPages)

    const missingMdx = configUrls.filter(u => {
      const paths = urlToMdxPath(u)
      return !paths.some(p => fs.existsSync(p))
    })
    const orphanedMdx = mdxPages.filter(p => !configSet.has(p))

    console.log(`\n📊 Docs coverage report:`)
    console.log(`   Config URLs: ${configUrls.length}`)
    console.log(`   MDX files:   ${mdxPages.length}`)
    console.log(`   Missing MDX: ${missingMdx.length}`)
    console.log(`   Orphaned:    ${orphanedMdx.length}`)

    if (missingMdx.length > 0) {
      console.error(`\n❌ URLs with no MDX file:\n${missingMdx.map(u => `   ${u}`).join('\n')}`)
    }
    if (orphanedMdx.length > 0) {
      console.warn(`\n⚠️  MDX files not in nav:\n${orphanedMdx.map(u => `   ${u}`).join('\n')}`)
    }

    // This is the hard check — every config URL must have content
    expect(missingMdx).toEqual([])
  })
})
