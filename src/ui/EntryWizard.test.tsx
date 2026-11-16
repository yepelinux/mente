import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { defaultSettings } from '../content/defaults';
import { clearAll, listEntries } from '../lib/store';
import { EntryWizard } from './EntryWizard';
import { entry } from '../lib/test-helpers';

beforeEach(() => clearAll());
afterEach(cleanup);

function goToExponer() {
  render(<EntryWizard settings={defaultSettings()} onDone={vi.fn()} />);
  fireEvent.input(screen.getByLabelText('Intensidad inicial'), { target: { value: '8' } });
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
}

test('Guardar is disabled while the thought is empty', () => {
  goToExponer();
  expect((screen.getByRole('button', { name: 'Guardar' }) as HTMLButtonElement).disabled).toBe(true);
});

test('filling intensity and thought saves one entry', async () => {
  const onDone = vi.fn();
  render(<EntryWizard settings={defaultSettings()} onDone={onDone} />);
  fireEvent.input(screen.getByLabelText('Intensidad inicial'), { target: { value: '8' } });
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
  fireEvent.input(screen.getByLabelText('Pensamiento'), { target: { value: '¿Y si me echan?' } });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
  await waitFor(() => expect(onDone).toHaveBeenCalled());
  const [e] = await listEntries();
  expect(e.intensityBefore).toBe(8);
  expect(e.thought).toBe('¿Y si me echan?');
});

test('double tap on Guardar saves a single entry', async () => {
  goToExponer();
  fireEvent.input(screen.getByLabelText('Pensamiento'), { target: { value: 'x' } });
  const save = screen.getByRole('button', { name: 'Guardar' });
  fireEvent.click(save);
  fireEvent.click(save);
  await waitFor(async () => expect(await listEntries()).toHaveLength(1));
  await new Promise((r) => setTimeout(r, 50));
  expect(await listEntries()).toHaveLength(1);
});

test('reaching Transformar records the reframe and final intensity', async () => {
  const onDone = vi.fn();
  render(<EntryWizard settings={defaultSettings()} onDone={onDone} />);
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
  fireEvent.input(screen.getByLabelText('Pensamiento'), { target: { value: 'Todo va a salir mal' } });
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
  fireEvent.input(screen.getByLabelText('Pensamiento alternativo'), { target: { value: 'Algunas cosas pueden salir bien' } });
  fireEvent.input(screen.getByLabelText('Intensidad final'), { target: { value: '3' } });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
  await waitFor(() => expect(onDone).toHaveBeenCalled());
  const [e] = await listEntries();
  expect(e.reframe).toBe('Algunas cosas pueden salir bien');
  expect(e.intensityAfter).toBe(3);
});

test('a reframe saved without moving the final slider records the value shown', async () => {
  const onDone = vi.fn();
  render(<EntryWizard settings={defaultSettings()} onDone={onDone} />);
  fireEvent.input(screen.getByLabelText('Intensidad inicial'), { target: { value: '8' } });
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
  fireEvent.input(screen.getByLabelText('Pensamiento'), { target: { value: 'x' } });
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
  fireEvent.input(screen.getByLabelText('Pensamiento alternativo'), { target: { value: 'y' } });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
  await waitFor(() => expect(onDone).toHaveBeenCalled());
  const [e] = await listEntries();
  expect(e.intensityAfter).toBe(8);
});

test('Cancelar leaves without saving', async () => {
  const onDone = vi.fn();
  render(<EntryWizard settings={defaultSettings()} onDone={onDone} />);
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
  fireEvent.input(screen.getByLabelText('Pensamiento'), { target: { value: 'x' } });
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(onDone).toHaveBeenCalled();
  expect(await listEntries()).toEqual([]);
});

test('start time defaults to now and duration can be picked or typed', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 16, 21, 7));
  const onDone = vi.fn();
  render(<EntryWizard settings={defaultSettings()} onDone={onDone} />);
  expect((screen.getByLabelText('¿A qué hora empezó?') as HTMLInputElement).value).toBe('21:07');
  fireEvent.input(screen.getByLabelText('¿A qué hora empezó?'), { target: { value: '20:30' } });
  fireEvent.click(screen.getByRole('button', { name: '15 min' }));
  expect((screen.getByLabelText('Duración en minutos') as HTMLInputElement).value).toBe('15');
  fireEvent.input(screen.getByLabelText('Duración en minutos'), { target: { value: '40' } });
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
  fireEvent.input(screen.getByLabelText('Pensamiento'), { target: { value: 'x' } });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
  await waitFor(() => expect(onDone).toHaveBeenCalled());
  vi.useRealTimers();
  const [e] = await listEntries();
  expect(e.startTime).toBe('20:30');
  expect(e.durationMinutes).toBe(40);
});

test('leaving the duration empty saves no duration', async () => {
  const onDone = vi.fn();
  render(<EntryWizard settings={defaultSettings()} onDone={onDone} />);
  fireEvent.click(screen.getByRole('button', { name: '15 min' }));
  fireEvent.input(screen.getByLabelText('Duración en minutos'), { target: { value: '' } });
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
  fireEvent.input(screen.getByLabelText('Pensamiento'), { target: { value: 'x' } });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
  await waitFor(() => expect(onDone).toHaveBeenCalled());
  const [e] = await listEntries();
  expect(e.durationMinutes).toBeUndefined();
});

async function saveFromMedir(onDone: () => void) {
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
  fireEvent.input(screen.getByLabelText('Pensamiento'), { target: { value: 'x' } });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
  await waitFor(() => expect(onDone).toHaveBeenCalled());
  return (await listEntries())[0];
}

test('several emotions can be picked, plus others typed and comma-separated', async () => {
  const onDone = vi.fn();
  render(<EntryWizard settings={defaultSettings()} onDone={onDone} />);
  fireEvent.click(screen.getByRole('button', { name: 'Ansiedad' }));
  fireEvent.click(screen.getByRole('button', { name: 'Culpa' }));
  fireEvent.input(screen.getByLabelText('Otras emociones'), { target: { value: ' Cansancio , ansiedad,, ' } });
  const e = await saveFromMedir(onDone);
  expect(e.emotions).toEqual(['Ansiedad', 'Culpa', 'Cansancio']);
});

test('tapping a picked emotion again unpicks it', async () => {
  const onDone = vi.fn();
  render(<EntryWizard settings={defaultSettings()} onDone={onDone} />);
  fireEvent.click(screen.getByRole('button', { name: 'Miedo' }));
  fireEvent.click(screen.getByRole('button', { name: 'Enojo' }));
  fireEvent.click(screen.getByRole('button', { name: 'Miedo' }));
  expect(screen.getByRole('button', { name: 'Miedo' }).getAttribute('aria-pressed')).toBe('false');
  const e = await saveFromMedir(onDone);
  expect(e.emotions).toEqual(['Enojo']);
});

test('editing shows preset emotions as picked and the rest as typed text', () => {
  render(<EntryWizard settings={defaultSettings()} onDone={vi.fn()} initial={entry({ emotions: ['Miedo', 'Insomnio', 'Celos'] })} />);
  expect(screen.getByRole('button', { name: 'Miedo' }).getAttribute('aria-pressed')).toBe('true');
  expect((screen.getByLabelText('Otras emociones') as HTMLInputElement).value).toBe('Insomnio, Celos');
});
