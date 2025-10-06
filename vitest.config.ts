import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"
import { configDefaults, defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    exclude: [
      ...configDefaults.exclude,
      "**/node_modules/**",
      "**/fixtures/**",
      "**/templates/**",
      "**/packages/tests/**",
    ],
  },
  plugins: [
    react(),
    tsconfigPaths({
      ignoreConfigErrors: true,
    }),
  ],
})
