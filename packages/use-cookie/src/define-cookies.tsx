import React from 'react'
import {
  createCookieService,
  type ServiceOptions,
  type CookieConfig,
} from './vanilla'
import type { KeyOf } from '@one-stack/utils/types'
import { createEmitter } from '@one-stack/utils/emitter'
import { isServer } from '@one-stack/utils/is-server'
import { keysOf } from '@one-stack/utils/keys-of'
import { useIsomorphicLayoutEffect } from '@one-stack/use-isomorphic-layout-effect'
import type { ValidatorOutput } from '@one-stack/utils/validate'

export type CookieProviderProps = {
  headers: Headers
  children: React.ReactNode
}

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

  // server
  function getServerCookie<TName extends CookieName>(
    serverCookieString: string,
    name: TName,
  ): CookieValue<TName> {
    return service.get(name, serverCookieString)
  }

  // client
  function get<TName extends CookieName>(name: TName) {
    return store.get(name)!
  }

  // client
  function set<TName extends CookieName>(
    name: TName,
    updater: React.SetStateAction<CookieValue<TName>>,
  ) {
    const value =
      typeof updater === 'function'
        ? (updater as any)(store.get(name))
        : updater
    store.set(name, value)
    service.set(name, value)
    emitter.emit(name, value)
    emitCrossTabMessage(name)
  }

  // client
  function clear(names: CookieName[] = keysOf(config)) {
    names.forEach((name) => {
      const value = service.parseSerialized(name, undefined)
      store.set(name, value)
      service.remove(name)
      emitter.emit(name, value)
      emitCrossTabMessage(name)
    })
  }

  return {
    CookieProvider(props: CookieProviderProps) {
      const serverCookieString: string = props.headers.get('Cookie') ?? ''
      const prevServerCookieString = React.useRef(serverCookieString)

      React.useState(() => {
        keysOf(config as Record<CookieName, any>).forEach((name) => {
          store.set(name, getServerCookie(serverCookieString, name))
        })
      })

      // Notify the listeners when server-side cookies change
      React.useEffect(() => {
        keysOf(config).forEach((name: any) => {
          const prevRawValue = service.getSerialized(
            prevServerCookieString.current,
            name as CookieName,
          )
          const curRawValue = service.getSerialized(
            serverCookieString,
            name as CookieName,
          )
          if (prevRawValue !== curRawValue) {
            store.set(name, service.parseSerialized(name, curRawValue))
            emitter.emit(name, service.parseSerialized(name, curRawValue))
            emitCrossTabMessage(name)
          }
        })
        prevServerCookieString.current = serverCookieString
      }, [serverCookieString])

      return props.children
    },

    useCookie<TName extends CookieName>(name: TName) {
      type State = {
        value: CookieValue<TName>
        set: (updater: React.SetStateAction<CookieValue<TName>>) => void
        clear: () => void
        get: () => CookieValue<TName>
      }

      const [state, setState] = React.useState<State>(() => ({
        value: get(name),
        set: (updater) => set(name, updater),
        clear: () => clear([name]),
        get: () => get(name),
      }))

      useIsomorphicLayoutEffect(
        () =>
          emitter.on((channel, updater) => {
            channel === (name as string) &&
              setState((prev) => ({
                ...prev,
                value:
                  typeof updater === 'function' ? updater(prev.value) : updater,
              }))
          }),
        [name],
      )

      return state
    },

    clientCookies: { get, set, clear },

    serverCookies: {
      get: <TName extends CookieName>(
        headers: Headers,
        name: TName,
      ): CookieValue<TName> => service.get(name, headers.get('Cookie') ?? ''),
    },
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
