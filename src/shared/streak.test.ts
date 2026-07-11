import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applySolve } from './streak.js';

const DAY1 = '2026-07-10';
const DAY2 = '2026-07-11';
const DAY3 = '2026-07-12';

void test('first-ever solve starts a streak of 1 and sets bestTime + lastTimeMs', () => {
  const { record, isNewBest } = applySolve(undefined, DAY1, '2026-07-09', 2400);
  assert.deepEqual(record, { lastSolvedDate: DAY1, streak: 1, bestTimeMs: 2400, lastTimeMs: 2400 });
  assert.equal(isNewBest, true);
});

void test('solved yesterday and today -> streak increments', () => {
  const existing = { lastSolvedDate: DAY1, streak: 5, bestTimeMs: 1800, lastTimeMs: 1800 };
  const { record } = applySolve(existing, DAY2, DAY1, 2400);
  assert.equal(record.streak, 6);
  assert.equal(record.lastSolvedDate, DAY2);
  assert.equal(record.lastTimeMs, 2400);
});

void test('solved today but missed yesterday -> streak resets to 1', () => {
  // last played DAY1, now it's DAY3 (yesterday would be DAY2, which was missed)
  const existing = { lastSolvedDate: DAY1, streak: 5, bestTimeMs: 1800, lastTimeMs: 1800 };
  const { record } = applySolve(existing, DAY3, DAY2, 2400);
  assert.equal(record.streak, 1);
  assert.equal(record.lastSolvedDate, DAY3);
});

void test('re-solving the same day again does not double-increment the streak', () => {
  const existing = { lastSolvedDate: DAY2, streak: 6, bestTimeMs: 1800, lastTimeMs: 1800 };
  const { record } = applySolve(existing, DAY2, DAY1, 2400);
  assert.equal(record.streak, 6); // unchanged, not 7
});

void test('re-solving the same day updates lastTimeMs to the latest attempt', () => {
  const existing = { lastSolvedDate: DAY2, streak: 6, bestTimeMs: 1800, lastTimeMs: 1800 };
  const { record } = applySolve(existing, DAY2, DAY1, 3100);
  assert.equal(record.lastTimeMs, 3100);
});

void test('a faster time than the existing best is recorded as a new best', () => {
  const existing = { lastSolvedDate: DAY1, streak: 3, bestTimeMs: 2000, lastTimeMs: 2000 };
  const { record, isNewBest } = applySolve(existing, DAY2, DAY1, 1500);
  assert.equal(isNewBest, true);
  assert.equal(record.bestTimeMs, 1500);
});

void test('a slower time than the existing best does not overwrite bestTime, but lastTimeMs still updates', () => {
  const existing = { lastSolvedDate: DAY1, streak: 3, bestTimeMs: 1200, lastTimeMs: 1200 };
  const { record, isNewBest } = applySolve(existing, DAY2, DAY1, 3000);
  assert.equal(isNewBest, false);
  assert.equal(record.bestTimeMs, 1200);
  assert.equal(record.lastTimeMs, 3000);
});

void test('a tied time is not treated as a new best (strictly less-than)', () => {
  const existing = { lastSolvedDate: DAY1, streak: 3, bestTimeMs: 2000, lastTimeMs: 2000 };
  const { isNewBest } = applySolve(existing, DAY2, DAY1, 2000);
  assert.equal(isNewBest, false);
});
