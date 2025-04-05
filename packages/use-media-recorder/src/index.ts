import React from 'react'
import { useLatestRef } from '@1hook/use-latest-ref'
import type { Prettify } from '@1hook/utils/types'

export type UseMediaRecorderOptions = Prettify<
  MediaRecorderOptions & {
    timeslice?: number
    onStop?: () => void
    onStart?: () => void
    onPause?: () => void
    onResume?: () => void
    onComplete?: (chunks: Blob[]) => void
  }
>

export type UseMediaRecorderReturn = {
  state: RecordingState
  pause: () => void
  resume: () => void
}

export function useMediaRecorder(
  stream: MediaStream | null | undefined,
  {
    timeslice,
    audioBitsPerSecond,
    bitsPerSecond,
    mimeType,
    videoBitsPerSecond,
    ...listeners
  }: UseMediaRecorderOptions = {},
): UseMediaRecorderReturn {
  const recorderRef = React.useRef<MediaRecorder | null>(null)
  const listenersRef = useLatestRef(listeners)
  const [state, setState] = React.useState<RecordingState>('inactive')

  React.useEffect(() => {
    if (!stream) return
    const chunks: Blob[] = []
    const recorder = new MediaRecorder(stream, {
      audioBitsPerSecond,
      bitsPerSecond,
      mimeType,
      videoBitsPerSecond,
    })
    recorder.onstart = () => {
      listenersRef.current.onStart?.()
      setState(recorder.state)
    }
    recorder.onpause = () => {
      listenersRef.current.onPause?.()
      setState(recorder.state)
    }
    recorder.onresume = () => {
      listenersRef.current.onResume?.()
      setState(recorder.state)
    }
    recorder.onstop = () => {
      listenersRef.current.onStop?.()
      chunks.length && listenersRef.current.onComplete?.(chunks)
      chunks.splice(0, chunks.length)
      setState(recorder.state)
    }
    recorder.ondataavailable = (e) => {
      chunks.push(e.data)
    }
    recorder.start(timeslice)
    setState('recording')
    recorderRef.current = recorder

    return () => {
      recorder.stop()
      recorderRef.current = null
    }
  }, [
    stream,
    timeslice,
    audioBitsPerSecond,
    bitsPerSecond,
    mimeType,
    videoBitsPerSecond,
    listenersRef,
  ])

  const pause = React.useCallback(() => {
    if (recorderRef.current?.state !== 'inactive') {
      recorderRef.current?.pause()
    }
  }, [])

  const resume = React.useCallback(() => {
    if (recorderRef.current?.state !== 'inactive') {
      recorderRef.current?.resume()
    }
  }, [])

  return { state, pause, resume }
}
