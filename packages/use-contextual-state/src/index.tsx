import React from 'react'
import { useInvariantContext } from '@rebase.io/use-invariant-context'

export function defineContextualState<State>() {
  const StateCtx = React.createContext<State>(null!)
  const SetStateCtx = React.createContext<null | React.Dispatch<
    React.SetStateAction<State>
  >>(null)

  return [
    (props: {
      children: React.ReactNode
      initialState: State | (() => State)
    }) => {
      const [state, setState] = React.useState(props.initialState)
      return (
        <SetStateCtx.Provider value={setState}>
          <StateCtx.Provider value={state}>{props.children}</StateCtx.Provider>
        </SetStateCtx.Provider>
      )
    },

    () => {
      const state = React.useContext(StateCtx)
      const setState = useInvariantContext(SetStateCtx)
      return [state, setState] as const
    },

    () => useInvariantContext(SetStateCtx),
  ] as const
}
