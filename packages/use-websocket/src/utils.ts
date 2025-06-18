import type { SocketInstanceOptions } from './vanilla'
import type { StandardSchemaV1 } from '@standard-schema/spec'
import { SchemaValidationError } from '@1hook/utils/validate'

export type InstanceId = string & { instanceId: true }

export function getInstanceId(
  options: SocketInstanceOptions<any, any, any>,
): InstanceId {
  return JSON.stringify({
    url: options.url,
    protocols: options.protocols,
  }) as InstanceId
}

export async function validate<TSchema extends StandardSchemaV1>(
  schema: TSchema,
  data: StandardSchemaV1.InferInput<TSchema>,
): Promise<StandardSchemaV1.InferOutput<TSchema>> {
  const result = await schema['~standard'].validate(data)
  if (result.issues) throw new SchemaValidationError(result, data)
  return result.value
}

export function safeJsonParse(data: unknown): unknown {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data)
    } catch (_) {
      // silent
    }
  }
  return data
}

export function safeJsonStringify(data: unknown): string {
  if (typeof data === 'string') return data
  return JSON.stringify(data)
}
