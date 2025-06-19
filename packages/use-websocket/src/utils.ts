import type { SocketInstanceOptions } from './vanilla'

export type InstanceId = string & { instanceId: true }

export function getInstanceId(
  options: SocketInstanceOptions<any, any, any>,
): InstanceId {
  return JSON.stringify({
    url: options.url,
    protocols: options.protocols,
  }) as InstanceId
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
