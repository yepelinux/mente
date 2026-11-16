import { getSettings, listDays, listEntries, replaceAll, validateEntry } from './store';
import type { Backup } from './types';
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
  for (const e of data.entries) {
    if (typeof e?.id !== 'string' || typeof e?.createdAt !== 'string' || validateEntry(e)) fail('hay un registro dañado.');
  }
  for (const d of data.days) {
    if (typeof d?.date !== 'string' || typeof d?.practiceDone !== 'boolean') fail('hay un día dañado.');
  }
  const s = data.settings;
  if (!Array.isArray(s?.dayPrompts) || s.dayPrompts.length !== PLAN_DAYS || typeof s?.stepTexts !== 'object')
    fail('la configuración está incompleta.');
  return data as Backup;
}

export async function importBackup(b: Backup): Promise<void> {
  await replaceAll(b.entries, b.days, b.settings);
}
