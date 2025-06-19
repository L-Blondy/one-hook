import {
  getInstanceId,
  safeJsonParse,
  safeJsonStringify,
  type InstanceId,
} from './utils'
import type { MaybePromise } from '@1hook/utils/types'
import {
  validate,
  type Validator,
  type ValidatorOutput,
} from '@1hook/utils/validate'

type Listeners<TMessage = any> = {
  onClose?: (event: CloseEvent) => void
  onOpen?: (event: Event) => void
  onMessage?: (message: TMessage, event: MessageEvent<unknown>) => void
  onError?: (event: Event) => void
}

export type SocketInstance<
  TParsedMessage,
  TValidator extends Validator<TParsedMessage, any>,
  TOutgoingMessage,
> = ReturnType<
  typeof createInstance<TParsedMessage, TValidator, TOutgoingMessage>
>

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

export type WebSocketIncomingMessageOption<
  TParsedMessage,
  TValidator extends Validator<TParsedMessage, any>,
> = {
  /**
   * The incoming message options.
   *
   * Return `null | undefined` to ignore the message.
   */
  parse?: (
    data: unknown,
    event: MessageEvent<unknown>,
    socket: WebSocket,
  ) => MaybePromise<TParsedMessage>
  /**
   * Validation schema for the incoming message. Can be any StandardSchemaV1 compliant schema.
   *
   * Return `null | undefined` to ignore the message.
   */
  validate?: TValidator
}

export type WebSocketOutgoingMessageOption<TOutgoingMessage> = {
  /**
   * The function to serialize the outgoing message, before passing it to `WebSocket.send`
   */
  serialize: (
    data: TOutgoingMessage,
    socket: WebSocket,
  ) => Parameters<WebSocket['send']>[0]
}

export type SocketInstanceOptions<
  TParsedMessage,
  TValidator extends Validator<TParsedMessage, any>,
  TOutgoingMessage,
> = {
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
  protocols?: string | string[]
  /**
   * Define the reconnection strategy, if any.
   */
  reconnect?: WebSocketReconnectOption
  /**
   * Define the ping strategy, if any.
   */
  ping?: WebSocketPingOption
  /**
   * Parse and validate the incoming message data
   */
  incomingMessage?: WebSocketIncomingMessageOption<TParsedMessage, TValidator>
  /**
   * The outgoing message options (WebSocket.send)
   */
  outgoingMessage?: WebSocketOutgoingMessageOption<TOutgoingMessage>
}

/**
 * Store the instances the reuse based on a unique id.
 */
export const instanceMap = new Map<InstanceId, SocketInstance<any, any, any>>()

/**
 * Features:
 * - reconnect
 * - ping
 * - queue messages while connecting
 * - ignore incoming messages
 * - stable instance given the some url + protocols
 */
export function getSocketInstance<
  TParsedMessage = unknown,
  TValidator extends Validator<TParsedMessage, any> = Validator<TParsedMessage>,
  TOutgoingMessage = unknown,
>(
  options: SocketInstanceOptions<TParsedMessage, TValidator, TOutgoingMessage>,
): SocketInstance<TParsedMessage, TValidator, TOutgoingMessage> {
  const id = getInstanceId(options)
  return instanceMap.get(id) ?? createInstance(id, options)
}

function createInstance<
  TParsedMessage,
  TValidator extends Validator<TParsedMessage, any>,
  TOutgoingMessage,
>(
  id: InstanceId,
  options: SocketInstanceOptions<TParsedMessage, TValidator, TOutgoingMessage>,
) {
  type TMessage = Exclude<ValidatorOutput<TValidator>, undefined | null>
  const allListeners = new Set<Listeners<TMessage>>()
  const messageQueue: Array<Parameters<WebSocket['send']>[0]> = []

  const recoWhen = options.reconnect?.when ?? (() => true)
  const recoDelay = options.reconnect?.delay ?? 0
  const recoAttempts = options.reconnect?.attempts ?? Infinity

  const pingInterval = options.ping?.interval ?? 0
  const pingMessage = options.ping?.message ?? 'ping'
  const pingLeading = options.ping?.leading ?? false

  const incomingParse = options.incomingMessage?.parse ?? safeJsonParse
  const incomingValidate =
    options.incomingMessage?.validate ?? ((x: TMessage) => x)

  const outgoingSerialize =
    options.outgoingMessage?.serialize ?? safeJsonStringify

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
        void (async function () {
          const parsed: TParsedMessage = (await incomingParse(
            event.data,
            event,
            socket,
          )) as any
          if (parsed === undefined || parsed === null) return
          const validated: TMessage = await validate(
            incomingValidate as any,
            parsed as any,
          )
          if (validated === undefined || validated === null) return
          allListeners.forEach((listeners) => {
            listeners.onMessage?.(validated, event)
          })
        })()
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
    send(message: TOutgoingMessage) {
      const socket = instance['~socket']
      if (!socket) return
      const serialized = outgoingSerialize(message, socket)
      if (socket.readyState === WebSocket.CONNECTING) {
        // queue the message only when the socket is connecting
        messageQueue.push(serialized)
      } else {
        // other cases are all gracefully handled by default
        socket.send(serialized)
      }
    },
    listen(listeners: Listeners<TMessage>) {
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
