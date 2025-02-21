/* eslint-disable @typescript-eslint/require-await */
import { afterAll, afterEach, beforeAll, vi } from 'vitest'

type AnyFunction = (...args: any[]) => any
const noop = () => {}

beforeAll(() => {
  vi.stubGlobal('navigator', navigatorMock)
})

afterEach(() => {
  vi.restoreAllMocks()
  permissionListeners.clear()
  geolocationSuccessListeners.clear()
  geolocationErrorListeners.clear()
})

afterAll(() => {
  vi.unstubAllGlobals()
})

export const permissionListeners = new Set<EventListener>()
const geolocationSuccessListeners = new Set<
  (position: GeolocationPosition) => void
>()
const geolocationErrorListeners = new Set<
  (error: GeolocationPositionError) => void
>()

const permissionStatus: PermissionStatus = {
  name: '',
  state: 'prompt',
  dispatchEvent: () => true,
  onchange: () => {},
  addEventListener(_type: 'change', listener: EventListener) {
    permissionListeners.add(listener)
  },
  removeEventListener: (_type: 'change', listener: EventListener) => {
    permissionListeners.delete(listener)
  },
}

const navigatorMock = {
  permissions: {
    query: vi.fn(
      async (descriptor: PermissionDescriptor): Promise<PermissionStatus> => {
        // @ts-expect-error this is a mock...
        permissionStatus.name = descriptor.name
        return permissionStatus
      },
    ),
  },
  mediaDevices: {
    async getUserMedia(_contraints: MediaStreamConstraints) {
      if (typeof _contraints !== 'object') throw new Error('Failed')
      const stream = {
        getTracks: () => [{ stop: noop }],
        getVideoTracks: () => [{ stop: noop }],
        getAudioTracks: () => [{ stop: noop }],
      }
      return stream
    },
    async getDisplayMedia(_options: DisplayMediaStreamOptions) {
      if (typeof _options !== 'object') throw new Error('Failed')
      const stream = {
        getTracks: () => [{ stop: noop }],
        getVideoTracks: () => [{ stop: noop }],
        getAudioTracks: () => [{ stop: noop }],
      }
      return stream
    },
  },
  geolocation: {
    getCurrentPosition(
      successListener: AnyFunction,
      errorListener: AnyFunction,
      _options: PositionOptions,
    ) {
      geolocationSuccessListeners.add(successListener)
      geolocationErrorListeners.add(errorListener)
    },
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  },
}

export function mockPermissionChange(state: PermissionState) {
  // @ts-expect-error this is a mock...
  permissionStatus.state = state
  permissionListeners.forEach((l) => l({} as Event))
}

export function mockGeolocationSuccess(position: GeolocationPosition) {
  geolocationSuccessListeners.forEach((l) => l(position))
}

export function mockGeolocationError(error: GeolocationPositionError) {
  geolocationErrorListeners.forEach((l) => l(error))
}
