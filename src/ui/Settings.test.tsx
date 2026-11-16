import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { defaultSettings } from '../content/defaults';
import { clearAll } from '../lib/store';
import type { Settings } from '../lib/types';
import { SettingsScreen } from './Settings';

beforeEach(() => clearAll());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  // @ts-expect-error test cleanup
  delete navigator.share; // @ts-expect-error test cleanup
  delete navigator.canShare;
});

function setup(initial: Settings = defaultSettings()) {
  let current = initial;
  const onSave = vi.fn(async (s: Settings) => {
    current = s;
    view.rerender(<SettingsScreen settings={current} onSave={onSave} onImported={vi.fn()} />);
  });
  const view = render(<SettingsScreen settings={current} onSave={onSave} onImported={vi.fn()} />);
  return { onSave, get current() { return current; } };
}

function mockShare(result: 'ok' | 'cancel') {
  Object.assign(navigator, {
    canShare: () => true,
    share: vi.fn(() => (result === 'ok' ? Promise.resolve() : Promise.reject(new DOMException('x', 'AbortError')))),
  });
}

test('exporting via share stamps lastBackupAt only once sharing finished', async () => {
  mockShare('ok');
  const s = setup();
  fireEvent.click(screen.getByRole('button', { name: 'Exportar respaldo' }));
  await waitFor(() => expect(s.current.lastBackupAt).not.toBeNull());
});

test('a cancelled share does not clear the backup reminder', async () => {
  mockShare('cancel');
  const s = setup();
  fireEvent.click(screen.getByRole('button', { name: 'Exportar respaldo' }));
  await new Promise((r) => setTimeout(r, 50));
  expect(s.current.lastBackupAt).toBeNull();
});

test('exporting does not make the screen look like it has unsaved changes', async () => {
  mockShare('ok');
  const s = setup();
  fireEvent.click(screen.getByRole('button', { name: 'Exportar respaldo' }));
  await waitFor(() => expect(s.current.lastBackupAt).not.toBeNull());
  expect(screen.queryByRole('button', { name: 'Guardar cambios' })).toBeNull();
});

test('restarting the plan keeps unsaved text edits', async () => {
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  const s = setup();
  fireEvent.input(screen.getByLabelText('Día 1'), { target: { value: 'Mi consigna' } });
  fireEvent.click(screen.getByRole('button', { name: 'Reiniciar el plan hoy' }));
  await waitFor(() => expect(s.current.planStartDate).not.toBeNull());
  expect(s.current.dayPrompts[0]).toBe('Mi consigna');
});
