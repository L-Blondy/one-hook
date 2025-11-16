import reactHooksPlugin from 'eslint-plugin-react-hooks'
import reactPlugin from 'eslint-plugin-react'

/** @type {any} */
export const config_react = {
  plugins: {
    'react-hooks': reactHooksPlugin,
    react: reactPlugin,
  },
  rules: {
    ...reactHooksPlugin.configs.recommended.rules,
    ...reactPlugin.configs.recommended.rules,
    'react-hooks/automatic-effect-dependencies': 2,
    'react-hooks/capitalized-calls': 2,
    'react-hooks/component-hook-factories': 2,
    'react-hooks/config': 2,
    'react-hooks/error-boundaries': 2,
    'react-hooks/exhaustive-deps': 2,
    'react-hooks/fbt': 2,
    'react-hooks/fire': 2,
    'react-hooks/gating': 2,
    'react-hooks/globals': 2,
    'react-hooks/hooks': 2,
    'react-hooks/incompatible-library': 2,
    'react-hooks/memoized-effect-dependencies': 2,
    'react-hooks/no-deriving-state-in-effects': 2,
    'react-hooks/preserve-manual-memoization': 0,
    'react-hooks/purity': 2,
    'react-hooks/rule-suppression': 2,
    'react-hooks/rules-of-hooks': 2,
    'react-hooks/set-state-in-effect': 2,
    'react-hooks/set-state-in-render': 2,
    'react-hooks/static-components': 2,
    'react-hooks/syntax': 2,
    'react-hooks/unsupported-syntax': 2,
    'react-hooks/use-memo': 2,
    'react/display-name': 2,
    'react/jsx-no-leaked-render': 1,
    'react/no-children-prop': 0,
    'react/prop-types': 0,
    'react/react-in-jsx-scope': 0,
  },
}
