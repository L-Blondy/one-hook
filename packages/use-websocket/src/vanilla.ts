import { getInstanceId, type InstanceId, type SendableMessage } from './utils'

type Listeners = {
  onClose?: (event: CloseEvent) => void
  onOpen?: (event: Event) => void
  onMessage?: (event: MessageEvent<unknown>) => any
  onError?: (event: Event) => void
}

export type SocketInstance = ReturnType<typeof createInstance>

export type WebSocketReconnectOption = {
  when?: (closeEvent: CloseEvent) => boolean
  delay: number | ((attempt: number, closeEvent: CloseEvent) => number)
  attempts?: number
}

export type WebSocketPingOption = {
  interval: number
  message?: string
  leading?: boolean
}

export type SocketInstanceOptions = {
  /**
   * The url of the websocket server.
   *
   * See [MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/WebSocket#url) for more details
   */
  url: string | URL
  /**
   * The sub-protocols.
   *
   * See [MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/WebSocket#protocols) for more details
   */
  protocols: string | string[] | undefined
  /**
   * Define the reconnection strategy, if any.
   */
  reconnect: WebSocketReconnectOption | undefined
  /**
   * Define the ping strategy, if any.
   */
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

    socket.addEventListener(
      'close',
      (event) => {
        allListeners.forEach((listeners) => {
          listeners.onClose?.(event)
        })
        controller.abort() // remove listeners on that socket instance. A new instance will be created.
        clearInterval(pingIntervalId)
        messageQueue.length = 0 // clear the message queue
        if (
          !allListeners.size ||
          !recoWhen(event) ||
          ++recoAttempt > recoAttempts
        ) {
          clearTimeout(recoTimeoutId)
          return
        }
        const delay =
          typeof recoDelay === 'function'
            ? recoDelay(recoAttempt, event)
            : recoDelay
        if (delay) {
          recoTimeoutId = setTimeout(() => connect(), delay)
        }
      },
      { signal },
    )
    socket.addEventListener(
      'open',
      (event) => {
        allListeners.forEach((listeners) => {
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
