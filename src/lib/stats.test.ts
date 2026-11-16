import { expect, test } from 'vitest';
import { dailyAverages } from './stats';
import { entry } from './test-helpers';

test('averages before and after per day, skipping entries without after', () => {
  const r = dailyAverages([
    entry({ id: 'a', intensityBefore: 8, intensityAfter: 3 }),
    entry({ id: 'b', intensityBefore: 6 }),
  ]);
  expect(r).toEqual([{ date: '2026-11-15', before: 7, after: 3, count: 2 }]);
});

test('a day with no after values has after null', () => {
  expect(dailyAverages([entry({ intensityBefore: 4 })])[0].after).toBeNull();
});

test('days are sorted ascending', () => {
  const r = dailyAverages([entry({ id: 'a', date: '2026-11-16' }), entry({ id: 'b', date: '2026-11-14' })]);
  expect(r.map((d) => d.date)).toEqual(['2026-11-14', '2026-11-16']);
});

test('empty input gives empty output', () => {
  expect(dailyAverages([])).toEqual([]);
});
