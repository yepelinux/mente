import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, expect, test, vi } from 'vitest';
import { entry } from '../lib/test-helpers';
import { HOUR_PX, WeekCalendar } from './WeekCalendar';
import { emotionColor } from '../content/emotionColors';

afterEach(cleanup);

const entries = [
  entry({ id: 'a', date: '2026-11-17', startTime: '21:30', durationMinutes: 45, thought: 'Mail del jefe' }),
  entry({ id: 'b', date: '2026-11-18', thought: 'Sin hora' }),
];

test('shows the week of the given day, Monday first', () => {
  render(<WeekCalendar entries={entries} initialDate="2026-11-19" onSelect={vi.fn()} />);
  expect(screen.getByText('16 – 22 nov')).toBeTruthy();
  expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['lu16', 'ma17', 'mi18', 'ju19', 'vi20', 'sá21', 'do22']);
});

test('a block sits at its start time and is as tall as its duration', () => {
  render(<WeekCalendar entries={entries} initialDate="2026-11-19" onSelect={vi.fn()} />);
  const block = screen.getByRole('button', { name: /Mail del jefe/ }) as HTMLElement;
  expect(parseFloat(block.style.top)).toBeCloseTo(21.5 * HOUR_PX, 1);
  expect(parseFloat(block.style.height)).toBeCloseTo(0.75 * HOUR_PX, 1);
});

test('entries without time appear in the all-day row', () => {
  render(<WeekCalendar entries={entries} initialDate="2026-11-19" onSelect={vi.fn()} />);
  expect(screen.getByRole('button', { name: /Sin hora/ }).closest('.allday')).not.toBeNull();
});

test('tapping a block selects its entry', () => {
  const onSelect = vi.fn();
  render(<WeekCalendar entries={entries} initialDate="2026-11-19" onSelect={onSelect} />);
  fireEvent.click(screen.getByRole('button', { name: /Mail del jefe/ }));
  expect(onSelect).toHaveBeenCalledWith('a');
});

test('arrows move between weeks', () => {
  render(<WeekCalendar entries={entries} initialDate="2026-11-19" onSelect={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Semana siguiente' }));
  expect(screen.getByText('23 – 29 nov')).toBeTruthy();
  expect(screen.queryByRole('button', { name: /Mail del jefe/ })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Semana anterior' }));
  fireEvent.click(screen.getByRole('button', { name: 'Semana anterior' }));
  expect(screen.getByText('9 – 15 nov')).toBeTruthy();
});

test('a week spanning two months shows both', () => {
  render(<WeekCalendar entries={[]} initialDate="2026-12-02" onSelect={vi.fn()} />);
  expect(screen.getByText('30 nov – 6 dic')).toBeTruthy();
});

test('blocks are painted with their emotions and the legend lists the week\'s emotions', () => {
  const es = [
    entry({ id: 'x', date: '2026-11-17', startTime: '10:00', durationMinutes: 60, emotions: ['Tristeza', 'Culpa'], thought: 'Pienso en eso' }),
    entry({ id: 'y', date: '2026-11-25', startTime: '10:00', emotions: ['Enojo'], thought: 'Otra semana' }),
  ];
  render(<WeekCalendar entries={es} initialDate="2026-11-17" onSelect={vi.fn()} />);
  const fill = (screen.getByRole('button', { name: /Pienso en eso/ }) as HTMLElement).style.getPropertyValue('--fill');
  expect(fill).toContain(emotionColor('Tristeza'));
  expect(fill).toContain(emotionColor('Culpa'));
  const legend = screen.getByRole('list', { name: 'Emociones de la semana' });
  expect(legend.textContent).toContain('Tristeza');
  expect(legend.textContent).toContain('Culpa');
  expect(legend.textContent).not.toContain('Enojo');
});
