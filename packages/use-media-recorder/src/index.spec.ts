import '../../../test-utils/media-recorder'
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, expect, test, vi } from 'vitest'
import { useMediaRecorder } from './index'

afterEach(() => {
  cleanup()
  vi.clearAllTimers()
})

beforeAll(() => {
  vi.useFakeTimers()
})

afterAll(() => {
  vi.useRealTimers()
})

test('Should return {state, pause, resume}', () => {
  const { result } = renderHook(() => {
    return useMediaRecorder(null)
  })

  expect(typeof result.current.state).toBe('string')
  expect(typeof result.current.pause).toBe('function')
  expect(typeof result.current.resume).toBe('function')
})

test('The initial state is inactive', () => {
  const { result } = renderHook(() => {
    return useMediaRecorder(null)
  })

  expect(result.current.state).toBe('inactive')
})

test('Should start recording when the media stream is defined, and call the onStart event', () => {
  const spy = vi.fn()
  let stream: MediaStream = {} as MediaStream
  const { result } = renderHook(() => {
    return useMediaRecorder(stream, {
      onStart: spy,
    })
  })
  expect(result.current.state).toBe('recording')
  expect(spy).toHaveBeenCalled()
})

test('Should stop recording when the media stream is not defined, and call the onStop event', () => {
  const spy = vi.fn()
  let stream: MediaStream | null = {} as MediaStream

  const { result, rerender } = renderHook(() => {
    return useMediaRecorder(stream, {
      onStop: spy,
    })
  })
  expect(result.current.state).toBe('recording')
  expect(spy).toHaveBeenCalledTimes(1) // strict mode
  stream = null
  rerender()
  expect(spy).toHaveBeenCalledTimes(2)
  expect(result.current.state).toBe('inactive')
})

test('onComplete should receive the chunks if any', () => {
  const spy = vi.fn()
  let stream: MediaStream | null = {} as MediaStream

  const { rerender } = renderHook(() => {
    return useMediaRecorder(stream, {
      onComplete(chunks) {
        expect(chunks).toEqual([0])
        spy(chunks)
      },
    })
  })
  vi.advanceTimersByTime(100)
  stream = null
  rerender()
  expect(spy).toHaveBeenCalledTimes(1)
})

test('onComplete should not be called if there is no chunk', () => {
  const onComplete = vi.fn()
  const onStop = vi.fn()
  let stream = {} as MediaStream | null
  const { rerender } = renderHook(() => {
    return useMediaRecorder(stream, {
      onComplete,
      onStop,
    })
  })
  stream = null
  rerender()
  expect(onStop).toHaveBeenCalled()
  expect(onComplete).not.toHaveBeenCalled()
})

test('after the stream is closed, the chunks are cleared', () => {
  const spy = vi.fn()
  let stream: MediaStream | null = {} as MediaStream
  let exec = 1

  const { rerender } = renderHook(() => {
    return useMediaRecorder(stream, {
      onComplete(chunks) {
        if (exec === 1) {
          expect(chunks).toEqual([0, 1, 2])
        }
        if (exec === 2) {
          expect(chunks).toEqual([0, 1])
        }
        exec++
        spy(chunks)
      },
    })
  })
  vi.advanceTimersByTime(300)
  stream = null
  rerender()
  expect(spy).toHaveBeenCalledTimes(1)
  stream = {} as MediaStream
  rerender()
  vi.advanceTimersByTime(200)
  stream = null
  rerender()
  expect(spy).toHaveBeenCalledTimes(2)
})

test('pause() should set the state to paused and trigger onPause', () => {
  const spy = vi.fn()
  const stream = {} as MediaStream
  const { result } = renderHook(() => {
    return useMediaRecorder(stream, {
      onPause: spy,
    })
  })
  act(() => result.current.pause())
  expect(result.current.state).toBe('paused')
  expect(spy).toHaveBeenCalledTimes(1)
})

test('resume() should set the state to recording and trigger onResume', () => {
  const spy = vi.fn()
  const stream = {} as MediaStream
  const { result } = renderHook(() => {
    return useMediaRecorder(stream, {
      onResume: spy,
    })
  })
  act(() => result.current.pause())
  expect(result.current.state).toBe('paused')
  act(() => result.current.resume())
  expect(result.current.state).toBe('recording')
  expect(spy).toHaveBeenCalledTimes(1)
})

test('changing the `stream` option should restart the recording', () => {
  const onStart = vi.fn()
  const onStop = vi.fn()
  const onComplete = vi.fn()
  let stream = {} as MediaStream
  const { rerender } = renderHook(() => {
    return useMediaRecorder(stream, {
      onStart,
      onStop,
      onComplete,
    })
  })
  expect(onStart).toHaveBeenCalledTimes(2) // strict mode
  expect(onStop).toHaveBeenCalledTimes(1) // strict mode
  expect(onComplete).toHaveBeenCalledTimes(0)
  // populate chunks for onComplete
  vi.advanceTimersByTime(100)
  stream = {} as MediaStream
  rerender()
  expect(onStart).toHaveBeenCalledTimes(3) // strict mode
  expect(onStop).toHaveBeenCalledTimes(2) // strict mode
  expect(onComplete).toHaveBeenCalledTimes(1)
})

