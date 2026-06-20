import { defineConfig } from 'tsup'
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const SERVER_SAFE_PATHS = [
  'types/',
  'services/',
  'lib/',
]

function addUseClientDirective(dir: string, relativePath = '') {
  const files = readdirSync(dir)
  for (const file of files) {
    const filePath = join(dir, file)
    const currentRelativePath = relativePath ? `${relativePath}/${file}` : file
    const stat = statSync(filePath)

    if (stat.isDirectory()) {
      addUseClientDirective(filePath, currentRelativePath)
    } else if (file.endsWith('.js') || file.endsWith('.mjs')) {
      const isServerSafe = SERVER_SAFE_PATHS.some(path => currentRelativePath.startsWith(path))
      if (isServerSafe) continue

      const content = readFileSync(filePath, 'utf-8')
      if (!content.startsWith('"use client"')) {
        writeFileSync(filePath, '"use client";\n' + content)
      }
    }
  }
}

export default defineConfig({
  entry: {
    'index': 'src/index.ts',

    // Domain modules
    'dashboard/index': 'src/dashboard/index.ts',
    'nodes/index': 'src/nodes/index.ts',
    'workflows/index': 'src/workflows/index.ts',
    'executions/index': 'src/executions/index.ts',
    'identity/index': 'src/identity/index.ts',
    'compute/index': 'src/compute/index.ts',

    // Shared
    'hooks/index': 'src/hooks/index.ts',
    'services/index': 'src/services/index.ts',
    'types/index': 'src/types/index.ts',
    'lib/index': 'src/lib/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: false, // Generated with tsc separately
  sourcemap: false,
  external: [
    /^(?!\.)/,
  ],
  noExternal: [
    /^\./,
  ],
  splitting: false,
  clean: true,
  target: 'es2020',
  outDir: 'dist',
  treeshake: true,
  minify: false,
  esbuildOptions(options) {
    options.jsx = 'automatic'
    options.platform = 'neutral'
    options.keepNames = true
  },
  onSuccess() {
    addUseClientDirective('./dist')
    console.log('Added "use client" directive to client-side output files')
  },
})
