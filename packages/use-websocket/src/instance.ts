type EventMap = {
  close: (event: CloseEvent) => void
  open: (event: Event) => void
  message: (event: MessageEvent<unknown>) => void
  error: (event: Event) => void
}

export type SocketInstance = ReturnType<typeof createSocketInstance>

export type SocketInstanceOptions = {
  url: string
  protocols?: string | string[]
  reconnect?: {
    when?: (closeEvent: CloseEvent) => boolean
    delay: number | ((attempt: number, closeEvent: CloseEvent) => number)
    attempts?: number
  }
  ping?: {
    interval: number
    message?: string
    leading?: boolean
  }
}

/**
 * Features:
 * - reconnect
 * - ping
 * - stable instance (no need to create a new instance)
 */
export function createSocketInstance(options: SocketInstanceOptions) {
  const listenersMap = {
    close: new Set<EventMap['close']>(),
    open: new Set<EventMap['open']>(),
    message: new Set<EventMap['message']>(),
    error: new Set<EventMap['error']>(),
  }

  const recoWhen = options.reconnect?.when ?? (() => true)
  const recoDelay = options.reconnect?.delay ?? 0
  const recoAttempts = options.reconnect?.attempts ?? Infinity

  const pingInterval = options.ping?.interval ?? 0
  const pingMessage = options.ping?.message ?? 'ping'
  const pingLeading = options.ping?.leading ?? false

  let recoAttempt = 0
  let recoTimeoutId: NodeJS.Timeout | undefined
  let pingIntervalId: NodeJS.Timeout | undefined

  const instance = {
    socket: undefined as WebSocket | undefined,
    connect() {
      instance.socket = new WebSocket(options.url, options.protocols)
      const controller = new AbortController()
      const { signal } = controller

      instance.socket.addEventListener(
        'close',
        (event) => {
          listenersMap.close.forEach((l) => l(event))
          controller.abort() // remove listeners on that socket instance
          clearInterval(pingIntervalId)
          if (recoWhen(event) && ++recoAttempt <= recoAttempts) {
            const delay =
              typeof recoDelay === 'function'
                ? recoDelay(recoAttempt, event)
                : recoDelay
            if (delay) {
              recoTimeoutId = setTimeout(() => instance.connect(), delay)
            }
          }
        },
        { signal },
      )
      instance.socket.addEventListener(
        'open',
        (event) => {
          listenersMap.open.forEach((l) => l(event))
          recoAttempt = 0
          clearTimeout(recoTimeoutId)
          if (pingInterval) {
            if (pingLeading) {
              instance.socket?.send(pingMessage)
            }
            pingIntervalId = setInterval(() => {
              instance.socket?.send(pingMessage)
            }, pingInterval)
          }
        },
        { signal },
      )
      instance.socket.addEventListener(
        'error',
        (event) => {
          listenersMap.error.forEach((l) => l(event))
        },
        { signal },
      )
      instance.socket.addEventListener(
        'message',
        (event: MessageEvent<unknown>) => {
          listenersMap.message.forEach((l) => l(event))
        },
        { signal },
      )
    },
    /**
     * Close the socket but does not clear the listeners
     */
    close(...args: Parameters<WebSocket['close']>) {
      instance.socket?.close(...args)
    },
    /**
     * Clears everything
     */
    kill() {
      clearTimeout(recoTimeoutId)
      instance.socket?.close()
      // TODO maybe pass a custom code to close and clear in the listener
      Object.values(listenersMap).forEach((set) => set.clear())
    },
    on<TEventType extends keyof EventMap>(
      type: TEventType,
      listener: EventMap[TEventType],
    ) {
      listenersMap[type].add(listener as any)
    },
    off<TEventType extends keyof EventMap>(
      type: TEventType,
      listener: EventMap[TEventType],
    ) {
      listenersMap[type].delete(listener as any)
    },
  }

  return instance
}
