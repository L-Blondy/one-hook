import React from 'react'
import { useGetIsMounted } from '@one-stack/use-get-is-mounted'

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
  stream: MediaStream
  state: 'open'
  error: null
  audioState: 'none' | 'enabled' | 'disabled'
  videoState: 'none' | 'enabled' | 'disabled'
}

type LoadingMedia = {
  stream: null
  state: 'loading'
  error: null
  audioState: 'none'
  videoState: 'none'
}

export type DisplayMedia = ClosedMedia | ErrorMedia | OpenMedia | LoadingMedia

export function useDisplayMedia(options: DisplayMediaStreamOptions = {}) {
  const getIsMounted = useGetIsMounted()
  const [_options, _setOptions] = React.useState(options)

  const [media, setMedia] = React.useState<DisplayMedia>({
    stream: null,
    state: 'closed',
    error: null,
    audioState: 'none',
    videoState: 'none',
  })

  if (JSON.stringify(options) !== JSON.stringify(_options)) {
    _setOptions(options)
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
      .getDisplayMedia(_options)
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
        // handle stop screen sharing
        stream.getVideoTracks().forEach((track) => {
          track.onended = close
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
  }, [media.state, _options, getIsMounted, close])

  React.useEffect(() => close, [_options, close])

  return { ...media, open, close, toggleAudio, toggleVideo }
}

function closeStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop())
}
