import vitestPlugin from "@vitest/eslint-plugin";

/** @type {any} */
export const config_vitest = {
  plugins: {
    vitest: vitestPlugin,
  },
  rules: {
    ...vitestPlugin.configs.recommended.rules,
    "vitest/expect-expect": 0,
  },
};
