import { describe, expect, it } from 'vitest';

import { formatClock, formatDuration } from './format.js';

describe('time formatting', () => {
  it('formats a duration in hours and minutes', () => {
    expect(formatDuration(215)).toBe('3시간 35분');
    expect(formatDuration(60)).toBe('1시간');
  });

  it('formats elapsed minutes as a clock value', () => {
    expect(formatClock(85)).toBe('1:25');
    expect(formatClock(5)).toBe('0:05');
  });
});
