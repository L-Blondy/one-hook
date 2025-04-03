import { useUnmountEffect } from '@one-stack/use-unmount-effect'
import { isServer } from '@one-stack/utils/is-server'
import { useGetIsMounted } from '@one-stack/use-get-is-mounted'
import React from 'react'

export type UseSpeechSynthesisOptions = {
  lang?: string
  voice?: SpeechSynthesisVoice | null
  rate?: number
  pitch?: number
  volume?: number
}

type SpeechState =
  | {
      /**
       *  The current utterance being spoken
       */
      utterance: SpeechSynthesisUtterance | null
      /**
       * The current state of speech synthesis
       */
      state: 'idle' | 'speaking'
      /**
       * Error information if state is 'error'
       */
      error: null
    }
  | {
      utterance: SpeechSynthesisUtterance | null
      state: 'error'
      error: SpeechSynthesisErrorEvent
    }

type SpeechActions = {
  /**
   * Start speaking the provided text
   */
  speak(text: string): void
  /**
   * Stop the current speech
   */
  cancel(): void
}

export type UseSpeechSynthesisReturn = SpeechState & SpeechActions

export function useSpeechSynthesis({
  lang = 'en-US',
  pitch = 1,
  rate = 1,
  voice = null,
  volume = 1,
}: UseSpeechSynthesisOptions = {}) {
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
