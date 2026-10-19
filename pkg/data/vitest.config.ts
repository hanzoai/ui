import { defineConfig } from 'vitest/config'

// @hanzo/ui's resolutions for a non-browser target, read from the one place it
// keeps them, so this suite and @hanzo/ui's own resolve gui identically.
import { alias } from '../ui/scripts/alias.mjs'

/**
 * Two kinds of suite, one runner, as in @hanzo/ui.
 *
 * `*.test.ts`  — the PURE logic (sort / filter / group / view state, value
 *                coercion): plain Node, no gui runtime.
 * `*.test.tsx` — the field displays, editors and the table MOUNT under the real
 *                GuiProvider and @hanzo/ui's config, in jsdom (`@vitest-environment
 *                jsdom` at the top of the file). @hanzo/ui is read from its built
 *                `dist`, as a consumer reads it, so build it first
 *                (`pnpm --filter @hanzo/data... build` does).
 */
export default defineConfig({
  css: { postcss: { plugins: [] } },
  resolve: { alias },
  test: {
    environment: 'node',
    testTimeout: 60_000,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    setupFiles: ['../ui/vitest.setup.ts'],
    // gui and react-native-web re-export one module graph; inlined, they resolve
    // to one instance, so the provider and the components read the same theme.
    server: { deps: { inline: [/@hanzogui\//, /@hanzo\/gui/, /react-native/, /@hanzo\/ui/] } },
  },
})
