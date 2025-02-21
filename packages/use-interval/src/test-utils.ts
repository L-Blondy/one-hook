import { clear, intervalMap } from './vanilla'

export function resetIntervalSync() {
  intervalMap.forEach(({ interval }) => clear(interval))
  intervalMap.clear()
}
