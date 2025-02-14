/**
 * https://crustack.vercel.app/utils/timeout/
 */
export async function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(() => resolve(void 0), ms))
}
