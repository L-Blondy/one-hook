import React from 'react'

export type MapInit<K, V> =
  | readonly (readonly [K, V])[]
  | Iterable<readonly [K, V]>
  | null
  | undefined

export function useMap<K, V>(init?: MapInit<K, V>) {
  const [_map, _setMap] = React.useState(() => createMap(init))

  // by assigning to the _map, the result itself is spreadable, just like a Map
  // it also gives the result a stable identity
  return Object.assign(
    _map,
    React.useMemo(
      () => ({
        clear(): void {
          _setMap((_map) =>
            !_map.size
              ? _map // do not update the state if the Map is already empty
              : createMap(),
          )
        },
        delete(key: K): void {
          _setMap((_map) =>
            !_map.has(key)
              ? _map // do not update the state if the value is already absent,
              : createMap([..._map].filter((e) => e[0] !== key)),
          )
        },
        get(key: K): V | undefined {
          return Map.prototype.get.call(_map, key)
        },
        has(key: K): boolean {
          return Map.prototype.has.call(_map, key)
        },
        reset(init?: MapInit<K, V>): void {
          return _setMap(createMap(init))
        },
        set(key: K, value: V): void {
          _setMap((_map) =>
            _map.get(key) === value
              ? _map // do not update the state if the key-value pair already exists
              : createMap([..._map, [key, value]]),
          )
        },
      }),
      [_map],
    ),
  )
}

/**
 * Memoize the values, keys and entries without pre-computing them
 */
function createMap<K, V>(init?: MapInit<K, V>) {
  const _map = new Map(init)
  let entries: [K, V][]
  let keys: K[]
  let values: V[]

  return Object.assign(_map, {
    entries() {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!entries) entries = [..._map]
      return entries
    },
    keys() {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!keys) keys = this.entries().map((e) => e[0])
      return keys
    },
    values() {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!values) values = this.entries().map((e) => e[1])
      return values
    },
  })
}
