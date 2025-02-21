import { afterAll, beforeAll, vi } from 'vitest'

beforeAll(() => {
  vi.stubGlobal('MediaRecorder', MediaRecorderMock)
})

afterAll(() => {
  vi.unstubAllGlobals()
})

const MediaRecorderMock = vi.fn(
  (_stream: MediaStream, _options: MediaRecorderOptions) => {
    let interval: number | NodeJS.Timeout | undefined
    let data = 0

    const instance = {
      start() {
        instance.state = 'recording'
        interval = setInterval(() => {
          instance.ondataavailable({ data })
          data++
        }, 100)
        instance.onstart()
      },
      stop() {
        instance.state = 'inactive'
        clearInterval(interval)
        instance.onstop()
      },
      pause() {
        instance.state = 'paused'
        clearInterval(interval)
        instance.onpause()
      },
      resume() {
        instance.state = 'recording'
        interval = setInterval(() => {
          instance.ondataavailable({ data })
          data++
        }, 100)
        instance.onresume()
      },
      ondataavailable: vi.fn(),
      onstart: vi.fn(),
      onstop: vi.fn(),
      onpause: vi.fn(),
      onresume: vi.fn(),
      state: 'inactive' as RecordingState,
    }
    return instance
  },
)
