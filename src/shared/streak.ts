export type StreakRecord = {
  lastSolvedDate: string; // UTC "YYYY-MM-DD", same format as getDailySeed
  streak: number;
  bestTimeMs: number;
  lastTimeMs: number; // time taken on lastSolvedDate specifically (for replay/reopen views)
};

export type ApplySolveResult = {
  record: StreakRecord;
  isNewBest: boolean;
};

// Pure streak decision logic, no Redis involved — this is what actually
// implements the rules from the spec:
//   - solved yesterday AND today -> streak++
//   - solved today but missed yesterday (or never played) -> streak resets to 1
//   - re-solving the same day again doesn't double-count the streak
export function applySolve(
  existing: StreakRecord | undefined,
  today: string,
  yesterday: string,
  timeMs: number
): ApplySolveResult {
  let streak: number;
  if (existing?.lastSolvedDate === today) {
    streak = existing.streak; // already solved today; don't re-increment on replay
  } else if (existing?.lastSolvedDate === yesterday) {
    streak = existing.streak + 1;
  } else {
    streak = 1;
  }

  const isNewBest = existing === undefined || timeMs < existing.bestTimeMs;
  const bestTimeMs = isNewBest ? timeMs : existing.bestTimeMs;

  return {
    record: { lastSolvedDate: today, streak, bestTimeMs, lastTimeMs: timeMs },
    isNewBest,
  };
}