test('changing the `timeslice` option should restart the recording', () => {
  const onStart = vi.fn()
  const onStop = vi.fn()
  const onComplete = vi.fn()
  const stream = {} as MediaStream
  let timeslice = 100
  const { rerender } = renderHook(() => {
    return useMediaRecorder(stream, {
      timeslice,
      onStart,
      onStop,
      onComplete,
    })
  })
  expect(onStart).toHaveBeenCalledTimes(2) // strict mode
  expect(onStop).toHaveBeenCalledTimes(1) // strict mode
  expect(onComplete).toHaveBeenCalledTimes(0)
  // populate chunks for onComplete
  vi.advanceTimersByTime(100)
  timeslice = 200
  rerender()
  expect(onStart).toHaveBeenCalledTimes(3) // strict mode
  expect(onStop).toHaveBeenCalledTimes(2) // strict mode
  expect(onComplete).toHaveBeenCalledTimes(1)
})

test('changing the `audioBitsPerSecond` option should restart the recording', () => {
  const onStart = vi.fn()
  const onStop = vi.fn()
  const onComplete = vi.fn()
  const stream = {} as MediaStream
  let audioBitsPerSecond = 100
  const { rerender } = renderHook(() => {
    return useMediaRecorder(stream, {
      audioBitsPerSecond,
      onStart,
      onStop,
      onComplete,
    })
  })
  expect(onStart).toHaveBeenCalledTimes(2) // strict mode
  expect(onStop).toHaveBeenCalledTimes(1) // strict mode
  expect(onComplete).toHaveBeenCalledTimes(0)
  // populate chunks for onComplete
  vi.advanceTimersByTime(100)
  audioBitsPerSecond = 200
  rerender()
  expect(onStart).toHaveBeenCalledTimes(3) // strict mode
  expect(onStop).toHaveBeenCalledTimes(2) // strict mode
  expect(onComplete).toHaveBeenCalledTimes(1)
})

test('changing the `bitsPerSecond` option should restart the recording', () => {
  const onStart = vi.fn()
  const onStop = vi.fn()
  const onComplete = vi.fn()
  const stream = {} as MediaStream
  let bitsPerSecond = 100
  const { rerender } = renderHook(() => {
    return useMediaRecorder(stream, {
      bitsPerSecond,
      onStart,
      onStop,
      onComplete,
    })
  })
  expect(onStart).toHaveBeenCalledTimes(2) // strict mode
  expect(onStop).toHaveBeenCalledTimes(1) // strict mode
  expect(onComplete).toHaveBeenCalledTimes(0)
  // populate chunks for onComplete
  vi.advanceTimersByTime(100)
  bitsPerSecond = 200
  rerender()
  expect(onStart).toHaveBeenCalledTimes(3) // strict mode
  expect(onStop).toHaveBeenCalledTimes(2) // strict mode
  expect(onComplete).toHaveBeenCalledTimes(1)
})

test('changing the `mimeType` option should restart the recording', () => {
  const onStart = vi.fn()
  const onStop = vi.fn()
  const onComplete = vi.fn()
  const stream = {} as MediaStream
  let mimeType = '100'
  const { rerender } = renderHook(() => {
    return useMediaRecorder(stream, {
      mimeType,
      onStart,
      onStop,
      onComplete,
    })
  })
  expect(onStart).toHaveBeenCalledTimes(2) // strict mode
  expect(onStop).toHaveBeenCalledTimes(1) // strict mode
  expect(onComplete).toHaveBeenCalledTimes(0)
  // populate chunks for onComplete
  vi.advanceTimersByTime(100)
  mimeType = '200'
  rerender()
  expect(onStart).toHaveBeenCalledTimes(3) // strict mode
  expect(onStop).toHaveBeenCalledTimes(2) // strict mode
  expect(onComplete).toHaveBeenCalledTimes(1)
})

test('changing the `videoBitsPerSecond` option should restart the recording', () => {
  const onStart = vi.fn()
  const onStop = vi.fn()
  const onComplete = vi.fn()
  const stream = {} as MediaStream
  let videoBitsPerSecond = 100
  const { rerender } = renderHook(() => {
    return useMediaRecorder(stream, {
      videoBitsPerSecond,
      onStart,
      onStop,
      onComplete,
    })
  })
  expect(onStart).toHaveBeenCalledTimes(2) // strict mode
  expect(onStop).toHaveBeenCalledTimes(1) // strict mode
  expect(onComplete).toHaveBeenCalledTimes(0)
  // populate chunks for onComplete
  vi.advanceTimersByTime(100)
  videoBitsPerSecond = 200
  rerender()
  expect(onStart).toHaveBeenCalledTimes(3) // strict mode
  expect(onStop).toHaveBeenCalledTimes(2) // strict mode
  expect(onComplete).toHaveBeenCalledTimes(1)
})
