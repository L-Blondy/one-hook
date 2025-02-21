import '../../../test-utils/intersection-observer'
import { afterEach, expect, test } from 'vitest'
import { cleanup } from '@testing-library/react'
import { getEventListener } from './vanilla'

afterEach(() => {
  cleanup()
})

test('Same target, type and options should use the same instance', () => {
  const target = document.createElement('div')
  const i1 = getEventListener(target, 'click', { passive: true })
  const i2 = getEventListener(target, 'click', { passive: true })
  expect(i1).toBe(i2)
})

test('Different target should use the different instance', () => {
  const target1 = document.createElement('div')
  const target2 = document.createElement('div')
  const i1 = getEventListener(target1, 'click', { passive: true })
  const i2 = getEventListener(target2, 'click', { passive: true })
  expect(i1).not.toBe(i2)
})

test('Different type should use the different instance', () => {
  const target = document.createElement('div')
  const i1 = getEventListener(target, 'click', { passive: true })
  const i2 = getEventListener(target, 'blur', { passive: true })
  expect(i1).not.toBe(i2)
})

test('Different options should use the different instance', () => {
  const target = document.createElement('div')
  const i1 = getEventListener(target, 'click', { passive: true })
  const i2 = getEventListener(target, 'click', { passive: false })
  expect(i1).not.toBe(i2)
})
