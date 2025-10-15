/* ESLint config (Next.js + TypeScript) */
module.exports = {
  root: true,
  // Place `eslint:recommended` first so Next's config can override where needed
  extends: ["eslint:recommended", "next/core-web-vitals", "prettier"],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
  ignorePatterns: ["node_modules/", ".next/", ".turbo/", "dist/", "out/"],
  overrides: [
    {
      files: ["**/*.ts", "**/*.tsx"],
      parser: "@typescript-eslint/parser",
      plugins: ["@typescript-eslint"],
      rules: {
        // TypeScript handles undefined variables; prevent false positives for JSX/React types
        "no-undef": "off",
        // Prefer TS-aware unused-vars; allow underscore-prefixed ignores
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": [
          "warn",
          { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
        ],
        // Allow empty catch blocks (common in try/detect flows)
        "no-empty": ["warn", { allowEmptyCatch: true }],
      },
    },
  ],
};
