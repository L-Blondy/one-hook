import '../../../test-utils/intersection-observer'
import { afterEach, expect, test } from 'vitest'
import { cleanup } from '@testing-library/react'
import { getIntersectionObserver } from './vanilla'

afterEach(() => {
  cleanup()
})

test('Same options should use the same instance', () => {
  const i1 = getIntersectionObserver({ rootMargin: '50px' })
  const i2 = getIntersectionObserver({ rootMargin: '50px' })
  expect(i1).toBe(i2)
})

test('Different options should use the differencìt instance', () => {
  const i1 = getIntersectionObserver({ rootMargin: '50px' })
  const i2 = getIntersectionObserver({ rootMargin: '0px' })
  expect(i1).not.toBe(i2)
})
