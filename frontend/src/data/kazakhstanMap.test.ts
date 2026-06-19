import { describe, expect, it } from 'vitest';

import { KAZAKHSTAN_MACROREGIONS, kazakhstanMapRegions } from './kazakhstanMap';

describe('kazakhstan map regions', () => {
  it('covers current Kazakhstan ADM1 regions and seven macroregions', () => {
    expect(kazakhstanMapRegions).toHaveLength(20);
    expect(KAZAKHSTAN_MACROREGIONS.map((item) => item.name)).toEqual([
      'Запад',
      'Север',
      'Центр',
      'Восток',
      'Юг',
      'Алматы',
      'Астана',
    ]);

    const macroregionKeys = new Set(KAZAKHSTAN_MACROREGIONS.map((item) => item.key));
    expect(new Set(kazakhstanMapRegions.map((item) => item.macroregion)).size).toBe(7);
    expect(kazakhstanMapRegions.every((item) => macroregionKeys.has(item.macroregion))).toBe(true);
  });
});
