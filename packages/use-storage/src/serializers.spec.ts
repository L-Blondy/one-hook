import { expect, test } from 'vitest'
import { defaultDeserializer, defaultSerializer } from './serializers'

test('serialize', () => {
  expect(defaultSerializer({ a: 1 })).toEqual('{"$v":{"a":1}}')
  expect(defaultSerializer('test')).toEqual('test')
  expect(defaultSerializer(null)).toEqual('{"$v":null}')
  expect(defaultSerializer(undefined)).toEqual('{}')
})

test('deserialize', () => {
  expect(defaultDeserializer('{"$v":{"a":1}}')).toEqual({ a: 1 })
  expect(defaultDeserializer('test')).toEqual('test')
  expect(defaultDeserializer('{"$v":null}')).toEqual(null)
  expect(defaultDeserializer('{}')).toEqual(undefined)
})
