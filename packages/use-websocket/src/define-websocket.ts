import React from 'react'
import {
  type WebSocketReconnectOption,
  type WebSocketPingOption,
  getSocketInstance,
  type SocketInstance,
  type WebSocketIncomingMessageOption,
  type WebSocketOutgoingMessageOption,
} from './vanilla'
import { useLatestRef } from '@1hook/use-latest-ref'
import type { StandardSchemaV1 } from '@standard-schema/spec'

export type DefineWebSocketOptions<
  TParsedMessage,
  TSchema extends StandardSchemaV1<TParsedMessage>,
  TOutgoingMessage,
> = {
  reconnect?: WebSocketReconnectOption
  ping?: WebSocketPingOption
  incomingMessage?: WebSocketIncomingMessageOption<TParsedMessage, TSchema>
  outgoingMessage?: WebSocketOutgoingMessageOption<TOutgoingMessage>
}

type Falsy = null | undefined | false | 0 | ''

export type UseWebSocketOptions<TMessage> = {
  url: string | URL | Falsy
  protocols?: string | string[]
  onMessage?: (message: TMessage, event: MessageEvent<unknown>) => void
  onOpen?: (event: Event) => void
  onClose?: (event: CloseEvent) => void
  onError?: (event: Event) => void
}

export function defineWebSocket<
  TParsedMessage = unknown,
  TSchema extends
    StandardSchemaV1<TParsedMessage> = StandardSchemaV1<TParsedMessage>,
  TOutgoingMessage = unknown,
>({
  reconnect,
  ping,
}: DefineWebSocketOptions<TParsedMessage, TSchema, TOutgoingMessage>) {
  type TSocket = SocketInstance<TParsedMessage, TSchema, TOutgoingMessage>
  type TMessage = StandardSchemaV1.InferOutput<TSchema>

  /**
   * The WebSocket connection is closed automatically when all hooks listening to a URL are unmounted.
   */
  return function useWebSocket({
    url,
    protocols,
    ...listeners
  }: UseWebSocketOptions<TMessage>) {
    const instanceOptions = useStableOptions({ url, protocols })
    const listenersRef = useLatestRef(listeners)
    const [socket] = React.useState<TSocket | null>(null)

    React.useEffect(() => {
      if (!instanceOptions.url) return
      const socket = getSocketInstance<any>({
        url: instanceOptions.url,
        protocols: instanceOptions.protocols,
        reconnect,
        ping,
      })
      return socket.listen(listenersRef.current)
    }, [instanceOptions, listenersRef])

    return socket
  }
}

/**
 * new URL("...") is properly transformed to string
 */
function useStableOptions(
  options: Pick<UseWebSocketOptions<any>, 'url' | 'protocols'>,
) {
  const [stableOptions, setStableOptions] = React.useState(options)
  if (JSON.stringify(options) !== JSON.stringify(stableOptions)) {
    setStableOptions(options)
  }
  return stableOptions
}
