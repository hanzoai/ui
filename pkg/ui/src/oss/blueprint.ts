/**
 * What an OSS blueprint actually provisions, read from its own `docker-compose.yml`.
 *
 * This is the one implementation. It was written twice before it lived here — once in
 * TypeScript for the console's App Store and once in vanilla JS for oss.hanzo.ai — and
 * two readers of the same file format drift, which means two surfaces can disagree
 * about what a deploy will start.
 *
 * Deliberately a SMALL structural reader, not a YAML implementation: it walks the
 * `services:` block by indentation and pulls only the keys a detail view shows.
 * Anything it cannot read is absent, never guessed, so a surface degrades to "no
 * blueprint detail" instead of asserting something false about what will run.
 *
 * Pure and total — it never throws on malformed or hostile input — so it is safe to
 * run on untrusted CDN content and testable without a DOM or a network.
 */

/**
 * One service a blueprint provisions. `image` is absent for a service built from
 * source (`build:` rather than `image:`).
 */
export type Service = { name: string; image?: string; ports: string[] }

/** What a blueprint provisions: the containers it starts and the config it expects. */
export type Blueprint = { services: Service[]; env: string[] }

/** Indent width of a line, tabs counted as one column (compose files are space-indented). */
const indent = (line: string): number => line.length - line.trimStart().length

/**
 * Parse the load-bearing facts out of a `docker-compose.yml`: the services it starts
 * (with image + published ports) and the environment keys it expects.
 *
 * Environment KEYS only — never the values, which are routinely secrets.
 */
export function parseBlueprint(yaml: string): Blueprint {
  const lines = String(yaml ?? '').split(/\r?\n/)
  const services: Service[] = []
  const env = new Set<string>()

  let servicesAt = -1 // indent of the `services:` key, -1 until seen
  let current: Service | null = null
  let currentAt = -1 // indent of the current service's name (bookkeeping, not a field)
  let listKey: 'ports' | 'environment' | null = null
  let listAt = -1

  for (const raw of lines) {
    const line = raw.replace(/\t/g, ' ')
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const col = indent(line)

    if (servicesAt < 0) {
      if (/^services\s*:/.test(trimmed)) servicesAt = col
      continue
    }
    // Dedent back to or past `services:` ends the block (e.g. a following `volumes:`).
    if (col <= servicesAt) {
      if (!/^services\s*:/.test(trimmed)) break
      continue
    }

    // A service name sits exactly one level inside `services:`.
    if (current === null || col <= currentAt) {
      const m = trimmed.match(/^([A-Za-z0-9._-]+)\s*:\s*$/)
      if (m) {
        current = { name: m[1], ports: [] }
        currentAt = col
        services.push(current)
        listKey = null
        continue
      }
    }
    if (!current) continue

    if (listKey && col > listAt && trimmed.startsWith('-')) {
      const item = trimmed.replace(/^-\s*/, '').replace(/^["']|["']$/g, '')
      if (listKey === 'ports') current.ports.push(item)
      else {
        const key = item.split(/[=:]/)[0]?.trim()
        if (key) env.add(key)
      }
      continue
    }
    listKey = null

    const img = trimmed.match(/^image\s*:\s*(.+)$/)
    if (img) {
      current.image = img[1].trim().replace(/^["']|["']$/g, '')
      continue
    }
    if (/^ports\s*:/.test(trimmed)) {
      listKey = 'ports'
      listAt = col
      continue
    }
    if (/^environment\s*:/.test(trimmed)) {
      listKey = 'environment'
      listAt = col
      continue
    }
  }

  return { services, env: [...env].sort((a, b) => a.localeCompare(b)) }
}
