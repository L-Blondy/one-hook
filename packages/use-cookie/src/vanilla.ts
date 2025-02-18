import { defaultDeserializer, defaultSerializer } from "./serializers";

export type CookieServiceOptions<TDeserialized> = {
  disableEncoding?: boolean;
  serialize?: (value: NoInfer<TDeserialized>) => string;
  deserialize?: (value: string) => TDeserialized;
};

export type CookieAttributes = {
  expires?: number | Date;
  sameSite?: "lax" | "strict" | "none";
  secure?: boolean;
  domain?: string;
};

/**
 * ----
 * Client only cookie management service
 *
 * No `clear` method is exposed to avoid inconsistent behaviors:
 * cookies should be removed using the same attributes they were created with
 */
export function createCookieService<TDeserialized>({
  disableEncoding,
  serialize = defaultSerializer,
  deserialize = defaultDeserializer,
}: CookieServiceOptions<TDeserialized> = {}) {
  const encode = disableEncoding ? (str: string) => str : encodeURIComponent;
  const decode = disableEncoding ? (str: string) => str : decodeURIComponent;
  return {
    /**
     * ----
     * On **Next.js server** you can read/write `string` cookies as usual using the `cookie()` utility.
     *
     * To achieve that:
     * - the key is not encoded
     * - the value is encoded using encodeURIComponent
     * - the default serializer only transforms non-string values
     */
    set(key: string, value: TDeserialized, attrs: CookieAttributes = {}) {
      let stringified = encode(serialize(value));
      let cookie = `${key}=${stringified}; Path=/`;
      if (attrs.sameSite) cookie += `; SameSite=${attrs.sameSite}`;
      if (attrs.expires) cookie += `; Expires=${toUTCString(attrs.expires)}`;
      if (attrs.secure) cookie += `; Secure`;
      if (attrs.domain) cookie += `; Domain=${attrs.domain}`;
      document.cookie = cookie;
      return stringified;
    },
    get<T extends TDeserialized | undefined>(
      key: string,
      config: { validate: (value: TDeserialized | undefined) => T }
    ) {
      return this.parse(getValue(key, decode), config);
    },
    remove(key: string, attrs?: Omit<CookieAttributes, "expires">) {
      this.set(key, "" as TDeserialized, { ...attrs, expires: -1 });
    },
    /**
     * Can be used to parse already decoded cookies
     */
    parse<T extends TDeserialized | undefined>(
      value: string | undefined,
      config: { validate: (value: TDeserialized | undefined) => T }
    ) {
      const deserialized = value === undefined ? undefined : deserialize(value);
      return config.validate(deserialized);
    },
  };
}

function toUTCString(expires: number | Date) {
  return (
    typeof expires === "number"
      ? new Date(Date.now() + expires * 864e5) // 864e5 are the ms of one day
      : expires
  ).toUTCString();
}

function getValue(key: string, decode: (value: string) => string) {
  for (let cookie of document.cookie.split(";")) {
    cookie = cookie.trim();
    const exists = cookie.startsWith(`${key}=`);
    if (exists) return decode(cookie.replace(`${key}=`, ""));
  }
  return;
}
