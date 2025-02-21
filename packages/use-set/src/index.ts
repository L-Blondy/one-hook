import React from 'react'

export type SetInit<T> = Iterable<T> | null | undefined

export function useSet<T>(init?: SetInit<T>) {
  const [_set, _setSet] = React.useState(() => createSet(init))

  // by assigning to the _set, the result itself is spreadable, just like a Set
  // it also gives the result a stable identity
  return Object.assign(
    _set,
    React.useMemo(
      () => ({
        add(value: T): void {
          _setSet((_set) =>
            _set.has(value)
              ? _set // do not update the state if the value is already present
              : createSet([..._set, value]),
          )
        },
        clear(): void {
          _setSet((_set) =>
            !_set.size
              ? _set // do not update the state if the Set is already empty
              : createSet(),
          )
        },
        delete(value: T): void {
          _setSet((_set) =>
            !_set.has(value)
              ? _set // do not update the state if the value is already absent,
              : createSet([..._set].filter((v) => v !== value)),
          )
        },
        has(value: T): boolean {
          return Set.prototype.has.call(_set, value)
        },
        reset(init?: SetInit<T>): void {
          return _setSet(createSet(init))
        },
      }),
      [_set],
    ),
  )
}

/**
 * Memoize the values without pre-computing them
 */
function createSet<T>(init?: SetInit<T>) {
  const _set = new Set(init)
  let values: T[]
  return Object.assign(_set, {
    values() {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!values) values = [..._set]
      return values
    },
  })
}
