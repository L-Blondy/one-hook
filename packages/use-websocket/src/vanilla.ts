import type { StandardSchemaV1 } from '@standard-schema/spec'
import { getInstanceId, validate, type InstanceId } from './utils'
import type { MaybePromise } from '@1hook/utils/types'

type EventMap<TMessage> = {
  close: (event: CloseEvent) => void
  open: (event: Event) => void
  message: (message: TMessage, event: MessageEvent<unknown>) => void
  error: (event: Event) => void
}

export type SocketInstance<
  TParsedMessage = unknown,
  TSchema extends
    StandardSchemaV1<TParsedMessage> = StandardSchemaV1<TParsedMessage>,
> = ReturnType<typeof createInstance<TParsedMessage, TSchema>>

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

export type SocketInstanceOptions<
  TParsedMessage = unknown,
  TSchema extends
    StandardSchemaV1<TParsedMessage> = StandardSchemaV1<TParsedMessage>,
> = {
  url: string
  protocols?: string | string[]
  reconnect?: WebSocketReconnectOption
  ping?: WebSocketPingOption
  incomingMessage?: {
    parse?: (data: unknown) => MaybePromise<TParsedMessage>
    schema?: TSchema
  }
  outgoingMessage?: {
    serialize: (data: TParsedMessage) => Parameters<WebSocket['send']>[0]
  }
}

export const instanceMap = new Map<InstanceId, SocketInstance>()

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
>(
  options: SocketInstanceOptions<TParsedMessage, TSchema>,
): SocketInstance<TParsedMessage, TSchema> {
  const id = getInstanceId(options)
  const instance = instanceMap.get(id) ?? createInstance(id, options)
  instanceMap.set(id, instance)
  return instance
}

function createInstance<
  TParsedMessage = unknown,
  TSchema extends
    StandardSchemaV1<TParsedMessage> = StandardSchemaV1<TParsedMessage>,
>(id: InstanceId, options: SocketInstanceOptions<TParsedMessage, TSchema>) {
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

  const incomingParse = options.incomingMessage?.parse ?? ((d: unknown) => d)
  const incomingSchema = options.incomingMessage?.schema

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
          void (async function () {
            const parsed = await incomingParse(event.data)
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
    send(...args: Parameters<WebSocket['send']>) {
      instance.socket?.send(...args)
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
    on<TEventType extends keyof EventMap<TMessage>>(
      type: TEventType,
      listener: EventMap<TMessage>[TEventType],
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
  }

  return instance
}
