import { defineConfig } from "tsup"

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/colors.ts",
    "src/spacing.ts",
    "src/radii.ts",
    "src/typography.ts",
    "src/themes.ts",
    "src/theme.ts",
    "src/tailwind.ts",
    "src/gui.ts",
  ],
  format: ["cjs", "esm"],
  dts: false, // tsc emits these — rollup-plugin-dts cannot load on TS7,
  clean: true,
  sourcemap: true,
})
