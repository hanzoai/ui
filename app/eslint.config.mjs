import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: [
      "__registry__/**",
      ".source/**",
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      ".turbo/**",
      "node_modules/**",
      "coverage/**",
      "*.config.js",
      "*.config.mjs",
    ],
  },
  // JavaScript files
  {
    files: ["**/*.{js,jsx,mjs,cjs}"],
    ...js.configs.recommended,
    rules: {
      "no-unused-vars": "off",
      "no-undef": "off",
      "no-empty": "off",
      "no-constant-condition": "off",
      "no-case-declarations": "off",
      "no-useless-escape": "off",
      "no-control-regex": "off",
      "prefer-const": "off",
    },
  },
  // TypeScript files - parser only, all rules off (rely on TypeScript compiler)
  {
    files: ["**/*.{ts,tsx,mts}"],
    languageOptions: {
      parser: tsParser,
    },
    rules: {},
  },
  // CommonJS files
  {
    files: ["**/*.cjs"],
    languageOptions: {
      globals: {
        module: "readonly",
        require: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        exports: "writable",
      },
    },
  },
];
