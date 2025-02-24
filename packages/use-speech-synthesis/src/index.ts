import { useUnmountEffect } from '@1hook/use-unmount-effect'
import { isServer } from '@1hook/utils/is-server'
import { useGetIsMounted } from '@1hook/use-get-is-mounted'
import React from 'react'

export type SpeechSynthesisOptions = {
  lang?: string
  voice?: SpeechSynthesisVoice | null
  rate?: number
  pitch?: number
  volume?: number
}

type SpeechState =
  | {
      utterance: SpeechSynthesisUtterance | null
      state: 'idle' | 'speaking'
      error: null
    }
  | {
      utterance: SpeechSynthesisUtterance | null
      state: 'error'
      error: SpeechSynthesisErrorEvent
    }

type SpeechActions = {
  speak(text: string): void
  cancel(): void
}

export function useSpeechSynthesis({
  lang = 'en-US',
  pitch = 1,
  rate = 1,
  voice = null,
  volume = 1,
}: SpeechSynthesisOptions = {}) {
  const getIsMounted = useGetIsMounted()
  const lastActionRef = React.useRef<keyof SpeechActions | null>(null)
  const [speech, setSpeech] = React.useState<SpeechState>(() => {
    if (isServer) return { utterance: null, state: 'idle', error: null }
    const utterance = new SpeechSynthesisUtterance()
    utterance.onerror = (error) => {
      getIsMounted() &&
        setSpeech((speech) =>
          lastActionRef.current === 'cancel'
            ? {
                ...speech,
                error: null,
                state: 'idle',
              }
            : {
                ...speech,
                error,
                state: 'error',
              },
        )
    }
    utterance.onend = () => {
      getIsMounted() &&
        setSpeech((speech) => ({
          ...speech,
          error: null,
          state: 'idle',
        }))
    }
    utterance.onstart = () => {
      getIsMounted() &&
        setSpeech((speech) => ({
          ...speech,
          error: null,
          state: 'speaking',
        }))
    }

    return { utterance, state: 'idle', error: null }
  })

  if (speech.utterance) {
    Object.assign(speech.utterance, {
      lang,
      voice,
      rate,
      pitch,
      volume,
    })
  }

  useUnmountEffect(() => window.speechSynthesis.cancel())

  const speak = React.useCallback(
    (text: string) => {
      if (speech.utterance && text) {
        Object.assign(speech.utterance, { text })
        // sometimes the utterance is not spoken
        // pause and resume fixes it
        window.speechSynthesis.pause()
        window.speechSynthesis.speak(speech.utterance)
        window.speechSynthesis.resume()
        lastActionRef.current = 'speak'
      }
    },
    [speech.utterance],
  )

  const cancel = React.useCallback(() => {
    window.speechSynthesis.cancel()
    lastActionRef.current = 'cancel'
  }, [])

  return { ...speech, speak, cancel }
}
