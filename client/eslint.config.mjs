import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["components/Contract.tsx"],
    rules: {
      // See description above this config block's usage in DEPENDENCIES/audit
      // notes: this is a documented false positive (facebook/react#34743)
      // against the standard fetch-on-mount/dependency-change pattern, not
      // a real bug — the loading state here is intentionally reset
      // synchronously so retry/refresh buttons show a spinner immediately.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
