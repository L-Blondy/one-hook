import { cleanup } from '@testing-library/react'
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest'
import { intervalMap, set, clear } from './vanilla'
import { resetIntervalSync } from './test-utils'

afterAll(() => {
  vi.unstubAllGlobals()
})

beforeAll(() => {
  vi.useFakeTimers()
})

beforeEach(() => {
  vi.spyOn(global, 'clearInterval')
})

afterEach(() => {
  resetIntervalSync()
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.clearAllTimers()
})

afterAll(() => {
  vi.useRealTimers()
})
describe(`sync: true`, () => {
  test('Should execute the callback after the delay until cleared', () => {
    const spy = vi.fn()
    const token = set(spy, 1000, true)
    vi.advanceTimersByTime(999)
    expect(spy).toHaveBeenCalledTimes(0)
    vi.advanceTimersByTime(1)
    expect(spy).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(999)
    expect(spy).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(1)
    expect(spy).toHaveBeenCalledTimes(2)
    clear(token)
    vi.advanceTimersByTime(99999)
    expect(spy).toHaveBeenCalledTimes(2)
  })

  test('Two intervals with the same delay should share the same interval', () => {
    const spy1 = vi.fn()
    const spy2 = vi.fn()
    set(spy1, 1000, true)
    set(spy2, 1000, true)
    expect(intervalMap.size).toBe(1)
    expect(spy1).toHaveBeenCalledTimes(0)
    expect(spy2).toHaveBeenCalledTimes(0)
    vi.advanceTimersByTime(1000)
    expect(spy1).toHaveBeenCalledTimes(1)
    expect(spy2).toHaveBeenCalledTimes(1)
  })

  test('Cancelling all callbacks of an interval should clear it remove it from the Map', () => {
    const token1 = set(vi.fn(), 1000, true)
    const token2 = set(vi.fn(), 1000, true)
    expect(intervalMap.size).toBe(1)
    expect(intervalMap.get(1000)?.callbacks.size).toBe(2)
    clear(token1)
    expect(intervalMap.size).toBe(1)
    expect(intervalMap.get(1000)?.callbacks.size).toBe(1)
    expect(clearInterval).toHaveBeenCalledTimes(0)
    clear(token2)
    expect(clearInterval).toHaveBeenCalledTimes(1)
    expect(intervalMap.size).toBe(0)
  })

  test('different delays should create difference intervals', () => {
    const spy1 = vi.fn()
    const spy2 = vi.fn()
    set(spy1, 1000, true)
    set(spy2, 100, true)
    expect(intervalMap.size).toBe(2)
    vi.advanceTimersByTime(100)
    expect(spy1).toHaveBeenCalledTimes(0)
    expect(spy2).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(100)
    expect(spy1).toHaveBeenCalledTimes(0)
    expect(spy2).toHaveBeenCalledTimes(2)
    vi.advanceTimersByTime(800)
    expect(spy1).toHaveBeenCalledTimes(1)
    expect(spy2).toHaveBeenCalledTimes(10)
  })
})
