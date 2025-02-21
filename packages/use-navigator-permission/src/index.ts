import React from 'react'
import type { Prettify } from '@rebase.io/utils/types'

/**
 * 'camera' | 'microphone' are now supported everywhere (Safari 16+)
 * but not included in the type yet (ts 5.6.2)
 */
type NavigatorPermissionName = PermissionName | 'camera' | 'microphone'

export type NavigatorPermissionDescriptor = Prettify<
  PermissionDescriptor & {
    name: NavigatorPermissionName
  }
>
/**
 * - `'loading'` while the promise is pending
 * - `'error'` if the promise rejects`
 */
export type NavigatorPermissionState = Prettify<
  PermissionState | 'loading' | 'error'
>

export function useNavigatorPermission(descriptor: {
  name: NavigatorPermissionName
}): { state: NavigatorPermissionState } {
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
