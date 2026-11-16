import { describe, expect, test } from 'vitest';
import { initialScrollMin, layoutWeek, weekDays, weekStart } from './calendar';
import { entry } from './test-helpers';

describe('weekStart', () => {
  test('Monday is its own week start', () => expect(weekStart('2026-11-16')).toBe('2026-11-16'));
  test('Sunday belongs to the week that started the previous Monday', () => expect(weekStart('2026-11-22')).toBe('2026-11-16'));
  test('works across month boundaries', () => expect(weekStart('2026-12-02')).toBe('2026-11-30'));
});

test('weekDays lists 7 consecutive days', () => {
  expect(weekDays('2026-11-30')).toEqual(['2026-11-30', '2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04', '2026-12-05', '2026-12-06']);
});

describe('layoutWeek', () => {
  const W = '2026-11-16';
  const day = (layout: ReturnType<typeof layoutWeek>, date: string) => layout.find((d) => d.date === date)!;

  test('a timed entry is placed at its start with its duration', () => {
    const l = layoutWeek([entry({ date: '2026-11-17', startTime: '21:30', durationMinutes: 45 })], W);
    expect(day(l, '2026-11-17').blocks).toMatchObject([{ startMin: 1290, endMin: 1335, lane: 0, lanes: 1, noDuration: false, continued: false, continues: false }]);
  });

  test('an entry without duration gets a 15 min placeholder flagged noDuration', () => {
    const l = layoutWeek([entry({ date: W, startTime: '08:00' })], W);
    expect(day(l, W).blocks[0]).toMatchObject({ startMin: 480, endMin: 495, noDuration: true });
  });

  test('an entry without start time goes to the all-day row', () => {
    const l = layoutWeek([entry({ date: W })], W);
    expect(day(l, W).blocks).toEqual([]);
    expect(day(l, W).allDay).toHaveLength(1);
  });

  test('an entry crossing midnight continues on the next day', () => {
    const l = layoutWeek([entry({ date: W, startTime: '23:30', durationMinutes: 60 })], W);
    expect(day(l, W).blocks[0]).toMatchObject({ startMin: 1410, endMin: 1440, continues: true, continued: false });
    expect(day(l, '2026-11-17').blocks[0]).toMatchObject({ startMin: 0, endMin: 30, continued: true, continues: false });
  });

  test('a Sunday entry crossing midnight is clipped at the end of the week', () => {
    const l = layoutWeek([entry({ date: '2026-11-22', startTime: '23:00', durationMinutes: 120 })], W);
    expect(day(l, '2026-11-22').blocks[0]).toMatchObject({ endMin: 1440, continues: true });
    expect(l).toHaveLength(7);
  });

  test('a Sunday-night entry of the previous week shows its tail on Monday', () => {
    const l = layoutWeek([entry({ date: '2026-11-15', startTime: '23:00', durationMinutes: 120 })], W);
    expect(day(l, W).blocks[0]).toMatchObject({ startMin: 0, endMin: 60, continued: true });
  });

  test('entries outside the week are ignored', () => {
    const l = layoutWeek([entry({ date: '2026-11-23', startTime: '10:00' }), entry({ id: 'b', date: '2026-11-15' })], W);
    expect(l.every((d) => d.blocks.length === 0 && d.allDay.length === 0)).toBe(true);
  });

  test('overlapping entries share the width in lanes, the rest keep full width', () => {
    const l = layoutWeek(
      [
        entry({ id: 'a', date: W, startTime: '10:00', durationMinutes: 60 }),
        entry({ id: 'b', date: W, startTime: '10:30', durationMinutes: 60 }),
        entry({ id: 'c', date: W, startTime: '11:15', durationMinutes: 30 }),
        entry({ id: 'd', date: W, startTime: '15:00', durationMinutes: 30 }),
      ],
      W,
    );
    const byId = Object.fromEntries(day(l, W).blocks.map((b) => [b.entry.id, b]));
    expect(byId.a).toMatchObject({ lane: 0, lanes: 2 });
    expect(byId.b).toMatchObject({ lane: 1, lanes: 2 });
    expect(byId.c).toMatchObject({ lane: 0, lanes: 2 }); // reuses lane 0 once 'a' ended
    expect(byId.d).toMatchObject({ lane: 0, lanes: 1 });
  });

  test('back-to-back entries do not count as overlapping', () => {
    const l = layoutWeek(
      [entry({ id: 'a', date: W, startTime: '10:00', durationMinutes: 30 }), entry({ id: 'b', date: W, startTime: '10:30', durationMinutes: 30 })],
      W,
    );
    expect(day(l, W).blocks.map((b) => b.lanes)).toEqual([1, 1]);
  });
});

describe('initialScrollMin', () => {
  const W = '2026-11-16';
  test('half an hour before the earliest thought of the week', () => {
    const l = layoutWeek([entry({ id: 'a', date: '2026-11-18', startTime: '10:00' }), entry({ id: 'b', date: W, startTime: '08:15' })], W);
    expect(initialScrollMin(l)).toBe(465);
  });
  test('ignores the after-midnight tail of a late thought', () => {
    const l = layoutWeek([entry({ id: 'a', date: W, startTime: '23:30', durationMinutes: 75 }), entry({ id: 'b', date: '2026-11-18', startTime: '08:15' })], W);
    expect(initialScrollMin(l)).toBe(465);
  });
  test('an empty week opens at 7:00', () => {
    expect(initialScrollMin(layoutWeek([], W))).toBe(420);
  });
  test('a thought at 00:10 scrolls to the top, not below zero', () => {
    expect(initialScrollMin(layoutWeek([entry({ date: W, startTime: '00:10' })], W))).toBe(0);
  });
});
