import { noop } from '@1hook/utils/noop'
import { ws } from 'msw'
import { setupServer } from 'msw/node'
import {
  afterAll,
  afterEach,
  beforeAll,
  expect,
  expectTypeOf,
  test,
  vi,
} from 'vitest'
import { instanceMap } from './vanilla'
import { defineWebSocket } from './define-websocket'
import { z } from 'zod'
import { renderHook, waitFor } from '@testing-library/react'

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
    // default message is unknown
    defineWebSocket()({
      url: 'wss://socket.test.domain',
      onMessage(data, event) {
        expectTypeOf(data).toEqualTypeOf<unknown>()
        expectTypeOf(event).toEqualTypeOf<MessageEvent<unknown>>()
      },
    })

    // default parse
    defineWebSocket({
      parseMessage: (data) => String(data),
    })({
      url: 'wss://socket.test.domain',
      onMessage(data, event) {
        expectTypeOf(data).toEqualTypeOf<string>()
        expectTypeOf(event).toEqualTypeOf<MessageEvent<unknown>>()
      },
    })

    // default parse async
    defineWebSocket({
      parseMessage: (data) => Promise.resolve(String(data)),
    })({
      url: 'wss://socket.test.domain',
      onMessage(data, event) {
        expectTypeOf(data).toEqualTypeOf<string>()
        expectTypeOf(event).toEqualTypeOf<MessageEvent<unknown>>()
      },
    })

    // parse
    defineWebSocket({
      parseMessage: (data) => Number(data),
    })({
      url: 'wss://socket.test.domain',
      parseMessage: (data) => String(data),
      onMessage(data, event) {
        expectTypeOf(data).toEqualTypeOf<string>()
        expectTypeOf(event).toEqualTypeOf<MessageEvent<unknown>>()
      },
    })

    // parse async
    defineWebSocket({
      parseMessage: (data) => Promise.resolve(Number(data)),
    })({
      url: 'wss://socket.test.domain',
      parseMessage: (data) => Promise.resolve(String(data)),
      onMessage(data, event) {
        expectTypeOf(data).toEqualTypeOf<string>()
        expectTypeOf(event).toEqualTypeOf<MessageEvent<unknown>>()
      },
    })

    // validate schema async
    defineWebSocket({
      parseMessage: (data) => String(data),
    })({
      url: 'wss://socket.test.domain',
      validate: z.string().transform((v) => Promise.resolve(Number(v))),
      onMessage(data, event) {
        expectTypeOf(data).toEqualTypeOf<number>()
        expectTypeOf(event).toEqualTypeOf<MessageEvent<unknown>>()
      },
    })

    // validate function async
    defineWebSocket({
      parseMessage: (data) => String(data),
    })({
      url: 'wss://socket.test.domain',
      validate: (v) => Promise.resolve(Number(v)),
      onMessage(data, event) {
        expectTypeOf(data).toEqualTypeOf<number>()
        expectTypeOf(event).toEqualTypeOf<MessageEvent<unknown>>()
      },
    })

    // message should be non-nullable
    // validate function async
    defineWebSocket({})({
      url: 'wss://socket.test.domain',
      validate: z.string().nullish(),
      onMessage(data, event) {
        expectTypeOf(data).toEqualTypeOf<string>()
        expectTypeOf(event).toEqualTypeOf<MessageEvent<unknown>>()
      },
    })
  }

  function useOutgoingMessageType() {
    // should allow unknown by default
    defineWebSocket()({
      url: 'wss://socket.test.domain',
    }).send('message data' as unknown) // unknown ok

    // default type 1
    defineWebSocket({
      serializeMessage: (data: boolean) => String(data),
    })({
      url: 'wss://socket.test.domain',
    })
      // @ts-expect-error
      .send('message data' as string)

    // default type 2
    defineWebSocket({
      serializeMessage: (data: boolean) => String(data),
    })({
      url: 'wss://socket.test.domain',
    }).send(true)

    // hook type 1
    defineWebSocket({
      serializeMessage: (data: boolean) => String(data),
    })({
      serializeMessage: (data: number) => String(data),
      url: 'wss://socket.test.domain',
    })
      // @ts-expect-error
      .send('message data' as string)

    // hook type 2
    defineWebSocket({
      serializeMessage: (data: boolean) => String(data),
    })({
      serializeMessage: (data: number) => String(data),
      url: 'wss://socket.test.domain',
    }).send(1)
  }

  noop(useIncomingMessageType, useOutgoingMessageType)
})

