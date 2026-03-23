import { defineConfig } from "tsup"

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/colors.ts",
    "src/spacing.ts",
    "src/radii.ts",
    "src/typography.ts",
    "src/themes.ts",
    "src/tailwind.ts",
    "src/tamagui.ts",
  ],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
})
