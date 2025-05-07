/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 */
export function getRandomIntInclusive(min: number, max: number): number {
  const lower: number = Math.ceil(min)
  const upper: number = Math.floor(max)
  return Math.floor(Math.random() * (upper - lower + 1)) + lower
}
