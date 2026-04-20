import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Third-party-style shader/animation source — treat as vendored.
    "components/LiquidEther.jsx",
  ]),
  // Legacy code paths still contain scattered `any` usage, unused symbols, and
  // patterns flagged by the new React compiler rules that we're migrating
  // opportunistically. Downgrade those rules to warnings here so CI can
  // enforce lint on new code without reverting everything at once. As a
  // directory is cleaned up, drop it from this scope.
  {
    files: [
      "app/api/**/*.{ts,tsx}",
      "app/(instructor)/**/*.{ts,tsx}",
      "components/**/*.{ts,tsx}",
      "lib/db/**/*.{ts,tsx}",
      "lib/repositories/**/*.{ts,tsx}",
      "lib/hooks/use-query.ts",
      "lib/hooks/use-attendance.ts",
      "lib/import-parsers.ts",
      "lib/import-templates.ts",
      "lib/user.ts",
      "lib/user-server.ts",
      "lib/index.ts",
      "utils/supabase/**/*.{ts,tsx}",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/purity": "warn",
    },
  },
]);

export default eslintConfig;
