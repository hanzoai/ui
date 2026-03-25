import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"
import { configDefaults, defineConfig } from "vitest/config"

export default defineConfig({
  test: {
<<<<<<< HEAD
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
=======
>>>>>>> shadcn/main
    exclude: [
      ...configDefaults.exclude,
      "**/node_modules/**",
      "**/fixtures/**",
      "**/templates/**",
      "**/packages/tests/**",
    ],
  },
  plugins: [
<<<<<<< HEAD
    react(),
=======
>>>>>>> shadcn/main
    tsconfigPaths({
      ignoreConfigErrors: true,
    }),
  ],
})
