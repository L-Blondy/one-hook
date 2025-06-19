import type { StandardSchemaV1 } from '@standard-schema/spec'
import {
  getInstanceId,
  safeJsonParse,
  safeJsonStringify,
  validate,
  type InstanceId,
} from './utils'
import type { MaybePromise } from '@1hook/utils/types'

type Listeners<TMessage = any> = {
  close: (event: CloseEvent) => void
  open: (event: Event) => void
  message: (message: TMessage, event: MessageEvent<unknown>) => void
  error: (event: Event) => void
}

export type SocketInstance<
  TParsedMessage,
  TSchema extends StandardSchemaV1<TParsedMessage>,
  TOutgoingMessage,
> = ReturnType<typeof createInstance<TParsedMessage, TSchema, TOutgoingMessage>>

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
  TSchema extends StandardSchemaV1<TParsedMessage>,
> = {
  /**
   * The incoming message options
   */
  parse?: (data: unknown, socket: WebSocket) => MaybePromise<TParsedMessage>
  /**
   * Validation schema for the incoming message. Can be any StandardSchemaV1 compliant schema.
   */
  schema?: TSchema
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
  TSchema extends StandardSchemaV1<TParsedMessage>,
  TOutgoingMessage,
> = {
  /**
   * The url of the websocket server.
   *
   * See [MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/WebSocket#url) for more details
   */
  url: string
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
  incomingMessage?: WebSocketIncomingMessageOption<TParsedMessage, TSchema>
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
 * - stable instance given the some url + protocols
 */
export function getSocketInstance<
  TParsedMessage = unknown,
  TSchema extends
    StandardSchemaV1<TParsedMessage> = StandardSchemaV1<TParsedMessage>,
  TOutgoingMessage = unknown,
>(
  options: SocketInstanceOptions<TParsedMessage, TSchema, TOutgoingMessage>,
): SocketInstance<TParsedMessage, TSchema, TOutgoingMessage> {
  const id = getInstanceId(options)
  return instanceMap.get(id) ?? createInstance(id, options)
}

function createInstance<
  TParsedMessage,
  TSchema extends StandardSchemaV1<TParsedMessage>,
  TOutgoingMessage,
>(
  id: InstanceId,
  options: SocketInstanceOptions<TParsedMessage, TSchema, TOutgoingMessage>,
) {
  type TMessage = StandardSchemaV1.InferOutput<TSchema>
  const allListeners = new Set<Listeners<TMessage>>()

  const recoWhen = options.reconnect?.when ?? (() => true)
  const recoDelay = options.reconnect?.delay ?? 0
  const recoAttempts = options.reconnect?.attempts ?? Infinity

  const pingInterval = options.ping?.interval ?? 0
  const pingMessage = options.ping?.message ?? 'ping'
  const pingLeading = options.ping?.leading ?? false

  const incomingParse = options.incomingMessage?.parse ?? safeJsonParse
  const incomingSchema = options.incomingMessage?.schema

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
          listeners.close(event)
        })
        controller.abort() // remove listeners on that socket instance. A new instance will be created.
        clearInterval(pingIntervalId)
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
          listeners.open(event)
        })
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
          listeners.error(event)
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
            socket,
          )) as any
          const validated: TMessage = incomingSchema
            ? await validate(incomingSchema, parsed)
            : parsed
          allListeners.forEach((listeners) => {
            listeners.message(validated, event)
          })
        })()
      },
      { signal },
    )
  }

  const instance = {
    send(message: TOutgoingMessage) {
      instance['~socket']?.send(outgoingSerialize(message, instance['~socket']))
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
    id,
    ['~socket']: null as WebSocket | null,
  }
  instanceMap.set(id, instance)
  return instance
}
