import { getSettings, listDays, listEntries, normalizeEntry, replaceAll, validateEntry } from './store';
import type { Backup, StepKey } from './types';
import { PLAN_DAYS } from './plan';

export async function exportBackup(): Promise<Backup> {
  return {
    app: 'mente',
    version: 1,
    exportedAt: new Date().toISOString(),
    entries: await listEntries(),
    days: await listDays(),
    settings: await getSettings(),
  };
}

const STEP_KEYS: StepKey[] = ['medir', 'exponer', 'neutralizar', 'transformar', 'entrenar'];
const isDate = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

const fail = (msg: string): never => {
  throw new Error(`El archivo no es un respaldo válido de MENTE: ${msg}`);
};

/** Parses and validates a backup file's text. Throws with a Spanish message. */
export function parseBackup(text: string): Backup {
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    return fail('no es JSON.');
  }
  if (data?.app !== 'mente') fail('es de otra app.');
  if (data.version !== 1) fail(`versión ${data.version} no soportada.`);
  if (!Array.isArray(data.entries) || !Array.isArray(data.days)) fail('faltan registros.');
  data.entries = data.entries.map(normalizeEntry);
  for (const e of data.entries) {
    if (
      typeof e?.id !== 'string' ||
      typeof e.createdAt !== 'string' ||
      !isDate(e.date) ||
      !Array.isArray(e.emotions) ||
      !e.emotions.every((x: unknown) => typeof x === 'string') ||
      validateEntry(e)
    )
      fail('hay un registro dañado.');
  }
  for (const d of data.days) {
    if (!isDate(d?.date) || typeof d.practiceDone !== 'boolean') fail('hay un día dañado.');
  }
  const s = data.settings;
  if (
    !Array.isArray(s?.dayPrompts) ||
    s.dayPrompts.length !== PLAN_DAYS ||
    !s.dayPrompts.every((p: unknown) => typeof p === 'string') ||
    !STEP_KEYS.every((k) => typeof s.stepTexts?.[k]?.title === 'string' && typeof s.stepTexts[k].help === 'string') ||
    !(s.planStartDate === null || isDate(s.planStartDate)) ||
    !(s.lastBackupAt === null || typeof s.lastBackupAt === 'string')
  )
    fail('la configuración está incompleta.');
  return data as Backup;
}

export async function importBackup(b: Backup): Promise<void> {
  await replaceAll(b.entries, b.days, b.settings);
}
