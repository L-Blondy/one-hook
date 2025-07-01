import React from 'react'
import {
  type WebSocketReconnectOption,
  type WebSocketPingOption,
  getSocketInstance,
  type SocketInstance,
} from './vanilla'
import {
  validateAsync,
  type Validator,
  type ValidatorOutput,
} from '@1hook/utils/validate'
import {
  fallbackParseMessage,
  fallbackSerializeMessage,
  type SendableMessage,
} from './utils'
import type { Falsy, MaybePromise } from '@1hook/utils/types'
import { useEventHandler } from '@1hook/use-event-handler'
import { useIsHydrated } from '@1hook/use-is-hydrated'

export type DefineWebSocketOptions<TDefaultParsedMessage, TDefaultSendMessage> =
  {
    /**
     * The reconnection strategy.
     */
    reconnect?: WebSocketReconnectOption
    /**
     * The ping strategy.
     */
    ping?: WebSocketPingOption
    /**
     * The binary type. See [MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/binaryType) for more details.
     */
    binaryType?: BinaryType
    /**
     * The default function to parse the incoming message.
     *
     * Return `null | undefined` to ignore the message
     *
     * @remarks `Function`
     */
    parseMessage?: (
      event: MessageEvent<unknown>,
    ) => MaybePromise<TDefaultParsedMessage>
    /**
     * The default function to serialize the outgoing message.
     *
     * @remarks `Function`
     */
    serializeMessage?: (data: TDefaultSendMessage) => SendableMessage
  }

export type UseWebSocketOptions<
  TParsedMessage,
  TSendMessage,
  TValidator extends Validator<TParsedMessage, any>,
> = {
  /**
   * The URL of the WebSocket server.
   * Pass a falsy value to stop listening to the WebSocket server.
   *
   * @remarks `string | URL | Falsy`
   */
  url: string | URL | Falsy
  /**
   * The sub-protocols.
   *
   * See [MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/WebSocket#protocols) for more details
   */
  protocols?: string | string[]
  /**
   * The function to parse the incoming message.
   *
   * Uses `JSON.parse` by default.
   *
   * Return `null | undefined` to ignore the message
   *
   * @remarks `(event: MessageEvent) => MaybePromise<T>`
   */
  parseMessage?: (event: MessageEvent<unknown>) => MaybePromise<TParsedMessage>
  /**
   * Incoming message validator. Can be one of the following:
   * - a **function** that returns the value or throws an error
   * - a **schema** from a validation library like zod, valibot or arktype that follows the [Standard Schema](https://github.com/standard-schema/standard-schema) spec
   *
   * Return `null | undefined` to ignore the message
   */
  validate?: TValidator
  /**
   * The function to serialize the outgoing message.
   *
   * Uses `JSON.stringify` by default.
   *
   * @remarks `Function`
   */
  serializeMessage?: (message: TSendMessage) => SendableMessage
  /**
   * Executed when a message is received from the server, after it has been parsed and validated.
   *
   * `null` and `undefined` messages are ignored.
   *
   * @remarks `(message: T, event: MessageEvent) => void`
   */
  onMessage?: (
    message: Exclude<ValidatorOutput<TValidator>, undefined | null>,
    event: MessageEvent<unknown>,
  ) => void
  /**
   * [See MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/open_event)
   */
  onOpen?: (event: Event) => void
  /**
   * [See MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/close_event)
   */
  onClose?: (event: CloseEvent) => void
  /**
   * [See MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/error_event)
   */
  onError?: (event: Event) => void
}

export type UseWebSocketReturn<TSendMessage = unknown> = {
  /**
   * Send a message to the server.
   *
   * The message is serialized using the `serializeMessage` function.
   */
  send: (message: TSendMessage) => void
  /**
   * The current `readyState` of the WebSocket as a string literal type for convenience.
   *
   * Since the `"closing"` state can never be observed, it is not included in the type.
   */
  state: 'connecting' | 'open' | 'closed'
  /**
   * @private
   * @internal
   */
  ['~socket']: () => WebSocket | null
}

export function defineWebSocket<
  TDefaultParsedMessage = unknown,
  TDefaultSendMessage = unknown,
>({
  ping,
  reconnect,
  binaryType,
  parseMessage: defaultParseMessage = fallbackParseMessage,
  serializeMessage: defaultSerializeMessage = fallbackSerializeMessage,
}: DefineWebSocketOptions<TDefaultParsedMessage, TDefaultSendMessage> = {}) {
  /**
   * store the current state of the WebSocket connection to have it immediately when mounting a new hook
   */
  const __state = new Map<'current', UseWebSocketReturn['state']>([
    ['current', 'closed'],
  ])

  /**
   * The WebSocket connection is closed automatically when all hooks listening to a URL are unmounted.
   */
  return function useWebSocket<
    TParsedMessage = TDefaultParsedMessage,
    TSendMessage = TDefaultSendMessage,
    TValidator extends Validator<
      TParsedMessage,
      any
    > = Validator<TParsedMessage>,
  >({
    url,
    protocols,
    parseMessage = defaultParseMessage as any,
    serializeMessage = defaultSerializeMessage as any,
    validate = ((x: any) => x) as any,
    ...listeners
  }: UseWebSocketOptions<
    TParsedMessage,
    TSendMessage,
    TValidator
  >): UseWebSocketReturn<TSendMessage> {
    const instanceRef = React.useRef<SocketInstance | null>(null)
    const instanceOptions = useStableOptions({ url, protocols })
    const [state, setState] = React.useState<UseWebSocketReturn['state']>(
      () => __state.get('current')!,
    )

    const onClose = useEventHandler(listeners.onClose)
    const onError = useEventHandler(listeners.onError)
    const onOpen = useEventHandler(listeners.onOpen)
    const onMessage = useEventHandler(async (event: MessageEvent<unknown>) => {
      if (!listeners.onMessage) return
      const parsed = await parseMessage(event)
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (parsed === null || parsed === undefined) return
      const message = await validateAsync(validate, parsed as any)
      if (message === null || message === undefined) return
      listeners.onMessage(message, event)
    })

    // `useEventHandler` is ok since `send` should never be called during render
    const send = useEventHandler((message: TSendMessage) => {
      instanceRef.current?.send(serializeMessage(message))
    })

    React.useEffect(() => {
      if (!instanceOptions.url) return
      const instance = getSocketInstance({
        url: instanceOptions.url,
        protocols: instanceOptions.protocols,
        ping,
        reconnect,
      })
      if (binaryType && instance['~socket']) {
        instance['~socket'].binaryType = binaryType
      }
      instanceRef.current = instance
      const cleanup = instance.listen({
        onClose,
        onOpen,
        onError,
        onMessage,
        onStateChange(state) {
          __state.set('current', state)
          setState(state)
        },
      })
      return () => {
        cleanup()
        instanceRef.current = null
      }
    }, [instanceOptions, onClose, onError, onOpen, onMessage])

    return {
      state: !useIsHydrated() || !instanceOptions.url ? 'closed' : state,
      send,
      /** @private */
      ['~socket']: () => instanceRef.current?.['~socket'] ?? null,
    }
  }
}

/**
 * new URL("...") is properly transformed to string
 */
function useStableOptions(
  options: Pick<UseWebSocketOptions<any, any, any>, 'url' | 'protocols'>,
) {
  const [stableOptions, setStableOptions] = React.useState(options)
  if (JSON.stringify(options) !== JSON.stringify(stableOptions)) {
    setStableOptions(options)
  }
  return stableOptions
}
