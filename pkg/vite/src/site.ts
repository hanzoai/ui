/**
 * The static site: every page under app/ rendered as React Server Components,
 * written as HTML with its payload inlined, plus each route handler's file, each
 * opengraph image, robots.txt and sitemap.xml. One plugin, so a site's
 * vite.config.ts says `site()` and nothing about how.
 *
 *   dev     `vite`: each request rendered as it comes, server components and all.
 *   build   `vite build`: the client, server and HTML builds, then every output
 *           written to `out/`, the directory a Sites publish uploads.
 */
import fs from 'node:fs'
import path from 'node:path'
import { Readable } from 'node:stream'
import { fileURLToPath, pathToFileURL } from 'node:url'
import react from '@vitejs/plugin-react'
import rsc from '@vitejs/plugin-rsc'
import type { Plugin, ResolvedConfig } from 'vite'

export interface SiteOptions {
  /** The pages' directory, relative to the root. */
  app?: string
  /** Where the site is written. */
  out?: string
  /** `x/index.html` rather than `x.html`, for a server that answers /x/ only. */
  trailingSlash?: boolean
}

const ID = 'virtual:hanzo/app'
const RESOLVED = `\0${ID}`
const here = path.dirname(fileURLToPath(import.meta.url))
const entry = (name: string) => {
  for (const ext of ['.js', '.tsx']) {
    const f = path.join(here, `entry.${name}${ext}`)
    if (fs.existsSync(f)) return f
  }
  throw new Error(`entry.${name} is missing from ${here}`)
}

const walk = (dir: string, root = dir): string[] =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
        const full = path.join(dir, d.name)
        return d.isDirectory() ? walk(full, root) : [path.relative(root, full).split(path.sep).join('/')]
      })
    : []

export function site(options: SiteOptions = {}): Plugin[] {
  const appDir = options.app ?? 'app'
  const outDir = options.out ?? 'out'
  const trailing = options.trailingSlash ?? false
  let root = process.cwd()

  const files: Plugin = {
    name: 'hanzo:site:app',
    configResolved(config) {
      root = config.root
    },
    resolveId(id) {
      return id === ID ? RESOLVED : undefined
    },
    load(id) {
      if (id !== RESOLVED) return
      const dir = path.join(root, appDir)
      const entries = walk(dir)
        .filter((f) => /\.(tsx|ts|jsx|js|mdx|md)$/.test(f))
        .map((f) => `  ${JSON.stringify(f)}: () => import(${JSON.stringify(path.join(dir, f))}),`)
      return `export default {\n trailing: ${trailing},\n files: {\n${entries.join('\n')}\n }\n}\n`
    },
    configureServer(server) {
      const dir = path.join(root, appDir)
      const changed = (f: string) => {
        if (!f.startsWith(dir)) return
        for (const env of Object.values(server.environments)) {
          const m = env.moduleGraph.getModuleById(RESOLVED)
          if (m) env.moduleGraph.invalidateModule(m)
        }
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', changed)
      server.watcher.on('unlink', changed)
    },
  }

  const build: Plugin = {
    name: 'hanzo:site:build',
    config(_config, env) {
      return {
        appType: env.isPreview ? 'mpa' : undefined,
        rsc: { serverHandler: env.isPreview ? false : undefined },
        environments: {
          client: { build: { outDir } },
          rsc: { build: { outDir: '.hanzo/rsc' } },
          ssr: { build: { outDir: '.hanzo/ssr' } },
        },
      }
    },
    buildApp: {
      async handler(builder) {
        await write(builder.config)
      },
    },
  }

  // @vitejs/plugin-rsc is this package's dependency, not the site's: the
  // pre-bundled entries it names are reached through @hanzo/vite.
  const through: Plugin = {
    name: 'hanzo:site:through',
    configEnvironment(_name, config) {
      if (config.optimizeDeps?.include)
        config.optimizeDeps.include = config.optimizeDeps.include.map((e) => (e.startsWith('@vitejs/plugin-rsc') ? `@hanzo/vite > ${e}` : e))
    },
  }

  return [...react(), ...rsc({ entries: { rsc: entry('rsc'), ssr: entry('ssr'), client: entry('browser') } }), through, files, build]
}

async function write(config: ResolvedConfig) {
  const server: typeof import('./entry.rsc.js') = await import(pathToFileURL(path.join(config.environments.rsc.build.outDir, 'index.js')).href)
  const base = config.environments.client.build.outDir
  const list = await server.outputs()
  let n = 0
  const queue = [...list]
  const work = async () => {
    for (let o = queue.shift(); o; o = queue.shift()) {
      const target = path.join(base, o.file)
      await fs.promises.mkdir(path.dirname(target), { recursive: true })
      const { html, bytes } = await server.emit(o)
      if (html) await fs.promises.writeFile(target, Readable.fromWeb(html as never))
      else await fs.promises.writeFile(target, bytes!)
      n++
    }
  }
  await Promise.all(Array.from({ length: 8 }, work))
  config.logger.info(`[hanzo:site] wrote ${n} files to ${path.relative(config.root, base) || '.'}`)
}
