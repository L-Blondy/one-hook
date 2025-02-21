import React from 'react'
import { expectTypeOf, test } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useInvariantContext } from '.'

test('Should return a NonNullable version of the context type', () => {
  type ContextType = null | undefined | string | number | { a: boolean }
  const Context = React.createContext<ContextType>(null)
  renderHook(
    () => {
      const ctx = useInvariantContext(Context)
      expectTypeOf(ctx).toEqualTypeOf<NonNullable<ContextType>>()
    },
    {
      wrapper: (props: { children: React.ReactNode }) => (
        <Context.Provider value={{} as any} {...props} />
      ),
    },
  )
})
