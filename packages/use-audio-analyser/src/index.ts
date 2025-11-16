import React from 'react'
import { useIsHydrated } from '@1hook/use-is-hydrated'
import { noop } from '@1hook/utils/noop'

export type AudioAnalyserOptions = {
  /**
   * The method to use from the [AnalyserNode](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode#instance_methods) instance.
   *
   * All methods produce an array of numbers that contains either 8-bit or 32-bit values.
   *
   * - `getByteFrequencyData` produces a Uint8Array of size `fftSize / 2`.
   * - `getFloatFrequencyData` produces a Float32Array of size `fftSize / 2`.
   * - `getByteTimeDomainData` produces a Uint8Array of size `fftSize`.
   * - `getFloatTimeDomainData` produces a Float32Array of size `fftSize`.
   *
   * See [MDN docs](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode#instance_methods) for more details.
   *
   * @remarks `string`
   */
  method:
    | 'getByteFrequencyData'
    | 'getFloatFrequencyData'
    | 'getByteTimeDomainData'
    | 'getFloatTimeDomainData'
  /**
   * The audio sampling rate in samples per second (Hz). <br/>Frequencies up to half the sample rate can be analyzed. <br/>For example, a 48000 Hz sample rate allows analysis up to 24000 Hz. <br/>See [MDN docs](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/AudioContext#samplerate) for more details.
   */
  sampleRate?: number
  /**
   * Check out the [MDN docs](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/fftSize).<br/>Must be a power of 2 between 2^5 and 2^15, defaults to 2048.<br/>
   */
  fftSize?: number
  /**
   * The minimum power value in the scaling range for the data. <br/> See [MDN docs](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/minDecibels) for more details.
   */
  minDecibels?: number
  /**
   * The maximum power value in the scaling range for the data. <br/> See [MDN docs](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/maxDecibels) for more details.
   */
  maxDecibels?: number
  /**
   * A value between 0 and 1.<br/>Higher values create smoother transitions between frames.<br/> See [MDN docs](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/smoothingTimeConstant) for more details.
   */
  smoothingTimeConstant?: number
  /**
   * Provides the data. See the table below.
   */
  onData?: (data: number[]) => void
}

/**
 * https://one-hook.vercel.app/docs
 */
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
  const handleData = React.useEffectEvent(onData ?? noop)

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
