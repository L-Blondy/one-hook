/**
 * https://crustack.vercel.app/utils/to-px/
 */
export function px(input: number | string): string
export function px(input: undefined): undefined
export function px(input: string | number | undefined): string | undefined
export function px(input: string | number | undefined): string | undefined {
  return typeof input === 'number' ? `${input}px` : input
}
