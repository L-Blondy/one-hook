export function cn(
  ...classNames: Array<string | false | null | undefined | 0>
) {
  return classNames.filter(Boolean).join(' ')
}
