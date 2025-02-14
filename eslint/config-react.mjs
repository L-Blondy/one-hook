/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// @ts-expect-error invalid types
import reactCompilerPlugin from "eslint-plugin-react-compiler";
// @ts-expect-error invalid types
import reactHooksPlugin from "eslint-plugin-react-hooks";
import reactPlugin from "eslint-plugin-react";

/** @type {any} */
export const config_react = {
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
  },
};
