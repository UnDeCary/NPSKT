import { describe, expect, test } from 'vitest';
import { npsToGaugeAngle } from './NpsGauge';

describe('npsToGaugeAngle', () => {
  test('maps NPS values onto a 240 degree gauge arc', () => {
    expect(npsToGaugeAngle(-100)).toBe(-120);
    expect(npsToGaugeAngle(0)).toBe(0);
    expect(npsToGaugeAngle(100)).toBe(120);
  });

  test('clamps values outside the NPS range', () => {
    expect(npsToGaugeAngle(-120)).toBe(-120);
    expect(npsToGaugeAngle(140)).toBe(120);
  });
});
