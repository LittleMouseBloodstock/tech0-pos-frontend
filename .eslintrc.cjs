/* ESLint config (Next.js + TypeScript) */
module.exports = {
  root: true,
  extends: ["next/core-web-vitals", "eslint:recommended", "prettier"],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
  ignorePatterns: ["node_modules/", ".next/", ".turbo/", "dist/", "out/"],
};

