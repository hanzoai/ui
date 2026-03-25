import { copyFileSync } from "fs"
import { defineConfig } from "tsup"

export default defineConfig({
  clean: true,
  dts: true,
  entry: [
    "src/index.ts",
    "src/registry/index.ts",
    "src/schema/index.ts",
    "src/mcp/index.ts",
    "src/utils/index.ts",
    "src/icons/index.ts",
<<<<<<< HEAD
  ],
  format: ["esm"],
  sourcemap: true,
=======
    "src/preset/index.ts",
  ],
  format: ["esm"],
  sourcemap: false,
>>>>>>> shadcn/main
  minify: true,
  target: "esnext",
  outDir: "dist",
  treeshake: true,
<<<<<<< HEAD
=======
  // Bundle @antfu/ni and its dependency tinyexec to avoid
  // module resolution failures with npx temporary installs.
  noExternal: ["@antfu/ni", "tinyexec"],
>>>>>>> shadcn/main
  onSuccess: async () => {
    copyFileSync("src/tailwind.css", "dist/tailwind.css")
  },
})
