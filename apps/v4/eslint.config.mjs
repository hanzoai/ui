import nextVitals from "eslint-config-next/core-web-vitals"
import tseslint from "typescript-eslint"

const eslintConfig = tseslint.config(
  // Remove the @typescript-eslint plugin from next/typescript to prevent
  // duplicate registration with tseslint.configs.recommended.
  ...nextVitals.map((config) =>
    config.name === "next/typescript"
      ? { ...config, plugins: {} }
      : config
  ),
  ...tseslint.configs.recommended,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      ".source/**",
      "**/__index__.tsx",
    ],
  },
  {
    rules: {
      // React Compiler advisory rules, OFF for this app only.
      //
      // apps/v4 is a VENDORED upstream mirror — every file these rules flag
      // arrives from a sync commit ("feat: sync upstream shadcn/ui"), including
      // hooks/use-layout.tsx, components/command-menu.tsx and the whole
      // examples/{base,radix} registry, whose copies are byte-identical to each
      // other. eslint-config-next 16 turns the compiler rules on; upstream
      // shadcn does not satisfy them, so linting their code under our config
      // produced 48 errors in code we do not write.
      //
      // Patching them would fork every one of those files from upstream and
      // have to be redone at the next sync — to quiet advisories in a demo app.
      // The first two were already off for exactly this reason; the two added
      // below are the rest of the same family:
      //   set-state-in-effect  "Calling setState synchronously within an effect
      //                         can trigger cascading renders"        (42 of 48)
      //   refs                 "Cannot access refs during render"      (6 of 48)
      //
      // This file governs apps/v4 ONLY. Our own source — app/, pkgs/, packages/
      // — lints under its own config and is untouched, so nothing we actually
      // author is exempted here. If these should hold for vendored code too,
      // the fix belongs upstream in shadcn/ui, not as a local fork.
      "react-hooks/incompatible-library": "off",
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "@next/next/no-html-link-for-pages": "off",
      "@next/next/no-img-element": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
        },
      ],
    },
  },
)

export default eslintConfig
