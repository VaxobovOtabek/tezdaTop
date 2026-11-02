import { describe, expect, it } from 'vitest';
import { matchesRegion, mapViewport } from '../../admin/src/components/map-geography';

describe('moderation map geography', () => {
  const store = (region?: string) => ({ region, location: { lat: 40, lng: 70 } });
  it('matches spelling variants without mixing Tashkent city and province', () => {
    expect(matchesRegion(store("Farg'ona"), 'Farg‘ona viloyati')).toBe(true);
    expect(matchesRegion(store('  SIRDARYO VILOYATI '), 'Sirdaryo viloyati')).toBe(true);
    expect(matchesRegion(store('Toshkent viloyati'), 'Toshkent shahri')).toBe(false);
    expect(matchesRegion(store(), 'Toshkent shahri')).toBe(false);
    expect(matchesRegion(store(), 'Barcha viloyatlar')).toBe(true);
  });
  it('moves to Sirdaryo even when a search returns no stores', () => {
    expect(mapViewport('Sirdaryo viloyati', 'Barcha tumanlar', []).center).toEqual([40.49, 68.781, 9]);
  });
  it('focuses district results and falls back to the province for empty results', () => {
    const points: [number, number][] = [[40.49, 68.78]];
    expect(mapViewport('Sirdaryo viloyati', 'Guliston', points).locations).toEqual(points);
    expect(mapViewport('Sirdaryo viloyati', 'Guliston', []).center).toEqual([40.49, 68.781, 9]);
    expect(mapViewport('Barcha viloyatlar', 'Barcha tumanlar', points).locations).toEqual(points);
  });
});
