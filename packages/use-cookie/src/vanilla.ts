import {
  validateSync,
  type Validator,
  type ValidatorOutput,
} from '@1hook/utils/validate'
import { defaultDeserializer, defaultSerializer } from './serializers'
import type { KeyOf } from '@1hook/utils/types'

export type CookieServiceOptions = {
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

export type CookieConfig<TOutput = unknown> = {
  /**
   * The validator for the cookie. Can be:
   * - a function that returns a the value or throws an error
   * - a `StandardSchema` (e.g. a zod, valibot or arktype schema)
   */
  validate: Validator<TOutput>
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
}

type CookieName<TConfig extends Record<string, CookieConfig>> = KeyOf<TConfig>

type CookieValue<
  TConfig extends Record<string, CookieConfig>,
  TName extends CookieName<TConfig>,
> = ValidatorOutput<TConfig[TName]['validate']>

export type CookieService<TConfig extends Record<string, CookieConfig>> = {
  /**
   * Set a cookie value.
   *
   * @remarks `<T>(name: string, value: T) => string`
   */
  set: <TName extends CookieName<TConfig>>(
    name: TName,
    value: CookieValue<TConfig, TName>,
  ) => string
  /**
   * Get a cookie value.
   *
   * @remarks `<T>(name: string, allCookies?:string) => T`
   */
  get: <TName extends CookieName<TConfig>>(
    name: TName,
    allCookies?: string,
  ) => CookieValue<TConfig, TName>
  /**
   * Remove a cookie.
   *
   * @remarks `(name: string) => void`
   */
  remove: <TName extends CookieName<TConfig>>(name: TName) => void
  /**
   * Parse a raw cookie string. If the cookie is not found, the value is `undefined`.
   *
   * @remarks `(name: string, value: string | undefined) => T`
   */
  parseSerialized: <TName extends CookieName<TConfig>>(
    name: TName,
    value: string | undefined,
  ) => CookieValue<TConfig, TName>
  /**
   * Get a raw cookie string.
   *
   * @remarks `(allCookies: string, name: string) => string | undefined`
   */
  getSerialized: <TName extends CookieName<TConfig>>(
    allCookies: string,
    name: TName,
  ) => string | undefined
}

export function createCookieService<
  TConfig extends Record<string, CookieConfig>,
>(config: TConfig, options: CookieServiceOptions = {}): CookieService<TConfig> {
  const encode = options.disableEncoding
    ? (str: string) => str
    : encodeURIComponent
  const decode = options.disableEncoding
    ? (str: string) => str
    : decodeURIComponent
  const serialize = options.serialize ?? defaultSerializer
  const deserialize = options.deserialize ?? defaultDeserializer

  function setCookie<TName extends CookieName<TConfig>>(
    name: TName,
    value: CookieValue<TConfig, TName>,
    cookieConfig: CookieConfig<CookieValue<TConfig, TName>>,
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

  const service: CookieService<TConfig> = {
    set(name, value) {
      return setCookie(name, value, config[name] as any)
    },
    get(name, allCookies = document.cookie) {
      return this.parseSerialized(name, this.getSerialized(allCookies, name))
    },
    remove(name) {
      setCookie(name, '' as any, {
        ...config[name],
        validate: () => '' as any,
        expires: -1,
      })
    },
    parseSerialized(name, value) {
      const parsed = value === undefined ? undefined : deserialize(value)
      return validateSync((config[name] as any).validate, parsed)
    },
    getSerialized(allCookies: string, name: string): string | undefined {
      for (let cookie of allCookies.split(';')) {
        cookie = cookie.trim()
        const exists = cookie.startsWith(`${name}=`)
        if (exists) return decode(cookie.replace(`${name}=`, ''))
      }
    },
  }
  return service
}

function toUTCString(expires: number | Date) {
  return (
    typeof expires === 'number'
      ? new Date(Date.now() + expires * 864e5) // 864e5 are the ms of one day
      : expires
  ).toUTCString()
}
