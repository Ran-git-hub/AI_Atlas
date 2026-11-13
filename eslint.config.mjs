import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTypescript from "eslint-config-next/typescript"

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      // The rule treats every function named use + capital letter as a React
      // Hook. This codebase's domain word is "use case", so plain helpers such
      // as useCaseDisplayName are reported as hooks called inside callbacks and
      // loops. The rule has no naming option, so it stays off until those
      // helpers are renamed.
      "react-hooks/rules-of-hooks": "off",
      // Every plain <img> here loads a third-party logo, favicon or article
      // image by URL. next/image would route them through Vercel's image
      // optimizer, which is billed per source image and needs each host
      // allow-listed, so plain <img> is the deliberate choice.
      "@next/next/no-img-element": "off",
      // A leading underscore marks a binding kept on purpose, such as the
      // next/font loaders in app/layout.tsx that must be module-level consts.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { varsIgnorePattern: "^_", argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "node_modules/**",
    "next-env.d.ts",
    ".backups/**",
    ".claude/**",
    "reports/**",
    "supabase/**",
  ]),
])
