import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getDailySeed, generatePuzzle } from './puzzle.js';

void test('getDailySeed uses UTC and pads month/day', () => {
  assert.equal(getDailySeed(new Date('2026-01-05T23:59:00Z')), '2026-01-05');
  assert.equal(getDailySeed(new Date('2026-12-31T00:00:00Z')), '2026-12-31');
});

void test('same date always produces the identical puzzle', () => {
  const a = generatePuzzle(new Date('2026-07-10T08:00:00Z'));
  const b = generatePuzzle(new Date('2026-07-10T23:00:00Z')); // same UTC day, different time
  assert.deepEqual(a, b);
});

void test('different dates produce different puzzles (spot check)', () => {
  const day1 = generatePuzzle(new Date('2026-07-10T12:00:00Z'));
  const day2 = generatePuzzle(new Date('2026-07-11T12:00:00Z'));
  assert.notDeepEqual(day1, day2);
});

void test('oddIndex is always within grid bounds', () => {
  for (let i = 0; i < 30; i++) {
    const date = new Date(Date.UTC(2026, 0, 1 + i));
    const puzzle = generatePuzzle(date, 5);
    assert.ok(puzzle.oddIndex >= 0 && puzzle.oddIndex < 25);
  }
});

void test('odd tile differs from base in exactly one attribute', () => {
  for (let i = 0; i < 30; i++) {
    const date = new Date(Date.UTC(2026, 0, 1 + i));
    const { base, odd } = generatePuzzle(date, 5);
    const diffs = (['shape', 'color', 'rotation'] as const).filter((k) => base[k] !== odd[k]);
    assert.equal(diffs.length, 1, `expected exactly 1 diff, got ${diffs.length} for ${date.toISOString()}`);
  }
});

void test('a rotation diff is always visually distinguishable (triangle only)', () => {
  // Circles look identical at every rotation; squares and diamonds have
  // 90-degree symmetry so those turns are invisible. Only a triangle
  // actually looks different when rotated by 90/180/270.
  for (let i = 0; i < 60; i++) {
    const date = new Date(Date.UTC(2026, 0, 1 + i));
    const puzzle = generatePuzzle(date, 5);
    if (puzzle.diffAttr === 'rotation') {
      assert.equal(puzzle.base.shape, 'triangle');
    }
  }
});

void test('respects custom grid size', () => {
  const puzzle = generatePuzzle(new Date('2026-07-10T00:00:00Z'), 3);
  assert.equal(puzzle.totalTiles, 9);
  assert.ok(puzzle.oddIndex < 9);
});
