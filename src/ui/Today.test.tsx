import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { defaultSettings } from '../content/defaults';
import { clearAll, listDays } from '../lib/store';
import { Today } from './Today';

beforeEach(() => clearAll());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

test('checking the practice after midnight marks the new day, not the day the screen was rendered', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 15, 23, 59));
  const settings = { ...defaultSettings(), planStartDate: '2026-11-10' };
  render(<Today settings={settings} days={[]} hasData onChange={vi.fn()} onStart={vi.fn()} />);
  vi.setSystemTime(new Date(2026, 10, 16, 0, 1));
  fireEvent.click(screen.getByLabelText('Hice la práctica de hoy'));
  await waitFor(async () => expect(await listDays()).toEqual([{ date: '2026-11-16', practiceDone: true }]));
});

test('coming back to the app after midnight shows the new day', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 15, 23, 59));
  const settings = { ...defaultSettings(), planStartDate: '2026-11-15' };
  render(<Today settings={settings} days={[]} hasData onChange={vi.fn()} onStart={vi.fn()} />);
  expect(screen.getByRole('heading', { level: 2 }).textContent).toContain('Día 1 de 30');
  vi.setSystemTime(new Date(2026, 10, 16, 8, 0));
  fireEvent(document, new Event('visibilitychange'));
  await waitFor(() => expect(screen.getByRole('heading', { level: 2 }).textContent).toContain('Día 2 de 30'));
});
