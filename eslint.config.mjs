// @ts-check
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import eslint from "@eslint/js";
import * as tseslint from "typescript-eslint";
// @ts-expect-error invalid types
import reactCompilerPlugin from "eslint-plugin-react-compiler";
// @ts-expect-error invalid types
import reactHooksPlugin from "eslint-plugin-react-hooks";
import reactPlugin from "eslint-plugin-react";
// @ts-expect-error invalid types
import tailwindPlugin from "eslint-plugin-tailwindcss";
// @ts-expect-error invalid types
import nextPlugin from "@next/eslint-plugin-next";
import vitestPlugin from "@vitest/eslint-plugin";
import globals from "globals";

/** @type {any} */
const config = tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: {
        ...globals.serviceworker,
      },
      parserOptions: {
        project: ["./tsconfig.json", "./packages/*/tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    files: ["packages/**"],
    rules: {
      "block-scoped-var": "error",
      "default-param-last": 0,
      "getter-return": "error",
      "grouped-accessor-pairs": "warn",
      "max-params": ["error", 4],
      "new-cap": "warn",
      "no-alert": "error",
      "no-case-declarations": "warn",
      "no-class-assign": "error",
      "no-cond-assign": 0,
      "no-console": "warn",
      "no-const-assign": "error",
      "no-constructor-return": "error",
      "no-dupe-args": "error",
      "no-duplicate-imports": "warn",
      "no-eq-null": "warn",
      "no-eval": "error",
      "no-extend-native": "error",
      "no-extra-semi": 0,
      "no-implied-eval": "error",
      "no-invalid-this": "error",
      "no-mixed-operators": 0,
      "no-multi-assign": "error",
      "no-multi-str": "error",
      "no-template-curly-in-string": "warn",
      "no-unused-vars": "off",
      "no-var": 0,
      "prefer-template": 0,
      "prefer-const": 0,
      "no-ex-assign": "error",
      "spaced-comment": [
        "warn",
        "always",
        {
          markers: ["/"],
        },
      ],
      eqeqeq: "error",
      "@typescript-eslint/ban-types": 0,
      "@typescript-eslint/ban-ts-comment": 0,
      "@typescript-eslint/unbound-method": 0,
      "@typescript-eslint/no-empty-function": 0,
      "@typescript-eslint/no-explicit-any": 0,
      "@typescript-eslint/no-namespace": 0,
      "@typescript-eslint/no-unnecessary-condition": 2,
      "@typescript-eslint/no-unsafe-member-access": 0,
      "@typescript-eslint/no-unsafe-assignment": 0,
      "@typescript-eslint/no-unsafe-call": 0,
      "@typescript-eslint/no-unsafe-return": 0,
      "@typescript-eslint/no-unsafe-argument": 0,
      "@typescript-eslint/no-base-to-string": 0,
      "@typescript-eslint/no-redundant-type-constituents": 0,
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-unused-expressions": [
        2,
        {
          allowShortCircuit: true,
          allowTernary: true,
          allowTaggedTemplates: true,
          enforceForJSX: true,
        },
      ],
    },
  },
  {
    files: ["packages/hooks/**", "apps/playground/**"],
    plugins: {
      "react-compiler": reactCompilerPlugin,
      "react-hooks": reactHooksPlugin,
      react: reactPlugin,
    },
    rules: {
      ...reactHooksPlugin.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      "react/display-name": 2,
      "react/jsx-no-leaked-render": 1,
      "react/no-children-prop": 0,
      "react/prop-types": 0,
      "react/react-in-jsx-scope": 0,
      "react-compiler/react-compiler": "error",
      "react-hooks/exhaustive-deps": 2,
      "block-scoped-var": "error",
      "default-param-last": 0,
      "getter-return": "error",
      "grouped-accessor-pairs": "warn",
      "max-params": ["error", 4],
      "new-cap": "warn",
      "no-alert": "error",
      "no-case-declarations": "warn",
      "no-class-assign": "error",
      "no-cond-assign": 0,
      "no-console": "warn",
      "no-const-assign": "error",
      "no-constructor-return": "error",
      "no-dupe-args": "error",
      "no-duplicate-imports": "warn",
      "no-eq-null": "warn",
      "no-eval": "error",
      "no-extend-native": "error",
      "no-extra-semi": 0,
      "no-implied-eval": "error",
      "no-invalid-this": "error",
      "no-mixed-operators": 0,
      "no-multi-assign": "error",
      "no-multi-str": "error",
      "no-template-curly-in-string": "warn",
      "no-unused-vars": "off",
      "no-var": 0,
      "prefer-template": 0,
      "prefer-const": 0,
      "no-ex-assign": "error",
      "spaced-comment": [
        "warn",
        "always",
        {
          markers: ["/"],
        },
      ],
      eqeqeq: "error",
      "@typescript-eslint/ban-types": 0,
      "@typescript-eslint/ban-ts-comment": 0,
      "@typescript-eslint/unbound-method": 0,
      "@typescript-eslint/no-empty-function": 0,
      "@typescript-eslint/no-explicit-any": 0,
      "@typescript-eslint/no-namespace": 0,
      "@typescript-eslint/no-unnecessary-condition": 2,
      "@typescript-eslint/no-unsafe-member-access": 0,
      "@typescript-eslint/no-unsafe-assignment": 0,
      "@typescript-eslint/no-unsafe-call": 0,
      "@typescript-eslint/no-unsafe-return": 0,
      "@typescript-eslint/no-unsafe-argument": 0,
      "@typescript-eslint/no-base-to-string": 0,
      "@typescript-eslint/no-redundant-type-constituents": 0,
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-unused-expressions": [
        2,
        {
          allowShortCircuit: true,
          allowTernary: true,
          allowTaggedTemplates: true,
          enforceForJSX: true,
        },
      ],
    },
  },
  {
    files: ["packages/crustack/**"],
    plugins: {
      vitest: vitestPlugin,
    },
    rules: {
      ...vitestPlugin.configs.recommended.rules,
      "vitest/expect-expect": 0,
    },
  },
  {
    files: ["packages/playground/**"],
    plugins: {
      tailwindcss: tailwindPlugin,
      "@next/next": nextPlugin,
    },
    rules: {
      ...tailwindPlugin.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "no-console": 0,
      "tailwindcss/classnames-order": 0,
      "tailwindcss/no-custom-classname": 0,
      "tailwindcss/enforces-negative-arbitrary-values": 2,
      "tailwindcss/no-contradicting-classname": 2,
      "tailwindcss/no-unnecessary-arbitrary-value": 0,
      "tailwindcss/migration-from-tailwind-2": 0,
    },
  }
);

export default config;
