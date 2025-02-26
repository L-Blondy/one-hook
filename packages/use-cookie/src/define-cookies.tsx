import React from 'react'
import {
  createCookieService,
  type ServiceOptions,
  type CookieConfig,
} from './vanilla'
import type { KeyOf } from '@one-stack/utils/types'
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
  type CookieValue<TName extends CookieName> = ValidatorOutput<
    TConfig[TName]['validate']
  >

  const store = new Map<CookieName, CookieValue<CookieName>>()
  const emitter = createEmitter()
  const service = createCookieService(config, options)

  addCrossTabListener<CookieName>((name: CookieName) => {
    if (keysOf(config).includes(name)) {
      const value = service.get(name)
      service.set(name, value)
      store.set(name, value)
      emitter.emit(name, value)
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
        store.set(name, service.parse(name, props.serverCookies[name]))
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
          const value = service.parse(name as CookieName, cookie)
          store.set(name as CookieName, value)
          emitter.emit(name, value)
          emitCrossTabMessage(name)
        }
      })
      prevServerCookies.current = props.serverCookies
    }, [props.serverCookies])

    return props.children
  }

  function useCookie<TName extends CookieName>(name: TName) {
    const [state, setState] = React.useState<CookieValue<TName>>(
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
      (updater: React.SetStateAction<CookieValue<TName>>) => {
        const value =
          typeof updater === 'function'
            ? (updater as any)(store.get(name))
            : updater
        store.set(name, value)
        service.set(name, value)
        emitter.emit(name, value)
        emitCrossTabMessage(name)
      },
      [name],
    )

    return [state, set] as const
  }

  // could be non-hook
  function useClearCookies() {
    return React.useCallback((names: CookieName[] = keysOf(config)) => {
      names.forEach((name) => {
        const value = service.parse(name, undefined)
        store.set(name, value)
        service.remove(name)
        emitter.emit(name, value)
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
