import '../../../test-utils/navigator'
import { act, renderHook } from '@testing-library/react'
import { expect, test } from 'vitest'
import { useDisplayMedia } from '.'
import { scheduler } from 'timers/promises'

test('Should return open and close methods', () => {
  const hook = renderHook(() => useDisplayMedia({ audio: true }))
  expect(typeof hook.result.current.open).toBe('function')
  expect(typeof hook.result.current.close).toBe('function')
})

test('Initial state should be ClosedMedia', () => {
  const hook = renderHook(() => useDisplayMedia({ audio: true }))
  expect(hook.result.current.stream).toEqual(null)
  expect(hook.result.current.error).toEqual(null)
  expect(hook.result.current.state).toEqual('closed')
})

test('open should trigger the LoadingMedia state', () => {
  const hook = renderHook(() => useDisplayMedia({ audio: true }))
  act(() => hook.result.current.open())
  expect(hook.result.current.stream).toEqual(null)
  expect(hook.result.current.error).toEqual(null)
  expect(hook.result.current.state).toEqual('loading')
})

test('after loading success we should have the OpenMedia state', async () => {
  const hook = renderHook(() => useDisplayMedia({ audio: true }))
  act(() => hook.result.current.open())
  await scheduler.wait(0)
  expect(hook.result.current.state).toEqual('open')
  expect(typeof hook.result.current.stream).toBe('object')
  expect(hook.result.current.error).toEqual(null)
})

test('Calling open while in OpenMedia state should be a noop', async () => {
  const hook = renderHook(() => useDisplayMedia({ audio: true }))
  act(() => hook.result.current.open())
  await scheduler.wait(0)
  act(() => hook.result.current.open())
  expect(hook.result.current.state).toEqual('open')
})

test('Changing the contraints while in OpenMedia state should close the stream', async () => {
  let video = false
  const hook = renderHook(() => useDisplayMedia({ audio: true, video }))
  act(() => hook.result.current.open())
  await scheduler.wait(0)
  expect(hook.result.current.state).toEqual('open')
  video = true
  hook.rerender()
  expect(hook.result.current.state).toEqual('closed')
})

test('Calling close while in OpenMedia state should close the stream', async () => {
  const hook = renderHook(() => useDisplayMedia({ audio: true }))
  act(() => hook.result.current.open())
  await scheduler.wait(0)
  expect(hook.result.current.state).toEqual('open')
  act(() => hook.result.current.close())
  expect(hook.result.current.state).toEqual('closed')
})

test('Calling close while in LoadingMedia state should close the stream', () => {
  const hook = renderHook(() => useDisplayMedia({ audio: true }))
  act(() => hook.result.current.open())
  expect(hook.result.current.state).toEqual('loading')
  act(() => hook.result.current.close())
  expect(hook.result.current.state).toEqual('closed')
})

test('Calling close while in ErrorMedia state should be a noop', async () => {
  // @ts-expect-error
  const hook = renderHook(() => useDisplayMedia(true))
  act(() => hook.result.current.open())
  expect(hook.result.current.state).toEqual('loading')
  await scheduler.wait(0)
  expect(hook.result.current.state).toEqual('error')
  act(() => hook.result.current.close())
  expect(hook.result.current.state).toEqual('error')
})

test('Calling open while in ErrorMedia state should trigger the LoadingMedia state', async () => {
  // @ts-expect-error
  const hook = renderHook(() => useDisplayMedia(true))
  act(() => hook.result.current.open())
  expect(hook.result.current.state).toEqual('loading')
  await scheduler.wait(0)
  expect(hook.result.current.state).toEqual('error')
  act(() => hook.result.current.open())
  expect(hook.result.current.state).toEqual('loading')
})

test('toggleAudio should toggle audio tracks when in OpenMedia state', async () => {
  const hook = renderHook(() => useDisplayMedia({ audio: true }))
  act(() => hook.result.current.open())
  await scheduler.wait(0)
  expect(hook.result.current.audioState).toBe('enabled')
  act(() => hook.result.current.toggleAudio())
  expect(hook.result.current.audioState).toBe('disabled')
  act(() => hook.result.current.toggleAudio())
  expect(hook.result.current.audioState).toBe('enabled')
})

test('toggleVideo should toggle video tracks when in OpenMedia state', async () => {
  const hook = renderHook(() => useDisplayMedia({ video: true }))
  act(() => hook.result.current.open())
  await scheduler.wait(0)
  expect(hook.result.current.videoState).toBe('enabled')
  act(() => hook.result.current.toggleVideo())
  expect(hook.result.current.videoState).toBe('disabled')
  act(() => hook.result.current.toggleVideo())
  expect(hook.result.current.videoState).toBe('enabled')
})

test('toggleAudio should be a noop when not in OpenMedia state', () => {
  const hook = renderHook(() => useDisplayMedia({ audio: true }))
  expect(hook.result.current.audioState).toBe('none')
  act(() => hook.result.current.toggleAudio())
  expect(hook.result.current.audioState).toBe('none')
})

test('toggleVideo should be a noop when not in OpenMedia state', () => {
  const hook = renderHook(() => useDisplayMedia({ video: true }))
  expect(hook.result.current.videoState).toBe('none')
  act(() => hook.result.current.toggleVideo())
  expect(hook.result.current.videoState).toBe('none')
})

test('audioState and videoState should be "none" when stream is closed', async () => {
  const hook = renderHook(() => useDisplayMedia({ audio: true, video: true }))
  expect(hook.result.current.audioState).toBe('none')
  expect(hook.result.current.videoState).toBe('none')
  act(() => hook.result.current.open())
  await scheduler.wait(0)
  expect(hook.result.current.audioState).toBe('enabled')
  expect(hook.result.current.videoState).toBe('enabled')
  act(() => hook.result.current.close())
  expect(hook.result.current.audioState).toBe('none')
  expect(hook.result.current.videoState).toBe('none')
})

test('audioState and videoState should be "none" when stream is loading', async () => {
  const hook = renderHook(() => useDisplayMedia({ audio: true, video: true }))
  act(() => hook.result.current.open())
  expect(hook.result.current.audioState).toBe('none')
  expect(hook.result.current.videoState).toBe('none')
  await scheduler.wait(0)
  expect(hook.result.current.audioState).toBe('enabled')
  expect(hook.result.current.videoState).toBe('enabled')
})

test('audioState and videoState should be "none" when stream is in error state', async () => {
  // @ts-expect-error intentional error
  const hook = renderHook(() => useDisplayMedia('produce some error'))
  act(() => hook.result.current.open())
  expect(hook.result.current.audioState).toBe('none')
  expect(hook.result.current.videoState).toBe('none')
  await scheduler.wait(0)
  expect(hook.result.current.state).toBe('error')
  expect(hook.result.current.audioState).toBe('none')
  expect(hook.result.current.videoState).toBe('none')
})
