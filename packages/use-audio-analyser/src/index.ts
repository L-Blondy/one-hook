import React from 'react'
import { useEventHandler } from '@one-stack/use-event-handler'
import { useIsHydrated } from '@one-stack/use-is-hydrated'

export type AudioAnalyserOptions = {
  method:
    | 'getByteFrequencyData'
    | 'getFloatFrequencyData'
    | 'getByteTimeDomainData'
    | 'getFloatTimeDomainData'
  /**
   * [MDN docs](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/AudioContext#samplerate)
   */
  sampleRate?: number
  /**
   * [MDN docs](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/fftSize)
   */
  fftSize?: number
  /**
   * [MDN docs](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/minDecibels)
   */
  minDecibels?: number
  /**
   * [MDN docs](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/maxDecibels)
   */
  maxDecibels?: number
  /**
   * [MDN docs](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/smoothingTimeConstant)
   */
  smoothingTimeConstant?: number
  onData?: (data: number[]) => void
}

export function useAudioAnalyser(
  source: MediaStream | HTMLMediaElement | null,
  {
    method,
    onData,
    sampleRate,
    fftSize,
    minDecibels,
    maxDecibels,
    smoothingTimeConstant,
  }: AudioAnalyserOptions,
) {
  // targets passed as `ref.current` do no work properly,
  // they are undefined in the first effect.
  // To work around it we have to trigger a state update on mount
  useIsHydrated()
  const handleData = useEventHandler(onData)

  React.useEffect(() => {
    if (!source) return
    const audioContext = new AudioContext({ sampleRate })
    const analyser = new AnalyserNode(audioContext, {
      fftSize,
      maxDecibels,
      minDecibels,
      smoothingTimeConstant,
    })
    let animationFrame: number
    const bufferSize = method.includes('Time')
      ? analyser.fftSize
      : analyser.frequencyBinCount
    const freqData = method.includes('Float')
      ? new Float32Array(bufferSize)
      : new Uint8Array(bufferSize)
    let sourceNode: MediaStreamAudioSourceNode | MediaElementAudioSourceNode
    if (isStream(source)) {
      sourceNode = audioContext.createMediaStreamSource(source)
      startRaf()
    } else {
      sourceNode = audioContext.createMediaElementSource(source)
      // For HTMLMediaElement, connect through the analyzer to the destination in order to hear the audio
      analyser.connect(audioContext.destination)
      // only raf when the audio is playing
      source.addEventListener('playing', startRaf, { passive: true })
      source.addEventListener('waiting', stopRaf, { passive: true })
      source.addEventListener('pause', stopRaf, { passive: true })
    }
    sourceNode.connect(analyser)

    function startRaf() {
      React.startTransition(() => {
        analyser[method](freqData as any)
        handleData(Array.from(freqData))
        animationFrame = requestAnimationFrame(startRaf)
      })
    }

    function stopRaf() {
      cancelAnimationFrame(animationFrame)
    }

    return () => {
      stopRaf()
      analyser.disconnect()
      void audioContext.close()
      if (!isStream(source)) {
        source.removeEventListener('playing', startRaf)
        source.removeEventListener('waiting', stopRaf)
        source.removeEventListener('pause', stopRaf)
      }
    }
  }, [
    source,
    handleData,
    fftSize,
    method,
    minDecibels,
    maxDecibels,
    sampleRate,
    smoothingTimeConstant,
  ])
}

const isStream = (
  source: MediaStream | HTMLMediaElement,
): source is MediaStream => 'getTracks' in source
