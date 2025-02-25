import {
  validateSync,
  type Validator,
  type ValidatorOutput,
} from '@one-stack/utils/validate'
import { defaultDeserializer, defaultSerializer } from './serializers'
import type { KeyOf } from '@one-stack/utils/types'

export type ServiceOptions = {
  disableEncoding?: boolean
  serialize?: (value: unknown) => string
  deserialize?: (value: string) => any
}

export type CookieConfig<TOutput = any> = {
  expires?: number | Date
  sameSite?: 'lax' | 'strict' | 'none'
  secure?: boolean
  domain?: string
  validate: Validator<TOutput>
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
      return setCookie(name, value, config[name]!)
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
      return validateSync(config[name]!.validate, parsed)
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
