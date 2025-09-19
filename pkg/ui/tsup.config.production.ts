import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    // Main entry point
    'index': 'primitives/index-next.ts',

    // Core module entry points
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
    'lib/utils': 'src/utils.ts', // Alias for compatibility
    'src/hooks/index': 'src/hooks/index.ts',
    'style/theme-provider': 'style/theme-provider.tsx',
  },
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  external: [
    // React and related packages
    'react',
    'react-dom',
    'react/jsx-runtime',

    // Next.js
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

    // All @radix-ui packages
    /^@radix-ui\//,

    // Dependencies from package.json
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

    // Optional/missing dependencies
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
    '@hanzo_network/hanzo-node-state/v2/queries/getChatConversation/types',
    '@tauri-apps/plugin-dialog',
    '@tauri-apps/plugin-fs',
    '@tauri-apps/plugin-log',

    // Path aliases (mark as external for registry files)
    /^@\//,

    // Images and assets
    /\.(png|jpg|jpeg|gif|svg|ico|webp)$/,

    // CSS files
    /\.css$/,
  ],
  noExternal: [
    // Only bundle local relative imports
    /^\./,
  ],
  splitting: false,
  clean: true,
  target: 'es2020',
  outDir: 'dist',
  treeshake: true,
  minify: false, // Don't minify - let consuming apps handle this
  esbuildOptions(options) {
    options.jsx = 'automatic'
    options.jsxDev = false
    options.platform = 'neutral'
    options.mainFields = ['module', 'main']
    options.conditions = ['import', 'require']
    options.keepNames = true
  },
  onSuccess: async () => {
    const fs = (await import('fs')).default
    const path = (await import('path')).default
    const glob = (await import('glob')).glob

    // Add "use client" directive to React component files
    const files = await glob('dist/**/*.{js,mjs}', {
      ignore: ['**/*.d.ts', '**/utils.*', '**/types/*']
    })

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8')

      // Check if it's likely a React component
      const isReactComponent =
        content.includes('jsx-runtime') ||
        (content.includes('react') && (
          content.includes('useState') ||
          content.includes('useEffect') ||
          content.includes('Component') ||
          content.includes('forwardRef')
        ))

      if (isReactComponent &&
          !content.startsWith('"use client"') &&
          !content.startsWith("'use client'")) {
        fs.writeFileSync(file, '"use client";\n' + content)
      }
    }

    console.log('✅ Build completed successfully!')
    console.log('📦 Package is ready for publishing')
  }
})