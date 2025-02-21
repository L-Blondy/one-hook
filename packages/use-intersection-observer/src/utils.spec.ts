import { expect, test } from 'vitest'
import { getInstanceId } from './utils'

const o1: IntersectionObserverInit = { root: document.getElementById('body') }
const o2: IntersectionObserverInit = {
  root: document.querySelector('body'),
  rootMargin: '10px',
  threshold: 0,
}
const o3: IntersectionObserverInit = {
  root: document.querySelector('html'),
  rootMargin: '10px',
  threshold: 0,
}
const o4: IntersectionObserverInit = { threshold: [0, 0.5, 1] }

test('Should return the same id for a given input', () => {
  expect(getInstanceId(o1)).toBe(getInstanceId({ ...o1 }))
  expect(getInstanceId(o2)).toBe(getInstanceId({ ...o2 }))
  expect(getInstanceId(o3)).toBe(getInstanceId({ ...o3 }))
  expect(getInstanceId(o4)).toBe(getInstanceId({ ...o4 }))
})

test('Should return different ids for different outputs', () => {
  expect(
    [getInstanceId(o2), getInstanceId(o3), getInstanceId(o4)].includes(
      getInstanceId(o1),
    ),
  ).toBe(false)
  expect(
    [getInstanceId(o1), getInstanceId(o3), getInstanceId(o4)].includes(
      getInstanceId(o2),
    ),
  ).toBe(false)
  expect(
    [getInstanceId(o1), getInstanceId(o2), getInstanceId(o4)].includes(
      getInstanceId(o3),
    ),
  ).toBe(false)
  expect(
    [getInstanceId(o1), getInstanceId(o2), getInstanceId(o3)].includes(
      getInstanceId(o4),
    ),
  ).toBe(false)
})
