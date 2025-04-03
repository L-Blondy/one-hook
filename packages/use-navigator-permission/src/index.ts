import React from 'react'
import type { Prettify } from '@one-stack/utils/types'

/**
 * 'camera' | 'microphone' are now supported everywhere (Safari 16+)
 * but not included in the type yet (ts 5.6.2)
 */
export type NavigatorPermissionName = Prettify<
  PermissionName | 'camera' | 'microphone'
>

/**
 * - `'loading'` while the promise is pending
 * - `'error'` if the promise rejects`
 */
export type NavigatorPermissionState = Prettify<
  PermissionState | 'loading' | 'error'
>

export type UseNavigatorPermissionOptions = {
  /**
   * The name of the permission to query.
   */
  name: NavigatorPermissionName
}

export type UseNavigatorPermissionReturn = {
  /**
   * The current state of the permission.
   * - `loading` while the permission is being queried (the initial state)
   * - `error` if the permission query failed (e.g. unsupported permission)
   * - `granted` if the permission is granted. See [MDN docs](https://developer.mozilla.org/en-US/docs/Web/API/PermissionStatus/state#value)
   * - `denied` if the permission is denied. See [MDN docs](https://developer.mozilla.org/en-US/docs/Web/API/PermissionStatus/state#value)
   * - `prompt` if the permission is prompted. See [MDN docs](https://developer.mozilla.org/en-US/docs/Web/API/PermissionStatus/state#value)
   */
  state: NavigatorPermissionState
}

export function useNavigatorPermission(
  descriptor: UseNavigatorPermissionOptions,
): { state: NavigatorPermissionState } {
  const [state, setState] = React.useState<NavigatorPermissionState>('loading')
  const [_descriptor, _setDescriptor] = React.useState(descriptor)

  if (JSON.stringify(descriptor) !== JSON.stringify(_descriptor)) {
    _setDescriptor(descriptor)
  }

  React.useEffect(() => {
    let cleanup: (() => void) | undefined
    let isMounted = true
    setState('loading')

    navigator.permissions
      .query(_descriptor as PermissionDescriptor)
      .then((permissionStatus): void => {
        if (!isMounted) return
        function handleChange() {
          setState(permissionStatus.state)
        }
        handleChange()
        permissionStatus.addEventListener('change', handleChange, {
          passive: true,
        })

        cleanup = () => {
          permissionStatus.removeEventListener('change', handleChange)
        }
      })
      .catch(() => {
        isMounted && setState('error')
      })

    return () => {
      isMounted = false
      cleanup?.()
    }
  }, [_descriptor])

  return { state }
}
