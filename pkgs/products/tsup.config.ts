import { defineConfig } from "tsup"

// Two entry points, one concern each:
//   index  — pure data + types + logic + client + docs nav gen (ZERO React).
//   icons  — the ONLY React-touching module: iconKey -> @hanzogui/lucide-icons-2.
// Keeping icons out of the barrel means a static consumer (docs/site/pricing)
// that imports from "." never pulls React or the icon set into its bundle.
export default defineConfig({
  entry: ["src/index.ts", "src/icons.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  // Inline the checked-in snapshot JSON so the fallback ships inside the bundle.
  loader: { ".json": "json" },
})
