import { act, renderHook } from '@testing-library/react'
import '../../../test-utils/speech-synthesis'
import { expect, test } from 'vitest'
import { useSpeechSynthesis } from '.'

test('Should initialize with idle state', () => {
  const { result } = renderHook(() => useSpeechSynthesis())
  expect(result.current.state).toBe('idle')
})

test('Should have the "speaking" state after calling speak()', () => {
  const { result } = renderHook(() => useSpeechSynthesis())
  act(() => {
    result.current.speak('Hello, world!')
  })
  expect(result.current.state).toBe('speaking')
})

test('Should have the "idle" state after calling cancel()', () => {
  const { result } = renderHook(() => useSpeechSynthesis())
  act(() => {
    result.current.speak('Hello, world!')
    result.current.cancel()
  })
  expect(result.current.state).toBe('idle')
})

test('Should have the "error" state when an error occurs', () => {
  const { result } = renderHook(() => useSpeechSynthesis())
  act(() => {
    result.current.speak('invalid')
  })
  expect(result.current.state).toBe('error')
})

test('options should be applied to the utterance', () => {
  const options = {
    lang: 'fr',
    pitch: 0.1,
    rate: 0.2,
    voice: {
      default: true,
      lang: 'en-US',
      name: 'Alex',
      voiceURI: 'Alex',
      localService: true,
    },
    volume: 0.3,
  }
  const { result } = renderHook(() => useSpeechSynthesis(options))
  act(() => {
    result.current.speak('Hello, world!')
  })
  expect(result.current.utterance?.lang).toBe(options.lang)
  expect(result.current.utterance?.pitch).toBe(options.pitch)
  expect(result.current.utterance?.rate).toBe(options.rate)
  expect(result.current.utterance?.text).toBe('Hello, world!')
  expect(result.current.utterance?.voice).toBe(options.voice)
  expect(result.current.utterance?.volume).toBe(options.volume)
})
