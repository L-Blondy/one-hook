import type { AnyFunction } from '@rebase.io/utils/types'
import { isServer } from '@rebase.io/utils/is-server'

type Delay = number

export const intervalMap = new Map<
  Delay,
  {
    callbacks: Set<AnyFunction>
    interval: number | ReturnType<typeof setInterval>
  }
>()

function getIntervalSyncData(delay: number) {
  if (!intervalMap.has(delay)) {
    intervalMap.set(delay, {
      callbacks: new Set(),
      interval: isServer
        ? 0
        : setInterval(
            () => intervalMap.get(delay)?.callbacks.forEach((cb) => cb()),
            delay,
          ),
    })
  }
  return intervalMap.get(delay)!
}

function setIntervalSync(
  callback: AnyFunction,
  delay: number,
): [AnyFunction, number] {
  getIntervalSyncData(delay).callbacks.add(callback)
  return [callback, delay]
}

function clearIntervalSync([callback, delay]: [AnyFunction, number]) {
  const data = getIntervalSyncData(delay)
  data.callbacks.delete(callback)
  if (!data.callbacks.size) {
    clearInterval(data.interval)
    intervalMap.delete(delay)
  }
}

export type IntervalToken =
  | number
  | ReturnType<typeof setInterval>
  | [AnyFunction, number]

export const set = (
  callback: AnyFunction,
  delay: number,
  sync?: boolean,
): IntervalToken =>
  sync ? setIntervalSync(callback, delay) : setInterval(callback, delay)

export const clear = (token: IntervalToken | undefined): void =>
  Array.isArray(token) ? clearIntervalSync(token) : clearInterval(token)
