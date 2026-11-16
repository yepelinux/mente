import { describe, expect, test } from 'vitest';
import { EMOTIONS } from './defaults';
import { CUSTOM_PALETTE, emotionColor, emotionFill, NO_EMOTION_COLOR } from './emotionColors';

describe('emotionColor', () => {
  test('every preset emotion has its own color', () => {
    const colors = EMOTIONS.map(emotionColor);
    expect(new Set(colors).size).toBe(EMOTIONS.length);
    expect(colors).not.toContain(NO_EMOTION_COLOR);
  });
  test('presets match regardless of case and spaces', () => {
    expect(emotionColor('  culpa ')).toBe(emotionColor('Culpa'));
  });
  test('a typed emotion always gets the same color from the custom palette', () => {
    expect(emotionColor('Cansancio')).toBe(emotionColor('cansancio'));
    expect(CUSTOM_PALETTE).toContain(emotionColor('Cansancio'));
  });
  test('custom colors never repeat a preset color', () => {
    const presets = new Set(EMOTIONS.map(emotionColor));
    expect(CUSTOM_PALETTE.some((c) => presets.has(c))).toBe(false);
  });
  test('blank is the no-emotion color', () => {
    expect(emotionColor('  ')).toBe(NO_EMOTION_COLOR);
  });
});

describe('emotionFill', () => {
  const stops = (fill: string) => fill.match(/#[0-9a-f]{6}/gi) ?? [];
  test('no emotions paints the neutral color', () => {
    expect(stops(emotionFill([]))).toEqual([NO_EMOTION_COLOR]);
  });
  test('one emotion paints a single color', () => {
    expect(stops(emotionFill(['Tristeza']))).toEqual([emotionColor('Tristeza')]);
  });
  test('several emotions paint equal vertical stripes in order', () => {
    const fill = emotionFill(['Enojo', 'Miedo']);
    expect(stops(fill)).toEqual([emotionColor('Enojo'), emotionColor('Miedo')]);
    expect(fill).toContain('to right');
    expect(fill).toContain('0% 50%');
    expect(fill).toContain('50% 100%');
  });
  test('the tone variable controls how strong the colors look', () => {
    expect(emotionFill(['Culpa'])).toContain('var(--tone)');
  });
});
