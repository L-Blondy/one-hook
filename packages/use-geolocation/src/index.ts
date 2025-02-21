import React from 'react'

type LoadingState = {
  state: 'loading'
  error: null
  coords: {
    timestamp: null
    accuracy: null
    altitude: null
    altitudeAccuracy: null
    heading: null
    latitude: null
    longitude: null
    speed: null
  }
}

type WatchingState = {
  state: 'watching'
  error: null
  coords: {
    timestamp: number
    accuracy: number
    altitude: number | null
    altitudeAccuracy: number | null
    heading: number | null
    latitude: number
    longitude: number
    speed: number | null
  }
}

type ErrorState = {
  state: 'error'
  error: GeolocationPositionError
  coords: {
    timestamp: number | null
    accuracy: number | null
    altitude: number | null
    altitudeAccuracy: number | null
    heading: number | null
    latitude: number | null
    longitude: number | null
    speed: number | null
  }
}

export type GeolocationState = LoadingState | WatchingState | ErrorState

export function useGeolocation(options?: PositionOptions): GeolocationState {
  const [stableOptions, setStableOptions] = React.useState(options)
  const [state, setState] = React.useState<GeolocationState>({
    state: 'loading',
    error: null,
    coords: {
      timestamp: null,
      accuracy: null,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      latitude: null,
      longitude: null,
      speed: null,
    },
  })

  if (JSON.stringify(options) !== JSON.stringify(stableOptions)) {
    setStableOptions(options)
  }

  React.useEffect(() => {
    let mounted = true

    function onSuccessEvent(event: GeolocationPosition) {
      mounted &&
        setState({
          state: 'watching',
          error: null,
          coords: {
            timestamp: event.timestamp,
            accuracy: event.coords.accuracy,
            altitude: event.coords.altitude,
            altitudeAccuracy: event.coords.altitudeAccuracy,
            heading: event.coords.heading,
            latitude: event.coords.latitude,
            longitude: event.coords.longitude,
            speed: event.coords.speed,
          },
        })
    }

    function onErrorEvent(error: GeolocationPositionError) {
      mounted &&
        setState(({ coords }) => ({
          coords,
          state: 'error',
          error,
        }))
    }

    navigator.geolocation.getCurrentPosition(
      onSuccessEvent,
      onErrorEvent,
      stableOptions,
    )
    const watchId = navigator.geolocation.watchPosition(
      onSuccessEvent,
      onErrorEvent,
      stableOptions,
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
      mounted = false
    }
  }, [stableOptions])

  return state
}