test('Should queue messages while connecting', async () => {
  const useWebSocket = defineWebSocket()
  const spy = vi.fn()

  await new Promise<void>((resolve) => {
    const hook = renderHook(() =>
      useWebSocket({
        url: 'wss://socket.test.domain',
        onMessage(message) {
          spy(message)
          resolve()
        },
      }),
    )
    hook.result.current.send('message 1')
    hook.result.current.send('message 2')
    hook.result.current.send('message 3')
  })

  expect(spy).toHaveBeenNthCalledWith(1, 'message 1')
  expect(spy).toHaveBeenNthCalledWith(2, 'message 2')
  expect(spy).toHaveBeenNthCalledWith(3, 'message 3')
})

test('Should ping at interval { leading: false }', async () => {
  const useWebSocket = defineWebSocket({
    ping: {
      interval: 100,
      leading: false,
    },
  })
  const startDate = Date.now()

  const message = await new Promise((resolve) => {
    renderHook(() =>
      useWebSocket({
        url: 'wss://socket.test.domain',
        onMessage(message) {
          resolve(message)
        },
      }),
    )
  })

  expect(message).toBe('pong')
  expect(Date.now() - startDate).toBeGreaterThanOrEqual(100)
  expect(Date.now() - startDate).toBeLessThan(200)
})

test('Should ping immediately { leading: true }', async () => {
  const useWebSocket = defineWebSocket({
    ping: {
      interval: 100,
      leading: true,
    },
  })
  const startDate = Date.now()

  const message = await new Promise((resolve) => {
    renderHook(() =>
      useWebSocket({
        url: 'wss://socket.test.domain',
        onMessage(message) {
          resolve(message)
        },
      }),
    )
  })

  expect(message).toBe('pong')
  expect(Date.now() - startDate).toBeLessThan(50)
})

test('Should ping a custom message { message: "custom" }', async () => {
  const useWebSocket = defineWebSocket({
    ping: {
      interval: 100,
      leading: true,
      message: 'custom',
    },
  })

  const message = await new Promise((resolve) => {
    renderHook(() =>
      useWebSocket({
        url: 'wss://socket.test.domain',
        onMessage(message) {
          resolve(message)
        },
      }),
    )
  })

  expect(message).toBe('custom')
})

test('Should try to reconnect', async () => {
  const useWebSocket = defineWebSocket({
    reconnect: { delay: 1 },
  })

  let attempt = -1

  renderHook(() => {
    const socket = useWebSocket({
      url: 'wss://notfound.test.com',
      onOpen() {
        attempt++
        socket.__socket()?.close()
      },
    })
  })

  await waitFor(() => expect(attempt).toBeGreaterThanOrEqual(0))
})

test('Should try to reconnect at interval { delay: 100 }', async () => {
  const useWebSocket = defineWebSocket({
    reconnect: { delay: 100 },
  })

  let attempt = -1
  const startDate = Date.now()

  renderHook(() => {
    const socket = useWebSocket({
      url: 'wss://notfound.test.com',
      onOpen() {
        attempt++
        socket.__socket()?.close()
      },
    })
  })

  await waitFor(() => expect(attempt).toBe(3))

  expect(attempt).toBe(3)
  expect(Date.now() - startDate).toBeGreaterThanOrEqual(300)
  expect(Date.now() - startDate).toBeLessThan(400)
})

test('Should reuse the same instance given a url & protocols', async () => {
  const useWebSocket1 = defineWebSocket()
  const useWebSocket2 = defineWebSocket()

  let openCount = 0

  renderHook(() => {
    useWebSocket1({
      url: 'wss://socket.test.domain',
      protocols: ['test'],
      onOpen() {
        ++openCount
      },
    })
    useWebSocket1({
      url: 'wss://socket.test.domain',
      protocols: ['test'],
      onOpen() {
        ++openCount
      },
    })
    useWebSocket2({
      url: 'wss://socket.test.domain',
      protocols: ['test'],
      onOpen() {
        ++openCount
      },
    })
    useWebSocket2({
      url: 'wss://socket.test.domain',
      protocols: ['test'],
      onOpen() {
        ++openCount
      },
    })
  })
  await waitFor(() => expect(openCount).toBe(4))
  expect(instanceMap.size).toBe(1)
})

test('Should transition state from connecting to open', async () => {
  const useWebSocket = defineWebSocket()

  const hook = renderHook(() =>
    useWebSocket({ url: 'wss://socket.test.domain' }),
  )

  expect(hook.result.current.state).toBe('connecting')
  await waitFor(() => expect(hook.result.current.state).toBe('open'))
})

test('Should transition state to closed after socket close', async () => {
  const useWebSocket = defineWebSocket()
  const hook = renderHook((url?: string | null) => useWebSocket({ url }))
  hook.rerender('wss://socket.test.domain')
  await waitFor(() => expect(hook.result.current.state).toBe('open'))
  hook.rerender(null)
  await waitFor(() => expect(hook.result.current.state).toBe('closed'))
})
