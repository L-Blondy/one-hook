import React from 'react'
import { useInvariantContext } from '@1hook/use-invariant-context'

export function defineContextualState<State>() {
  const StateCtx = React.createContext<State>(null!)
  const SetStateCtx = React.createContext<null | React.Dispatch<
    React.SetStateAction<State>
  >>(null)

  function Provider(props: {
    children: React.ReactNode
    initialState: State | (() => State)
  }) {
    const [state, setState] = React.useState(props.initialState)
    return (
      <SetStateCtx.Provider value={setState}>
        <StateCtx.Provider value={state}>{props.children}</StateCtx.Provider>
      </SetStateCtx.Provider>
    )
  }

  function useState() {
    return [
      React.useContext(StateCtx),
      useInvariantContext(SetStateCtx),
    ] as const
  }

  function useSetState() {
    return useInvariantContext(SetStateCtx)
  }

  return [Provider, useState, useSetState] as [
    Provider: typeof Provider,
    useState: typeof useState,
    useSetState: typeof useSetState,
  ]
}
