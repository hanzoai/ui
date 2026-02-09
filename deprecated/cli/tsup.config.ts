import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
<<<<<<<< HEAD:pkg/brand/tsup.config.ts
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
========
  format: ["esm", "cjs"],
  sourcemap: true,
  minify: true,
  target: "esnext",
  outDir: "dist",
>>>>>>>> shadcn/main:deprecated/cli/tsup.config.ts
})
