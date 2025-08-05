import React from 'react'
import { getClosestScrollable, isIosDevice } from './utils'

/**
 * https://one-hook.vercel.app/docs
 */
export const useLockBodyScroll = function useLockBody() {
  const lockedRef = React.useRef(false)
  const [locked, setLocked] = React.useState(false)
  const originalBodyStyles = React.useRef<React.CSSProperties>({})

  const unlock = React.useCallback(() => {
    const { body } = document
    if (!lockedRef.current) return
    Object.assign(body.style, originalBodyStyles.current)
    if (isIosDevice()) {
      document.removeEventListener('touchmove', preventTouchBodyScroll)
    }
    lockedRef.current = false
    setLocked(false)
  }, [])

  const lock = React.useCallback(() => {
    const { body } = document
    const computedBodyStyles = getComputedStyle(body)
    if (lockedRef.current) return
    originalBodyStyles.current = {
      overflow: body.style.overflow,
      paddingRight: body.style.paddingRight,
    }
    Object.assign(body.style, {
      overflow: 'hidden',
      paddingRight: `calc(${window.innerWidth - body.clientWidth}px + ${computedBodyStyles.paddingRight})`,
    })
    if (isIosDevice()) {
      document.addEventListener('touchmove', preventTouchBodyScroll, {
        passive: false,
      })
    }
    lockedRef.current = true
    setLocked(true)
    return unlock
  }, [unlock])

  React.useEffect(() => unlock, [unlock])

  return { lock, unlock, locked }
}

function preventTouchBodyScroll(e: TouchEvent) {
  // Allow multi touch gestures
  // Allow scrolling other elements
  if (
    e.touches.length === 1 &&
    [document.documentElement, document.body].includes(
      getClosestScrollable(e.target as HTMLElement | null),
    )
  ) {
    e.preventDefault()
  }
}
