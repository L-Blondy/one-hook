import React from 'react'
import {
  createCookieService,
  type CookieServiceOptions,
  type CookieAttributes,
} from './vanilla'
import type { KeyOf, ValueOf } from '@rebase.io/utils/types'
import { createEmitter } from '@rebase.io/utils/emitter'
import { isServer } from '@rebase.io/utils/is-server'
import { entriesOf } from '@rebase.io/utils/entries-of'
import { keysOf } from '@rebase.io/utils/keys-of'
import { useIsomorphicLayoutEffect } from '@rebase.io/use-isomorphic-layout-effect'
import type { Validator, ValidatorOutput } from '@rebase.io/utils/validate'

type BaseConfig = {
  [TName in string]: CookieAttributes & {
    validate: Validator
  }
}

/**
 * https://crustack.vercel.app/hooks/define-cookies/
 */
export function defineCookies<
  TDeserialized,
  TConfig extends BaseConfig,
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
    console.log('CROSS TB LISTENER')
    if (keysOf(config).includes(name)) {
      emit(name as any, cookieService.get(name, config[name]!))
    }
  })

  function CookieProvider(props: {
    children: React.ReactNode
    ssrCookies: Record<string, string>
  }) {
    const prevSsrCookies = React.useRef<Record<string, string> | undefined>(
      undefined,
    )

    React.useState(() => {
      keysOf(config).forEach((name) => {
        store.set(
          name as any,
          cookieService.parse(props.ssrCookies[name], config[name]!),
        )
      })
    })

    // Notify the listeners when server-side cookies change
    React.useEffect(() => {
      entriesOf(props.ssrCookies).forEach(([name, cookie]) => {
        if (
          // check if the cookie name is ours
          keysOf(config).includes(name) &&
          // check if the serialized version of the cookie has changed
          cookie !== prevSsrCookies.current?.[name]
        ) {
          // notify the listeners with the parsed and validated value
          emit(
            name as any,
            cookieService.parse(props.ssrCookies[name], config[name]!),
          )
          // notify other tabs
          emitCrossTabMessage(name)
        }
      })
      prevSsrCookies.current = props.ssrCookies
    }, [props.ssrCookies])

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
    /**
     * https://crustack.vercel.app/hooks/define-cookies/#cookieprovider
     */
    CookieProvider,
    /**
     * https://crustack.vercel.app/hooks/define-cookies/#usecookie
     */
    useCookie,
    /**
     * https://crustack.vercel.app/hooks/define-cookies/#useclearcookies
     */
    useClearCookies,
    /**
     * Low level service that exposes the underlying methods.
     */
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
      console.log('STORAGE EVENT', e)
      if (e.key !== storageKey || !e.newValue) return
      try {
        cb(JSON.parse(e.newValue).name)
      } catch (_) {
        // silent fail
      }
    })
}
