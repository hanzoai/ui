import { defineWorkspace } from "vitest/config"

export default defineWorkspace([
  "./vitest.config.ts",
  "./pkgs/tests/vitest.config.ts",
])
