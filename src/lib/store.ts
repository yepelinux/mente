import { clear, createStore, get, set } from 'idb-keyval';
import { defaultSettings } from '../content/defaults';
import type { DayLog, Entry, Settings } from './types';

const db = createStore('mente', 'kv');

export async function listEntries(): Promise<Entry[]> {
  const all = (await get<Entry[]>('entries', db)) ?? [];
  return [...all].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function saveEntry(e: Entry): Promise<void> {
  const all = (await get<Entry[]>('entries', db)) ?? [];
  await set('entries', [...all.filter((x) => x.id !== e.id), e], db);
}

export async function deleteEntry(id: string): Promise<void> {
  const all = (await get<Entry[]>('entries', db)) ?? [];
  await set('entries', all.filter((x) => x.id !== id), db);
}

export async function listDays(): Promise<DayLog[]> {
  return (await get<DayLog[]>('days', db)) ?? [];
}

export async function setDay(d: DayLog): Promise<void> {
  const all = await listDays();
  await set('days', [...all.filter((x) => x.date !== d.date), d], db);
}

export async function getSettings(): Promise<Settings> {
  return (await get<Settings>('settings', db)) ?? defaultSettings();
}

export async function saveSettings(s: Settings): Promise<void> {
  await set('settings', s, db);
}

/** Replaces everything at once (used by backup import). */
export async function replaceAll(entries: Entry[], days: DayLog[], settings: Settings): Promise<void> {
  await set('entries', entries, db);
  await set('days', days, db);
  await set('settings', settings, db);
}

export async function clearAll(): Promise<void> {
  await clear(db);
}

/** Ask the browser not to evict our data under storage pressure. */
export async function requestPersistence(): Promise<boolean> {
  if (!navigator.storage?.persist) return false;
  return (await navigator.storage.persisted()) || navigator.storage.persist();
}

const isIntensity = (n: unknown) => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 10;

/** Returns a Spanish error message, or null when the draft can be saved. */
export function validateEntry(draft: Partial<Entry>): string | null {
  if (!isIntensity(draft.intensityBefore)) return 'Indicá una intensidad de 0 a 10.';
  if (!draft.thought?.trim()) return 'Escribí el pensamiento.';
  if (draft.intensityAfter !== undefined && !isIntensity(draft.intensityAfter))
    return 'La intensidad final tiene que ser de 0 a 10.';
  if (draft.startTime !== undefined && !/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.startTime))
    return 'La hora de inicio no es válida.';
  const d = draft.durationMinutes;
  if (d !== undefined && !(Number.isInteger(d) && d >= 1 && d <= 1440))
    return 'La duración tiene que ser de 1 a 1440 minutos.';
  return null;
}
