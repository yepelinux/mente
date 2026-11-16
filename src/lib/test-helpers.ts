import type { Entry } from './types';

export const entry = (over: Partial<Entry> = {}): Entry => ({
  id: 'e1',
  createdAt: '2026-11-15T10:00:00.000Z',
  date: '2026-11-15',
  emotion: 'Ansiedad',
  intensityBefore: 7,
  thought: '¿Y si sale mal?',
  ...over,
});
