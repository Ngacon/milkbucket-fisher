import { clamp, weightedPick } from '../src/utils/format';

describe('format helpers', () => {
  it('clamps numbers', () => {
    expect(clamp(5, 1, 3)).toBe(3);
    expect(clamp(-1, 0, 10)).toBe(0);
  });

  it('picks weighted entries', () => {
    const result = weightedPick([{ item: 'milk', weight: 1 }]);
    expect(result).toBe('milk');
  });
});
