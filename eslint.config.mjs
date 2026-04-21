import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

const config = [
  ...nextVitals,
  ...nextTypeScript,
  prettier,
  {
    ignores: [
      ".codex/**",
      ".next/**",
      "coverage/**",
      "dist/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
];

export default config;
