import { renderHook } from '@testing-library/react'
import { useGeolocation } from '.'
import { test, expect } from 'vitest'
import {
  mockGeolocationError,
  mockGeolocationSuccess,
} from '../../../test-utils/navigator'

test('should return loading state initially', () => {
  const { result } = renderHook(() => useGeolocation())

  expect(result.current).toEqual({
    state: 'loading',
    error: null,
    coords: {
      timestamp: null,
      accuracy: null,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      latitude: null,
      longitude: null,
      speed: null,
    },
  })
})

test('should handle successful geolocation', () => {
  const { result, rerender } = renderHook(() => useGeolocation())

  const event = {
    timestamp: 1234567890,
    toJSON: () => '',
    coords: {
      toJSON: () => '',
      accuracy: 10,
      altitude: 100,
      altitudeAccuracy: 5,
      heading: 90,
      latitude: 51.5074,
      longitude: -0.1278,
      speed: 0,
    },
  }

  mockGeolocationSuccess(event)
  rerender()

  expect(result.current).toEqual({
    state: 'watching',
    error: null,
    coords: {
      timestamp: event.timestamp,
      accuracy: event.coords.accuracy,
      altitude: event.coords.altitude,
      altitudeAccuracy: event.coords.altitudeAccuracy,
      heading: event.coords.heading,
      latitude: event.coords.latitude,
      longitude: event.coords.longitude,
      speed: event.coords.speed,
    },
  })
})

test('should handle geolocation error', () => {
  const { result, rerender } = renderHook(() => useGeolocation())

  const error = {
    code: 1,
    message: 'User denied geolocation',
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
  } as const

  mockGeolocationError(error)
  rerender()

  expect(result.current).toEqual({
    state: 'error',
    error: error,
    coords: {
      timestamp: null,
      accuracy: null,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      latitude: null,
      longitude: null,
      speed: null,
    },
  })
})
