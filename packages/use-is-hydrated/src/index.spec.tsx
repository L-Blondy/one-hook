import { cleanup, render } from '@testing-library/react'
import { useIsHydrated } from '.'
import { afterEach, expect, test } from 'vitest'
import React from 'react'

afterEach(() => cleanup())

test('Should be false before mounting', () => {
  let execElse = false
  function TestComponent() {
    const isFirstRender = React.useRef(true)
    const isHydrated = useIsHydrated()

    React.useLayoutEffect(() => {
      isFirstRender.current = false
      return () => {
        isFirstRender.current = true
      }
    }, [])

    if (isFirstRender.current) {
      expect(isHydrated).toBe(false)
    } else {
      expect(isHydrated).toBe(true)
      // eslint-disable-next-line react-compiler/react-compiler
      execElse = true
    }
    return null
  }

  render(<TestComponent />)
  expect(execElse).toBe(true)
})
