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

export type DefineWebSocketOptions<TDefaultParsedMessage, TDefaultSendMessage> =
  {
    reconnect?: WebSocketReconnectOption
    ping?: WebSocketPingOption
    binaryType?: BinaryType
    parseMessage?: (
      event: MessageEvent<unknown>,
    ) => MaybePromise<TDefaultParsedMessage>
    serializeMessage?: (data: TDefaultSendMessage) => SendableMessage
  }

export type UseWebSocketOptions<
  TParsedMessage,
  TSendMessage,
  TValidator extends Validator<TParsedMessage, any>,
> = {
  url: string | URL | Falsy
  protocols?: string | string[]
  validate?: TValidator
  parseMessage?: (event: MessageEvent<unknown>) => MaybePromise<TParsedMessage>
  serializeMessage?: (message: TSendMessage) => SendableMessage
  onMessage?: (
    message: Exclude<ValidatorOutput<TValidator>, undefined | null>,
    event: MessageEvent<unknown>,
  ) => void
  onOpen?: (event: Event) => void
  onClose?: (event: CloseEvent) => void
  onError?: (event: Event) => void
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
    onClose,
    onError,
    onMessage,
    onOpen,
  }: UseWebSocketOptions<TParsedMessage, TSendMessage, TValidator>) {
    const instanceRef = React.useRef<SocketInstance | null>(null)
    const instanceOptions = useStableOptions({ url, protocols })

    const handleClose = useEventHandler(onClose)
    const handleError = useEventHandler(onError)
    const handleOpen = useEventHandler(onOpen)
    const handleMessage = useEventHandler(
      async (event: MessageEvent<unknown>) => {
        if (!onMessage) return
        const parsed = await parseMessage(event)
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (parsed === null || parsed === undefined) return
        const message = await validateAsync(validate, parsed as any)
        if (message === null || message === undefined) return
        onMessage(message, event)
      },
    )

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
        onClose: handleClose,
        onOpen: handleOpen,
        onError: handleError,
        onMessage: handleMessage,
      })
      return () => {
        cleanup()
        instanceRef.current = null
      }
    }, [instanceOptions, handleClose, handleError, handleOpen, handleMessage])

    return {
      send,
      /**
       * DO NOT USE
       */
      get ['~socket']() {
        return instanceRef.current?.['~socket'] ?? null
      },
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
