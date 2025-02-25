import React from 'react'
import {
  createCookieService,
  type ServiceOptions,
  type CookieConfig,
} from './vanilla'
import type { KeyOf, ValueOf } from '@one-stack/utils/types'
import { createEmitter } from '@one-stack/utils/emitter'
import { isServer } from '@one-stack/utils/is-server'
import { entriesOf } from '@one-stack/utils/entries-of'
import { keysOf } from '@one-stack/utils/keys-of'
import { useIsomorphicLayoutEffect } from '@one-stack/use-isomorphic-layout-effect'
import type { ValidatorOutput } from '@one-stack/utils/validate'

export function defineCookies<TConfig extends Record<string, CookieConfig>>(
  config: TConfig,
  options: ServiceOptions = {},
) {
  type CookieName = KeyOf<TConfig>
  type Store = {
    [TName in CookieName]: ValidatorOutput<TConfig[TName]['validate']>
  }

  const store = new Map<CookieName, ValueOf<Store>>()

  const emitter = createEmitter<Record<CookieName, any>>()

  const service = createCookieService(config, options)

  function emit(name: CookieName, updater: any, parsed: boolean) {
    let value =
      typeof updater === 'function' ? updater(store.get(name)) : updater
    const remove = value === undefined
    if (!parsed) {
      value = service.parse(name, value)
    }
    store.set(name as any, value)
    remove ? service.remove(name) : service.set(name, value)
    emitter.emit(name as any, value)
  }

  addCrossTabListener<CookieName>((name: CookieName) => {
    if (keysOf(config).includes(name)) {
      emit(name as any, service.get(name), true)
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
      keysOf(config as Record<CookieName, any>).forEach((name) => {
        const value = service.parse(name, props.serverCookies[name])
        store.set(name, value as any)
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
          emit(name as CookieName, props.serverCookies[name], false)
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
          channel === (name as string) && setState(updater)
        }),
      [name],
    )

    const set = React.useCallback(
      (updater: React.SetStateAction<Store[TName]>) => {
        emit(name, updater, true)
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
        emit(name, service.parse(name, undefined), true)
        emitCrossTabMessage(name)
      })
    }, [])
  }

  return {
    CookieProvider,
    useCookie,
    useClearCookies,
    cookieService: service,
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
function addCrossTabListener<TName extends string>(cb: (name: TName) => any) {
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
