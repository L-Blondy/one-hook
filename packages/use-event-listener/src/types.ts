import type { createInstance } from './vanilla'

type StringOnly<T> = T extends string ? T : never

export type UseEventListenerTarget = Element | Document | Window

type EventMap<Target extends UseEventListenerTarget> = Target extends Window
  ? WindowEventMap
  : Target extends Document
    ? DocumentEventMap
    : HTMLElementEventMap

export type UseEventListenerType<Target extends UseEventListenerTarget> =
  StringOnly<keyof EventMap<Target>>

export type UseEventListenerCallback<
  Target extends UseEventListenerTarget,
  Type extends UseEventListenerType<Target>,
> = (event: EventMap<Target>[Type]) => void

export type UseEventListenerOptions = Omit<
  AddEventListenerOptions,
  'signal'
> & {
  /**
   * Automatically attach the listener the target element.
   *
   * @default true
   */
  autoListen?: boolean
}

export type EventListenerService<
  Target extends UseEventListenerTarget,
  Type extends UseEventListenerType<Target>,
> = ReturnType<typeof createInstance<Target, Type>>
