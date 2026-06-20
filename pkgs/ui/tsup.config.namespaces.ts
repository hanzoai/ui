import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    // Namespace directories only - primitives built separately
    'code/index': 'src/code/index.ts',
    '3d/index': 'src/3d/index.ts',
    'animation/index': 'src/animation/index.ts',
    'pattern/index': 'src/pattern/index.ts',
    'navigation/index': 'src/navigation/index.ts',
    'form/index': 'src/form/index.ts',
    'device/index': 'src/device/index.ts',
    'dock/index': 'src/dock/index.ts',
    'project/index': 'src/project/index.ts',
    'ui/index': 'src/ui/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: false, // Disabled - circular dependencies with namespace imports
  sourcemap: false,
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

    // All @radix-ui packages
    /^@radix-ui\//,

    // Self-imports (namespace components import from @hanzo/ui)
    /^@hanzo\/ui\//,
    '@hanzo/ui',

    // Other peer dependencies
    'lucide-react',
    '@hookform/resolvers',
    'react-hook-form',
    'class-variance-authority',
    'clsx',
    'cmdk',
    'date-fns',
    'embla-carousel',
    'embla-carousel-react',
    'input-otp',
    'lodash.castarray',
    'lodash.isplainobject',
    'lodash.merge',
    'react-day-picker',
    'react-resizable-panels',
    'sonner',
    'tailwind-merge',
    'tailwindcss-animate',
    'vaul',
    'zod',
    '@hanzo/react-drawer',
    'framer-motion',
    '@monaco-editor/react',
    'shiki',

    // Image/asset imports
    /\.(png|jpg|jpeg|gif|svg|ico|webp)$/,

    // CSS imports
    /\.css$/,
  ],
  noExternal: [],
  splitting: true,
  clean: false, // Don't clean - primitives already built
  target: 'es2020',
  outDir: 'dist',
  treeshake: true,
  minify: true,
  esbuildOptions(options) {
    options.jsx = 'automatic'
    options.platform = 'neutral'
    options.keepNames = true
  },
})
