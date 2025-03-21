import type React from 'react'
import { test } from 'vitest'
import { forwardGenericRef } from '.'
import { render } from '@testing-library/react'
import { noop } from 'src/noop'

const defaultTag = 'div'

type Props<TComponent extends React.ElementType<any> = typeof defaultTag> =
  React.ComponentPropsWithoutRef<TComponent> & {
    as?: TComponent
  }

const ComponentAs = forwardGenericRef(
  <TComponent extends React.ElementType<any>>(
    { as, ...props }: Props<TComponent>,
    _ref: any,
  ) => {
    const Comp = as || defaultTag
    return <Comp {...props} />
  },
)

test('type inferrence', () => {
  render(<ComponentAs as="input" onChange={noop} value="string" />)
  // @ts-expect-error div has no `value` prop
  render(<ComponentAs as="div" onChange={noop} value="string" />)
  render(<ComponentAs as="div" onChange={noop} />)
})
