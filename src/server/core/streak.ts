import { redis } from '@devvit/web/server';
import { getDailySeed } from '../../shared/puzzle';
import { applySolve, type StreakRecord } from '../../shared/streak';
import type { SolveResponse, StatusResponse } from '../../shared/api';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Reddit's Devvit Rules recommend auto-expiring stored user data within 30
// days of inactivity (see "Setting Up Auto-Deletion" in the Devvit Rules).
// This is refreshed on every solve, so it's a rolling 30-day inactivity
// window, not a fixed expiry from account creation.
const RETENTION_SECONDS = 30 * 24 * 60 * 60;

function redisKey(username: string): string {
  return `oddity:streak:${username}`;
}

// hGetAll returns {} (not null/undefined) for a key that doesn't exist yet,
// so an empty object means "this user has never solved before".
function parseRecord(hash: Record<string, string>): StreakRecord | undefined {
  if (Object.keys(hash).length === 0) return undefined;
  return {
    lastSolvedDate: hash.lastSolvedDate ?? '',
    streak: Number(hash.streak ?? 0),
    bestTimeMs: Number(hash.bestTimeMs ?? 0),
    lastTimeMs: Number(hash.lastTimeMs ?? 0),
  };
}

// Tells the client whether this user has already solved today's puzzle, so
// it can skip straight to the result screen instead of letting them replay.
// `now` is always the *server's* clock — the client can't spoof its date.
export async function getStatus(username: string, now: Date = new Date()): Promise<StatusResponse> {
  const today = getDailySeed(now);
  const existing = parseRecord(await redis.hGetAll(redisKey(username)));

  if (existing?.lastSolvedDate === today) {
    return {
      type: 'status',
      alreadySolvedToday: true,
      streak: existing.streak,
      bestTimeMs: existing.bestTimeMs,
      lastTimeMs: existing.lastTimeMs,
    };
  }

  return { type: 'status', alreadySolvedToday: false, streak: 0, bestTimeMs: 0, lastTimeMs: 0 };
}

// Reads the user's current streak record, applies today's solve using the
// pure rules in shared/streak.ts, writes the result back, and returns it.
export async function recordSolve(
  username: string,
  timeMs: number,
  now: Date = new Date()
): Promise<Omit<SolveResponse, 'type'>> {
  const key = redisKey(username);
  const today = getDailySeed(now);
  const yesterday = getDailySeed(new Date(now.getTime() - ONE_DAY_MS));

  const existingHash = await redis.hGetAll(key);
  const existing = parseRecord(existingHash);

  const { record, isNewBest } = applySolve(existing, today, yesterday, timeMs);

  await redis.hSet(key, {
    lastSolvedDate: record.lastSolvedDate,
    streak: String(record.streak),
    bestTimeMs: String(record.bestTimeMs),
    lastTimeMs: String(record.lastTimeMs),
  });
  await redis.expire(key, RETENTION_SECONDS);

  return { streak: record.streak, bestTimeMs: record.bestTimeMs, isNewBest };
}
