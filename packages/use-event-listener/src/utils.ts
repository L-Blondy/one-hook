import { getElementUid } from '@rebase.io/utils/get-element-uid'
import type {
  UseEventListenerTarget,
  UseEventListenerType,
  UseEventListenerOptions,
} from './types'

export type InstanceId = string & { instanceId: true }

export function getInstanceId(
  target: UseEventListenerTarget,
  type: UseEventListenerType<any>,
  options: UseEventListenerOptions,
): InstanceId {
  return JSON.stringify({
    ...options,
    type,
    target: getElementUid(target),
  }) as InstanceId
}
