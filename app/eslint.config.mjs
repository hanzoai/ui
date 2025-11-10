import js from "@eslint/js";
import tseslint from "typescript-eslint";

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
    ],
  },
  // Use only base configs without rules
  {
    files: ["**/*.{js,jsx,mjs,cjs}"],
    ...js.configs.recommended,
    rules: {
      // Turn off all rules
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
  // TypeScript files
  {
    files: ["**/*.{ts,tsx,mts}"],
    languageOptions: {
      parser: tseslint.parser,
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      // Turn off ALL rules - rely on TypeScript compiler
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-this-alias": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
      "@typescript-eslint/no-empty-interface": "off",
    },
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
