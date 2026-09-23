import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier/flat";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  ...nextVitals,
  ...nextTypescript,
  prettierConfig,
];

export default eslintConfig;
