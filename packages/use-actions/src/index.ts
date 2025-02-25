import React from 'react'
import type { Prettify } from '@one-stack/utils/types'

export function defineActions<
  State,
  ActionsDef extends Record<string, (...args: any[]) => State>,
>(actionsDef: (state: State) => ActionsDef) {
  type Actions = Prettify<{
    [ActionName in keyof ActionsDef]: (
      ...args: Parameters<ActionsDef[ActionName]>
    ) => void
  }>

  const reducer = (state: State, [name, args]: [string, any[]]) =>
    actionsDef(state)[name]!(...args)

  const getInitialState = (initialState: State | (() => State)) =>
    typeof initialState === 'function' ? (initialState as any)() : initialState

  return (initialState: State | (() => State)) => {
    const [state, dispatch] = React.useReducer(
      reducer,
      getInitialState(initialState),
    )

    const [actions] = React.useState<Actions>(() =>
      Object.keys(actionsDef(getInitialState(initialState))).reduce(
        (acc, name) => ({
          ...acc,
          [name]: (...args) => dispatch([name, args]),
        }),
        {} as Actions,
      ),
    )

    return [state, actions] as const
  }
}
