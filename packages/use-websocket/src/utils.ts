import type { SocketInstanceOptions } from './instance'

export type InstanceId = string & { instanceId: true }

export function getInstanceId(options: SocketInstanceOptions): InstanceId {
  return JSON.stringify({
    url: options.url,
    protocols: options.protocols,
  }) as InstanceId
}
