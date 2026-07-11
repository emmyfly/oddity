import { getDayNumber } from './dayNumber.js';

// Formats milliseconds as e.g. "2.4s". No rounding surprises: always 1 decimal place.
export function formatSeconds(timeMs: number): string {
  return `${(timeMs / 1000).toFixed(1)}s`;
}

// Wordle-style spoiler-free share text — no grid, no shape/color/rotation info.
export function buildShareText(date: Date, timeMs: number, streak: number): string {
  const dayNumber = getDayNumber(date);
  return `Oddity #${dayNumber} — ${formatSeconds(timeMs)} ⏱️ Streak: ${streak} 🔥`;
}
