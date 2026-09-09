import { defineConfig } from "vitest/config"

// Pure logic + fetch-mocked client + JSON-snapshot integrity — all node, no jsdom.
export default defineConfig({
  test: { environment: "node", include: ["src/**/*.test.ts"] },
})
