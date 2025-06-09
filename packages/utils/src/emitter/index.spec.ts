import { expect, expectTypeOf, test } from 'vitest'
import { createEmitter } from '.'
import { noop } from 'src/noop'

test('type inferrence', () => {
  const emitter = createEmitter<'x'>()
  emitter.on((message) => {
    expectTypeOf(message).toEqualTypeOf<'x'>()
  })
  emitter.emit('x')
  // @ts-expect-error
  emitter.emit('y')
})

test('Emit / receive', () => {
  const emitter = createEmitter<string>()
  let messages = ''
  emitter.on((message) => {
    messages += message
  })
  emitter.emit('x')
  emitter.emit('y')
  expect(messages).toBe('xy')
})

test('Should remove listeners properly', () => {
  const emitter = createEmitter<string>()
  // all listeners have the same ref
  const remove_1 = emitter.on(noop)
  const remove_2 = emitter.on(noop)
  const remove_3 = emitter.on(noop)
  // listeners should be removed 1 by one, even if they have the same ref
  expect(emitter.__l.size).toBe(3)
  remove_1()
  expect(emitter.__l.size).toBe(2)
  remove_2()
  expect(emitter.__l.size).toBe(1)
  remove_3()
  expect(emitter.__l.size).toBe(0)
  // Extra remove should produce no error
  remove_3()
  expect(emitter.__l.size).toBe(0)
})
