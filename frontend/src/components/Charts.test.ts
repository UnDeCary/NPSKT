import { describe, expect, test } from 'vitest';
import { STRUCTURE_STACK_ID, formatPercent } from './Charts';

describe('formatPercent', () => {
  test('renders chart values as percentages', () => {
    expect(formatPercent(0)).toBe('0%');
    expect(formatPercent(50)).toBe('50%');
    expect(formatPercent(12.345)).toBe('12.35%');
    expect(formatPercent(12.3)).toBe('12.3%');
  });

  test('uses a shared stack id for score structure bars', () => {
    expect(STRUCTURE_STACK_ID).toBe('score-structure');
  });
});
