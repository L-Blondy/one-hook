import { renderHook } from '@testing-library/react'
import {
  afterAll,
  afterEach,
  beforeAll,
  expect,
  expectTypeOf,
  test,
  vi,
} from 'vitest'
import { useCountdown } from '.'
import { resetIntervalSync } from '@1hook/use-interval/test-utils'

beforeAll(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  resetIntervalSync()
  vi.clearAllTimers()
})

afterAll(() => {
  vi.useRealTimers()
})

test('type inference', () => {
  renderHook(() => {
    const countdown = useCountdown({
      to: new Date(Date.now() + 1000 * 60),
      onTick: (value) => {
        expectTypeOf(value).toBeNumber()
      },
    })

    expectTypeOf(countdown).toBeNumber()
  })

  renderHook(() => {
    const countdown = useCountdown({
      to: new Date(Date.now() + 1000 * 60),
      transform: (n) => String(n),
      onTick: (value) => {
        expectTypeOf(value).toBeString()
      },
    })

    expectTypeOf(countdown).toBeString()
  })
})

test('Should return the remaining ms by default', () => {
  const { result } = renderHook(() => {
    return useCountdown({
      to: new Date(Date.now() + 1000 * 60),
    })
  })

  expect(result.current).toBe(1000 * 60)
})

test('Should return the whatever `transform` returns', () => {
  const { result } = renderHook(() => {
    return useCountdown({
      to: new Date(Date.now() + 1000 * 60),
      transform: String,
    })
  })

  expect(result.current).toBe(String(1000 * 60))
})

test('Should tick every 1000ms by default', () => {
  const onTickSpy = vi.fn()
  const to = new Date(Date.now() + 1000 * 60)

  const { rerender } = renderHook(() => {
    useCountdown({
      to,
      onTick: onTickSpy,
      trackState: true,
    })
  })

  vi.advanceTimersByTime(999)
  expect(onTickSpy).not.toHaveBeenCalled()
  vi.advanceTimersByTime(1)
  rerender()
  expect(onTickSpy).toHaveBeenCalledWith(1000 * 59)
  vi.advanceTimersByTime(1000)
  rerender()
  expect(onTickSpy).toHaveBeenCalledWith(1000 * 58)
})

test('`interval` changes the tick interval...', () => {
  const onTickSpy = vi.fn()

  renderHook(() => {
    useCountdown({
      to: new Date(Date.now() + 1000 * 60),
      interval: 500,
      onTick: onTickSpy,
    })
  })

  vi.advanceTimersByTime(499)
  expect(onTickSpy).not.toHaveBeenCalled()
  vi.advanceTimersByTime(1)
  expect(onTickSpy).toHaveBeenCalledWith(1000 * 60 - 500)
  vi.advanceTimersByTime(500)
  expect(onTickSpy).toHaveBeenCalledWith(1000 * 59)
})

test('`onTick` should receive whatever `transform` returns', () => {
  const onTickSpy = vi.fn()

  renderHook(() => {
    useCountdown({
      to: new Date(Date.now() + 1000 * 60),
      transform: String,
      onTick: onTickSpy,
    })
  })

  vi.advanceTimersByTime(999)
  expect(onTickSpy).not.toHaveBeenCalled()
  vi.advanceTimersByTime(1)
  expect(onTickSpy).toHaveBeenCalledWith(String(1000 * 59))
  vi.advanceTimersByTime(1000)
  expect(onTickSpy).toHaveBeenCalledWith(String(1000 * 58))
})

test('Should be paused when passing `to: null | false | undefined`', () => {
  const onTickSpy = vi.fn()
  let to: Parameters<typeof useCountdown>[0]['to'] = new Date(
    Date.now() + 1000 * 60,
  )

  const { rerender } = renderHook(() => {
    useCountdown({
      to,
      onTick: onTickSpy,
    })
  })

  vi.advanceTimersByTime(1000)
  expect(onTickSpy).toHaveBeenCalledWith(1000 * 59)
  expect(onTickSpy).toHaveBeenCalledOnce()

  to = null
  rerender()
  vi.advanceTimersByTime(5000)

  expect(onTickSpy).toHaveBeenCalledOnce()

  to = false
  rerender()
  vi.advanceTimersByTime(5000)

  expect(onTickSpy).toHaveBeenCalledOnce()

  to = undefined
  rerender()
  vi.advanceTimersByTime(5000)

  expect(onTickSpy).toHaveBeenCalledOnce()

  to = new Date(Date.now() + 1000 * 60)
  rerender()

  expect(onTickSpy).toHaveBeenCalledOnce()
  vi.advanceTimersByTime(1000)
  expect(onTickSpy).toHaveBeenCalledWith(1000 * 59)
  vi.advanceTimersByTime(1000)
  expect(onTickSpy).toHaveBeenCalledWith(1000 * 58)
  vi.advanceTimersByTime(1000)
  expect(onTickSpy).toHaveBeenCalledWith(1000 * 57)
})

