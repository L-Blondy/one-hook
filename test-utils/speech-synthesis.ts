import { afterAll, afterEach, beforeAll, vi } from 'vitest'

beforeAll(() => {
  vi.stubGlobal('SpeechSynthesisUtterance', SpeechSynthesisUtteranceMock)
  vi.stubGlobal('speechSynthesis', speechSynthesisMock)
})

afterEach(() => {
  vi.restoreAllMocks()
  utterances.clear()
})

afterAll(() => {
  vi.unstubAllGlobals()
})

const SpeechSynthesisUtteranceMock = vi.fn((_text?: string) => {
  const utterance = {
    onerror: vi.fn(),
    onend: vi.fn(),
    onstart: vi.fn(),
    onpause: vi.fn(),
    onresume: vi.fn(),
    lang: 'default',
    voice: null,
    rate: 1,
    pitch: 1,
    volume: 1,
    text: '',
    _error: null as any,
  }
  return utterance
})

const utterances = new Set<SpeechSynthesisUtterance & { _error: any }>()

const speechSynthesisMock = {
  pause() {
    utterances.forEach((utterance) => {
      if (utterance._error) return
      utterance.onpause?.({} as any)
    })
  },
  resume() {
    utterances.forEach((utterance) => {
      if (utterance._error) return
      utterance.onresume?.({} as any)
    })
  },
  cancel() {
    utterances.forEach((utterance) => {
      if (utterance._error) return
      utterance.onerror?.({} as any)
    })
  },
  speak(utterance: SpeechSynthesisUtterance & { _error: any }) {
    utterances.add(utterance)
    if (utterance.text === 'invalid') {
      utterance._error = {}
      utterance.onerror?.({} as any)
    } else {
      utterance.onstart?.({} as any)
    }
  },
}
