import React from 'react'
import { useGetIsMounted } from '@1hook/use-get-is-mounted'

type ClosedMedia = {
  stream: null
  state: 'closed'
  error: null
  audioState: 'none'
  videoState: 'none'
}

type ErrorMedia = {
  stream: null
  state: 'error'
  error: Error
  audioState: 'none'
  videoState: 'none'
}

type OpenMedia = {
  /**
   * The captured media stream when active, `undefined` otherwise
   */
  stream: MediaStream
  /**
   * Current state of the media stream
   */
  state: 'open'
  /**
   * Error object if state is 'error', `undefined` otherwise
   */
  error: null
  /**
   * - `'enabled' | 'disabled'` when at least one audio track is open. Use `toggleAudio` to switch between both states.
   * - `'none'` when no audio track is open.
   */
  audioState: 'none' | 'enabled' | 'disabled'
  /**
   * - `'enabled' | 'disabled'` when at least one video track is open. Use `toggleVideo` to switch between both states.
   * - `'none'` when no video track is open.
   */
  videoState: 'none' | 'enabled' | 'disabled'
}

type LoadingMedia = {
  stream: null
  state: 'loading'
  error: null
  audioState: 'none'
  videoState: 'none'
}

type UserMedia = ClosedMedia | ErrorMedia | OpenMedia | LoadingMedia

export type UseUserMediaOptions = MediaStreamConstraints
export type UseUserMediaReturn = UserMedia & {
  /**
   * Open the stream
   */
  open: () => void
  /**
   * Close the stream
   */
  close: () => void
  /**
   * Toggle `audioState` between `'enabled'` and `'disabled'` states. <br/>Effectively mutes or unmutes the audio stream
   */
  toggleAudio: () => void
  /**
   * Toggle `videoState` between `'enabled'` and `'disabled'` states. <br/>Effectively turns the camera on/off
   */
  toggleVideo: () => void
}

/**
 * https://one-hook.vercel.app/docs
 */
export function useUserMedia(
  constraints: UseUserMediaOptions = {},
): UseUserMediaReturn {
  const getIsMounted = useGetIsMounted()
  const [_constraints, _setConstraints] = React.useState(constraints)

  const [media, setMedia] = React.useState<UserMedia>({
    stream: null,
    state: 'closed',
    error: null,
    audioState: 'none',
    videoState: 'none',
  })

  if (JSON.stringify(constraints) !== JSON.stringify(_constraints)) {
    _setConstraints(constraints)
  }

  const close = React.useCallback(() => {
    setMedia((media) => {
      closeStream(media.stream)
      return media.state === 'error'
        ? media
        : {
            stream: null,
            state: 'closed',
            error: null,
            audioState: 'none',
            videoState: 'none',
          }
    })
  }, [])

  const open = React.useCallback(() => {
    setMedia((media) =>
      media.state === 'open'
        ? media
        : {
            stream: null,
            state: 'loading',
            error: null,
            audioState: 'none',
            videoState: 'none',
          },
    )
  }, [])

  const toggleAudio = React.useCallback(() => {
    setMedia((media) => {
      if (media.audioState === 'none') return media
      const newAudioState =
        media.audioState === 'enabled' ? 'disabled' : 'enabled'
      media.stream.getAudioTracks().forEach((track) => {
        track.enabled = newAudioState === 'enabled'
      })
      return { ...media, audioState: newAudioState }
    })
  }, [])

  const toggleVideo = React.useCallback(() => {
    setMedia((media) => {
      if (media.videoState === 'none') return media
      const newVideoState =
        media.videoState === 'enabled' ? 'disabled' : 'enabled'
      media.stream.getVideoTracks().forEach((track) => {
        track.enabled = newVideoState === 'enabled'
      })
      return { ...media, videoState: newVideoState }
    })
  }, [])

  React.useEffect(() => {
    if (media.state !== 'loading') return
    navigator.mediaDevices
      .getUserMedia(_constraints)
      .then((stream) => {
        const audioState = stream.getAudioTracks().length ? 'enabled' : 'none'
        const videoState = stream.getVideoTracks().length ? 'enabled' : 'none'

        getIsMounted() &&
          setMedia({
            stream,
            state: 'open',
            error: null,
            audioState,
            videoState,
          })
      })
      .catch((error) => {
        getIsMounted() &&
          setMedia({
            stream: null,
            state: 'error',
            error,
            audioState: 'none',
            videoState: 'none',
          })
      })
  }, [media.state, _constraints, getIsMounted])

  React.useEffect(() => close, [_constraints, close])

  return { ...media, open, close, toggleAudio, toggleVideo }
}

function closeStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop())
}
