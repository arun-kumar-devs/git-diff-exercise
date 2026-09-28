import { afterEach, describe, expect, it, vi } from 'vitest';
import { changeLabel, relativeTime, shortSha } from './format';

afterEach(() => vi.useRealTimers());

describe('relativeTime', () => {
  it('formats past dates using the largest matching unit', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-02T00:00:00Z'));
    expect(relativeTime('2025-01-01T00:00:00Z')).toBe('1 day ago');
  });

  it('formats future dates and very recent dates', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
    expect(relativeTime('2025-01-01T02:00:00Z')).toBe('in 2 hours');
    expect(relativeTime('2025-01-01T00:00:20Z')).toBe('just now');
  });

  it('preserves invalid dates verbatim', () => {
    expect(relativeTime('not-a-date')).toBe('not-a-date');
  });
});

describe('commit and change labels', () => {
  it('abbreviates a SHA to seven characters', () => {
    expect(shortSha('a1bf367b3af680b1182cc52bb77ba095764a11f9')).toBe('a1bf367');
  });

  it('turns change kinds into readable labels', () => {
    expect(changeLabel('TYPE_CHANGED')).toBe('Type changed');
    expect(changeLabel('ADDED')).toBe('Added');
  });
});