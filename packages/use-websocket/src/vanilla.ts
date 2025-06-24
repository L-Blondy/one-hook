import { getInstanceId, type InstanceId, type SendableMessage } from './utils'

type State = 'connecting' | 'open' | 'closed'

type Listeners = {
  onClose?: (event: CloseEvent) => void
  onOpen?: (event: Event) => void
  onMessage?: (event: MessageEvent<unknown>) => any
  onError?: (event: Event) => void
  onStateChange?: (state: State) => void
}

export type SocketInstance = ReturnType<typeof createInstance>

export type WebSocketReconnectOption = {
  /**
   * The function to determine if a reconnection should be attempted.
   *
   * @default () => true
   * @remarks `Function`
   */
  when?: (closeEvent: CloseEvent) => boolean
  /**
   * The delay in milliseconds between reconnection attempts. Set to 0 to disable reconnection.
   *
   * @remarks `Function`
   */
  delay: number | ((attempt: number, closeEvent: CloseEvent) => number)
  /**
   * The maximum number of reconnection attempts.
   *
   * @default Infinity
   */
  attempts?: number
}

export type WebSocketPingOption = {
  interval: number
  /**
   * The message to send when pinging.
   *
   * @default 'ping'
   */
  message?: string
  /**
   * Whether to send the ping message as soon as the connection is established.
   *
   * @default false
   */
  leading?: boolean
}

export type SocketInstanceOptions = {
  url: string | URL
  protocols: string | string[] | undefined
  reconnect: WebSocketReconnectOption | undefined
  ping: WebSocketPingOption | undefined
}

/**
 * Store the instances the reuse based on a unique id.
 */
export const instanceMap = new Map<InstanceId, SocketInstance>()

/**
 * Features:
 * - reconnect
 * - ping
 * - queue messages while connecting
 * - ignore incoming messages
 * - stable instance given the some url + protocols
 */
export function getSocketInstance(
  options: SocketInstanceOptions,
): SocketInstance {
  const id = getInstanceId(options)
  return instanceMap.get(id) ?? createInstance(id, options)
}

function createInstance(id: InstanceId, options: SocketInstanceOptions) {
  const allListeners = new Set<Listeners>()
  const messageQueue: Array<SendableMessage> = []

  const recoWhen = options.reconnect?.when ?? (() => true)
  const recoDelay = options.reconnect?.delay ?? 0
  const recoAttempts = options.reconnect?.attempts ?? Infinity

  const pingInterval = options.ping?.interval ?? 0
  const pingMessage = options.ping?.message ?? 'ping'
  const pingLeading = options.ping?.leading ?? false

  let recoAttempt = 0
  let recoTimeoutId: NodeJS.Timeout | undefined
  let pingIntervalId: NodeJS.Timeout | undefined

  function connect() {
    const socket = new WebSocket(options.url, options.protocols)
    instance['~socket'] = socket
    const controller = new AbortController()
    const { signal } = controller
    allListeners.forEach((listeners) => {
      listeners.onStateChange?.('connecting')
    })

    socket.addEventListener(
      'close',
      (event) => {
        allListeners.forEach((listeners) => {
          listeners.onStateChange?.('closed')
        })
        allListeners.forEach((listeners) => {
          listeners.onClose?.(event)
        })
        controller.abort() // remove listeners on that socket instance. A new instance will be created.
        clearInterval(pingIntervalId)
        messageQueue.length = 0 // clear the message queue
        let delay: number

        if (
          !allListeners.size ||
          !recoWhen(event) ||
          ++recoAttempt > recoAttempts ||
          !(delay =
            typeof recoDelay === 'function'
              ? recoDelay(recoAttempt, event)
              : recoDelay)
        ) {
          clearTimeout(recoTimeoutId)
          return
        }
        recoTimeoutId = setTimeout(() => connect(), delay)
      },
      { signal },
    )
    socket.addEventListener(
      'open',
      (event) => {
        allListeners.forEach((listeners) => {
          listeners.onStateChange?.('open')
          listeners.onOpen?.(event)
        })
        while (messageQueue.length) {
          socket.send(messageQueue.shift()!)
        }
        recoAttempt = 0
        clearTimeout(recoTimeoutId)
        if (pingInterval) {
          if (pingLeading) {
            socket.send(pingMessage)
          }
          pingIntervalId = setInterval(() => {
            socket.send(pingMessage)
          }, pingInterval)
        }
      },
      { signal },
    )
    socket.addEventListener(
      'error',
      (event) => {
        allListeners.forEach((listeners) => {
          listeners.onStateChange?.('closed')
          listeners.onError?.(event)
        })
      },
      { signal },
    )
    socket.addEventListener(
      'message',
      (event: MessageEvent<unknown>) => {
        allListeners.forEach((listeners) => {
          listeners.onMessage?.(event)
        })
      },
      { signal },
    )
  }

  /**
   * the `close` method is not part of the public API:
   * calling it manually without removing the listeners
   * would trigger a reconnection attempt.
   */
  const instance = {
    id,
    send(message: SendableMessage) {
      if (instance['~socket']?.readyState === WebSocket.CONNECTING) {
        // queue the message only when the socket is connecting
        messageQueue.push(message)
      } else {
        // other cases are all gracefully handled by default
        instance['~socket']?.send(message)
      }
    },
    listen(listeners: Listeners) {
      allListeners.add(listeners)
      if (!instance['~socket']) connect()
      return () => {
        allListeners.delete(listeners)
        if (!allListeners.size) {
          instance['~socket']?.close()
          instanceMap.delete(id)
        }
      }
    },
    ['~socket']: null as WebSocket | null,
  }
  instanceMap.set(id, instance)
  return instance
}
