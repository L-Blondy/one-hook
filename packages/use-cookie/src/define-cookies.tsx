import React from 'react'
import {
  createCookieService,
  type CookieServiceOptions,
  type CookieConfig,
} from './vanilla'
import type { KeyOf } from '@1hook/utils/types'
import { createEmitter } from '@1hook/utils/emitter'
import { isServer } from '@1hook/utils/is-server'
import { keysOf } from '@1hook/utils/keys-of'
import { useIsomorphicLayoutEffect } from '@1hook/use-isomorphic-layout-effect'
import type { ValidatorOutput } from '@1hook/utils/validate'

export type CookieProviderProps = {
  headers: Headers
  children: React.ReactNode
}

function clientOnly() {
  if (isServer)
    throw new Error(
      'This method cannot be used on the server. To read cookies from the server use `Cookie.fromHeaders`',
    )
}

export function defineCookies<TConfig extends Record<string, CookieConfig>>(
  config: TConfig,
  options: CookieServiceOptions = {},
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

  const Cookies = {
    /**
     * client only
     */
    get<TName extends CookieName>(name: TName): CookieValue<TName> {
      clientOnly()
      return store.get(name)!
    },

    /**
     * client only
     */
    set<TName extends CookieName>(
      name: TName,
      updater: React.SetStateAction<CookieValue<TName>>,
    ) {
      clientOnly()
      const value =
        typeof updater === 'function'
          ? (updater as any)(store.get(name))
          : updater
      store.set(name, value)
      service.set(name, value)
      emitter.emit(name, value)
      emitCrossTabMessage(name)
    },

    /**
     * client only
     */
    clear(names: CookieName[] = keysOf(config)) {
      clientOnly()
      names.forEach((name) => {
        const value = service.parseSerialized(name, undefined)
        store.set(name, value)
        service.remove(name)
        emitter.emit(name, value)
        emitCrossTabMessage(name)
      })
    },

    fromHeaders: (headers: Headers) => ({
      get: <TName extends CookieName>(name: TName): CookieValue<TName> =>
        service.get(name, headers.get('Cookie') ?? ''),
    }),
  }

  return {
    Cookies,

    CookieProvider(props: CookieProviderProps) {
      const serverCookieString: string = props.headers.get('Cookie') ?? ''
      const prevServerCookieString = React.useRef(serverCookieString)

      React.useState(() => {
        keysOf(config as Record<CookieName, any>).forEach((name) => {
          store.set(name, Cookies.fromHeaders(props.headers).get(name))
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
        value: Cookies.get(name),
        set: (updater) => Cookies.set(name, updater),
        clear: () => Cookies.clear([name]),
        get: () => Cookies.get(name),
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