test('Should call `onExpire` when the time is over', () => {
  const onExpireSpy = vi.fn()

  renderHook(() => {
    useCountdown({
      to: new Date(Date.now() + 1000 * 60),
      onExpire: onExpireSpy,
    })
  })

  expect(onExpireSpy).not.toHaveBeenCalled()
  vi.advanceTimersByTime(1000 * 59)
  expect(onExpireSpy).not.toHaveBeenCalled()
  vi.advanceTimersByTime(1000)
  expect(onExpireSpy).toHaveBeenCalledOnce()
})

test('When paused, onExpire should not be called', () => {
  const onExpireSpy = vi.fn()
  let to: Parameters<typeof useCountdown>[0]['to'] = null

  const { rerender } = renderHook(() => {
    useCountdown({
      to,
      onExpire: onExpireSpy,
    })
  })

  expect(onExpireSpy).not.toHaveBeenCalled()

  to = new Date(Date.now() + 1000 * 60)
  rerender()
  vi.advanceTimersByTime(1000)

  to = null
  expect(onExpireSpy).not.toHaveBeenCalled()
})

test('After being done, the countdown can start again by updating `to`', () => {
  const onExpireSpy = vi.fn()
  const onTickSpy = vi.fn()
  let to: Parameters<typeof useCountdown>[0]['to'] = new Date(
    Date.now() + 1000 * 60,
  )

  const { rerender } = renderHook(() => {
    useCountdown({
      to,
      onTick: onTickSpy,
      onExpire: onExpireSpy,
    })
  })
  vi.advanceTimersByTime(1000 * 60)
  expect(onExpireSpy).toHaveBeenCalled()

  // update to
  to = new Date(new Date(Date.now() + 1000 * 70))
  rerender()
  vi.advanceTimersByTime(1000)
  expect(onTickSpy).toHaveBeenCalledWith(1000 * 69)
})

test('Should not create a closure', () => {
  const to = new Date(Date.now() + 2000)
  const onTickSpy = vi.fn()
  const onExpireSpy = vi.fn()
  const onTransformSpy = vi.fn()
  const { rerender } = renderHook((props: { value: number } = { value: 1 }) =>
    useCountdown({
      to,
      onTick: () => onTickSpy(props.value),
      onExpire: () => onExpireSpy(props.value),
      transform: () => onTransformSpy(props.value),
    }),
  )
  vi.advanceTimersByTime(1000)
  expect(onTickSpy).toHaveBeenCalledWith(1)
  expect(onTransformSpy).toHaveBeenCalledWith(1)
  rerender({ value: 2 })
  vi.advanceTimersByTime(10000)
  expect(onTickSpy).toHaveBeenCalledWith(2)
  expect(onExpireSpy).toHaveBeenCalledWith(2)
  expect(onTransformSpy).toHaveBeenCalledWith(2)
})

test('When "to" changes, the state should update immediately', () => {
  let to: any = false

  const { rerender, result } = renderHook(() => {
    return useCountdown({ to, transform: String })
  })
  expect(result.current).toBe('0')
  to = new Date(Date.now() + 1000)
  rerender()
  expect(result.current).toBe('1000')
  vi.advanceTimersByTime(1000)
  rerender()
  expect(result.current).toBe('0')
  to = new Date(Date.now() + 1000)
  rerender()
  expect(result.current).toBe('1000')
})

test('{ trackState?: true | undefined } the returned value should update on each tick', () => {
  let to = new Date(Date.now() + 1000 * 60)

  const { result, rerender } = renderHook(() => {
    return useCountdown({ to, transform: String })
  })

  expect(result.current).toBe(String(1000 * 60))
  vi.advanceTimersByTime(999)
  rerender()
  expect(result.current).toBe(String(1000 * 60))
  vi.advanceTimersByTime(1)
  rerender()
  expect(result.current).toBe(String(1000 * 59))
})

test('{ trackState: false } the returned value should never', () => {
  let to = new Date(Date.now() + 1000 * 60)

  const { result, rerender } = renderHook(() => {
    return useCountdown({ to, transform: String, trackState: false })
  })

  expect(result.current).toBe(String(1000 * 60))
  vi.advanceTimersByTime(999)
  rerender()
  expect(result.current).toBe(String(1000 * 60))
  vi.advanceTimersByTime(1)
  rerender()
  expect(result.current).toBe(String(1000 * 60))
})
