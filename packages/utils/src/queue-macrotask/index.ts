/**
 * https://crustack.vercel.app/utils/queue-macrotask/
 */
export function queueMacrotask(fn: () => any) {
  setTimeout(() => fn())
}
