import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    rules: {
      curly: ["error", "all"],
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        document: "readonly",
        window: "readonly",
        console: "readonly",
        fetch: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        MutationObserver: "readonly",
        URLSearchParams: "readonly",
        URL: "readonly",
        AbortController: "readonly",
        IntersectionObserver: "readonly",
        requestAnimationFrame: "readonly",
      },
    },
  },
  {
    ignores: ["dist/", "node_modules/", "web-ext-artifacts/"],
  },
];
