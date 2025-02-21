import { expect, test } from 'vitest'
import { getInstanceId } from './utils'

const args1: Parameters<typeof getInstanceId> = [window, 'change', {}]
const args2: Parameters<typeof getInstanceId> = [
  document,
  'change',
  { capture: true },
]
const args3: Parameters<typeof getInstanceId> = [
  document.querySelector('button')!,
  'click',
  { passive: true },
]
const args4: Parameters<typeof getInstanceId> = [
  document.querySelector('input')!,
  'click',
  { once: true },
]

function copy(
  args: Parameters<typeof getInstanceId>,
): Parameters<typeof getInstanceId> {
  return [
    args[0],
    args[1],
    typeof args[2] === 'boolean' ? args[2] : { ...args[2] },
  ]
}

test('Should return the same id for a given input', () => {
  expect(getInstanceId(...args1)).toBe(getInstanceId(...copy(args1)))
  expect(getInstanceId(...args2)).toBe(getInstanceId(...copy(args2)))
  expect(getInstanceId(...args3)).toBe(getInstanceId(...copy(args3)))
  expect(getInstanceId(...args4)).toBe(getInstanceId(...copy(args4)))
})

test('Should return different ids for different outputs', () => {
  expect(
    [
      getInstanceId(...args2),
      getInstanceId(...args3),
      getInstanceId(...args4),
    ].includes(getInstanceId(...copy(args1))),
  ).toBe(false)
  expect(
    [
      getInstanceId(...args1),
      getInstanceId(...args3),
      getInstanceId(...args4),
    ].includes(getInstanceId(...copy(args2))),
  ).toBe(false)
  expect(
    [
      getInstanceId(...args1),
      getInstanceId(...args2),
      getInstanceId(...args4),
    ].includes(getInstanceId(...copy(args3))),
  ).toBe(false)
  expect(
    [
      getInstanceId(...args1),
      getInstanceId(...args2),
      getInstanceId(...args3),
    ].includes(getInstanceId(...copy(args4))),
  ).toBe(false)
})
