import { defineConfig } from "vitest/config"

// A package whose `test` script is `vitest run` needs its OWN config. Without
// one vitest walks up to the root workspace file and resolves its relative
// entries against THIS directory, so it looks for a config here, does not find
// it, and fails at startup before a single test runs — which reads as a broken
// suite rather than a missing file. Pure config folding: node, no DOM.
export default defineConfig({
  test: { environment: "node", include: ["src/**/*.test.ts"] },
})
