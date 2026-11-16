import { beforeEach, describe, expect, test } from 'vitest';
import { clearAll, getSettings, listDays, listEntries, saveEntry, saveSettings, setDay, validateEntry, deleteEntry } from './store';
import { entry } from './test-helpers';

beforeEach(() => clearAll());

describe('entries', () => {
  test('saved entries are listed newest first', async () => {
    await saveEntry(entry({ id: 'a', createdAt: '2026-11-14T10:00:00.000Z' }));
    await saveEntry(entry({ id: 'b', createdAt: '2026-11-15T10:00:00.000Z' }));
    expect((await listEntries()).map((e) => e.id)).toEqual(['b', 'a']);
  });
  test('saving the same id twice keeps one entry with the latest data', async () => {
    await saveEntry(entry());
    await saveEntry(entry({ reframe: 'Puede salir bien' }));
    const all = await listEntries();
    expect(all).toHaveLength(1);
    expect(all[0].reframe).toBe('Puede salir bien');
  });
  test('deleteEntry removes it', async () => {
    await saveEntry(entry());
    await deleteEntry('e1');
    expect(await listEntries()).toEqual([]);
  });
});

describe('days', () => {
  test('setDay upserts by date', async () => {
    await setDay({ date: '2026-11-15', practiceDone: true });
    await setDay({ date: '2026-11-15', practiceDone: false });
    expect(await listDays()).toEqual([{ date: '2026-11-15', practiceDone: false }]);
  });
});

describe('settings', () => {
  test('empty database returns defaults with 30 prompts', async () => {
    const s = await getSettings();
    expect(s.dayPrompts).toHaveLength(30);
    expect(s.planStartDate).toBeNull();
  });
  test('saved settings round-trip', async () => {
    const s = await getSettings();
    await saveSettings({ ...s, planStartDate: '2026-11-15' });
    expect((await getSettings()).planStartDate).toBe('2026-11-15');
  });
});

describe('validateEntry', () => {
  test('blank thought is rejected', () => {
    expect(validateEntry({ thought: '   ', intensityBefore: 5 })).not.toBeNull();
  });
  test('intensity outside 0–10 is rejected', () => {
    expect(validateEntry({ thought: 'x', intensityBefore: 11 })).not.toBeNull();
    expect(validateEntry({ thought: 'x', intensityBefore: -1 })).not.toBeNull();
    expect(validateEntry({ thought: 'x' })).not.toBeNull();
  });
  test('intensity after outside 0–10 is rejected', () => {
    expect(validateEntry({ thought: 'x', intensityBefore: 5, intensityAfter: 12 })).not.toBeNull();
  });
  test('valid draft passes, 0 included', () => {
    expect(validateEntry({ thought: 'x', intensityBefore: 0 })).toBeNull();
  });
});
