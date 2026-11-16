const PRESET_COLORS: Record<string, string> = {
  ansiedad: '#e5b53a',
  frustración: '#e07b39',
  enojo: '#d64545',
  vergüenza: '#e27fa6',
  miedo: '#8b6fd1',
  tristeza: '#4c8bd6',
  culpa: '#3fa79a',
};

/** Colors for emotions typed by hand; picked by a stable hash of the name. */
export const CUSTOM_PALETTE = ['#7ca65a', '#a07d5c', '#6c8fa3', '#b86bc2', '#9aa33f', '#c98f6b'];

export const NO_EMOTION_COLOR = '#8a9096';

const key = (name: string) => name.trim().toLocaleLowerCase('es');

export function emotionColor(name: string): string {
  const k = key(name);
  if (!k) return NO_EMOTION_COLOR;
  if (PRESET_COLORS[k]) return PRESET_COLORS[k];
  let hash = 0;
  for (const ch of k) hash = (hash * 31 + ch.codePointAt(0)!) >>> 0;
  return CUSTOM_PALETTE[hash % CUSTOM_PALETTE.length];
}

/**
 * CSS background painting each emotion as an equal vertical stripe, in order.
 * Colors are blended with the card color by `--tone` (set from the intensity).
 */
export function emotionFill(emotions: string[]): string {
  const colors = emotions.length ? emotions.map(emotionColor) : [NO_EMOTION_COLOR];
  const step = 100 / colors.length;
  const stops = colors.map((c, i) => {
    const from = +(i * step).toFixed(2);
    const to = +((i + 1) * step).toFixed(2);
    return `color-mix(in srgb, ${c} var(--tone), var(--card)) ${from}% ${to}%`;
  });
  return `linear-gradient(to right, ${stops.join(', ')})`;
}
