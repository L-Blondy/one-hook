import type { SocketInstanceOptions } from './vanilla'

export type InstanceId = string & { instanceId: true }

export type SendableMessage = Parameters<WebSocket['send']>[0]

export function getInstanceId(options: SocketInstanceOptions): InstanceId {
  return JSON.stringify({
    url: options.url,
    protocols: options.protocols,
  }) as InstanceId
}

function safeJsonParse(data: unknown): unknown {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data)
    } catch (_) {
      // silent
    }
  }
  return data
}

export const fallbackParseMessage = (e: MessageEvent<unknown>) =>
  safeJsonParse(e.data) as any

export function fallbackSerializeMessage(data: unknown): string {
  if (typeof data === 'string') return data
  return JSON.stringify(data)
}
