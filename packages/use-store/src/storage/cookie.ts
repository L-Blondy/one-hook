import {
  validateSync,
  type Validator,
  type ValidatorOutput,
} from '@1hook/utils/validate'
import { createEmitter } from '@1hook/utils/emitter'
import type React from 'react'
import { defaultDeserializer, defaultSerializer } from 'src/serialize'

export type CookieStorageOptions<TValidator extends Validator<unknown>> = {
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

export function cookie<TValidator extends Validator<unknown>>({
  name,
  validate,
  disableEncoding,
  serialize = defaultSerializer,
  deserialize = defaultDeserializer,
  ...cookieOptions
}: CookieStorageOptions<TValidator>) {
  const emitter = createEmitter()
  type State = ValidatorOutput<TValidator>

  const encode = disableEncoding ? (str: string) => str : encodeURIComponent
  const decode = disableEncoding ? (str: string) => str : decodeURIComponent

  function setCookie(
    value: State,
    cookieConfig: Pick<
      CookieStorageOptions<TValidator>,
      'domain' | 'expires' | 'sameSite' | 'secure'
    >,
  ) {
    let stringified = encode(serialize(value))
    let cookie = `${name}=${stringified}; Path=/`
    if (cookieConfig.sameSite) cookie += `; SameSite=${cookieConfig.sameSite}`
    if (cookieConfig.expires)
      cookie += `; Expires=${toUTCString(cookieConfig.expires)}`
    if (cookieConfig.secure) cookie += `; Secure`
    if (cookieConfig.domain) cookie += `; Domain=${cookieConfig.domain}`
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

  const storage = {
    set(updater: React.SetStateAction<State>): void {
      const next: State =
        typeof updater === 'function'
          ? (updater as any)(storage.get())
          : updater
      setCookie(next, cookieOptions)
      emitter.emit('', next)
    },
    get(allCookies = document.cookie): State {
      return parseCookieString(getCookieString(allCookies))
    },
    remove(): void {
      setCookie('' as any, { ...cookieOptions, expires: -1 })
      emitter.emit('', storage.get())
    },
    subscribe: (listener: (state: State) => void) =>
      emitter.on((_, state) => listener(state)),
  }
  return storage
}

function toUTCString(expires: number | Date) {
  return (
    typeof expires === 'number'
      ? new Date(Date.now() + expires * 864e5) // 864e5 are the ms of one day
      : expires
  ).toUTCString()
}
