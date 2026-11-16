import { expect, test } from 'vitest';
import { defaultSettings, EMOTIONS } from './defaults';

test('default settings have 30 non-empty day prompts', () => {
  const s = defaultSettings();
  expect(s.dayPrompts).toHaveLength(30);
  for (const p of s.dayPrompts) expect(p.trim().length).toBeGreaterThan(0);
});

test('every step has a title and help text', () => {
  const s = defaultSettings();
  for (const key of ['medir', 'exponer', 'neutralizar', 'transformar', 'entrenar'] as const) {
    expect(s.stepTexts[key].title.length).toBeGreaterThan(0);
    expect(s.stepTexts[key].help.length).toBeGreaterThan(0);
  }
});

test('plan has not started and there is no backup yet', () => {
  const s = defaultSettings();
  expect(s.planStartDate).toBeNull();
  expect(s.lastBackupAt).toBeNull();
});

test('defaults are fresh copies', () => {
  const a = defaultSettings();
  a.dayPrompts[0] = 'cambiado';
  expect(defaultSettings().dayPrompts[0]).not.toBe('cambiado');
});

test('emotion chips are provided', () => {
  expect(EMOTIONS).toContain('Ansiedad');
});
