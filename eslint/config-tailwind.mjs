/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// @ts-expect-error invalid types
import tailwindPlugin from 'eslint-plugin-tailwindcss'

/** @type {any} */
export const config_tailwind = {
  files: ['apps/playground/**'],
  plugins: {
    tailwindcss: tailwindPlugin,
  },
  rules: {
    ...tailwindPlugin.configs.recommended.rules,
    'tailwindcss/classnames-order': 0,
    'tailwindcss/no-custom-classname': 0,
    'tailwindcss/enforces-negative-arbitrary-values': 2,
    'tailwindcss/no-contradicting-classname': 2,
    'tailwindcss/no-unnecessary-arbitrary-value': 0,
    'tailwindcss/migration-from-tailwind-2': 0,
  },
}
