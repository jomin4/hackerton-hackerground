import { describe, expect, it } from 'vitest';
import { COMPANIONS, HOURS, TAGS } from '@cheongdo/shared';
import type { CourseQuery, Spot, Tag } from '@cheongdo/shared';
import { recommendCourse } from '../../src/domain/recommend-course.js';
import { spots } from '../fixtures/spots.js';

const query: CourseQuery = {
  hours: 4,
  with: 'family',
  tags: ['nature', 'experience'],
  exclude: [],
};

describe('recommendCourse', () => {
  it('matches the documented course for T1', () => {
    const course = recommendCourse(spots, query);

    expect(course.stops.map(({ spot }) => spot.id)).toEqual([
      'rail-bike',
      'yudeung-yeonji',
      'wine-tunnel',
      'eupseong',
    ]);
    expect(course.stops.map(({ matchedTags }) => matchedTags)).toEqual([
      ['nature', 'experience'],
      ['nature'],
      ['experience'],
      ['nature'],
    ]);
    expect(course.zones).toEqual(['cheongdo-eup', 'hwayang-eup']);
    expect(course.stops.map(({ score }) => score)).toEqual([25, 15, 15, 15]);
    expect(course.stops.map(({ companionMatch }) => companionMatch)).toEqual([
      true,
      true,
      true,
      true,
    ]);
    expect(
      course.stops.map(({ travelMinutes, startMinute, endMinute }) => [
        travelMinutes,
        startMinute,
        endMinute,
      ]),
    ).toEqual([
      [0, 0, 60],
      [25, 85, 115],
      [10, 125, 165],
      [10, 175, 215],
    ]);
    expect(course.totals).toEqual({
      budgetMinutes: 240,
      stayMinutes: 170,
      travelMinutes: 45,
      totalMinutes: 215,
      slackMinutes: 25,
    });
    expect(course.excluded.map(({ spot }) => spot.id)).toEqual(['unmunsa', 'provence']);
  });

  it('returns the same result for the same input (T2)', () => {
    expect(recommendCourse(spots, query)).toEqual(recommendCourse(spots, query));
  });

  it('does not mutate the input spots', () => {
    const originalSpots = structuredClone(spots);

    recommendCourse(spots, query);

    expect(spots).toEqual(originalSpots);
  });

  it('never exceeds the time budget for all documented condition combinations (T3)', () => {
    const tagSubsets: Tag[][] = [];
    for (let mask = 1; mask < 1 << TAGS.length; mask += 1) {
      tagSubsets.push(TAGS.filter((_, index) => (mask & (1 << index)) !== 0));
    }

    expect(tagSubsets).toHaveLength(31);

    for (const hours of HOURS) {
      for (const withCompanion of COMPANIONS) {
        for (const tags of tagSubsets) {
          const result = recommendCourse(spots, {
            hours,
            with: withCompanion,
            tags,
            exclude: [],
          });

          expect(result.totals.totalMinutes).toBeLessThanOrEqual(result.totals.budgetMinutes);
        }
      }
    }
  });

  it('selects only the wine tunnel for a two-hour food course (T4)', () => {
    const result = recommendCourse(spots, {
      hours: 2,
      with: 'couple',
      tags: ['food'],
      exclude: [],
    });

    expect(result.stops.map(({ spot }) => spot.id)).toEqual(['wine-tunnel']);
    expect(result.stops[0]?.spot.stayMinutes).toBe(40);
  });

  it('returns an empty course when no spots match any interests (T5)', () => {
    const foodSpots = spots.map((spot) => ({ ...spot, tags: ['food'] as Tag[] }));
    const result = recommendCourse(foodSpots, { ...query, tags: ['history'] });

    expect(result.stops).toEqual([]);
    expect(result.excluded).toEqual([]);
    expect(result.zones).toEqual([]);
    expect(result.totals).toEqual({
      budgetMinutes: 240,
      stayMinutes: 0,
      travelMinutes: 0,
      totalMinutes: 0,
      slackMinutes: 240,
    });
  });

  it('omits excluded spots from both stops and excluded results (T6)', () => {
    const result = recommendCourse(spots, { ...query, exclude: ['rail-bike'] });

    expect(result.stops.some(({ spot }) => spot.id === 'rail-bike')).toBe(false);
    expect(result.excluded.some(({ spot }) => spot.id === 'rail-bike')).toBe(false);
  });

  it('lists an over-budget matching spot as excluded (T7)', () => {
    const longSpot = { ...spots[0]!, stayMinutes: 240 };
    const result = recommendCourse([longSpot], {
      hours: 2,
      with: 'family',
      tags: ['nature'],
      exclude: [],
    });

    expect(result.stops).toEqual([]);
    expect(result.excluded.map(({ spot }) => spot.id)).toEqual(['rail-bike']);
    expect(result.totals).toEqual({
      budgetMinutes: 120,
      stayMinutes: 0,
      travelMinutes: 0,
      totalMinutes: 0,
      slackMinutes: 120,
    });
  });

  it('does not make a spot a candidate when only its companion matches (T8)', () => {
    const result = recommendCourse([spots[0]!], {
      hours: 4,
      with: 'friends',
      tags: ['history'],
      exclude: [],
    });

    expect(result.stops).toEqual([]);
    expect(result.excluded).toEqual([]);
  });

  it('orders zones by candidate rank when refill adds a higher-ranked zone later (T9)', () => {
    const makeSpot = (
      id: string,
      zone: Spot['zone'],
      routeOrder: number,
      tags: Tag[],
      stayMinutes: number,
    ): Spot => ({
      id,
      name: id,
      summary: id,
      description: [id],
      tips: [],
      zone,
      routeOrder,
      tags,
      goodFor: ['solo'],
      stayMinutes,
      address: '경상북도 청도군',
      source: '확인 전 임시 정보',
    });
    const t9Spots = [
      makeSpot('a', 'cheongdo-eup', 1, ['nature', 'history'], 20),
      makeSpot('b', 'cheongdo-eup', 2, ['nature', 'history'], 20),
      makeSpot('c', 'cheongdo-eup', 3, ['nature', 'history'], 20),
      makeSpot('d', 'cheongdo-eup', 4, ['nature', 'history'], 20),
      makeSpot('e', 'hwayang-eup', 1, ['nature', 'history'], 70),
      makeSpot('f', 'unmun-myeon', 1, ['nature'], 10),
    ];
    const result = recommendCourse(t9Spots, {
      hours: 4,
      with: 'family',
      tags: ['nature', 'history'],
      exclude: [],
    });

    expect(result.stops.map(({ spot }) => spot.id)).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
    expect(result.zones).toEqual(['cheongdo-eup', 'hwayang-eup', 'unmun-myeon']);
    expect(result.totals.totalMinutes).toBe(240);
  });

  it('assigns consecutive stop orders and consistent start times', () => {
    const { stops } = recommendCourse(spots, query);

    expect(stops.map(({ order }) => order)).toEqual([1, 2, 3, 4]);
    expect(stops[0]?.startMinute).toBe(stops[0]?.travelMinutes ?? 0);
    for (let index = 1; index < stops.length; index += 1) {
      const previousStop = stops[index - 1]!;
      const currentStop = stops[index]!;
      expect(currentStop.startMinute).toBe(previousStop.endMinute + currentStop.travelMinutes);
    }
  });
});
