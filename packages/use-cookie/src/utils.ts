export function toUTCString(expires: number | Date) {
  return (
    typeof expires === 'number'
      ? new Date(Date.now() + expires * 864e5) // 864e5 are the ms of one day
      : expires
  ).toUTCString()
}
