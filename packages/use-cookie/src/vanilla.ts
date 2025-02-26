import {
  validateSync,
  type Validator,
  type ValidatorOutput,
} from '@one-stack/utils/validate'
import { defaultDeserializer, defaultSerializer } from './serializers'
import type { KeyOf } from '@one-stack/utils/types'

export type ServiceOptions = {
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

/**
 * ----
 * Client only cookie management service
 *
 * No `clear` method is exposed to avoid inconsistent behaviors:
 * cookies should be removed using the same attributes they were created with
 */
export function createCookieService<
  TConfig extends Record<string, CookieConfig>,
>(config: TConfig, options: ServiceOptions = {}) {
  type CookieName = KeyOf<TConfig>
  type CookieValue<TName extends CookieName> = ValidatorOutput<
    TConfig[TName]['validate']
  >

  const encode = options.disableEncoding
    ? (str: string) => str
    : encodeURIComponent
  const decode = options.disableEncoding
    ? (str: string) => str
    : decodeURIComponent
  const serialize = options.serialize ?? defaultSerializer
  const deserialize = options.deserialize ?? defaultDeserializer

  function setCookie<TName extends CookieName>(
    name: TName,
    value: CookieValue<TName>,
    cookieConfig: CookieConfig<CookieValue<TName>>,
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

  return {
    set<TName extends CookieName>(name: TName, value: CookieValue<TName>) {
      return setCookie(name, value, config[name] as any)
    },
    get<TName extends CookieName>(name: TName): CookieValue<TName> {
      return this.parse(name, readValue(name, decode))
    },
    remove(name: CookieName) {
      setCookie(name, '' as CookieValue<CookieName>, {
        ...config[name],
        validate: () => '' as CookieValue<CookieName>,
        expires: -1,
      })
    },
    parse<TName extends CookieName>(
      name: TName,
      value: string | undefined,
    ): CookieValue<TName> {
      const parsed = value === undefined ? undefined : deserialize(value)
      return validateSync((config[name] as any).validate, parsed)
    },
  }
}

function toUTCString(expires: number | Date) {
  return (
    typeof expires === 'number'
      ? new Date(Date.now() + expires * 864e5) // 864e5 are the ms of one day
      : expires
  ).toUTCString()
}

function readValue(key: string, decode: (value: string) => string) {
  for (let cookie of document.cookie.split(';')) {
    cookie = cookie.trim()
    const exists = cookie.startsWith(`${key}=`)
    if (exists) return decode(cookie.replace(`${key}=`, ''))
  }
}
