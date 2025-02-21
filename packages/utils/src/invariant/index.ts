type InvariantConfig = {
  stripMessage?: boolean
}

type Invariant = ((
  condition: any,
  message: string | (() => string),
) => asserts condition) & { config: (config: InvariantConfig) => void }

export const invariant: Invariant = function invariant_(
  condition: any,
  message: string | (() => string),
): asserts condition {
  if (!condition) {
    const error = new Error(
      __CONFIG__.current?.stripMessage
        ? ''
        : typeof message === 'function'
          ? message()
          : message,
    )
    error.name = 'InvariantError'
    throw error
  }
}

const __CONFIG__ = {} as { current?: InvariantConfig }

invariant.config = (config: InvariantConfig) => {
  __CONFIG__.current = config
}
