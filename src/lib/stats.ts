import type { LocalDate } from './dates';
import type { Entry } from './types';

export interface DayAverage {
  date: LocalDate;
  before: number;
  after: number | null;
  count: number;
}

const avg = (ns: number[]) => Math.round((ns.reduce((a, b) => a + b, 0) / ns.length) * 10) / 10;

export function dailyAverages(entries: Entry[]): DayAverage[] {
  const byDate = new Map<LocalDate, Entry[]>();
  for (const e of entries) byDate.set(e.date, [...(byDate.get(e.date) ?? []), e]);
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, es]) => {
      const afters = es.flatMap((e) => (e.intensityAfter === undefined ? [] : [e.intensityAfter]));
      return { date, before: avg(es.map((e) => e.intensityBefore)), after: afters.length ? avg(afters) : null, count: es.length };
    });
}
