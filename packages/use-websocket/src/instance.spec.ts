import { afterAll, afterEach, beforeAll, expect, test } from 'vitest'
import { setupServer } from 'msw/node'
import { ws } from 'msw'
import { createSocketInstance } from './instance'

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
afterEach(() => server.resetHandlers())

test('Should receive messages', async () => {
  const socket = createSocketInstance({ url: 'wss://socket.test.domain' })
  socket.connect()

  const data = await new Promise((resolve) => {
    socket.on('open', () => {
      socket.socket?.send('message data')
    })

    socket.on('message', (event) => {
      resolve(event.data)
    })
  })
  expect(data).toBe('message data')
  socket.kill()
})

test('Should ping at interval { leading: false }', async () => {
  const socket = createSocketInstance({
    url: 'wss://socket.test.domain',
    ping: {
      interval: 100,
      leading: false,
    },
  })
  socket.connect()

  const start = Date.now()
  const data = await new Promise((resolve) => {
    socket.on('message', (event) => {
      resolve(event.data)
    })
  })
  expect(data).toBe('pong')
  expect(Date.now() - start).toBeGreaterThanOrEqual(100)
  expect(Date.now() - start).toBeLessThan(150)
  socket.kill()
})

test('Should ping immediately { leading: true }', async () => {
  const socket = createSocketInstance({
    url: 'wss://socket.test.domain',
    ping: {
      interval: 100,
      leading: true,
    },
  })
  socket.connect()

  const start = Date.now()
  const data = await new Promise((resolve) => {
    socket.on('message', (event) => {
      resolve(event.data)
    })
  })
  expect(data).toBe('pong')
  expect(Date.now() - start).toBeLessThan(50)
  socket.kill()
})

test('Should ping a custom message { message: "custom" }', async () => {
  const socket = createSocketInstance({
    url: 'wss://socket.test.domain',
    ping: {
      interval: 100,
      message: 'custom',
      leading: true,
    },
  })
  socket.connect()

  const data = await new Promise((resolve) => {
    socket.on('message', (event) => {
      resolve(event.data)
    })
  })
  expect(data).toBe('custom')
  socket.kill()
})

test('Should try to reconnect', async () => {
  const socket = createSocketInstance({
    url: 'wss://notfound.test.com',
    reconnect: {
      delay: 1,
    },
  })
  socket.connect()

  const data = await new Promise((resolve) => {
    let attempt = -1
    socket.on('open', () => {
      attempt++
      socket.close()
      if (attempt === 3) {
        resolve(attempt)
      }
    })
  })
  expect(data).toBe(3)
})

test('Should try to reconnect at interval { delay: 100 }', async () => {
  const socket = createSocketInstance({
    url: 'wss://notfound.test.com',
    reconnect: {
      delay: 100,
    },
  })
  socket.connect()
  const start = Date.now()
  const data = await new Promise((resolve) => {
    let attempt = -1
    socket.on('open', () => {
      attempt++
      socket.close()
      if (attempt === 3) {
        resolve(attempt)
      }
    })
  })
  expect(data).toBe(3)
  expect(Date.now() - start).toBeGreaterThanOrEqual(300)
  expect(Date.now() - start).toBeLessThan(350)
})
