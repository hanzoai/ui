import { defineConfig } from 'tsup'

// Multi-framework build configuration
export default defineConfig([
  // React/Next.js build
  {
    name: 'react',
    entry: {
      'index': 'frameworks/react/index.ts',
      'components/index': 'frameworks/react/components/index.ts',
      'hooks/index': 'frameworks/react/hooks/index.ts',
      'utils/index': 'frameworks/react/utils/index.ts',
    },
    outDir: 'dist/react',
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    external: [
      'react',
      'react-dom',
      'next',
      'next/image',
      'next/link',
      'next/navigation',
      '@radix-ui/*',
      'lucide-react',
      'class-variance-authority',
      'clsx',
      'tailwind-merge'
    ],
    treeshake: true,
    splitting: false,
    clean: true,
  },

  // Vue build
  {
    name: 'vue',
    entry: {
      'index': 'frameworks/vue/index.ts',
      'components/index': 'frameworks/vue/components/index.ts',
      'composables/index': 'frameworks/vue/composables/index.ts',
      'utils/index': 'frameworks/vue/utils/index.ts',
    },
    outDir: 'dist/vue',
    format: ['esm'],
    dts: true,
    sourcemap: true,
    external: [
      'vue',
      'radix-vue',
      '@vueuse/core',
      'class-variance-authority',
      'clsx',
      'tailwind-merge'
    ],
    treeshake: true,
    splitting: false,
    clean: true,
  },

  // Svelte build
  {
    name: 'svelte',
    entry: {
      'index': 'frameworks/svelte/index.ts',
      'components/index': 'frameworks/svelte/components/index.ts',
      'stores/index': 'frameworks/svelte/stores/index.ts',
      'utils/index': 'frameworks/svelte/utils/index.ts',
    },
    outDir: 'dist/svelte',
    format: ['esm'],
    dts: false, // Svelte components don't need .d.ts
    sourcemap: true,
    external: [
      'svelte',
      'svelte/store',
      '@melt-ui/svelte',
      'class-variance-authority',
      'clsx',
      'tailwind-merge'
    ],
    treeshake: true,
    splitting: false,
    clean: true,
  },

  // React Native build
  {
    name: 'react-native',
    entry: {
      'index': 'frameworks/react-native/index.ts',
      'components/index': 'frameworks/react-native/components/index.ts',
      'hooks/index': 'frameworks/react-native/hooks/index.ts',
      'utils/index': 'frameworks/react-native/utils/index.ts',
    },
    outDir: 'dist/react-native',
    format: ['cjs'], // React Native uses CommonJS
    dts: true,
    sourcemap: true,
    external: [
      'react',
      'react-native',
      'react-native-svg',
      'react-native-reanimated',
      'react-native-gesture-handler',
      'react-native-safe-area-context',
      'react-native-screens',
      '@react-native-community/*',
      'class-variance-authority',
      'clsx'
    ],
    platform: 'neutral', // Don't bundle for Node.js
    treeshake: false, // React Native doesn't support tree shaking well
    splitting: false,
    clean: true,
  },

  // Core utilities build (framework-agnostic)
  {
    name: 'core',
    entry: {
      'index': 'frameworks/core/index.ts',
      'types/index': 'frameworks/core/types/index.ts',
      'utils/index': 'frameworks/core/utils/index.ts',
      'styles/index': 'frameworks/core/styles/index.ts',
    },
    outDir: 'dist/core',
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    external: [
      'class-variance-authority',
      'clsx',
      'tailwind-merge'
    ],
    platform: 'neutral',
    treeshake: true,
    splitting: false,
    clean: true,
  },

  // Adapters build
  {
    name: 'adapters',
    entry: {
      'index': 'frameworks/adapters/index.ts',
      'react-to-svelte': 'frameworks/adapters/react-to-svelte/index.ts',
      'react-to-vue': 'frameworks/adapters/react-to-vue/index.ts',
      'react-to-rn': 'frameworks/adapters/react-to-rn/index.ts',
      'shared': 'frameworks/adapters/shared/index.ts',
    },
    outDir: 'dist/adapters',
    format: ['esm'],
    dts: true,
    sourcemap: true,
    external: [
      'typescript',
      '@babel/core',
      '@babel/parser',
      '@babel/traverse',
      '@babel/generator',
      'prettier'
    ],
    platform: 'node',
    treeshake: true,
    splitting: false,
    clean: true,
  }
])