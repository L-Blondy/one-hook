import React from 'react'
import {
  createCookieService,
  type CookieServiceOptions,
  type CookieAttributes,
} from './vanilla'
import type { KeyOf, Prettify, ValueOf } from '@one-stack/utils/types'
import { createEmitter } from '@one-stack/utils/emitter'
import { isServer } from '@one-stack/utils/is-server'
import { entriesOf } from '@one-stack/utils/entries-of'
import { keysOf } from '@one-stack/utils/keys-of'
import { useIsomorphicLayoutEffect } from '@one-stack/use-isomorphic-layout-effect'
import type { Validator, ValidatorOutput } from '@one-stack/utils/validate'

export type CookieConfig<TInput = any, TOutput = TInput> = Prettify<
  CookieAttributes & {
    validate: Validator<TInput, TOutput>
  }
>

export function defineCookies<
  TDeserialized,
  TConfig extends Record<string, CookieConfig>,
  const TCookieServiceOptions extends CookieServiceOptions<TDeserialized>,
>(config: TConfig, cookieServiceOptions: TCookieServiceOptions = {} as any) {
  type Store = {
    [TName in KeyOf<TConfig>]: ValidatorOutput<TConfig[TName]['validate']>
  }

  const store = new Map<keyof Store, ValueOf<Store>>()

  const emitter = createEmitter()

  const cookieService = createCookieService(cookieServiceOptions)

  function emit(
    ...[name, updater, remove]: [
      Parameters<typeof emitter.emit>[0],
      Parameters<typeof emitter.emit>[1],
      remove?: boolean,
    ]
  ) {
    const next =
      typeof updater === 'function' ? updater(store.get(name as any)) : updater
    store.set(name as any, next)
    remove
      ? cookieService.remove(name, config[name])
      : cookieService.set(name, next, config[name])
    emitter.emit(name, next)
  }

  addCrossTabListener((name) => {
    if (keysOf(config).includes(name)) {
      emit(name as any, cookieService.get(name, config[name]!))
    }
  })

  function CookieProvider(props: {
    children: React.ReactNode
    serverCookies: Record<string, string>
  }) {
    const prevServerCookies = React.useRef<Record<string, string> | undefined>(
      undefined,
    )

    React.useState(() => {
      keysOf(config).forEach((name) => {
        store.set(
          name as any,
          cookieService.parse(props.serverCookies[name], config[name]!),
        )
      })
    })

    // Notify the listeners when server-side cookies change
    React.useEffect(() => {
      entriesOf(props.serverCookies).forEach(([name, cookie]) => {
        if (
          // check if the cookie name is ours
          keysOf(config).includes(name) &&
          // check if the serialized version of the cookie has changed
          cookie !== prevServerCookies.current?.[name]
        ) {
          // notify the listeners with the parsed and validated value
          emit(
            name as any,
            cookieService.parse(props.serverCookies[name], config[name]!),
          )
          // notify other tabs
          emitCrossTabMessage(name)
        }
      })
      prevServerCookies.current = props.serverCookies
    }, [props.serverCookies])

    return props.children
  }

  function useCookie<TName extends keyof Store>(name: TName) {
    const [state, setState] = React.useState<Store[TName]>(
      () => store.get(name)!,
    )

    useIsomorphicLayoutEffect(
      () =>
        emitter.on((channel, updater) => {
          channel === name && setState(updater)
        }),
      [name],
    )

    const set = React.useCallback(
      (updater: React.SetStateAction<Store[TName]>) => {
        emit(name as any, updater)
        emitCrossTabMessage(name)
      },
      [name],
    )

    return [state, set] as const
  }

  // could be non-hook
  function useClearCookies() {
    return React.useCallback((options?: { keys?: (keyof Store)[] }) => {
      const names = options?.keys ?? keysOf(config)
      names.forEach((name) => {
        emit(name as any, cookieService.parse(undefined, config[name]!), true)
        emitCrossTabMessage(name)
      })
    }, [])
  }

  return {
    CookieProvider,
    useCookie,
    useClearCookies,
    cookieService,
  }
}

const storageKey = '_cookie_sync_'
let messageId = 0

// trigger a change in the localStorage (does not work with sessionStorage)
function emitCrossTabMessage(name: string) {
  !isServer &&
    localStorage.setItem(storageKey, JSON.stringify({ name, id: ++messageId }))
}

// listen to the change in localStorage coming from other tabs
function addCrossTabListener(cb: (name: string) => any) {
  !isServer &&
    window.addEventListener('storage', (e) => {
      if (e.key !== storageKey || !e.newValue) return
      try {
        cb(JSON.parse(e.newValue).name)
      } catch (_) {
        // silent fail
      }
    })
}
