import { describe, expect, test } from 'vitest';
import { daysBetween, toLocalDate } from './dates';
import { blockForDay, dayOfPlan, needsBackupReminder, streak } from './plan';

describe('toLocalDate', () => {
  test('uses the local calendar day, not UTC', () => {
    expect(toLocalDate(new Date(2026, 10, 15, 23, 59))).toBe('2026-11-15');
    expect(toLocalDate(new Date(2026, 10, 16, 0, 1))).toBe('2026-11-16');
  });
});

describe('daysBetween', () => {
  test('counts calendar days across month boundaries', () => {
    expect(daysBetween('2026-11-15', '2026-12-14')).toBe(29);
    expect(daysBetween('2026-11-15', '2026-11-14')).toBe(-1);
  });
});

describe('dayOfPlan', () => {
  test('start date is day 1', () => {
    expect(dayOfPlan('2026-11-15', '2026-11-15')).toEqual({ kind: 'active', day: 1 });
  });
  test('day 30 is still active', () => {
    expect(dayOfPlan('2026-11-15', '2026-12-14')).toEqual({ kind: 'active', day: 30 });
  });
  test('after day 30 the plan is finished', () => {
    expect(dayOfPlan('2026-11-15', '2026-12-15')).toEqual({ kind: 'finished' });
  });
  test('before the start date it has not started', () => {
    expect(dayOfPlan('2026-11-15', '2026-11-14')).toEqual({ kind: 'not-started' });
  });
});

describe('blockForDay', () => {
  test('maps days to the four blocks', () => {
    expect(blockForDay(1)).toBe('medir-exponer');
    expect(blockForDay(7)).toBe('medir-exponer');
    expect(blockForDay(8)).toBe('neutralizar');
    expect(blockForDay(14)).toBe('neutralizar');
    expect(blockForDay(15)).toBe('transformar');
    expect(blockForDay(21)).toBe('transformar');
    expect(blockForDay(22)).toBe('entrenar');
    expect(blockForDay(30)).toBe('entrenar');
  });
});

describe('streak', () => {
  test('counts consecutive days ending yesterday when today is not done', () => {
    expect(streak(['2026-11-13', '2026-11-14'], '2026-11-15')).toBe(2);
  });
  test('a gap breaks the streak', () => {
    expect(streak(['2026-11-13', '2026-11-15'], '2026-11-15')).toBe(1);
  });
  test('empty is zero', () => {
    expect(streak([], '2026-11-15')).toBe(0);
  });
  test('duplicates do not double count', () => {
    expect(streak(['2026-11-15', '2026-11-15', '2026-11-14'], '2026-11-15')).toBe(2);
  });
  test('a streak that ended two days ago is zero', () => {
    expect(streak(['2026-11-12'], '2026-11-15')).toBe(0);
  });
});

describe('needsBackupReminder', () => {
  const now = new Date(2026, 10, 15, 12);
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000).toISOString();
  test('never backed up', () => expect(needsBackupReminder(null, now)).toBe(true));
  test('8 days ago', () => expect(needsBackupReminder(daysAgo(8), now)).toBe(true));
  test('6 days ago', () => expect(needsBackupReminder(daysAgo(6), now)).toBe(false));
});
