import { getElementUid } from '@1hook/utils/get-element-uid'
import type { UseIntersectionObserverOptions } from '.'

export type InstanceId = string & { instanceId: true }

export function getInstanceId(
  options: UseIntersectionObserverOptions,
): InstanceId {
  return JSON.stringify({
    ...options,
    root: getElementUid(options.root),
  }) as InstanceId
}
