/** @type {any} */
export const config_ts = {
  rules: {
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
      1,
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
};
