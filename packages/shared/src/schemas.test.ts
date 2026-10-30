import { describe, expect, it } from 'vitest';
import { courseQuerySchema, spotSchema, splitCsv, spotsQuerySchema } from './schemas.js';

describe('splitCsv', () => {
  it('trims whitespace, removes empty values, and deduplicates entries', () => {
    expect(splitCsv(' nature, ,food,nature, photo ')).toEqual(['nature', 'food', 'photo']);
  });
});

describe('courseQuerySchema', () => {
  const validQuery = {
    hours: '4',
    with: 'solo',
    tags: 'food,nature',
  };

  it('parses a valid query', () => {
    expect(courseQuerySchema.parse(validQuery)).toEqual({
      hours: 4,
      with: 'solo',
      tags: ['nature', 'food'],
      exclude: [],
    });
  });

  it('rejects hours outside the allowed values', () => {
    expect(courseQuerySchema.safeParse({ ...validQuery, hours: '99' }).success).toBe(false);
  });

  it.each([
    ['non-numeric hours', { ...validQuery, hours: 'abc' }],
    ['missing hours', { with: 'solo', tags: 'nature' }],
  ])('reports the localized message for %s', (_description, query) => {
    const result = courseQuerySchema.safeParse(query);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('여행 시간은 2, 4, 6 중 하나여야 해요.');
    }
  });

  it.each([
    ['unknown companion', { ...validQuery, with: 'alien' }],
    ['missing companion', { hours: '4', tags: 'nature' }],
  ])('reports the localized message for %s', (_description, query) => {
    const result = courseQuerySchema.safeParse(query);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        '동행은 solo, couple, family, friends 중 하나여야 해요.',
      );
    }
  });

  it('rejects an empty tags list', () => {
    expect(courseQuerySchema.safeParse({ ...validQuery, tags: ' , ' }).success).toBe(false);
  });

  it('reports the localized message when tags are missing', () => {
    const result = courseQuerySchema.safeParse({ hours: '4', with: 'solo' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('관심사를 하나 이상 골라주세요.');
    }
  });

  it('rejects an unknown tag', () => {
    expect(courseQuerySchema.safeParse({ ...validQuery, tags: 'nature,unknown' }).success).toBe(
      false,
    );
  });

  it('reports the localized message for an unknown tag', () => {
    const result = courseQuerySchema.safeParse({ ...validQuery, tags: 'unknown' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        '관심사는 nature, history, experience, food, photo 중에서 골라주세요.',
      );
    }
  });

  it('returns tags in TAGS order', () => {
    expect(
      courseQuerySchema.parse({ ...validQuery, tags: 'photo,experience,nature' }).tags,
    ).toEqual(['nature', 'experience', 'photo']);
  });

  it('deduplicates and trims exclude entries', () => {
    expect(
      courseQuerySchema.parse({ ...validQuery, exclude: 'rail-bike, unmunsa,rail-bike' }).exclude,
    ).toEqual(['rail-bike', 'unmunsa']);
  });

  it('defaults exclude to an empty list', () => {
    expect(courseQuerySchema.parse(validQuery).exclude).toEqual([]);
  });
});

describe('spotsQuerySchema', () => {
  it('reports localized messages for unknown tag and zone values', () => {
    const tagResult = spotsQuerySchema.safeParse({ tag: 'unknown' });
    const zoneResult = spotsQuerySchema.safeParse({ zone: 'unknown' });

    expect(tagResult.success).toBe(false);
    if (!tagResult.success) {
      expect(tagResult.error.issues[0]?.message).toBe(
        '관심사는 nature, history, experience, food, photo 중에서 골라주세요.',
      );
    }

    expect(zoneResult.success).toBe(false);
    if (!zoneResult.success) {
      expect(zoneResult.error.issues[0]?.message).toBe(
        '권역은 cheongdo-eup, hwayang-eup, unmun-myeon, iseo-myeon 중 하나여야 해요.',
      );
    }
  });
});

describe('spotSchema', () => {
  const validSpot = {
    id: 'test-spot',
    name: '테스트 장소',
    summary: '테스트 장소 소개',
    description: ['장소 설명이에요.'],
    tips: [],
    zone: 'hwayang-eup',
    routeOrder: 1,
    tags: ['nature'],
    goodFor: ['solo'],
    stayMinutes: 30,
    address: '경상북도 청도군 화양읍',
    source: '확인 전 임시 정보',
  };

  it('accepts a spot without operational information or checkedAt', () => {
    expect(spotSchema.safeParse(validSpot).success).toBe(true);
  });

  it('requires checkedAt when operational information is present', () => {
    expect(spotSchema.safeParse({ ...validSpot, hours: { weekday: '09:00-18:00' } }).success).toBe(
      false,
    );
  });
});
