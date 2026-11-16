import { beforeEach, expect, test } from 'vitest';
import { exportBackup, importBackup, parseBackup } from './backup';
import { clearAll, getSettings, listDays, listEntries, saveEntry, saveSettings, setDay } from './store';
import { entry } from './test-helpers';

beforeEach(() => clearAll());

test('export → JSON → parse → import reproduces the data', async () => {
  await saveEntry(entry());
  await setDay({ date: '2026-11-15', practiceDone: true });
  await saveSettings({ ...(await getSettings()), planStartDate: '2026-11-15' });
  const text = JSON.stringify(await exportBackup());
  await clearAll();
  await importBackup(parseBackup(text));
  expect(await listEntries()).toEqual([entry()]);
  expect(await listDays()).toEqual([{ date: '2026-11-15', practiceDone: true }]);
  expect((await getSettings()).planStartDate).toBe('2026-11-15');
});

test.each([
  ['not JSON', 'nope'],
  ['another app', JSON.stringify({ app: 'otra', version: 1, entries: [], days: [], settings: {} })],
  ['future version', JSON.stringify({ app: 'mente', version: 2, entries: [], days: [], settings: {} })],
  ['entries not an array', JSON.stringify({ app: 'mente', version: 1, entries: {}, days: [], settings: {} })],
  ['entry without thought', JSON.stringify({ app: 'mente', version: 1, entries: [{ id: 'x' }], days: [], settings: {} })],
  ['settings without 30 prompts', JSON.stringify({ app: 'mente', version: 1, entries: [], days: [], settings: { dayPrompts: [] } })],
])('rejects %s', (_name, text) => {
  expect(() => parseBackup(text)).toThrow();
});

test('a failed parse leaves existing data untouched', async () => {
  await saveEntry(entry());
  try { await importBackup(parseBackup('nope')); } catch { /* expected */ }
  expect(await listEntries()).toHaveLength(1);
});
