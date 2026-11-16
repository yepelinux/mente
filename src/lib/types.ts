import type { LocalDate } from './dates';

export type StepKey = 'medir' | 'exponer' | 'neutralizar' | 'transformar' | 'entrenar';

export interface Entry {
  id: string;
  createdAt: string;
  date: LocalDate;
  /** Emotions felt, in the order picked (presets first, then typed ones). */
  emotions: string[];
  intensityBefore: number;
  /** Local time the thought started, HH:MM (24 h). */
  startTime?: string;
  /** How long it lasted, in whole minutes (1–1440). */
  durationMinutes?: number;
  trigger?: string;
  thought: string;
  evidenceFor?: string;
  evidenceAgainst?: string;
  reframe?: string;
  intensityAfter?: number;
}

export interface DayLog {
  date: LocalDate;
  practiceDone: boolean;
  note?: string;
}

export interface Settings {
  planStartDate: LocalDate | null;
  stepTexts: Record<StepKey, { title: string; help: string }>;
  dayPrompts: string[];
  lastBackupAt: string | null;
}

export interface Backup {
  app: 'mente';
  version: 1;
  exportedAt: string;
  entries: Entry[];
  days: DayLog[];
  settings: Settings;
}
