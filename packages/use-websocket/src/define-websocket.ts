// import React from 'react'
// import {
//   type WebSocketReconnectOption,
//   type WebSocketPingOption,
//   getSocketInstance,
//   type SocketInstance,
//   type WebSocketIncomingMessageOption,
//   type WebSocketOutgoingMessageOption,
// } from './vanilla'
// import { getInstanceId } from './utils'
// import { useLatestRef } from '@1hook/use-latest-ref'
// import type { StandardSchemaV1 } from '@standard-schema/spec'

// export type DefineWebSocketOptions<
//   TParsedMessage,
//   TSchema extends StandardSchemaV1<TParsedMessage>,
//   TOutgoingMessage,
// > = {
//   reconnect?: WebSocketReconnectOption
//   ping?: WebSocketPingOption
//   incomingMessage?: WebSocketIncomingMessageOption<TParsedMessage, TSchema>
//   outgoingMessage?: WebSocketOutgoingMessageOption<TOutgoingMessage>
// }

// export type UseWebSocketOptions<TMessage> = {
//   url: string
//   protocols?: string | string[]
//   onMessage?: (data: TMessage, event: MessageEvent<unknown>) => void
//   onOpen?: (event: Event) => void
//   onClose?: (event: CloseEvent) => void
//   onError?: (event: Event) => void
// }

// export function defineWebSocket<
//   TParsedMessage = unknown,
//   TSchema extends
//     StandardSchemaV1<TParsedMessage> = StandardSchemaV1<TParsedMessage>,
//   TOutgoingMessage = unknown,
// >({
//   reconnect,
//   ping,
// }: DefineWebSocketOptions<TParsedMessage, TSchema, TOutgoingMessage>) {
//   type TSocket = SocketInstance<TParsedMessage, TSchema, TOutgoingMessage>
//   type TMessage = StandardSchemaV1.InferOutput<TSchema>

//   return function useWebSocket(options: UseWebSocketOptions<TMessage>) {
//     const instanceId = getInstanceId(options)
//     const optionsRef = useLatestRef(options)
//     const [socket] = React.useState<TSocket | null>(null)

//     React.useEffect(() => {
//       const { url, protocols } = optionsRef.current
//       if (!url) return
//       const socket = getSocketInstance({
//         url,
//         protocols,
//         reconnect,
//         ping,
//       })
//       const offOpen = socket.on('open', optionsRef.current.onOpen)
//       const offClose = socket.on('close', optionsRef.current.onClose)
//       const offError = socket.on('error', optionsRef.current.onError)
//       const offMessage = socket.on('message', (m: any, e) => {
//         optionsRef.current.onMessage?.(m, e)
//       })

//       return () => {
//         offOpen()
//         offClose()
//         offError()
//         offMessage()
//         if (!socket.hasListeners) {
//           socket.close()
//         }
//       }
//     }, [instanceId, optionsRef])

//     return socket
//   }
// }

// const useWebSocket = defineWebSocket({
//   incomingMessage: {
//     parse: (data) => String(data),
//   },
//   outgoingMessage: {
//     serialize: (data: boolean) => String(data),
//   },
// })

// function Test() {
//   const socket = useWebSocket({
//     url: 'wss://socket.test.domain',
//     protocols: ['test'],
//     onMessage(data) {
//       console.log(data)
//     },
//   })
//   socket?.send(true)
// }
