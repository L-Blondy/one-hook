import { afterAll, afterEach, beforeAll, expect, test, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import { useNavigatorPermission } from '.'
import {
  mockPermissionChange,
  permissionListeners,
} from '../../../test-utils/navigator'

beforeAll(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  cleanup()
})

afterAll(() => {
  vi.useRealTimers()
})

test('Should return `undefined` initially', () => {
  const { result } = renderHook(() =>
    useNavigatorPermission({ name: 'geolocation' }),
  )
  expect(result.current.state).toBe('loading')
})

test('should have permission state on promise resolve', async () => {
  const { result } = renderHook(() =>
    useNavigatorPermission({ name: 'geolocation' }),
  )
  await act(async () => {})
  expect(result.current.state).toBe('prompt')
})

test('should update hook state on permission state change', async () => {
  const { result } = renderHook(() =>
    useNavigatorPermission({ name: 'geolocation' }),
  )

  await act(async () => {})
  expect(result.current.state).toBe('prompt')
  act(() => {
    mockPermissionChange('granted')
  })
  expect(result.current.state).toBe('granted')
})

test('Should remove the listeners on unmount', async () => {
  const { unmount } = renderHook(() =>
    useNavigatorPermission({ name: 'geolocation' }),
  )
  await act(async () => {})
  expect(permissionListeners.size).toBe(1)
  unmount()
  expect(permissionListeners.size).toBe(0)
})
