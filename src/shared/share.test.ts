import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatSeconds, buildShareText } from './share.js';

void test('formatSeconds always shows exactly 1 decimal place', () => {
  assert.equal(formatSeconds(2400), '2.4s');
  assert.equal(formatSeconds(2000), '2.0s');
  assert.equal(formatSeconds(999), '1.0s');
  assert.equal(formatSeconds(12345), '12.3s');
});

void test('buildShareText matches the spec format and reveals no puzzle content', () => {
  const text = buildShareText(new Date('2026-07-10T12:00:00Z'), 2400, 6);
  assert.equal(text, 'Oddity #1 — 2.4s ⏱️ Streak: 6 🔥');
  // spoiler-free: no shape/color/rotation/grid words in the share string
  for (const word of ['circle', 'square', 'triangle', 'diamond', 'grid', '#']) {
    if (word === '#') continue; // '#' itself is part of "Oddity #1", not a spoiler
    assert.ok(!text.toLowerCase().includes(word), `share text should not mention "${word}"`);
  }
});
