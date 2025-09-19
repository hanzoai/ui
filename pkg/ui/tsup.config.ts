import { defineConfig } from 'tsup'
import { glob } from 'glob'
import path from 'path'

// Find all component files to include as entry points
const componentFiles = glob.sync('primitives/**/*.{ts,tsx}', {
  ignore: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/*.d.ts']
})

const blockFiles = glob.sync('blocks/**/*.{ts,tsx}', {
  ignore: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/*.d.ts']
})

const utilFiles = glob.sync('util/**/*.{ts,tsx}', {
  ignore: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/*.d.ts']
})

export default defineConfig({
  entry: {
    // Main entry points
    'index': 'primitives/index-next.ts',
    'primitives/index-next': 'primitives/index-next.ts',
    'primitives/index-common': 'primitives/index-common.ts',
    'assets/index': 'assets/index.ts',
    'blocks/index': 'blocks/index.ts',
    'components/index': 'components/index.ts',
    'tailwind/index': 'tailwind/index.ts',
    'types/index': 'types/index.ts',
    'util/index': 'util/index.ts',
    'util/index-client': 'util/index-client.ts',
    'src/utils': 'src/utils.ts',
    'src/registry/index': 'src/registry/index.ts',
    'src/mcp/index': 'src/mcp/index.ts',
    'src/hooks/index': 'src/hooks/index.ts',
    'style/theme-provider': 'style/theme-provider.tsx',

    // Framework-specific entries
    'frameworks/react/index': 'frameworks/react/index.ts',
    'frameworks/vue/index': 'frameworks/vue/index.ts',
    'frameworks/svelte/index': 'frameworks/svelte/index.ts',
    'frameworks/react-native/index': 'frameworks/react-native/index.ts',

    // Individual component files for tree-shaking
    ...Object.fromEntries(
      [...componentFiles, ...blockFiles, ...utilFiles].map(file => [
        file.replace(/\.(ts|tsx)$/, ''),
        file
      ])
    )
  },
  format: ['cjs', 'esm'],
  dts: {
    resolve: true,
    entry: {
      'index': 'primitives/index-next.ts',
      'primitives/index-next': 'primitives/index-next.ts',
      'primitives/index-common': 'primitives/index-common.ts',
      'assets/index': 'assets/index.ts',
      'blocks/index': 'blocks/index.ts',
      'components/index': 'components/index.ts',
      'tailwind/index': 'tailwind/index.ts',
      'types/index': 'types/index.ts',
      'util/index': 'util/index.ts',
      'util/index-client': 'util/index-client.ts',
      'src/utils': 'src/utils.ts',
      'src/registry/index': 'src/registry/index.ts',
      'src/mcp/index': 'src/mcp/index.ts',
      'src/hooks/index': 'src/hooks/index.ts',
      'frameworks/react/index': 'frameworks/react/index.ts',
      'frameworks/vue/index': 'frameworks/vue/index.ts',
      'frameworks/svelte/index': 'frameworks/svelte/index.ts',
      'frameworks/react-native/index': 'frameworks/react-native/index.ts',
    }
  },
  sourcemap: true,
  external: [
    // React and Next.js
    'react',
    'react-dom',
    'react/jsx-runtime',
    'next',
    'next/image',
    'next/link',
    'next/navigation',
    'next/dynamic',
    'next/head',
    'next-themes',

    // Peer dependencies
    'lucide-react',
    '@hookform/resolvers',
    'react-hook-form',
    'mobx',
    'mobx-react',
    'mobx-react-lite',
    'validator',
    'embla-carousel',
    'embla-carousel-react',

    // All @radix-ui packages (already in dependencies)
    /^@radix-ui\//,

    // Other dependencies that should be external
    '@modelcontextprotocol/sdk',
    '@next/third-parties',
    '@splinetool/react-spline',
    '@splinetool/runtime',
    '@tailwindcss/container-queries',
    'class-variance-authority',
    'clsx',
    'cmdk',
    'commander',
    'date-fns',
    'input-otp',
    'lodash.castarray',
    'lodash.isplainobject',
    'lodash.merge',
    'markdown-to-jsx',
    'mermaid',
    'postcss-selector-parser',
    'qrcode.react',
    'react-day-picker',
    'react-intersection-observer',
    'react-resizable-panels',
    'sonner',
    'sql.js',
    'svg-pan-zoom',
    'tailwind-merge',
    'tailwindcss-animate',
    'tailwindcss-interaction-media',
    'vaul',
    'zod',
    'zod-to-json-schema',
    '@hanzo/react-drawer',

    // Optional dependencies that might not be installed
    'rehype-katex',
    'remark-gfm',
    'remark-math',
    'react-syntax-highlighter',
    'react-dropzone',
    'filesize',
    'framer-motion',
    'react-markdown',
    'react-qrcode-logo',
    '@hanzo_network/hanzo-i18n',
    '@tauri-apps/plugin-dialog',
    '@tauri-apps/plugin-fs',
    '@tauri-apps/plugin-log',

    // Image/asset imports
    /\.(png|jpg|jpeg|gif|svg|ico|webp)$/,

    // CSS imports
    /\.css$/,
  ],
  noExternal: [],
  splitting: false, // Disable splitting for predictable output
  clean: true,
  target: 'es2020',
  outDir: 'dist',
  treeshake: true,
  minify: false, // Don't minify - let consuming apps handle this
  esbuildOptions(options) {
    options.jsx = 'automatic' // Use React 17+ JSX transform
    options.jsxDev = false
    options.platform = 'neutral' // Works in both browser and Node.js
    options.mainFields = ['module', 'main']
    options.conditions = ['import', 'require']
  },
  onSuccess: async () => {
    // Add "use client" directive to React components after build
    const fs = (await import('fs')).default
    const files = glob.sync('dist/**/*.{js,mjs}', {
      ignore: ['**/*.d.ts']
    })

    for (const file of files) {
      // Check if file contains React imports or JSX
      const content = fs.readFileSync(file, 'utf-8')
      if (content.includes('react') || content.includes('jsx-runtime')) {
        // Add "use client" if not already present
        if (!content.startsWith('"use client"') && !content.startsWith("'use client'")) {
          fs.writeFileSync(file, '"use client";\n' + content)
        }
      }
    }
  }
})