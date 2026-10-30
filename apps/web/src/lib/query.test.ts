import { describe, expect, it } from 'vitest';

import { fromCourseSearchParams, toCourseUrl } from './query.js';

describe('course query', () => {
  it('creates a stable URL with tags in shared definition order', () => {
    expect(
      toCourseUrl({
        hours: 4,
        with: 'family',
        tags: ['experience', 'nature'],
        exclude: [],
      }),
    ).toBe('/course?hours=4&with=family&tags=nature,experience');
  });

  it('reads supported values from search params', () => {
    expect(
      fromCourseSearchParams(new URLSearchParams('hours=2&with=solo&tags=photo,nature')),
    ).toEqual({
      hours: 2,
      with: 'solo',
      tags: ['nature', 'photo'],
      exclude: [],
    });
  });

  it('uses defaults when values are absent or unsupported', () => {
    expect(fromCourseSearchParams(new URLSearchParams('hours=99&with=unknown'))).toEqual({
      hours: 4,
      with: 'family',
      tags: ['nature', 'experience'],
      exclude: [],
    });
  });
});
