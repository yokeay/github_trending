import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Disable rules that conflict with prettier
      "no-unused-vars": "off",
      "react/no-unescaped-entities": "off",
      // Disable cascading renders rule for simplicity
      "react-hooks/set-state-in-effect": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    "data/**",
    "backups/**",
  ]),
]);

export default eslintConfig;