import { beforeEach, expect, test } from 'vitest';
import { exportBackup, importBackup, parseBackup } from './backup';
import { clearAll, getSettings, listDays, listEntries, saveEntry, saveSettings, setDay } from './store';
import { entry } from './test-helpers';
import { defaultSettings } from '../content/defaults';

const validSettings = () => defaultSettings();

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
  ['stepTexts null', JSON.stringify({ app: 'mente', version: 1, entries: [], days: [], settings: { ...validSettings(), stepTexts: null } })],
  ['a step text missing', JSON.stringify({ app: 'mente', version: 1, entries: [], days: [], settings: { ...validSettings(), stepTexts: {} } })],
  ['entry without date', JSON.stringify({ app: 'mente', version: 1, entries: [{ ...entry(), date: undefined }], days: [], settings: validSettings() })],
  ['entry without emotion', JSON.stringify({ app: 'mente', version: 1, entries: [{ ...entry(), emotion: undefined }], days: [], settings: validSettings() })],
  ['bad plan start date', JSON.stringify({ app: 'mente', version: 1, entries: [], days: [], settings: { ...validSettings(), planStartDate: 'ayer' } })],
  ['non-string prompt', JSON.stringify({ app: 'mente', version: 1, entries: [], days: [], settings: { ...validSettings(), dayPrompts: Array(30).fill(1) } })],
])('rejects %s', (_name, text) => {
  expect(() => parseBackup(text)).toThrow();
});

test('a failed parse leaves existing data untouched', async () => {
  await saveEntry(entry());
  try { await importBackup(parseBackup('nope')); } catch { /* expected */ }
  expect(await listEntries()).toHaveLength(1);
});

test('a complete valid backup with entries is accepted', () => {
  const text = JSON.stringify({ app: 'mente', version: 1, exportedAt: 'x', entries: [entry()], days: [], settings: { ...validSettings(), planStartDate: '2026-11-15' } });
  expect(parseBackup(text).entries).toHaveLength(1);
});
