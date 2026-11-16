import { addDays, daysBetween, type LocalDate } from './dates';

export const PLAN_DAYS = 30;
const BACKUP_REMINDER_DAYS = 7;

export type PlanStatus =
  | { kind: 'not-started' }
  | { kind: 'active'; day: number }
  | { kind: 'finished' };

export type Block = 'medir-exponer' | 'neutralizar' | 'transformar' | 'entrenar';

export function dayOfPlan(start: LocalDate, today: LocalDate): PlanStatus {
  const day = daysBetween(start, today) + 1;
  if (day < 1) return { kind: 'not-started' };
  if (day > PLAN_DAYS) return { kind: 'finished' };
  return { kind: 'active', day };
}

export function blockForDay(day: number): Block {
  if (day <= 7) return 'medir-exponer';
  if (day <= 14) return 'neutralizar';
  if (day <= 21) return 'transformar';
  return 'entrenar';
}

/** Consecutive done days ending today, or ending yesterday if today is not done yet. */
export function streak(doneDates: LocalDate[], today: LocalDate): number {
  const done = new Set(doneDates);
  let cursor = done.has(today) ? today : addDays(today, -1);
  let count = 0;
  while (done.has(cursor)) {
    count++;
    cursor = addDays(cursor, -1);
  }
  return count;
}

export function needsBackupReminder(lastBackupAt: string | null, now: Date, hasData = true): boolean {
  if (!hasData) return false;
  if (!lastBackupAt) return true;
  return now.getTime() - new Date(lastBackupAt).getTime() > BACKUP_REMINDER_DAYS * 86_400_000;
}
