import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getDayNumber } from './dayNumber.js';

void test('epoch date is day 1', () => {
  assert.equal(getDayNumber(new Date('2026-07-10T12:00:00Z')), 1);
});

void test('day number advances by exactly 1 per UTC calendar day', () => {
  assert.equal(getDayNumber(new Date('2026-07-11T00:00:00Z')), 2);
  assert.equal(getDayNumber(new Date('2026-07-11T23:59:59Z')), 2);
  assert.equal(getDayNumber(new Date('2026-07-20T12:00:00Z')), 11);
});

void test('time of day does not affect the day number', () => {
  const morning = getDayNumber(new Date('2026-08-01T00:00:01Z'));
  const night = getDayNumber(new Date('2026-08-01T23:59:59Z'));
  assert.equal(morning, night);
});
