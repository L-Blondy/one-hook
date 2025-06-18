import type { StandardSchemaV1 } from '@standard-schema/spec'
import {
  getInstanceId,
  safeJsonParse,
  safeJsonStringify,
  validate,
  type InstanceId,
} from './utils'
import type { MaybePromise } from '@1hook/utils/types'
import { noop } from '@1hook/utils/noop'

type EventMap<TMessage = any> = {
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
  parse?: (data: unknown) => MaybePromise<TParsedMessage>
  /**
   * Validation schema for the incoming message. Can be any StandardSchemaV1 compliant schema.
   */
  schema?: TSchema
}

export type WebSocketOutgoingMessageOption<TOutgoingMessage> = {
  /**
   * The function to serialize the outgoing message, before passing it to `WebSocket.send`
   */
  serialize: (data: TOutgoingMessage) => Parameters<WebSocket['send']>[0]
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
  const instance = instanceMap.get(id) ?? createInstance(id, options)
  instanceMap.set(id, instance)
  return instance
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
  const listenersMap = {
    close: new Set<EventMap<TMessage>['close']>(),
    open: new Set<EventMap<TMessage>['open']>(),
    message: new Set<EventMap<TMessage>['message']>(),
    error: new Set<EventMap<TMessage>['error']>(),
  }

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

  const instance = {
    id,
    socket: undefined as WebSocket | undefined,
    connect() {
      instance.socket = new WebSocket(options.url, options.protocols)
      const controller = new AbortController()
      const { signal } = controller

      instance.socket.addEventListener(
        'close',
        (event) => {
          listenersMap.close.forEach((l) => l(event))
          controller.abort() // remove listeners on that socket instance. A new instance will be created.
          clearInterval(pingIntervalId)
          if (
            recoWhen(event) &&
            instance.hasListeners &&
            ++recoAttempt <= recoAttempts
          ) {
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
          void (async function () {
            const parsed: TParsedMessage = (await incomingParse(
              event.data,
            )) as any
            const validated: TMessage = incomingSchema
              ? await validate(incomingSchema, parsed)
              : parsed
            listenersMap.message.forEach((l) => l(validated, event))
          })()
        },
        { signal },
      )
    },
    /**
     * Close the socket but does not clear the listeners. \
     */
    close(...args: Parameters<WebSocket['close']>) {
      instance.socket?.close(...args)
    },
    /**
     * Send a message.
     */
    send(message: TOutgoingMessage) {
      instance.socket?.send(outgoingSerialize(message))
    },

    on<TEventType extends keyof EventMap<TMessage>>(
      type: TEventType,
      listener: EventMap<TMessage>[TEventType] = noop,
    ) {
      listenersMap[type].add(listener as any)
      return () => instance.off(type, listener)
    },
    off<TEventType extends keyof EventMap<TMessage>>(
      type: TEventType,
      listener: EventMap<TMessage>[TEventType],
    ) {
      listenersMap[type].delete(listener as any)
    },
    get hasListeners() {
      return Object.values(listenersMap).some((set) => set.size)
    },
    /**
     * Clears everything
     */
    ['~kill']() {
      clearTimeout(recoTimeoutId)
      Object.values(listenersMap).forEach((set) => set.clear())
      instance.socket?.close()
    },
  }

  return instance
}
