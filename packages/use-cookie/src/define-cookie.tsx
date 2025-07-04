import {
  validateSync,
  type ValidatorSync,
  type ValidatorOutput,
} from '@1hook/utils/validate'
import React from 'react'
import { defaultDeserializer, defaultSerializer } from './serializer'
import { toUTCString } from './utils'
import { createEmitter } from '@1hook/utils/emitter'
import { isServer } from '@1hook/utils/is-server'
import { useIsHydrated } from '@1hook/use-is-hydrated'
import { useIsomorphicLayoutEffect } from '@1hook/use-isomorphic-layout-effect'

/**
 * To avoid issues with React.createContext being called
 * at module scope in Next.js + Server Components, we
 * lazily initialize the context through a getter function
 */
type ServerCookieCtxValue = string | null | undefined
let ctx: React.Context<ServerCookieCtxValue>

function getServerCookieCtx() {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  ctx ??= React.createContext<ServerCookieCtxValue>('')
  return ctx
}

export type ServerCookieProviderProps = {
  /**
   * The cookie header value.
   *
   * @example
   * ```tsx
   * <ServerCookieProvider value={(await headers()).get('cookie')}>
   *   <App />
   * </ServerCookieProvider>
   * ```
   */
  value: ServerCookieCtxValue
  children: React.ReactNode
}

export function ServerCookieProvider(props: ServerCookieProviderProps) {
  const Ctx = getServerCookieCtx()
  return <Ctx.Provider {...props} />
}

export type DefineCookieOptions<TValidator extends ValidatorSync<unknown>> = {
  /**
   * The name of the cookie.
   */
  name: string
  /**
   * The validator for the cookie, can be:
   * - a function that returns a the value or throws an error
   * - a `StandardSchema` (e.g. a zod, valibot or arktype schema)
   */
  validate: TValidator
  /**
   * Defines the host to which the cookie will be sent.
   * See [MDN docs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#domaindomain-value) for details
   */
  domain?: string
  /**
   * The expiration of the cookie
   * - set to a `number` to expire in N days
   * - set to a `Date` to expire at a specific date
   * - set to `undefined` or omit to expire with the Session
   */
  expires?: number | Date
  /**
   * The sameSite attribute of the cookie.
   * See [MDN docs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#samesitesamesite-value) for details
   */
  sameSite?: 'lax' | 'strict' | 'none'
  /**
   * Only send the cookie over HTTPS
   * See [MDN docs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#secure) for details
   */
  secure?: boolean
  /**
   * By default the cookie is encoded using `encodeURIComponent`. \
   * Set this to `true` to disable encoding.
   */
  disableEncoding?: boolean
  /**
   * Custom serializer for the cookie.
   */
  serialize?: (value: unknown) => string
  /**
   * Custom deserializer for the cookie.
   */
  deserialize?: (value: string) => any
}

type Unsubscribe = () => void

export type DefineCookieReturn<TValidator extends ValidatorSync<unknown>> = [
  useCookie: () => [
    ValidatorOutput<TValidator>,
    React.Dispatch<React.SetStateAction<ValidatorOutput<TValidator>>>,
  ],
  Cookie: {
    set(updater: React.SetStateAction<ValidatorOutput<TValidator>>): void
    get(allCookies?: string | null): ValidatorOutput<TValidator>
    clear(): void
    name: string
    subscribe: (
      listener: (state: ValidatorOutput<TValidator>) => void,
    ) => Unsubscribe
  },
]

export function defineCookie<TValidator extends ValidatorSync<unknown>>({
  name,
  validate,
  disableEncoding,
  serialize = defaultSerializer,
  deserialize = defaultDeserializer,
  ...cookieOptions
}: DefineCookieOptions<TValidator>): DefineCookieReturn<TValidator> {
  type State = ValidatorOutput<TValidator>
  const emitter = createEmitter<State>()

  const encode = disableEncoding ? (str: string) => str : encodeURIComponent
  const decode = disableEncoding ? (str: string) => str : decodeURIComponent

  function setCookie(value: State, options: typeof cookieOptions) {
    let stringified = encode(serialize(value))
    let cookie = `${name}=${stringified}; Path=/`
    if (options.sameSite) cookie += `; SameSite=${options.sameSite}`
    if (options.expires) cookie += `; Expires=${toUTCString(options.expires)}`
    if (options.secure) cookie += `; Secure`
    if (options.domain) cookie += `; Domain=${options.domain}`
    document.cookie = cookie
    return stringified
  }

  function getCookieString(allCookies: string): string | undefined {
    for (let cookie of allCookies.split(';')) {
      cookie = cookie.trim()
      const exists = cookie.startsWith(`${name}=`)
      if (exists) return decode(cookie.replace(`${name}=`, ''))
    }
  }

  function parseCookieString(value: string | undefined): State {
    const parsed = value === undefined ? undefined : deserialize(value)
    return validateSync(validate, parsed)
  }

  let crossTabMessageId = 0
  const crossTabKey = `_cookie_sync_${name}`

  // trigger a change in the localStorage
  function notifyOtherTabs() {
    localStorage.setItem(crossTabKey, String(++crossTabMessageId))
  }

  // listen to the change in localStorage coming from other tabs
  if (!isServer) {
    window.addEventListener('storage', (e) => {
      if (e.key === crossTabKey) {
        emitter.emit(service.get())
      }
    })
  }

  const service = {
    set(updater: React.SetStateAction<State>): void {
      const next: State =
        typeof updater === 'function'
          ? (updater as any)(service.get())
          : updater
      setCookie(next, cookieOptions)
      emitter.emit(next)
      notifyOtherTabs()
    },
    get(allCookies: string | null = document.cookie): State {
      return parseCookieString(getCookieString(allCookies ?? ''))
    },
    clear(): void {
      setCookie('' as State, { ...cookieOptions, expires: -1 })
      emitter.emit(service.get())
      notifyOtherTabs()
    },
    subscribe: (listener: (state: State) => void) => emitter.on(listener),
    name,
  }

  function useCookie() {
    const isHydrated = useIsHydrated()
    const serverCookie = React.useContext(getServerCookieCtx())
    const [state, setState] = React.useState<State>(() =>
      isHydrated ? service.get() : service.get(serverCookie),
    )
    useIsomorphicLayoutEffect(() => service.subscribe(setState), [])
    return [state, service.set] as [
      State,
      React.Dispatch<React.SetStateAction<State>>,
    ]
  }

  return [useCookie, service] as const
}
