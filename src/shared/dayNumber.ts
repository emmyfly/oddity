// The date puzzle #1 was seeded — everything is numbered relative to this.
// Update this constant if/when the game gets an official public launch date.
const EPOCH_UTC_MS = Date.UTC(2026, 6, 10); // 2026-07-10

// Sequential puzzle number, Wordle-style ("Oddity #12"). Pure function of the
// UTC calendar date, so client and server always agree without a round trip.
export function getDayNumber(date: Date = new Date()): number {
  const todayUtcMidnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.round((todayUtcMidnight - EPOCH_UTC_MS) / 86_400_000) + 1;
}
