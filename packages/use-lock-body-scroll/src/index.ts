import React from 'react'
import { getClosestScrollable, isIosDevice } from './utils'

/**
 * https://crustack.vercel.app/hooks/use-lock-body-scroll/
 */
export const useLockBodyScroll = function useLockBody() {
  const [locked, setLocked] = React.useState(false)
  const initialBodyStyles = React.useRef<React.CSSProperties>({})

  const unlock = React.useCallback(() => {
    const { body } = document
    if (body.style.overflow !== 'hidden') return // already unlocked
    Object.assign(body.style, initialBodyStyles.current)
    if (isIosDevice()) {
      document.removeEventListener('touchmove', preventTouchBodyScroll)
    }
    setLocked(false)
  }, [])

  const lock = React.useCallback(() => {
    const { body } = document
    if (body.style.overflow === 'hidden') return // already locked
    initialBodyStyles.current = {
      overflow: body.style.overflow,
      paddingRight: body.style.paddingRight,
    }
    Object.assign(body.style, {
      overflow: 'hidden',
      paddingRight: `${body.offsetWidth - body.clientWidth}px`,
    })
    if (isIosDevice()) {
      document.addEventListener('touchmove', preventTouchBodyScroll, {
        passive: false,
      })
    }
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
