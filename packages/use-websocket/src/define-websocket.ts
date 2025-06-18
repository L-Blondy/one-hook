import React from 'react'
import {
  type WebSocketReconnectOption,
  type WebSocketPingOption,
  getSocketInstance,
  type SocketInstance,
} from './vanilla'
import { getInstanceId } from './utils'
import { useLatestRef } from '@1hook/use-latest-ref'

export type DefineWebSocketOptions = {
  reconnect?: WebSocketReconnectOption
  ping?: WebSocketPingOption
  parseMessage?: (data: unknown) => unknown
  serializeMessage?: (data: unknown) => Parameters<WebSocket['send']>[0]
}

export type UseWebSocketOptions = {
  url: string
  protocols?: string | string[]
}

export function defineWebSocket({ reconnect, ping }: DefineWebSocketOptions) {
  return function useWebSocket(options: UseWebSocketOptions) {
    const instanceId = getInstanceId(options)
    const optionsRef = useLatestRef(options)
    const [socket] = React.useState<SocketInstance | null>(null)

    React.useEffect(() => {
      const { url, protocols } = optionsRef.current
      if (!url) return
      const socket = getSocketInstance({
        url,
        protocols,
        reconnect,
        ping,
      })
      const offOpen = socket.on('open', (e) => {})

      return () => {
        offOpen()
      }
    }, [instanceId, optionsRef])
  }
}
