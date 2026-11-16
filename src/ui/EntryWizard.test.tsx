import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { defaultSettings } from '../content/defaults';
import { clearAll, listEntries } from '../lib/store';
import { EntryWizard } from './EntryWizard';

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
