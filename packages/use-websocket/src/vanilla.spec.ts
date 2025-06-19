import {
  afterAll,
  afterEach,
  beforeAll,
  expect,
  expectTypeOf,
  test,
} from 'vitest'
import { setupServer } from 'msw/node'
import { ws } from 'msw'
import { getSocketInstance, instanceMap } from './vanilla'
import { noop } from '@1hook/utils/noop'
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
  function incomingMessageType() {
    getSocketInstance({
      url: 'wss://socket.test.domain',
    }).listen({
      onMessage(data, event) {
        expectTypeOf(data).toEqualTypeOf<unknown>()
        expectTypeOf(event).toEqualTypeOf<MessageEvent<unknown>>()
      },
      onOpen: noop,
      onClose: noop,
      onError: noop,
    })

    getSocketInstance({
      url: 'wss://socket.test.domain',
      incomingMessage: {
        parse: (data) => String(data),
      },
    }).listen({
      onMessage(data, event) {
        expectTypeOf(data).toEqualTypeOf<string>()
        expectTypeOf(event).toEqualTypeOf<MessageEvent<unknown>>()
      },
      onOpen: noop,
      onClose: noop,
      onError: noop,
    })

    getSocketInstance({
      url: 'wss://socket.test.domain',
      incomingMessage: {
        parse: (data) => String(data),
        // @ts-expect-error Input string expected number
        validate: z.number(),
      },
    }).listen({
      onMessage(data, event) {
        expectTypeOf(data).toEqualTypeOf<number>()
        expectTypeOf(event).toEqualTypeOf<MessageEvent<unknown>>()
      },
      onOpen: noop,
      onClose: noop,
      onError: noop,
    })

    getSocketInstance({
      url: 'wss://socket.test.domain',
      incomingMessage: {
        validate: z.number(),
      },
    }).listen({
      onMessage(data, event) {
        expectTypeOf(data).toEqualTypeOf<number>()
        expectTypeOf(event).toEqualTypeOf<MessageEvent<unknown>>()
      },
      onOpen: noop,
      onClose: noop,
      onError: noop,
    })

    getSocketInstance({
      url: 'wss://socket.test.domain',
      incomingMessage: {
        validate: Number,
      },
    }).listen({
      onMessage(data, event) {
        expectTypeOf(data).toEqualTypeOf<number>()
        expectTypeOf(event).toEqualTypeOf<MessageEvent<unknown>>()
      },
      onOpen: noop,
      onClose: noop,
      onError: noop,
    })
  }

  function outgoingMessageType() {
    getSocketInstance({
      url: 'wss://socket.test.domain',
    }).send('message data' as unknown) // unknown ok

    getSocketInstance({
      url: 'wss://socket.test.domain',
      outgoingMessage: {
        serialize: (data: boolean) => String(data),
      },
    })
      // @ts-expect-error expect boolean receive unknown
      .send('message data' as unknown)

    getSocketInstance({
      url: 'wss://socket.test.domain',
      outgoingMessage: {
        serialize: (data: boolean) => String(data),
      },
    }).send(true)
  }

  noop(incomingMessageType, outgoingMessageType)
})

test('Should receive messages', async () => {
  const socket = getSocketInstance({ url: 'wss://socket.test.domain' })

  const data = await new Promise((resolve) => {
    socket.listen({
      onOpen() {
        socket.send('message data')
      },
      onMessage(data) {
        resolve(data)
      },
      onClose: noop,
      onError: noop,
    })
  })
  expect(data).toBe('message data')
})

test('Should ping at interval { leading: false }', async () => {
  const socket = getSocketInstance({
    url: 'wss://socket.test.domain',
    ping: {
      interval: 100,
      leading: false,
    },
  })

  const start = Date.now()
  const data = await new Promise((resolve) => {
    socket.listen({
      onMessage(data) {
        resolve(data)
      },
      onOpen: noop,
      onClose: noop,
      onError: noop,
    })
  })
  expect(data).toBe('pong')
  expect(Date.now() - start).toBeGreaterThanOrEqual(100)
  expect(Date.now() - start).toBeLessThan(200)
})

test('Should ping immediately { leading: true }', async () => {
  const socket = getSocketInstance({
    url: 'wss://socket.test.domain',
    ping: {
      interval: 100,
      leading: true,
    },
  })

  const start = Date.now()
  const data = await new Promise((resolve) => {
    socket.listen({
      onMessage(data) {
        resolve(data)
      },
      onOpen: noop,
      onClose: noop,
      onError: noop,
    })
  })
  expect(data).toBe('pong')
  expect(Date.now() - start).toBeLessThan(50)
})

test('Should ping a custom message { message: "custom" }', async () => {
  const socket = getSocketInstance({
    url: 'wss://socket.test.domain',
    ping: {
      interval: 100,
      message: 'custom',
      leading: true,
    },
  })

  const data = await new Promise((resolve) => {
    socket.listen({
      onMessage(data) {
        resolve(data)
      },
      onOpen: noop,
      onClose: noop,
      onError: noop,
    })
  })
  expect(data).toBe('custom')
})

test('Should try to reconnect', async () => {
  const socket = getSocketInstance({
    url: 'wss://notfound.test.com',
    reconnect: {
      delay: 1,
    },
  })

  const data = await new Promise((resolve) => {
    let attempt = -1
    socket.listen({
      onOpen() {
        attempt++
        socket['~socket']?.close()
        if (attempt === 3) {
          resolve(attempt)
        }
      },
      onMessage: noop,
      onClose: noop,
      onError: noop,
    })
  })
  expect(data).toBe(3)
})

test('Should try to reconnect at interval { delay: 100 }', async () => {
  const socket = getSocketInstance({
    url: 'wss://notfound.test.com',
    reconnect: {
      delay: 100,
    },
  })
  const start = Date.now()
  const data = await new Promise((resolve) => {
    let attempt = -1
    socket.listen({
      onOpen() {
        attempt++
        socket['~socket']?.close()
        if (attempt === 3) {
          resolve(attempt)
        }
      },
      onMessage: noop,
      onClose: noop,
      onError: noop,
    })
  })
  expect(data).toBe(3)
  expect(Date.now() - start).toBeGreaterThanOrEqual(300)
  expect(Date.now() - start).toBeLessThan(400)
})

test('Should reuse the same instance given a url & protocols', () => {
  const socket1 = getSocketInstance({
    url: 'wss://notfound.test.com',
    protocols: ['test'],
  })
  const socket2 = getSocketInstance({
    url: 'wss://notfound.test.com',
    protocols: ['test'],
  })
  socket1.listen({
    onOpen: noop,
    onMessage: noop,
    onClose: noop,
    onError: noop,
  })
  socket2.listen({
    onOpen: noop,
    onMessage: noop,
    onClose: noop,
    onError: noop,
  })
  expect(socket1.id).toBe(socket2.id)
  expect(instanceMap.size).toBe(1)
})
