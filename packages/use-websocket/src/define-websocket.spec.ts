import { noop } from '@1hook/utils/noop'
import { ws } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, expectTypeOf, test } from 'vitest'
import { instanceMap } from './vanilla'
import { defineWebSocket } from './define-websocket'
import { z } from 'zod'

const api = ws.link('wss://socket.test.domain')

const server = setupServer(
  api.addEventListener('connection', ({ client }) => {
    client.addEventListener('message', (event) => {
      event.preventDefault()
      if (event.data === 'ping') {
        client.send('pong')
      } else {
        client.send(event.data)
      }
    })
  }),
)

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))

// Close server after all tests
afterAll(() => server.close())

// Reset handlers after each test for test isolation
afterEach(() => {
  server.resetHandlers()
  instanceMap.forEach((instance) => instance['~socket']?.close())
  instanceMap.clear()
})

test('type inference', () => {
  function useIncomingMessageType() {
    defineWebSocket()({
      url: 'wss://socket.test.domain',
      onMessage(data, event) {
        expectTypeOf(data).toEqualTypeOf<unknown>()
        expectTypeOf(event).toEqualTypeOf<MessageEvent<unknown>>()
      },
    })

    defineWebSocket({
      incomingMessage: {
        parse: (data) => String(data),
      },
    })({
      url: 'wss://socket.test.domain',
      onMessage(data, event) {
        expectTypeOf(data).toEqualTypeOf<string>()
        expectTypeOf(event).toEqualTypeOf<MessageEvent<unknown>>()
      },
    })

    defineWebSocket({
      incomingMessage: {
        parse: (data) => String(data),
        // @ts-expect-error Input string expected number
        schema: z.number(),
      },
    })({
      url: 'wss://socket.test.domain',
      onMessage(data, event) {
        expectTypeOf(data).toEqualTypeOf<number>()
        expectTypeOf(event).toEqualTypeOf<MessageEvent<unknown>>()
      },
    })

    defineWebSocket({
      incomingMessage: {
        schema: z.number(),
      },
    })({
      url: 'wss://socket.test.domain',
      onMessage(data, event) {
        expectTypeOf(data).toEqualTypeOf<number>()
        expectTypeOf(event).toEqualTypeOf<MessageEvent<unknown>>()
      },
    })
  }

  function useOutgoingMessageType() {
    defineWebSocket()({
      url: 'wss://socket.test.domain',
    }).send('message data' as unknown) // unknown ok

    defineWebSocket({
      outgoingMessage: {
        serialize: (data: boolean) => String(data),
      },
    })({
      url: 'wss://socket.test.domain',
    })
      // @ts-expect-error expect boolean receive unknown
      .send('message data' as unknown)

    defineWebSocket({
      outgoingMessage: {
        serialize: (data: boolean) => String(data),
      },
    })({
      url: 'wss://socket.test.domain',
    }).send(true)
  }

  noop(useIncomingMessageType, useOutgoingMessageType)
})
